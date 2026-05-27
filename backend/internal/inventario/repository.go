package inventario

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ── Productos ────────────────────────────────────────────────

func (r *Repository) FindAllProductos(sucursalID string, soloActivos bool, tipo string) ([]Producto, error) {
	query := `
		SELECT id, sucursal_id, nombre, COALESCE(sku,''), COALESCE(descripcion,''),
			precio, stock_actual, stock_minimo, activo, COALESCE(tipo,'VENTA'), COALESCE(medida,'UNIDAD'), COALESCE(presentaciones::text,''), created_at, updated_at
		FROM productos
		WHERE sucursal_id = $1
	`
	args := []any{sucursalID}
	i := 2

	if soloActivos {
		query += fmt.Sprintf(" AND activo = true")
	}
	if tipo != "" {
		query += fmt.Sprintf(" AND tipo = $%d", i)
		args = append(args, tipo)
		i++
	}
	query += " ORDER BY nombre ASC"

	rows, err := r.db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var productos []Producto
	for rows.Next() {
		var p Producto
		if err := rows.Scan(
			&p.ID, &p.SucursalID, &p.Nombre, &p.SKU, &p.Descripcion,
			&p.Precio, &p.StockActual, &p.StockMinimo, &p.Activo,
			&p.Tipo, &p.Medida, &p.Presentaciones, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		productos = append(productos, p)
	}
	return productos, nil
}

func (r *Repository) FindProductoByID(id string) (*Producto, error) {
	query := `
		SELECT id, sucursal_id, nombre, COALESCE(sku,''), COALESCE(descripcion,''),
			precio, stock_actual, stock_minimo, activo, COALESCE(tipo,'VENTA'), COALESCE(medida,'UNIDAD'), COALESCE(presentaciones::text,''), created_at, updated_at
		FROM productos WHERE id = $1
	`
	var p Producto
	err := r.db.QueryRow(context.Background(), query, id).Scan(
		&p.ID, &p.SucursalID, &p.Nombre, &p.SKU, &p.Descripcion,
		&p.Precio, &p.StockActual, &p.StockMinimo, &p.Activo,
		&p.Tipo, &p.Medida, &p.Presentaciones, &p.CreatedAt, &p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) CreateProducto(p *Producto) error {
	query := `
		INSERT INTO productos
			(sucursal_id, nombre, sku, descripcion, precio, stock_actual, stock_minimo, activo, tipo, medida, presentaciones)
		VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,NULLIF($10,'')::jsonb)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(context.Background(), query,
		p.SucursalID, p.Nombre, p.SKU, p.Descripcion,
		p.Precio, p.StockActual, p.StockMinimo, p.Tipo, p.Medida, p.Presentaciones,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *Repository) UpdateProducto(id string, req UpdateProductoRequest) error {
	_, err := r.db.Exec(context.Background(), `
		UPDATE productos
		SET nombre=$1, sku=$2, descripcion=$3, precio=$4, stock_minimo=$5, tipo=$6, medida=$7, presentaciones=NULLIF($8,'')::jsonb, updated_at=NOW()
		WHERE id=$9
	`, req.Nombre, req.SKU, req.Descripcion, req.Precio, req.StockMinimo, req.Tipo, req.Medida, req.Presentaciones, id)
	return err
}

func (r *Repository) UpdateActivo(id string, activo bool) error {
	_, err := r.db.Exec(context.Background(),
		`UPDATE productos SET activo=$1, updated_at=NOW() WHERE id=$2`, activo, id)
	return err
}

func (r *Repository) DeleteProducto(id string) error {
	tieneVentas, err := r.tieneVentas(id)
	if err != nil {
		return err
	}
	if tieneVentas {
		return ErrTieneVentas
	}

	tx, err := r.db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())
	_, err = tx.Exec(context.Background(),
		`DELETE FROM movimientos_inventario WHERE producto_id=$1`, id)
	if err != nil {
		return err
	}
	_, err = tx.Exec(context.Background(),
		`DELETE FROM productos WHERE id=$1`, id)
	if err != nil {
		return err
	}
	return tx.Commit(context.Background())
}

func (r *Repository) tieneVentas(productoID string) (bool, error) {
	var count int
	err := r.db.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM detalle_venta WHERE producto_id=$1`, productoID,
	).Scan(&count)
	return count > 0, err
}

func (r *Repository) GenerarSKU() (string, error) {
	var maxNum int
	err := r.db.QueryRow(context.Background(),
		`SELECT COALESCE(MAX(NULLIF(regexp_replace(sku, '\D','','g'),'')::int), 0)
		 FROM productos WHERE sku ~ '^PROD-\d+$'`,
	).Scan(&maxNum)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("PROD-%03d", maxNum+1), nil
}

// ── Movimientos (con tx para garantizar consistencia) ────────

func (r *Repository) RegistrarMovimiento(m *Movimiento) error {
	ctx := context.Background()

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Leer stock actual con bloqueo para evitar race conditions
	var stockActual float64
	err = tx.QueryRow(ctx,
		`SELECT stock_actual FROM productos WHERE id=$1 FOR UPDATE`, m.ProductoID,
	).Scan(&stockActual)
	if err != nil {
		return err
	}

	// 2. Calcular nuevo stock
	nuevoStock := stockActual + m.Cantidad
	if nuevoStock < 0 {
		return fmt.Errorf("stock insuficiente: disponible %.2f, requerido %.2f", stockActual, -m.Cantidad)
	}

	// 3. Guardar el movimiento
	m.StockAntes = int(stockActual)
	m.StockDespues = int(nuevoStock)
	err = tx.QueryRow(ctx, `
		INSERT INTO movimientos_inventario
			(producto_id, usuario_id, tipo, cantidad, stock_antes, stock_despues, referencia_id, observaciones)
		VALUES ($1,$2,$3,$4,$5,$6,NULLIF($7,'')::uuid,$8)
		RETURNING id, created_at
	`, m.ProductoID, m.UsuarioID, m.Tipo, m.Cantidad,
		m.StockAntes, m.StockDespues, m.ReferenciaID, m.Observaciones,
	).Scan(&m.ID, &m.CreatedAt)
	if err != nil {
		return err
	}

	// 4. Actualizar stock en producto
	_, err = tx.Exec(ctx,
		`UPDATE productos SET stock_actual=$1, updated_at=NOW() WHERE id=$2`,
		nuevoStock, m.ProductoID,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *Repository) FindMovimientos(filtros FiltrosMovimiento) ([]Movimiento, error) {
	query := `
		SELECT
			m.id, m.producto_id, p.nombre, m.usuario_id, u.nombre,
			m.tipo, m.cantidad, m.stock_antes, m.stock_despues,
			COALESCE(m.referencia_id::text,''), COALESCE(m.observaciones,''),
			m.created_at
		FROM movimientos_inventario m
		JOIN productos p ON p.id = m.producto_id
		JOIN usuarios u ON u.id = m.usuario_id
		WHERE 1=1
	`
	args := []any{}
	i := 1

	if filtros.ProductoID != "" {
		query += fmt.Sprintf(" AND m.producto_id=$%d", i)
		args = append(args, filtros.ProductoID)
		i++
	}
	if filtros.Tipo != "" {
		query += fmt.Sprintf(" AND m.tipo=$%d", i)
		args = append(args, filtros.Tipo)
		i++
	}

	query += " ORDER BY m.created_at DESC"

	if filtros.Limite > 0 {
		query += fmt.Sprintf(" LIMIT $%d", i)
		args = append(args, filtros.Limite)
	}

	rows, err := r.db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movimientos []Movimiento
	for rows.Next() {
		var m Movimiento
		if err := rows.Scan(
			&m.ID, &m.ProductoID, &m.ProductoNombre,
			&m.UsuarioID, &m.UsuarioNombre,
			&m.Tipo, &m.Cantidad, &m.StockAntes, &m.StockDespues,
			&m.ReferenciaID, &m.Observaciones, &m.CreatedAt,
		); err != nil {
			return nil, err
		}
		movimientos = append(movimientos, m)
	}
	return movimientos, nil
}

func (r *Repository) FindProductosBajoStock(sucursalID string) ([]Producto, error) {
	query := `
		SELECT id, sucursal_id, nombre, COALESCE(sku,''), COALESCE(descripcion,''),
			precio, stock_actual, stock_minimo, activo, COALESCE(tipo,'VENTA'), COALESCE(medida,'UNIDAD'), COALESCE(presentaciones::text,''), created_at, updated_at
		FROM productos
		WHERE sucursal_id=$1 AND activo=true AND stock_actual <= stock_minimo
		ORDER BY stock_actual ASC
	`
	rows, err := r.db.Query(context.Background(), query, sucursalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var productos []Producto
	for rows.Next() {
		var p Producto
		if err := rows.Scan(
			&p.ID, &p.SucursalID, &p.Nombre, &p.SKU, &p.Descripcion,
			&p.Precio, &p.StockActual, &p.StockMinimo, &p.Activo,
			&p.Tipo, &p.Medida, &p.Presentaciones, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		productos = append(productos, p)
	}
	return productos, nil
}

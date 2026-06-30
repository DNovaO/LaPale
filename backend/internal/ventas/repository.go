package ventas

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	Db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{Db: db}
}

func (r *Repository) FindAll(filtros FiltrosVenta) ([]Venta, error) {
	query := `
		SELECT v.id, v.sucursal_id, v.vendedor_id, u.nombre,
			COALESCE(v.autorizado_por::text,''), v.tipo, v.estado,
			v.subtotal, v.total, COALESCE(v.notas,''),
			v.ticket_numero, COALESCE(p.metodo,''), v.created_at, v.updated_at
		FROM ventas v
		JOIN usuarios u ON u.id = v.vendedor_id
		LEFT JOIN pagos p ON p.venta_id = v.id
		WHERE v.sucursal_id = $1
	`
	args := []any{filtros.SucursalID}
	i := 2

	if filtros.VendedorID != "" {
		query += fmt.Sprintf(" AND v.vendedor_id=$%d", i)
		args = append(args, filtros.VendedorID)
		i++
	}
	if filtros.Estado != "" {
		query += fmt.Sprintf(" AND v.estado=$%d", i)
		args = append(args, filtros.Estado)
		i++
	}
	if filtros.Tipo != "" {
		query += fmt.Sprintf(" AND v.tipo=$%d", i)
		args = append(args, filtros.Tipo)
		i++
	}
	if filtros.Fecha != "" {
		query += fmt.Sprintf(" AND (v.created_at AT TIME ZONE 'America/Mexico_City')::date=$%d", i)
		args = append(args, filtros.Fecha)
		i++
	}

	query += " ORDER BY v.created_at DESC"

	if filtros.Limite > 0 {
		query += fmt.Sprintf(" LIMIT $%d", i)
		args = append(args, filtros.Limite)
	}

	rows, err := r.Db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ventas []Venta
	for rows.Next() {
		var v Venta
		if err := rows.Scan(
			&v.ID, &v.SucursalID, &v.VendedorID, &v.VendedorNombre,
			&v.AutorizadoPor, &v.Tipo, &v.Estado,
			&v.Subtotal, &v.Total, &v.Notas,
			&v.TicketNumero, &v.Metodo, &v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, err
		}
		ventas = append(ventas, v)
	}
	return ventas, nil
}

func (r *Repository) FindByID(id string) (*Venta, error) {
	query := `
		SELECT v.id, v.sucursal_id, v.vendedor_id, u.nombre,
			COALESCE(v.autorizado_por::text,''), v.tipo, v.estado,
			v.subtotal, v.total, COALESCE(v.notas,''),
			v.ticket_numero, v.created_at, v.updated_at
		FROM ventas v
		JOIN usuarios u ON u.id = v.vendedor_id
		WHERE v.id = $1
	`
	var v Venta
	err := r.Db.QueryRow(context.Background(), query, id).Scan(
		&v.ID, &v.SucursalID, &v.VendedorID, &v.VendedorNombre,
		&v.AutorizadoPor, &v.Tipo, &v.Estado,
		&v.Subtotal, &v.Total, &v.Notas,
		&v.TicketNumero, &v.CreatedAt, &v.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Cargar detalle y pagos
	v.Detalle, err = r.findDetalle(v.ID)
	if err != nil {
		return nil, err
	}
	v.Pagos, err = r.findPagos(v.ID)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *Repository) findDetalle(ventaID string) ([]DetalleVenta, error) {
	rows, err := r.Db.Query(context.Background(), `
		SELECT d.id, d.venta_id, d.producto_id, p.nombre,
			d.cantidad, d.precio_unitario, d.subtotal, d.es_cortesia
		FROM detalle_venta d
		JOIN productos p ON p.id = d.producto_id
		WHERE d.venta_id = $1
	`, ventaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var detalle []DetalleVenta
	for rows.Next() {
		var d DetalleVenta
		if err := rows.Scan(
			&d.ID, &d.VentaID, &d.ProductoID, &d.ProductoNombre,
			&d.Cantidad, &d.PrecioUnitario, &d.Subtotal, &d.EsCortesia,
		); err != nil {
			return nil, err
		}
		detalle = append(detalle, d)
	}
	return detalle, nil
}

func (r *Repository) findPagos(ventaID string) ([]Pago, error) {
	rows, err := r.Db.Query(context.Background(), `
		SELECT id, venta_id, metodo, monto,
			COALESCE(monto_recibido,0), COALESCE(cambio,0),
			COALESCE(mp_payment_id,''), COALESCE(referencia_externa,''), estado
		FROM pagos WHERE venta_id = $1
	`, ventaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pagos []Pago
	for rows.Next() {
		var p Pago
		if err := rows.Scan(
			&p.ID, &p.VentaID, &p.Metodo, &p.Monto,
			&p.MontoRecibido, &p.Cambio,
			&p.MpPaymentID, &p.ReferenciaExterna, &p.Estado,
		); err != nil {
			return nil, err
		}
		pagos = append(pagos, p)
	}
	return pagos, nil
}

func (r *Repository) InsertVenta(ctx context.Context, tx pgx.Tx, v *Venta) error {
	autorizadoPor := "NULL"
	if v.AutorizadoPor != "" {
		autorizadoPor = fmt.Sprintf("'%s'::uuid", v.AutorizadoPor)
	}
	return tx.QueryRow(ctx, fmt.Sprintf(`
		INSERT INTO ventas
			(sucursal_id, vendedor_id, autorizado_por, tipo, estado, subtotal, total, notas)
		VALUES ($1,$2,%s,$3,$4,$5,$6,$7)
		RETURNING id, ticket_numero, created_at, updated_at
	`, autorizadoPor),
		v.SucursalID, v.VendedorID, v.Tipo, v.Estado, v.Subtotal, v.Total, v.Notas,
	).Scan(&v.ID, &v.TicketNumero, &v.CreatedAt, &v.UpdatedAt)
}

func (r *Repository) GetProductoStock(ctx context.Context, tx pgx.Tx, productoID string) (productoStock, error) {
	var p productoStock
	err := tx.QueryRow(ctx, `
		SELECT nombre, precio, stock_actual, activo
		FROM productos WHERE id = $1
		FOR UPDATE
	`, productoID).Scan(&p.nombre, &p.precio, &p.stock, &p.activo)
	if err != nil {
		return productoStock{}, err
	}
	return p, nil
}

func (r *Repository) InsertDetalleYDescontar(ctx context.Context, tx pgx.Tx, v *Venta, detalle []DetalleVenta) error {
	for i := range detalle {
		d := &detalle[i]
		d.VentaID = v.ID

		err := tx.QueryRow(ctx, `
			INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal, es_cortesia)
			VALUES ($1,$2,$3,$4,$5,$6)
			RETURNING id
		`, d.VentaID, d.ProductoID, d.Cantidad, d.PrecioUnitario, d.Subtotal, d.EsCortesia,
		).Scan(&d.ID)
		if err != nil {
			return err
		}

		ps, err := r.GetProductoStock(ctx, tx, d.ProductoID)
		if err != nil {
			return fmt.Errorf("producto %s no encontrado", d.ProductoID)
		}

		consumo := d.Cantidad * d.FactorConsumo
		nuevoStock := ps.stock - consumo
		if nuevoStock < 0 {
			return fmt.Errorf("stock insuficiente para '%s': disponible %.2f, requerido %.2f",
				ps.nombre, ps.stock, consumo)
		}

		_, err = tx.Exec(ctx,
			`UPDATE productos SET stock_actual=$1, updated_at=NOW() WHERE id=$2`,
			nuevoStock, d.ProductoID,
		)
		if err != nil {
			return err
		}

		tipoMov := "SALIDA_VENTA"
		if d.EsCortesia {
			tipoMov = "SALIDA_CORTESIA"
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO movimientos_inventario
				(producto_id, usuario_id, tipo, cantidad, stock_antes, stock_despues, referencia_id, observaciones)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		`, d.ProductoID, v.VendedorID, tipoMov, -consumo,
			ps.stock, nuevoStock, v.ID,
			fmt.Sprintf("Venta #%d", v.TicketNumero),
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) InsertDetalleSinDescontar(ctx context.Context, tx pgx.Tx, v *Venta, detalle []DetalleVenta) error {
	for i := range detalle {
		d := &detalle[i]
		d.VentaID = v.ID
		err := tx.QueryRow(ctx, `
			INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal, es_cortesia)
			VALUES ($1,$2,$3,$4,$5,$6)
			RETURNING id
		`, d.VentaID, d.ProductoID, d.Cantidad, d.PrecioUnitario, d.Subtotal, d.EsCortesia).Scan(&d.ID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) InsertPago(ctx context.Context, tx pgx.Tx, pago Pago, v *Venta) error {
	pago.VentaID = v.ID
	cambio := 0.0
	if pago.Metodo == MetodoEfectivo && pago.MontoRecibido > pago.Monto {
		cambio = pago.MontoRecibido - pago.Monto
	}
	estadoPago := EstadoPagoConfirmado
	if pago.Metodo == MetodoTarjeta {
		estadoPago = EstadoPagoPendiente
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO pagos (venta_id, metodo, monto, monto_recibido, cambio, estado)
		VALUES ($1,$2,$3,$4,$5,$6)
	`, pago.VentaID, pago.Metodo, pago.Monto, pago.MontoRecibido, cambio, estadoPago)
	return err
}

type productoStock struct {
	nombre  string
	precio  float64
	stock   float64
	activo  bool
}

func (r *Repository) GetProductosParaVenta(ids []string) (map[string]productoStock, error) {
	query := `
		SELECT id, nombre, precio, stock_actual, activo
		FROM productos WHERE id = ANY($1)
	`
	rows, err := r.Db.Query(context.Background(), query, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]productoStock)
	for rows.Next() {
		var id string
		var p productoStock
		if err := rows.Scan(&id, &p.nombre, &p.precio, &p.stock, &p.activo); err != nil {
			return nil, err
		}
		result[id] = p
	}
	return result, nil
}

func (r *Repository) CancelarVenta(id, motivo, usuarioID string) error {
	ctx := context.Background()
	tx, err := r.Db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Obtener detalle para revertir stock
	rows, err := tx.Query(ctx, `
		SELECT producto_id, cantidad, es_cortesia FROM detalle_venta WHERE venta_id=$1
	`, id)
	if err != nil {
		return err
	}
	defer rows.Close()

	type item struct {
		productoID string
		cantidad   float64
		esCortesia bool
	}
	var items []item
	for rows.Next() {
		var it item
		if err := rows.Scan(&it.productoID, &it.cantidad, &it.esCortesia); err != nil {
			return err
		}
		items = append(items, it)
	}
	rows.Close()

	// Revertir stock de cada producto
	for _, it := range items {
		var stockActual float64
		err = tx.QueryRow(ctx,
			`SELECT stock_actual FROM productos WHERE id=$1 FOR UPDATE`, it.productoID,
		).Scan(&stockActual)
		if err != nil {
			return err
		}

		nuevoStock := stockActual + it.cantidad
		_, err = tx.Exec(ctx,
			`UPDATE productos SET stock_actual=$1, updated_at=NOW() WHERE id=$2`,
			nuevoStock, it.productoID,
		)
		if err != nil {
			return err
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO movimientos_inventario
				(producto_id, usuario_id, tipo, cantidad, stock_antes, stock_despues, referencia_id, observaciones)
			VALUES ($1,$2,'ENTRADA',$3,$4,$5,$6,$7)
		`, it.productoID, usuarioID, it.cantidad, stockActual, nuevoStock, id,
			"Reverso por cancelación de venta: "+motivo,
		)
		if err != nil {
			return err
		}
	}

	// Marcar venta como cancelada
	_, err = tx.Exec(ctx,
		`UPDATE ventas SET estado='CANCELADA', updated_at=NOW() WHERE id=$1`, id,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *Repository) GetTopProductos(sucursalID, fecha string, limite int) ([]TopProducto, error) {
	rows, err := r.Db.Query(context.Background(), `
		SELECT d.producto_id, p.nombre, p.medida,
			COALESCE(SUM(d.cantidad), 0),
			COALESCE(SUM(d.subtotal), 0)
		FROM detalle_venta d
		JOIN ventas v ON v.id = d.venta_id
		JOIN productos p ON p.id = d.producto_id
		WHERE v.sucursal_id = $1
			AND v.estado = 'CERRADA'
			AND v.tipo = 'NORMAL'
			AND d.es_cortesia = false
			AND (v.created_at AT TIME ZONE 'America/Mexico_City')::date = $2::date
		GROUP BY d.producto_id, p.nombre, p.medida
		ORDER BY SUM(d.cantidad) DESC
		LIMIT $3
	`, sucursalID, fecha, limite)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var productos []TopProducto
	for rows.Next() {
		var tp TopProducto
		if err := rows.Scan(&tp.ProductoID, &tp.ProductoNombre, &tp.Medida, &tp.CantidadVendida, &tp.TotalIngresos); err != nil {
			return nil, err
		}
		productos = append(productos, tp)
	}
	return productos, nil
}

func (r *Repository) FindPendientes(sucursalID string) ([]Venta, error) {
	rows, err := r.Db.Query(context.Background(), `
		SELECT v.id, v.sucursal_id, v.vendedor_id, u.nombre,
			COALESCE(v.autorizado_por::text,''), v.tipo, v.estado,
			v.subtotal, v.total, COALESCE(v.notas,''),
			v.ticket_numero, v.created_at, v.updated_at
		FROM ventas v
		JOIN usuarios u ON u.id = v.vendedor_id
		WHERE v.sucursal_id = $1
			AND v.estado = 'ABIERTA'
			AND (v.created_at AT TIME ZONE 'America/Mexico_City')::date = CURRENT_DATE
		ORDER BY v.created_at ASC
	`, sucursalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ventas []Venta
	for rows.Next() {
		var v Venta
		if err := rows.Scan(
			&v.ID, &v.SucursalID, &v.VendedorID, &v.VendedorNombre,
			&v.AutorizadoPor, &v.Tipo, &v.Estado,
			&v.Subtotal, &v.Total, &v.Notas,
			&v.TicketNumero, &v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, err
		}

		v.Detalle, err = r.findDetalle(v.ID)
		if err != nil {
			return nil, err
		}
		ventas = append(ventas, v)
	}
	return ventas, nil
}

func (r *Repository) CobrarVenta(ventaID string, pago Pago, usuarioID string) error {
	ctx := context.Background()
	tx, err := r.Db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT producto_id, cantidad, es_cortesia
		FROM detalle_venta WHERE venta_id = $1
	`, ventaID)
	if err != nil {
		return err
	}
	defer rows.Close()

	type item struct {
		productoID string
		cantidad   float64
		esCortesia bool
	}
	var items []item
	for rows.Next() {
		var it item
		if err := rows.Scan(&it.productoID, &it.cantidad, &it.esCortesia); err != nil {
			return err
		}
		items = append(items, it)
	}
	rows.Close()

	for _, it := range items {
		var stockActual float64
		err := tx.QueryRow(ctx,
			`SELECT stock_actual FROM productos WHERE id = $1 FOR UPDATE`, it.productoID,
		).Scan(&stockActual)
		if err != nil {
			return err
		}

		nuevoStock := stockActual - it.cantidad
		if nuevoStock < 0 {
			return fmt.Errorf("stock insuficiente para el producto %s: disponible %.2f, requerido %.2f",
				it.productoID, stockActual, it.cantidad)
		}

		_, err = tx.Exec(ctx,
			`UPDATE productos SET stock_actual = $1, updated_at = NOW() WHERE id = $2`,
			nuevoStock, it.productoID,
		)
		if err != nil {
			return err
		}

		tipoMov := "SALIDA_VENTA"
		if it.esCortesia {
			tipoMov = "SALIDA_CORTESIA"
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO movimientos_inventario
				(producto_id, usuario_id, tipo, cantidad, stock_antes, stock_despues, referencia_id, observaciones)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, it.productoID, usuarioID, tipoMov, -it.cantidad, stockActual, nuevoStock, ventaID,
			fmt.Sprintf("Cobro de venta #%s", ventaID),
		)
		if err != nil {
			return err
		}
	}

	cambio := 0.0
	if pago.Metodo == MetodoEfectivo && pago.MontoRecibido > pago.Monto {
		cambio = pago.MontoRecibido - pago.Monto
	}
	estadoPago := EstadoPagoConfirmado
	if pago.Metodo == MetodoTarjeta {
		estadoPago = EstadoPagoPendiente
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO pagos (venta_id, metodo, monto, monto_recibido, cambio, estado)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, ventaID, pago.Metodo, pago.Monto, pago.MontoRecibido, cambio, estadoPago)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx,
		`UPDATE ventas SET estado = 'CERRADA', updated_at = NOW() WHERE id = $1`,
		ventaID,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

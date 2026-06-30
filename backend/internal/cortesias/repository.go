package cortesias

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll(sucursalID string) ([]ReglaCortesia, error) {
	rows, err := r.db.Query(context.Background(), `
		SELECT rc.id, rc.sucursal_id, rc.nombre, rc.monto_minimo, rc.monto_maximo,
			rc.producto_id, p.nombre, rc.cantidad, rc.activa,
			rc.limite_diario, rc.contador_diario, rc.created_at, rc.updated_at
		FROM reglas_cortesia rc
		JOIN productos p ON p.id = rc.producto_id
		WHERE rc.sucursal_id = $1
		ORDER BY rc.monto_minimo ASC
	`, sucursalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reglas []ReglaCortesia
	for rows.Next() {
		var rg ReglaCortesia
		if err := rows.Scan(
			&rg.ID, &rg.SucursalID, &rg.Nombre, &rg.MontoMinimo, &rg.MontoMaximo,
			&rg.ProductoID, &rg.ProductoNombre, &rg.Cantidad, &rg.Activa,
			&rg.LimiteDiario, &rg.ContadorDiario, &rg.CreatedAt, &rg.UpdatedAt,
		); err != nil {
			return nil, err
		}
		reglas = append(reglas, rg)
	}
	return reglas, nil
}

func (r *Repository) FindByID(id string) (*ReglaCortesia, error) {
	var rg ReglaCortesia
	err := r.db.QueryRow(context.Background(), `
		SELECT rc.id, rc.sucursal_id, rc.nombre, rc.monto_minimo, rc.monto_maximo,
			rc.producto_id, p.nombre, rc.cantidad, rc.activa,
			rc.limite_diario, rc.contador_diario, rc.created_at, rc.updated_at
		FROM reglas_cortesia rc
		JOIN productos p ON p.id = rc.producto_id
		WHERE rc.id = $1
	`, id).Scan(
		&rg.ID, &rg.SucursalID, &rg.Nombre, &rg.MontoMinimo, &rg.MontoMaximo,
		&rg.ProductoID, &rg.ProductoNombre, &rg.Cantidad, &rg.Activa,
		&rg.LimiteDiario, &rg.ContadorDiario, &rg.CreatedAt, &rg.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &rg, nil
}

func (r *Repository) Create(rg *ReglaCortesia) error {
	return r.db.QueryRow(context.Background(), `
		INSERT INTO reglas_cortesia (sucursal_id, nombre, monto_minimo, monto_maximo,
			producto_id, cantidad, activa, limite_diario)
		VALUES ($1,$2,$3,$4,$5,$6,true,$7)
		RETURNING id, created_at, updated_at
	`, rg.SucursalID, rg.Nombre, rg.MontoMinimo, rg.MontoMaximo,
		rg.ProductoID, rg.Cantidad, rg.LimiteDiario,
	).Scan(&rg.ID, &rg.CreatedAt, &rg.UpdatedAt)
}

func (r *Repository) Update(id string, rg *ReglaCortesia) error {
	_, err := r.db.Exec(context.Background(), `
		UPDATE reglas_cortesia SET
			nombre=$1, monto_minimo=$2, monto_maximo=$3,
			producto_id=$4, cantidad=$5, limite_diario=$6,
			updated_at=NOW()
		WHERE id=$7
	`, rg.Nombre, rg.MontoMinimo, rg.MontoMaximo,
		rg.ProductoID, rg.Cantidad, rg.LimiteDiario, id)
	return err
}

func (r *Repository) Delete(id string) error {
	_, err := r.db.Exec(context.Background(), `DELETE FROM reglas_cortesia WHERE id=$1`, id)
	return err
}

func (r *Repository) ToggleActiva(id string, activa bool) error {
	_, err := r.db.Exec(context.Background(),
		`UPDATE reglas_cortesia SET activa=$1, updated_at=NOW() WHERE id=$2`, activa, id)
	return err
}

func (r *Repository) ExisteSolapamiento(sucursalID string, montoMinimo float64, montoMaximo *float64, excludeID string) (bool, error) {
	var existe bool
	err := r.db.QueryRow(context.Background(), `
		SELECT EXISTS(
			SELECT 1 FROM reglas_cortesia
			WHERE sucursal_id = $1 AND activa = true AND id::text != $2
				AND monto_minimo <= COALESCE($4, 999999999)
				AND (monto_maximo IS NULL OR monto_maximo >= $3)
		)
	`, sucursalID, excludeID, montoMinimo, montoMaximo).Scan(&existe)
	return existe, err
}

func (r *Repository) FindMatchingForUpdate(ctx context.Context, tx pgx.Tx, sucursalID string, monto float64) (*ReglaCortesia, error) {
	var rg ReglaCortesia
	err := tx.QueryRow(ctx, `
		SELECT rc.id, rc.nombre, rc.producto_id, p.nombre, rc.cantidad,
			rc.limite_diario, rc.contador_diario, rc.fecha_contador
		FROM reglas_cortesia rc
		JOIN productos p ON p.id = rc.producto_id
		WHERE rc.sucursal_id = $1
			AND rc.activa = true
			AND rc.monto_minimo <= $2
			AND (rc.monto_maximo IS NULL OR rc.monto_maximo >= $2)
		ORDER BY rc.monto_minimo DESC
		LIMIT 1
		FOR UPDATE OF rc
	`, sucursalID, monto).Scan(
		&rg.ID, &rg.Nombre, &rg.ProductoID, &rg.ProductoNombre,
		&rg.Cantidad, &rg.LimiteDiario, &rg.ContadorDiario, &rg.FechaContador,
	)
	if err != nil {
		return nil, err
	}
	return &rg, nil
}

func (r *Repository) FindMatchingReadOnly(sucursalID string, monto float64) (*ReglaCortesia, error) {
	var rg ReglaCortesia
	err := r.db.QueryRow(context.Background(), `
		SELECT rc.id, rc.nombre, rc.producto_id, p.nombre, rc.cantidad,
			rc.limite_diario, rc.contador_diario, rc.fecha_contador
		FROM reglas_cortesia rc
		JOIN productos p ON p.id = rc.producto_id
		WHERE rc.sucursal_id = $1
			AND rc.activa = true
			AND rc.monto_minimo <= $2
			AND (rc.monto_maximo IS NULL OR rc.monto_maximo >= $2)
		ORDER BY rc.monto_minimo DESC
		LIMIT 1
	`, sucursalID, monto).Scan(
		&rg.ID, &rg.Nombre, &rg.ProductoID, &rg.ProductoNombre,
		&rg.Cantidad, &rg.LimiteDiario, &rg.ContadorDiario, &rg.FechaContador,
	)
	if err != nil {
		return nil, err
	}
	return &rg, nil
}

func (r *Repository) IncrementarContador(ctx context.Context, tx pgx.Tx, reglaID string, today time.Time, cantidad int) error {
	var fechaContador *time.Time
	todayDate := today.Format("2006-01-02")

	err := tx.QueryRow(ctx, `
		UPDATE reglas_cortesia SET
			contador_diario = CASE
				WHEN fecha_contador IS NULL OR fecha_contador <> $2::date THEN $3
				ELSE contador_diario + $3
			END,
			fecha_contador = $2::date,
			updated_at = NOW()
		WHERE id = $1
		RETURNING fecha_contador
	`, reglaID, todayDate, cantidad).Scan(&fechaContador)
	return err
}

func (r *Repository) InsertOtorgada(ctx context.Context, tx pgx.Tx, o *CortesiaOtorgada) error {
	return tx.QueryRow(ctx, `
		INSERT INTO cortesias_otorgadas (venta_id, regla_id, producto_id, cantidad,
			monto_compra, vendedor_id, sucursal_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, created_at
	`, o.VentaID, o.ReglaID, o.ProductoID, o.Cantidad,
		o.MontoCompra, o.VendedorID, o.SucursalID,
	).Scan(&o.ID, &o.CreatedAt)
}

func (r *Repository) GetDashboard(sucursalID string) (*DashboardCortesia, error) {
	d := &DashboardCortesia{}
	today := time.Now().Format("2006-01-02")

	var total int
	err := r.db.QueryRow(context.Background(), `
		SELECT COALESCE(SUM(cantidad), 0) FROM cortesias_otorgadas
		WHERE sucursal_id=$1 AND (created_at AT TIME ZONE 'America/Mexico_City')::date=$2
	`, sucursalID, today).Scan(&total)
	if err != nil {
		return nil, err
	}
	d.TotalesHoy = total

	rows, err := r.db.Query(context.Background(), `
		SELECT rc.id, rc.nombre, p.nombre, rc.limite_diario,
			COALESCE(SUM(co.cantidad), 0)
		FROM reglas_cortesia rc
		JOIN productos p ON p.id = rc.producto_id
		LEFT JOIN cortesias_otorgadas co ON co.regla_id = rc.id AND co.(created_at AT TIME ZONE 'America/Mexico_City')::date = $2
		WHERE rc.sucursal_id = $1 AND rc.activa = true
		GROUP BY rc.id, rc.nombre, p.nombre, rc.limite_diario
		ORDER BY rc.monto_minimo ASC
	`, sucursalID, today)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item ResumenPorRegla
		if err := rows.Scan(&item.ReglaID, &item.ReglaNombre, &item.Producto, &item.LimiteDiario, &item.Entregadas); err != nil {
			return nil, err
		}
		d.PorRegla = append(d.PorRegla, item)

		restantes := 0
		if item.LimiteDiario > 0 {
			restantes = item.LimiteDiario - item.Entregadas
			if restantes < 0 {
				restantes = 0
			}
		}
		d.Disponibles = append(d.Disponibles, DisponibleRegla{
			ReglaID:       item.ReglaID,
			ReglaNombre:   item.ReglaNombre,
			Producto:      item.Producto,
			LimiteDiario:  item.LimiteDiario,
			EntregadasHoy: item.Entregadas,
			Restantes:     restantes,
		})
	}

	rows2, err := r.db.Query(context.Background(), `
		SELECT co.vendedor_id, u.nombre, COALESCE(SUM(co.cantidad), 0)
		FROM cortesias_otorgadas co
		JOIN usuarios u ON u.id = co.vendedor_id
		WHERE co.sucursal_id=$1 AND co.(created_at AT TIME ZONE 'America/Mexico_City')::date=$2
		GROUP BY co.vendedor_id, u.nombre
		ORDER BY SUM(co.cantidad) DESC
	`, sucursalID, today)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	for rows2.Next() {
		var item ResumenPorVendedor
		if err := rows2.Scan(&item.VendedorID, &item.VendedorNombre, &item.Entregadas); err != nil {
			return nil, err
		}
		d.PorVendedor = append(d.PorVendedor, item)
	}

	return d, nil
}

func (r *Repository) GetHistorial(filtros FiltrosHistorial) ([]CortesiaOtorgada, error) {
	query := `
		SELECT co.id, co.venta_id, v.ticket_numero, co.regla_id, rc.nombre,
			co.producto_id, p.nombre, co.cantidad, co.monto_compra,
			co.vendedor_id, u.nombre, co.sucursal_id, co.created_at
		FROM cortesias_otorgadas co
		JOIN ventas v ON v.id = co.venta_id
		JOIN reglas_cortesia rc ON rc.id = co.regla_id
		JOIN productos p ON p.id = co.producto_id
		JOIN usuarios u ON u.id = co.vendedor_id
		WHERE co.sucursal_id = $1
	`
	args := []interface{}{filtros.SucursalID}
	i := 2

	if filtros.FechaDesde != "" {
		query += fmt.Sprintf(" AND co.(created_at AT TIME ZONE 'America/Mexico_City')::date >= $%d", i)
		args = append(args, filtros.FechaDesde)
		i++
	}
	if filtros.FechaHasta != "" {
		query += fmt.Sprintf(" AND co.(created_at AT TIME ZONE 'America/Mexico_City')::date <= $%d", i)
		args = append(args, filtros.FechaHasta)
		i++
	}
	if filtros.VendedorID != "" {
		query += fmt.Sprintf(" AND co.vendedor_id = $%d", i)
		args = append(args, filtros.VendedorID)
		i++
	}

	query += " ORDER BY co.created_at DESC"

	if filtros.Limite > 0 {
		query += fmt.Sprintf(" LIMIT $%d", i)
		args = append(args, filtros.Limite)
	}

	rows, err := r.db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var historial []CortesiaOtorgada
	for rows.Next() {
		var co CortesiaOtorgada
		if err := rows.Scan(
			&co.ID, &co.VentaID, &co.TicketNumero, &co.ReglaID, &co.ReglaNombre,
			&co.ProductoID, &co.ProductoNombre, &co.Cantidad, &co.MontoCompra,
			&co.VendedorID, &co.VendedorNombre, &co.SucursalID, &co.CreatedAt,
		); err != nil {
			return nil, err
		}
		historial = append(historial, co)
	}
	return historial, nil
}

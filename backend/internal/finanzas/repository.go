package finanzas

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ── Gastos ───────────────────────────────────────────────────

func (r *Repository) CreateGasto(g *Gasto) error {
	return r.db.QueryRow(context.Background(), `
		INSERT INTO gastos (sucursal_id, usuario_id, tipo, monto, descripcion, observaciones, fecha)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, created_at
	`, g.SucursalID, g.UsuarioID, g.Tipo, g.Monto,
		g.Descripcion, g.Observaciones, g.Fecha,
	).Scan(&g.ID, &g.CreatedAt)
}

func (r *Repository) FindGastos(filtros FiltrosPeriodo) ([]Gasto, error) {
	query := `
		SELECT g.id, g.sucursal_id, g.usuario_id, u.nombre,
			g.tipo, g.monto, COALESCE(g.descripcion,''),
			COALESCE(g.observaciones,''), g.fecha::text, g.created_at
		FROM gastos g
		JOIN usuarios u ON u.id = g.usuario_id
		WHERE g.sucursal_id = $1
	`
	args := []any{filtros.SucursalID}
	i := 2

	if filtros.Desde != "" {
		query += " AND g.fecha >= $2"
		args = append(args, filtros.Desde)
		i++
	}
	if filtros.Hasta != "" {
		query += " AND g.fecha <= $3"
		args = append(args, filtros.Hasta)
		_ = i
	}

	query += " ORDER BY g.fecha DESC, g.created_at DESC"

	rows, err := r.db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var gastos []Gasto
	for rows.Next() {
		var g Gasto
		if err := rows.Scan(
			&g.ID, &g.SucursalID, &g.UsuarioID, &g.UsuarioNombre,
			&g.Tipo, &g.Monto, &g.Descripcion, &g.Observaciones,
			&g.Fecha, &g.CreatedAt,
		); err != nil {
			return nil, err
		}
		gastos = append(gastos, g)
	}
	return gastos, nil
}

func (r *Repository) DeleteGasto(id string) error {
	result, err := r.db.Exec(context.Background(),
		`DELETE FROM gastos WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("gasto no encontrado")
	}
	return nil
}

// ── Resumen del día ──────────────────────────────────────────

func (r *Repository) GetResumenDia(sucursalID, fecha string) (*ResumenDia, error) {
	ctx := context.Background()
	resumen := &ResumenDia{Fecha: fecha}

	// Ventas del día por método de pago
	err := r.db.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(v.total), 0),
			COUNT(v.id),
			COALESCE(SUM(CASE WHEN p.metodo='EFECTIVO'      THEN p.monto ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN p.metodo='TARJETA'       THEN p.monto ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN p.metodo='TRANSFERENCIA' THEN p.monto ELSE 0 END), 0)
		FROM ventas v
		LEFT JOIN pagos p ON p.venta_id = v.id AND p.estado = 'CONFIRMADO'
		WHERE v.sucursal_id=$1
			AND v.estado='CERRADA'
			AND v.tipo='NORMAL'
			AND v.created_at::date=$2
	`, sucursalID, fecha,
	).Scan(
		&resumen.TotalVentas, &resumen.NumVentas,
		&resumen.TotalEfectivo, &resumen.TotalTarjeta, &resumen.TotalTransferencia,
	)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	// Cortesías del día
	err = r.db.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(dv.precio_unitario * dv.cantidad), 0),
			COUNT(DISTINCT v.id)
		FROM ventas v
		JOIN detalle_venta dv ON dv.venta_id = v.id
		WHERE v.sucursal_id=$1
			AND v.tipo='CORTESIA'
			AND v.estado='CERRADA'
			AND v.created_at::date=$2
	`, sucursalID, fecha,
	).Scan(&resumen.TotalCortesias, &resumen.NumCortesias)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	// Gastos del día
	err = r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(monto), 0)
		FROM gastos
		WHERE sucursal_id=$1 AND fecha=$2
	`, sucursalID, fecha,
	).Scan(&resumen.TotalGastos)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	resumen.Utilidad = resumen.TotalVentas - resumen.TotalGastos

	// Top 5 productos más vendidos
	rows, err := r.db.Query(ctx, `
		SELECT d.producto_id, p.nombre,
			SUM(d.cantidad) AS cantidad,
			SUM(d.subtotal) AS total
		FROM detalle_venta d
		JOIN ventas v ON v.id = d.venta_id
		JOIN productos p ON p.id = d.producto_id
		WHERE v.sucursal_id=$1
			AND v.estado='CERRADA'
			AND v.tipo='NORMAL'
			AND v.created_at::date=$2
		GROUP BY d.producto_id, p.nombre
		ORDER BY cantidad DESC
		LIMIT 5
	`, sucursalID, fecha)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var pv ProductoVendido
		if err := rows.Scan(&pv.ProductoID, &pv.Nombre, &pv.Cantidad, &pv.Total); err != nil {
			return nil, err
		}
		resumen.ProductosMasVendidos = append(resumen.ProductosMasVendidos, pv)
	}

	return resumen, nil
}

// ── Resumen por período ──────────────────────────────────────

func (r *Repository) GetResumenPeriodo(filtros FiltrosPeriodo) (*ResumenPeriodo, error) {
	resumen := &ResumenPeriodo{Desde: filtros.Desde, Hasta: filtros.Hasta}

	err := r.db.QueryRow(context.Background(), `
		SELECT
			COALESCE(SUM(v.total), 0),
			COUNT(v.id)
		FROM ventas v
		WHERE v.sucursal_id=$1
			AND v.estado='CERRADA'
			AND v.tipo='NORMAL'
			AND v.created_at::date BETWEEN $2 AND $3
	`, filtros.SucursalID, filtros.Desde, filtros.Hasta,
	).Scan(&resumen.TotalVentas, &resumen.NumVentas)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(context.Background(), `
		SELECT COALESCE(SUM(monto), 0)
		FROM gastos
		WHERE sucursal_id=$1 AND fecha BETWEEN $2 AND $3
	`, filtros.SucursalID, filtros.Desde, filtros.Hasta,
	).Scan(&resumen.TotalGastos)
	if err != nil {
		return nil, err
	}

	err = r.db.QueryRow(context.Background(), `
		SELECT COALESCE(SUM(dv.precio_unitario * dv.cantidad), 0)
		FROM ventas v
		JOIN detalle_venta dv ON dv.venta_id = v.id
		WHERE v.sucursal_id=$1
			AND v.tipo='CORTESIA'
			AND v.estado='CERRADA'
			AND v.created_at::date BETWEEN $2 AND $3
	`, filtros.SucursalID, filtros.Desde, filtros.Hasta,
	).Scan(&resumen.TotalCortesias)
	if err != nil {
		return nil, err
	}

	resumen.Utilidad = resumen.TotalVentas - resumen.TotalGastos
	return resumen, nil
}

// ── Cierre de caja ───────────────────────────────────────────

func (r *Repository) CerrarCaja(c *CierreCaja) error {
	return r.db.QueryRow(context.Background(), `
		INSERT INTO cierres_caja (
			sucursal_id, usuario_id,
			total_efectivo, total_tarjeta, total_transferencia,
			total_cortesias, num_cortesias,
			total_gastos, total_ventas, num_ventas, notas
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING id, fecha_cierre
	`, c.SucursalID, c.UsuarioID,
		c.TotalEfectivo, c.TotalTarjeta, c.TotalTransferencia,
		c.TotalCortesias, c.NumCortesias,
		c.TotalGastos, c.TotalVentas, c.NumVentas, c.Notas,
	).Scan(&c.ID, &c.FechaCierre)
}

func (r *Repository) FindCierres(sucursalID string, limite int) ([]CierreCaja, error) {
	rows, err := r.db.Query(context.Background(), `
		SELECT c.id, c.sucursal_id, c.usuario_id, u.nombre,
			c.total_efectivo, c.total_tarjeta, c.total_transferencia,
			c.total_cortesias, c.num_cortesias,
			c.total_gastos, c.total_ventas, c.num_ventas,
			c.reporte_enviado, c.fecha_cierre, COALESCE(c.notas,'')
		FROM cierres_caja c
		JOIN usuarios u ON u.id = c.usuario_id
		WHERE c.sucursal_id=$1
		ORDER BY c.fecha_cierre DESC
		LIMIT $2
	`, sucursalID, limite)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cierres []CierreCaja
	for rows.Next() {
		var c CierreCaja
		if err := rows.Scan(
			&c.ID, &c.SucursalID, &c.UsuarioID, &c.UsuarioNombre,
			&c.TotalEfectivo, &c.TotalTarjeta, &c.TotalTransferencia,
			&c.TotalCortesias, &c.NumCortesias,
			&c.TotalGastos, &c.TotalVentas, &c.NumVentas,
			&c.ReporteEnviado, &c.FechaCierre, &c.Notas,
		); err != nil {
			return nil, err
		}
		cierres = append(cierres, c)
	}
	return cierres, nil
}

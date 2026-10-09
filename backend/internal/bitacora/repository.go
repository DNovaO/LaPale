package bitacora

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Registrar(reg *Registro) error {
	var datosAnt, datosNuevos []byte
	var err error

	if reg.DatosAnteriores != nil {
		datosAnt, err = json.Marshal(reg.DatosAnteriores)
		if err != nil {
			return err
		}
	}
	if reg.DatosNuevos != nil {
		datosNuevos, err = json.Marshal(reg.DatosNuevos)
		if err != nil {
			return err
		}
	}

	// Snapshot del nombre: si la cuenta se elimina después,
	// el historial conserva quién hizo el registro.
	var nombre string
	_ = r.db.QueryRow(context.Background(),
		`SELECT COALESCE(nombre,'') FROM usuarios WHERE id=$1`, reg.UsuarioID,
	).Scan(&nombre)

	_, err = r.db.Exec(context.Background(), `
		INSERT INTO bitacora_actividad (
			usuario_id, usuario_nombre, sucursal_id, modulo, accion,
			entidad, entidad_id,
			datos_anteriores, datos_nuevos,
			ip_address, user_agent
		) VALUES (
			$1, $2, $3, $4,
			NULLIF($5,'')::uuid, NULLIF($6,'')::uuid,
			NULLIF($7,'')::jsonb, NULLIF($8,'')::jsonb,
			NULLIF($9,''), NULLIF($10,'')
		)
	`,
		reg.UsuarioID, nombre, reg.SucursalID, reg.Modulo, reg.Accion,
		reg.Entidad, reg.EntidadID,
		string(datosAnt), string(datosNuevos),
		reg.IPAddress, reg.UserAgent,
	)
	return err
}

func (r *Repository) FindAll(filtros FiltrosBitacora) ([]Registro, error) {
	query := `
		SELECT
			b.id, COALESCE(b.usuario_id::text,''), COALESCE(b.usuario_nombre, u.nombre, ''),
			b.sucursal_id, b.modulo, b.accion,
			COALESCE(b.entidad,''), COALESCE(b.entidad_id::text,''),
			b.datos_anteriores, b.datos_nuevos,
			COALESCE(b.ip_address,''), COALESCE(b.user_agent,''),
			b.created_at
		FROM bitacora_actividad b
		LEFT JOIN usuarios u ON u.id = b.usuario_id
		WHERE b.sucursal_id = $1
	`
	args := []any{filtros.SucursalID}
	i := 2

	if filtros.UsuarioID != "" {
		query += fmt.Sprintf(" AND b.usuario_id=$%d", i)
		args = append(args, filtros.UsuarioID)
		i++
	}
	if filtros.Modulo != "" {
		query += fmt.Sprintf(" AND b.modulo=$%d", i)
		args = append(args, filtros.Modulo)
		i++
	}
	if filtros.Accion != "" {
		query += fmt.Sprintf(" AND b.accion=$%d", i)
		args = append(args, filtros.Accion)
		i++
	}
	if filtros.Desde != "" {
		query += fmt.Sprintf(" AND b.created_at::date>=$%d", i)
		args = append(args, filtros.Desde)
		i++
	}
	if filtros.Hasta != "" {
		query += fmt.Sprintf(" AND b.created_at::date<=$%d", i)
		args = append(args, filtros.Hasta)
		i++
	}

	query += " ORDER BY b.created_at DESC"

	if filtros.Limite > 0 {
		query += fmt.Sprintf(" LIMIT $%d", i)
		args = append(args, filtros.Limite)
	}

	rows, err := r.db.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var registros []Registro
	for rows.Next() {
		var reg Registro
		var datosAnt, datosNuevos []byte
		if err := rows.Scan(
			&reg.ID, &reg.UsuarioID, &reg.UsuarioNombre,
			&reg.SucursalID, &reg.Modulo, &reg.Accion,
			&reg.Entidad, &reg.EntidadID,
			&datosAnt, &datosNuevos,
			&reg.IPAddress, &reg.UserAgent,
			&reg.CreatedAt,
		); err != nil {
			return nil, err
		}
		if len(datosAnt) > 0 {
			_ = json.Unmarshal(datosAnt, &reg.DatosAnteriores)
		}
		if len(datosNuevos) > 0 {
			_ = json.Unmarshal(datosNuevos, &reg.DatosNuevos)
		}
		registros = append(registros, reg)
	}
	return registros, nil
}

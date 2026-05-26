package auth

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

// FindByUsername hace JOIN con roles para traer permisos en una sola query
func (r *Repository) FindByUsername(username string) (*User, error) {
	query := `
		SELECT
			u.id,
			u.sucursal_id::text,
			u.rol_id::text,
			u.nombre,
			u.username,
			u.password_hash,
			u.activo,
			u.created_at,
			r.nombre   AS rol_nombre,
			r.permisos
		FROM usuarios u
		JOIN roles r ON r.id = u.rol_id
		WHERE u.username = $1
		LIMIT 1
	`

	var user User
	err := r.db.QueryRow(context.Background(), query, username).Scan(
		&user.ID,
		&user.SucursalID,
		&user.RolID,
		&user.Nombre,
		&user.Username,
		&user.PasswordHash,
		&user.Activo,
		&user.CreatedAt,
		&user.RolNombre,
		&user.Permisos,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil // no encontrado — el service lo maneja
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID se usa para revalidar el usuario en el middleware
func (r *Repository) FindByID(userID string) (*User, error) {
	query := `
		SELECT
			u.id,
			u.sucursal_id::text,
			u.rol_id::text,
			u.nombre,
			u.username,
			u.password_hash,
			u.activo,
			u.created_at,
			r.nombre   AS rol_nombre,
			r.permisos
		FROM usuarios u
		JOIN roles r ON r.id = u.rol_id
		WHERE u.id = $1
		LIMIT 1
	`

	var user User
	err := r.db.QueryRow(context.Background(), query, userID).Scan(
		&user.ID,
		&user.SucursalID,
		&user.RolID,
		&user.Nombre,
		&user.Username,
		&user.PasswordHash,
		&user.Activo,
		&user.CreatedAt,
		&user.RolNombre,
		&user.Permisos,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

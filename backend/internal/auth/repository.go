package auth

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindByUsername(username string) (*User, error) {

	query := `
		SELECT
			id,
			sucursal_id,
			rol_id,
			nombre,
			username,
			password_hash,
			activo,
			created_at
		FROM usuarios
		WHERE username = $1
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
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

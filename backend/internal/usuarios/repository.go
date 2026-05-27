package usuarios

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

func (r *Repository) FindAll(sucursalID string) ([]Usuario, error) {
	query := `
		SELECT
			u.id, u.sucursal_id, u.rol_id, u.nombre, u.username,
			u.activo, u.created_at, u.updated_at,
			r.nombre AS rol_nombre,
			s.nombre AS sucursal_nombre
		FROM usuarios u
		JOIN roles r ON r.id = u.rol_id
		JOIN sucursales s ON s.id = u.sucursal_id
		WHERE u.sucursal_id = $1
		ORDER BY u.created_at DESC
	`
	rows, err := r.db.Query(context.Background(), query, sucursalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var usuarios []Usuario
	for rows.Next() {
		var u Usuario
		err := rows.Scan(
			&u.ID, &u.SucursalID, &u.RolID, &u.Nombre, &u.Username,
			&u.Activo, &u.CreatedAt, &u.UpdatedAt,
			&u.RolNombre, &u.SucursalNombre,
		)
		if err != nil {
			return nil, err
		}
		usuarios = append(usuarios, u)
	}
	return usuarios, nil
}

func (r *Repository) FindByID(id string) (*Usuario, error) {
	query := `
		SELECT
			u.id, u.sucursal_id, u.rol_id, u.nombre, u.username,
			u.activo, u.created_at, u.updated_at,
			r.nombre AS rol_nombre,
			s.nombre AS sucursal_nombre
		FROM usuarios u
		JOIN roles r ON r.id = u.rol_id
		JOIN sucursales s ON s.id = u.sucursal_id
		WHERE u.id = $1
	`
	var u Usuario
	err := r.db.QueryRow(context.Background(), query, id).Scan(
		&u.ID, &u.SucursalID, &u.RolID, &u.Nombre, &u.Username,
		&u.Activo, &u.CreatedAt, &u.UpdatedAt,
		&u.RolNombre, &u.SucursalNombre,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) ExistsByUsername(username string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(context.Background(),
		`SELECT EXISTS(SELECT 1 FROM usuarios WHERE username = $1)`, username,
	).Scan(&exists)
	return exists, err
}

func (r *Repository) Create(u *Usuario, passwordHash string) error {
	query := `
		INSERT INTO usuarios (sucursal_id, rol_id, nombre, username, password_hash, activo)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(context.Background(), query,
		u.SucursalID, u.RolID, u.Nombre, u.Username, passwordHash,
	).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
}

func (r *Repository) Update(id string, req UpdateUsuarioRequest) error {
	_, err := r.db.Exec(context.Background(), `
		UPDATE usuarios
		SET nombre = $1, rol_id = $2, updated_at = NOW()
		WHERE id = $3
	`, req.Nombre, req.RolID, id)
	return err
}

func (r *Repository) UpdateEstado(id string, activo bool) error {
	_, err := r.db.Exec(context.Background(), `
		UPDATE usuarios SET activo = $1, updated_at = NOW() WHERE id = $2
	`, activo, id)
	return err
}

func (r *Repository) UpdatePassword(id, passwordHash string) error {
	_, err := r.db.Exec(context.Background(), `
		UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2
	`, passwordHash, id)
	return err
}

func (r *Repository) FindRoles() ([]Rol, error) {
	rows, err := r.db.Query(context.Background(), `SELECT id, nombre FROM roles ORDER BY nombre`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []Rol
	for rows.Next() {
		var rol Rol
		if err := rows.Scan(&rol.ID, &rol.Nombre); err != nil {
			return nil, err
		}
		roles = append(roles, rol)
	}
	return roles, nil
}

package auth

import "time"

type User struct {
	ID           string    `db:"id"`
	SucursalID   string    `db:"sucursal_id"`
	RolID        string    `db:"rol_id"`
	Nombre       string    `db:"nombre"`
	Username     string    `db:"username"`
	PasswordHash string    `db:"password_hash"`
	Activo       bool      `db:"activo"`
	CreatedAt    time.Time `db:"created_at"`
	RolNombre    string    `db:"rol_nombre"`
	Permisos     []byte    `db:"permisos"`
}

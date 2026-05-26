package auth

import "time"

type User struct {
	ID           string    `db:"id" json:"id"`
	SucursalID   string    `db:"sucursal_id" json:"sucursal_id"`
	RolID        string    `db:"rol_id" json:"rol_id"`
	Nombre       string    `db:"nombre" json:"nombre"`
	Username     string    `db:"username" json:"username"`
	PasswordHash string    `db:"password_hash" json:"-"`
	Activo       bool      `db:"activo" json:"activo"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

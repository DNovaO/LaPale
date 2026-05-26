package domain

import "time"

type Usuario struct {
	ID           string    `json:"id"`
	SucursalID   string    `json:"sucursal_id"`
	RolID        string    `json:"rol_id"`
	Nombre       string    `json:"nombre"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Activo       bool      `json:"activo"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

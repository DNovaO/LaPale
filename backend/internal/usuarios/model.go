package usuarios

import "time"

type Rol struct {
	ID     string `json:"id"`
	Nombre string `json:"nombre"`
}

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

	// Del JOIN
	RolNombre      string `json:"rol"`
	SucursalNombre string `json:"sucursal"`
}

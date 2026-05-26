package auth

import "paleteria-system/pkg/claims"

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string     `json:"token"`
	User  UserPublic `json:"user"`
}

type UserPublic struct {
	ID         string          `json:"id"`
	Nombre     string          `json:"nombre"`
	Username   string          `json:"username"`
	RolNombre  string          `json:"rol"`
	SucursalID string          `json:"sucursal_id"`
	Permisos   claims.Permisos `json:"permisos"`
}

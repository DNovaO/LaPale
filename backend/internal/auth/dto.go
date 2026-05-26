package auth

// LoginRequest es el body del POST /auth/login
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse es lo que devuelve el endpoint de login
type LoginResponse struct {
	Token string     `json:"token"`
	User  UserPublic `json:"user"`
}

// UserPublic es la representación segura del usuario (sin password_hash)
type UserPublic struct {
	ID         string   `json:"id"`
	Nombre     string   `json:"nombre"`
	Username   string   `json:"username"`
	RolNombre  string   `json:"rol"`
	SucursalID string   `json:"sucursal_id"`
	Permisos   Permisos `json:"permisos"`
}

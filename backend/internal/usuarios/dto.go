package usuarios

type CreateUsuarioRequest struct {
	SucursalID string `json:"sucursal_id"`
	RolID      string `json:"rol_id"`
	Nombre     string `json:"nombre"`
	Username   string `json:"username"`
	Password   string `json:"password"`
}

type UpdateUsuarioRequest struct {
	Nombre string `json:"nombre"`
	RolID  string `json:"rol_id"`
}

type UpdateEstadoRequest struct {
	Activo bool `json:"activo"`
}

type ChangePasswordRequest struct {
	Password string `json:"password"`
}

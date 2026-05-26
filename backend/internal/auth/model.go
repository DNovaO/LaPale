package auth

import "time"

// User es el modelo interno — nunca sale directo al JSON
type User struct {
	ID           string    `db:"id"`
	SucursalID   string    `db:"sucursal_id"`
	RolID        string    `db:"rol_id"`
	Nombre       string    `db:"nombre"`
	Username     string    `db:"username"`
	PasswordHash string    `db:"password_hash"`
	Activo       bool      `db:"activo"`
	CreatedAt    time.Time `db:"created_at"`

	// Campos del JOIN con roles
	RolNombre string `db:"rol_nombre"`
	Permisos  []byte `db:"permisos"` // JSONB raw
}

// Permisos refleja exactamente el JSONB de roles.permisos
type Permisos struct {
	PuedeCortesia       bool `json:"puede_cortesia"`
	VerReportes         bool `json:"ver_reportes"`
	GestionarInventario bool `json:"gestionar_inventario"`
	GestionarUsuarios   bool `json:"gestionar_usuarios"`
	RegistrarGastos     bool `json:"registrar_gastos"`
	CerrarCaja          bool `json:"cerrar_caja"`
}

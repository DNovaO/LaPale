package claims

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const ContextKey = "claims"

type Permisos struct {
	PuedeCortesia       bool `json:"puede_cortesia"`
	VerReportes         bool `json:"ver_reportes"`
	GestionarInventario bool `json:"gestionar_inventario"`
	GestionarUsuarios   bool `json:"gestionar_usuarios"`
	RegistrarGastos     bool `json:"registrar_gastos"`
	CerrarCaja          bool `json:"cerrar_caja"`
}

type UserClaims struct {
	UserID     string   `json:"user_id"`
	Username   string   `json:"username"`
	Nombre     string   `json:"nombre"`
	RolNombre  string   `json:"rol"`
	SucursalID string   `json:"sucursal_id"`
	Permisos   Permisos `json:"permisos"`
	jwt.RegisteredClaims
}

// GetClaims extrae los claims del contexto de Fiber.
// Disponible para cualquier handler sin importar auth.
func GetClaims(c *fiber.Ctx) *UserClaims {
	uc, _ := c.Locals(ContextKey).(*UserClaims)
	return uc
}

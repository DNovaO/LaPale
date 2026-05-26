package auth

import (
	"strings"

	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
)

const claimsKey = "claims"

// Middleware valida el JWT en el header Authorization: Bearer <token>
// Úsalo en cualquier grupo de rutas protegidas
func Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" {
			return response.Error(c, 401, "token requerido")
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			return response.Error(c, 401, "formato inválido: Authorization: Bearer <token>")
		}

		claims, err := ParseJWT(parts[1])
		if err != nil {
			return response.Error(c, 401, "token inválido o expirado")
		}

		// Guardamos los claims para que cualquier handler los pueda leer
		c.Locals(claimsKey, claims)
		return c.Next()
	}
}

// GetClaims extrae los claims del contexto de Fiber.
// Llamar solo dentro de rutas protegidas con Middleware().
func GetClaims(c *fiber.Ctx) *Claims {
	claims, _ := c.Locals(claimsKey).(*Claims)
	return claims
}

// RequirePermiso devuelve un middleware que verifica un permiso puntual.
//
// Uso:
//
//	api.Get("/reportes", auth.Middleware(), auth.RequirePermiso(func(p auth.Permisos) bool {
//	    return p.VerReportes
//	}), handler)
func RequirePermiso(check func(Permisos) bool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil {
			return response.Error(c, 401, "no autenticado")
		}
		if !check(claims.Permisos) {
			return response.Error(c, 403, "no tienes permiso para esta acción")
		}
		return c.Next()
	}
}

// RequireAdmin verifica que el usuario sea administrador.
func RequireAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil {
			return response.Error(c, 401, "no autenticado")
		}
		if claims.RolNombre != "administrador" {
			return response.Error(c, 403, "se requiere rol administrador")
		}
		return c.Next()
	}
}

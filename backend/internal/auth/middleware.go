package auth

import (
	"strings"

	"paleteria-system/pkg/claims"
	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
)

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

		uc, err := ParseJWT(parts[1])
		if err != nil {
			return response.Error(c, 401, "token inválido o expirado")
		}

		c.Locals(claims.ContextKey, uc)
		return c.Next()
	}
}

// GetClaims es un alias para no romper los handlers existentes
func GetClaims(c *fiber.Ctx) *claims.UserClaims {
	return claims.GetClaims(c)
}

func RequirePermiso(check func(claims.Permisos) bool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		uc := claims.GetClaims(c)
		if uc == nil {
			return response.Error(c, 401, "no autenticado")
		}
		if !check(uc.Permisos) {
			return response.Error(c, 403, "no tienes permiso para esta acción")
		}
		return c.Next()
	}
}

func RequireAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		uc := claims.GetClaims(c)
		if uc == nil {
			return response.Error(c, 401, "no autenticado")
		}
		if uc.RolNombre != "administrador" {
			return response.Error(c, 403, "se requiere rol administrador")
		}
		return c.Next()
	}
}

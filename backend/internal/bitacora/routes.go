package bitacora

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegisterRoutes espera un grupo de router que ya tenga aplicados
// auth.Middleware() y auth.RequireAdmin() antes de llamar.
func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	service := NewService(db)
	handler := NewHandler(service)

	router.Get("/", handler.GetAll)
}

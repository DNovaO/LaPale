package ventas

import (
	"paleteria-system/internal/auth"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	repo := NewRepository(db)
	service := NewService(repo)
	handler := NewHandler(service)

	v := router.Group("/ventas", auth.Middleware())

	v.Get("/", handler.GetAll)
	v.Get("/:id", handler.GetByID)
	v.Post("/", handler.Confirmar)
	v.Patch("/:id/cancelar", auth.RequireAdmin(), handler.Cancelar)
}

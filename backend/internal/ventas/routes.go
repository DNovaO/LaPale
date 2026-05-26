package ventas

import (
	"paleteria-system/internal/auth"
	"paleteria-system/internal/bitacora"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	repo := NewRepository(db)
	service := NewService(repo)
	b := bitacora.NewService(db)
	handler := NewHandler(service, b)
	v := router.Group("/ventas", auth.Middleware())

	v.Get("/", handler.GetAll)
	v.Get("/:id", handler.GetByID)
	v.Post("/", handler.Confirmar)
	v.Patch("/:id/cancelar", auth.RequireAdmin(), handler.Cancelar)
}

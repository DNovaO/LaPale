package ventas

import (
	"paleteria-system/internal/auth"
	"paleteria-system/internal/bitacora"
	"paleteria-system/internal/cortesias"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool, cs *cortesias.Service) {
	repo := NewRepository(db)
	service := NewService(repo, cs)
	b := bitacora.NewService(db)
	handler := NewHandler(service, b)
	v := router.Group("/ventas", auth.Middleware())

	v.Get("/", handler.GetAll)
	v.Get("/pendientes", handler.GetPendientes)
	v.Get("/top-productos", handler.GetTopProductos)
	v.Get("/:id", handler.GetByID)
	v.Post("/", handler.Confirmar)
	v.Post("/:id/cobrar", handler.Cobrar)
	v.Patch("/:id/cancelar", auth.RequireAdmin(), handler.Cancelar)
}

package cortesias

import (
	"paleteria-system/internal/auth"
	"paleteria-system/internal/bitacora"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	repo := NewRepository(db)
	service := NewService(repo, db)
	b := bitacora.NewService(db)
	handler := NewHandler(service, b)

	c := router.Group("/cortesias",
		auth.Middleware(),
		auth.RequireAdmin(),
	)

	c.Get("/reglas", handler.GetAllReglas)
	c.Get("/reglas/:id", handler.GetRegla)
	c.Post("/reglas", handler.CreateRegla)
	c.Put("/reglas/:id", handler.UpdateRegla)
	c.Delete("/reglas/:id", handler.DeleteRegla)
	c.Patch("/reglas/:id/toggle", handler.ToggleRegla)
	c.Get("/dashboard", handler.GetDashboard)
	c.Get("/historial", handler.GetHistorial)
	c.Get("/preview", handler.PreviewCortesia)
}

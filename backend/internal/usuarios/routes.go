package usuarios

import (
	"paleteria-system/internal/auth"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	repo := NewRepository(db)
	service := NewService(repo)
	handler := NewHandler(service)

	// Todas requieren estar autenticado y ser administrador
	u := router.Group("/usuarios",
		auth.Middleware(),
		auth.RequireAdmin(),
	)

	u.Get("/", handler.GetAll)
	u.Get("/:id", handler.GetByID)
	u.Post("/", handler.Create)
	u.Put("/:id", handler.Update)
	u.Patch("/:id/estado", handler.UpdateEstado)
	u.Patch("/:id/password", handler.ChangePassword)
}

package bitacora

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	service := NewService(db)
	handler := NewHandler(service)

	// El router que llega desde main.go ya tiene auth.Middleware()
	// y auth.RequireAdmin() aplicados — ver cmd/api/main.go
	router.Get("/bitacora", handler.GetAll)
}

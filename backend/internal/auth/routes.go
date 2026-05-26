package auth

import (
	"paleteria-system/internal/bitacora"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	repo := NewRepository(db)
	service := NewService(repo)
	b := bitacora.NewService(db)
	handler := NewHandler(service, b)

	router.Post("/auth/login", handler.Login)
}

package auth

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {

	repo := NewRepository(db)
	service := NewService(repo)
	handler := NewHandler(service)

	auth := router.Group("/auth")

	auth.Post("/login", handler.Login)
}

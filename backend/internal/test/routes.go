package test

import (
	"paleteria-system/internal/auth"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	t := router.Group("/test", auth.Middleware(), auth.RequireAdmin())
	t.Post("/generar-ventas", GenerarVentas(db))
}

package main

import (
	"log"

	"paleteria-system/internal/auth"
	"paleteria-system/internal/config"
	"paleteria-system/internal/database"
	"paleteria-system/internal/finanzas"
	"paleteria-system/internal/inventario"
	"paleteria-system/internal/usuarios"
	"paleteria-system/internal/ventas"
	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	config.LoadConfig()

	db, err := database.Connect()
	if err != nil {
		log.Fatal(err)
	}

	app := fiber.New(fiber.Config{
		AppName: config.AppConfig.AppName,
	})

	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} ${method} ${path} ${latency}\n",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return response.Success(c, fiber.Map{"status": "ok"})
	})

	api := app.Group("/api")

	// Rutas públicas
	auth.RegisterRoutes(api, db)

	// Rutas protegidas
	usuarios.RegisterRoutes(api, db)
	inventario.RegisterRoutes(api, db)
	ventas.RegisterRoutes(api, db)
	finanzas.RegisterRoutes(api, db)

	log.Printf("🚀 Servidor corriendo en puerto %s [%s]", config.AppConfig.AppPort, config.AppConfig.AppEnv)
	log.Fatal(app.Listen(":" + config.AppConfig.AppPort))
}

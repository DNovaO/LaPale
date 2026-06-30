package main

import (
	"log"
	"os"

	"paleteria-system/internal/auth"
	"paleteria-system/internal/bitacora"
	"paleteria-system/internal/config"
	"paleteria-system/internal/cortesias"
	"paleteria-system/internal/database"
	"paleteria-system/internal/finanzas"
	"paleteria-system/internal/inventario"
	"paleteria-system/internal/printer"
	"paleteria-system/internal/usuarios"
	"paleteria-system/internal/ventas"
	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	config.LoadConfig()

	db, err := database.Connect()
	if err != nil {
		log.Fatal(err)
	}

	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Error al ejecutar migraciones: %v", err)
	}

	os.MkdirAll("data/cierres", 0755)

	app := fiber.New(fiber.Config{
		AppName: config.AppConfig.AppName,
	})

	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} ${method} ${path} ${latency}\n",
	}))

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, ngrok-skip-browser-warning",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return response.Success(c, fiber.Map{"status": "ok"})
	})

	api := app.Group("/api")

	auth.RegisterRoutes(api, db)

	usuarios.RegisterRoutes(api, db)
	inventario.RegisterRoutes(api, db)

	csRepo := cortesias.NewRepository(db)
	csService := cortesias.NewService(csRepo, db)
	cortesias.RegisterRoutes(api, db)
	ventas.RegisterRoutes(api, db, csService)

	// Después de las otras rutas:
	printer.RegisterRoutes(api)

	finanzas.RegisterRoutes(api, db)
	bitacora.RegisterRoutes(
		api.Group("/bitacora", auth.Middleware(), auth.RequireAdmin()),
		db,
	)

	log.Printf("🚀 Servidor corriendo en puerto %s [%s]", config.AppConfig.AppPort, config.AppConfig.AppEnv)
	log.Fatal(app.Listen(":" + config.AppConfig.AppPort))
}

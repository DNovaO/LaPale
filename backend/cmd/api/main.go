package main

import (
	"log"
	"paleteria-system/internal/auth"
	"paleteria-system/internal/config"
	"paleteria-system/internal/database"

	"github.com/gofiber/fiber/v2"
)

func main() {

	config.LoadConfig()

	db, err := database.Connect()

	if err != nil {
		log.Fatal(err)
	}

	app := fiber.New()

	api := app.Group("/api")

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "backend running",
		})
	})

	auth.RegisterRoutes(api, db)

	log.Fatal(app.Listen(":" + config.AppConfig.AppPort))
}

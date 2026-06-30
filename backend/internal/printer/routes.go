package printer

import (
	"os"
	"paleteria-system/internal/auth"
	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(router fiber.Router) {
	device := os.Getenv("PRINTER_DEVICE")
	r := router.Group("/printer", auth.Middleware())

	r.Post("/ticket", func(c *fiber.Ctx) error {
		var t Ticket
		if err := c.BodyParser(&t); err != nil {
			return response.Error(c, 400, "body inválido")
		}
		if err := PrintTicket(device, &t); err != nil {
			return response.Error(c, 500, "error al imprimir: "+err.Error())
		}
		return response.Success(c, fiber.Map{"printed": true})
	})

	// r.Post("/cajon", func(c *fiber.Ctx) error {
	// 	if err := OpenCashDrawer(device); err != nil {
	// 		return response.Error(c, 500, "error al abrir cajón: "+err.Error())
	// 	}
	// 	return response.Success(c, fiber.Map{"opened": true})
	// })
}

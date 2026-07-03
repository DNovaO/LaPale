package email

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"paleteria-system/internal/auth"
	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) SendTicket(c *fiber.Ctx) error {
	var req SendTicketRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body invalido")
	}
	if req.Email == "" {
		return response.Error(c, 400, "el email es requerido")
	}

	if err := SendTicket(req); err != nil {
		return response.Error(c, 500, "error al enviar el correo: "+err.Error())
	}

	return response.Success(c, fiber.Map{"message": "Ticket enviado a " + req.Email})
}

func (h *Handler) UploadTicket(c *fiber.Ctx) error {
	file, err := c.FormFile("pdf")
	if err != nil {
		return response.Error(c, 400, "archivo PDF requerido")
	}

	filename := fmt.Sprintf("ticket_%d.pdf", time.Now().UnixNano())
	dir := "data/tickets"
	os.MkdirAll(dir, 0755)
	path := filepath.Join(dir, filename)

	if err := c.SaveFile(file, path); err != nil {
		return response.Error(c, 500, "error al guardar archivo")
	}

	url := "/tickets/" + filename
	return response.Success(c, fiber.Map{"url": url})
}

func RegisterRoutes(router fiber.Router) {
	handler := NewHandler()
	e := router.Group("/email", auth.Middleware())
	e.Post("/ticket", handler.SendTicket)

	router.Post("/tickets/upload", handler.UploadTicket)
}

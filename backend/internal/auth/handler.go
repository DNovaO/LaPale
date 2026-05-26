package auth

import (
	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Login(c *fiber.Ctx) error {

	var req LoginRequest

	if err := c.BodyParser(&req); err != nil {
		return response.Error(
			c,
			400,
			"body inválido",
		)
	}

	authResponse, err := h.service.Login(req)

	if err != nil {
		return response.Error(
			c,
			401,
			"credenciales inválidas",
		)
	}

	return response.Success(c, authResponse)
}

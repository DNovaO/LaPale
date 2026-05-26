package auth

import (
	"errors"

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
		return response.Error(c, 400, "body inválido")
	}

	if req.Username == "" || req.Password == "" {
		return response.Error(c, 400, "username y password son requeridos")
	}

	authResponse, err := h.service.Login(req)
	if err != nil {
		switch {
		case errors.Is(err, ErrCredencialesInvalidas):
			return response.Error(c, 401, "credenciales inválidas")
		case errors.Is(err, ErrUsuarioInactivo):
			return response.Error(c, 401, "usuario inactivo, contacta al administrador")
		default:
			return response.Error(c, 500, "error interno del servidor")
		}
	}

	return response.Success(c, authResponse)
}

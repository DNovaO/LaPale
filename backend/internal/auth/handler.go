package auth

import (
	"errors"

	"paleteria-system/internal/bitacora"
	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service  *Service
	bitacora *bitacora.Service
}

func NewHandler(service *Service, b *bitacora.Service) *Handler {
	return &Handler{service: service, bitacora: b}
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

	h.bitacora.Log(bitacora.Registro{
		UsuarioID:  authResponse.User.ID,
		SucursalID: authResponse.User.SucursalID,
		Modulo:     bitacora.ModuloAuth,
		Accion:     bitacora.AccionLogin,
		IPAddress:  c.IP(),
		UserAgent:  c.Get("User-Agent"),
	})

	return response.Success(c, authResponse)
}

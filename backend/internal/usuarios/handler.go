package usuarios

import (
	"errors"

	"paleteria-system/internal/auth"
	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetAll(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	usuarios, err := h.service.GetAll(claims.SucursalID)
	if err != nil {
		return response.Error(c, 500, "error al obtener usuarios")
	}
	return response.Success(c, usuarios)
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	u, err := h.service.GetByID(id)
	if err != nil {
		if errors.Is(err, ErrUsuarioNoEncontrado) {
			return response.Error(c, 404, "usuario no encontrado")
		}
		return response.Error(c, 500, "error al obtener usuario")
	}
	return response.Success(c, u)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var req CreateUsuarioRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	// Si no mandan sucursal_id, usamos la del admin que está creando
	if req.SucursalID == "" {
		claims := auth.GetClaims(c)
		req.SucursalID = claims.SucursalID
	}

	u, err := h.service.Create(req)
	if err != nil {
		switch {
		case errors.Is(err, ErrUsernameOcupado):
			return response.Error(c, 409, "el username ya está en uso")
		case errors.Is(err, ErrDatosRequeridos):
			return response.Error(c, 400, "faltan datos requeridos")
		case errors.Is(err, ErrPasswordMuyCorto):
			return response.Error(c, 400, "la contraseña debe tener al menos 6 caracteres")
		default:
			return response.Error(c, 500, "error al crear usuario")
		}
	}
	return response.Created(c, u)
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var req UpdateUsuarioRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	if err := h.service.Update(id, req); err != nil {
		switch {
		case errors.Is(err, ErrUsuarioNoEncontrado):
			return response.Error(c, 404, "usuario no encontrado")
		case errors.Is(err, ErrDatosRequeridos):
			return response.Error(c, 400, "faltan datos requeridos")
		default:
			return response.Error(c, 500, "error al actualizar usuario")
		}
	}
	return response.Success(c, fiber.Map{"message": "usuario actualizado"})
}

func (h *Handler) UpdateEstado(c *fiber.Ctx) error {
	id := c.Params("id")
	var req UpdateEstadoRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	if err := h.service.UpdateEstado(id, req.Activo); err != nil {
		if errors.Is(err, ErrUsuarioNoEncontrado) {
			return response.Error(c, 404, "usuario no encontrado")
		}
		return response.Error(c, 500, "error al actualizar estado")
	}
	return response.Success(c, fiber.Map{"message": "estado actualizado"})
}

func (h *Handler) ChangePassword(c *fiber.Ctx) error {
	id := c.Params("id")
	var req ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	if err := h.service.ChangePassword(id, req); err != nil {
		if errors.Is(err, ErrPasswordMuyCorto) {
			return response.Error(c, 400, "la contraseña debe tener al menos 6 caracteres")
		}
		return response.Error(c, 500, "error al cambiar contraseña")
	}
	return response.Success(c, fiber.Map{"message": "contraseña actualizada"})
}

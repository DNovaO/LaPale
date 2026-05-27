package bitacora

import (
	"log"

	"paleteria-system/pkg/claims"
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
	uc := claims.GetClaims(c)
	if uc == nil {
		return response.Error(c, 401, "no autenticado")
	}

	filtros := FiltrosBitacora{
		SucursalID: uc.SucursalID,
		UsuarioID:  c.Query("usuario_id"),
		Modulo:     c.Query("modulo"),
		Accion:     c.Query("accion"),
		Desde:      c.Query("desde"),
		Hasta:      c.Query("hasta"),
		Limite:     c.QueryInt("limite", 100),
	}

	registros, err := h.service.GetAll(filtros)
	if err != nil {
		log.Printf("ERROR al obtener bitácora: %v", err)
		return response.Error(c, 500, "error al obtener bitácora")
	}
	return response.Success(c, registros)
}

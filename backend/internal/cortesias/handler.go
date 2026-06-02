package cortesias

import (
	"errors"
	"log"

	"paleteria-system/internal/auth"
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

func (h *Handler) GetAllReglas(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	reglas, err := h.service.GetAll(claims.SucursalID)
	if err != nil {
		return response.Error(c, 500, "error al obtener reglas")
	}
	return response.Success(c, reglas)
}

func (h *Handler) GetRegla(c *fiber.Ctx) error {
	rg, err := h.service.GetByID(c.Params("id"))
	if err != nil {
		if errors.Is(err, ErrReglaNoEncontrada) {
			return response.Error(c, 404, "regla no encontrada")
		}
		return response.Error(c, 500, "error al obtener regla")
	}
	return response.Success(c, rg)
}

func (h *Handler) CreateRegla(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	var req CreateReglaRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	rg, err := h.service.Create(claims.SucursalID, req)
	if err != nil {
		if errors.Is(err, ErrDatosRequeridos) {
			return response.Error(c, 400, "faltan datos requeridos")
		}
		if errors.Is(err, ErrRangoSolapado) {
			return response.Error(c, 409, "el rango de montos se solapa con otra regla activa")
		}
		log.Printf("ERROR al crear regla: %v", err)
		return response.Error(c, 500, "error al crear regla")
	}

	h.bitacora.Log(bitacora.Registro{
		UsuarioID:  claims.UserID,
		SucursalID: claims.SucursalID,
		Modulo:     "CORTESIAS",
		Accion:     bitacora.AccionCrear,
		Entidad:    "reglas_cortesia",
		EntidadID:  rg.ID,
		DatosNuevos: fiber.Map{
			"nombre":     rg.Nombre,
			"producto":   rg.ProductoID,
			"rango":      fiber.Map{"min": rg.MontoMinimo, "max": rg.MontoMaximo},
		},
		IPAddress: c.IP(),
	})

	return response.Created(c, rg)
}

func (h *Handler) UpdateRegla(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	id := c.Params("id")
	var req UpdateReglaRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	if err := h.service.Update(id, req); err != nil {
		if errors.Is(err, ErrDatosRequeridos) {
			return response.Error(c, 400, "faltan datos requeridos")
		}
		if errors.Is(err, ErrRangoSolapado) {
			return response.Error(c, 409, "el rango de montos se solapa con otra regla activa")
		}
		return response.Error(c, 500, "error al actualizar regla")
	}

	h.bitacora.Log(bitacora.Registro{
		UsuarioID:  claims.UserID,
		SucursalID: claims.SucursalID,
		Modulo:     "CORTESIAS",
		Accion:     bitacora.AccionActualizar,
		Entidad:    "reglas_cortesia",
		EntidadID:  id,
		IPAddress:  c.IP(),
	})

	return response.Success(c, fiber.Map{"message": "regla actualizada"})
}

func (h *Handler) DeleteRegla(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	id := c.Params("id")

	if err := h.service.Delete(id); err != nil {
		return response.Error(c, 500, "error al eliminar regla")
	}

	h.bitacora.Log(bitacora.Registro{
		UsuarioID:  claims.UserID,
		SucursalID: claims.SucursalID,
		Modulo:     "CORTESIAS",
		Accion:     bitacora.AccionEliminar,
		Entidad:    "reglas_cortesia",
		EntidadID:  id,
		IPAddress:  c.IP(),
	})

	return response.Success(c, fiber.Map{"message": "regla eliminada"})
}

func (h *Handler) ToggleRegla(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	id := c.Params("id")
	var req ToggleReglaRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	if err := h.service.ToggleActiva(id, req.Activa); err != nil {
		return response.Error(c, 500, "error al cambiar estado")
	}

	accion := bitacora.AccionDesactivar
	if req.Activa {
		accion = bitacora.AccionActivar
	}
	h.bitacora.Log(bitacora.Registro{
		UsuarioID:  claims.UserID,
		SucursalID: claims.SucursalID,
		Modulo:     "CORTESIAS",
		Accion:     accion,
		Entidad:    "reglas_cortesia",
		EntidadID:  id,
		IPAddress:  c.IP(),
	})

	return response.Success(c, fiber.Map{"message": "estado actualizado"})
}

func (h *Handler) GetDashboard(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	d, err := h.service.GetDashboard(claims.SucursalID)
	if err != nil {
		return response.Error(c, 500, "error al obtener dashboard")
	}
	return response.Success(c, d)
}

func (h *Handler) GetHistorial(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	filtros := FiltrosHistorial{
		SucursalID: claims.SucursalID,
		FechaDesde: c.Query("desde"),
		FechaHasta: c.Query("hasta"),
		VendedorID: c.Query("vendedor_id"),
		Limite:     c.QueryInt("limite", 100),
	}

	historial, err := h.service.GetHistorial(filtros)
	if err != nil {
		return response.Error(c, 500, "error al obtener historial")
	}
	return response.Success(c, historial)
}

func (h *Handler) PreviewCortesia(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	monto := c.QueryFloat("monto", 0)

	info, err := h.service.PreviewCortesia(claims.SucursalID, monto)
	if err != nil {
		if errors.Is(err, ErrLimiteAlcanzado) {
			return response.Success(c, fiber.Map{"aplicable": false, "mensaje": "límite diario alcanzado"})
		}
		return response.Error(c, 500, "error al consultar cortesía")
	}

	if info == nil {
		return response.Success(c, fiber.Map{"aplicable": false})
	}

	return response.Success(c, fiber.Map{
		"aplicable": true,
		"cortesia":  info,
	})
}

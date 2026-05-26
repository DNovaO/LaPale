package ventas

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
	filtros := FiltrosVenta{
		SucursalID: claims.SucursalID,
		Estado:     c.Query("estado"),
		Tipo:       c.Query("tipo"),
		Fecha:      c.Query("fecha"),
		Limite:     c.QueryInt("limite", 50),
	}
	// Vendedor solo ve sus propias ventas
	if claims.RolNombre == "vendedor" {
		filtros.VendedorID = claims.UserID
	}

	ventas, err := h.service.GetAll(filtros)
	if err != nil {
		return response.Error(c, 500, "error al obtener ventas")
	}
	return response.Success(c, ventas)
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	v, err := h.service.GetByID(c.Params("id"))
	if err != nil {
		if errors.Is(err, ErrVentaNoEncontrada) {
			return response.Error(c, 404, "venta no encontrada")
		}
		return response.Error(c, 500, "error al obtener venta")
	}
	return response.Success(c, v)
}

func (h *Handler) Confirmar(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	var req CrearVentaRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	// Vendedor sin permiso de cortesía no puede crearlas
	if req.Tipo == TipoCortesia && !claims.Permisos.PuedeCortesia {
		return response.Error(c, 403, "no tienes permiso para registrar cortesías")
	}

	venta, err := h.service.Confirmar(claims.SucursalID, claims.UserID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrDetalleVacio):
			return response.Error(c, 400, "la venta debe tener al menos un producto")
		case errors.Is(err, ErrMetodoPagoInvalido):
			return response.Error(c, 400, "método de pago inválido: EFECTIVO, TARJETA, TRANSFERENCIA")
		case errors.Is(err, ErrCortesiaSinAutorizar):
			return response.Error(c, 400, "las cortesías requieren el campo autorizado_por")
		case errors.Is(err, ErrProductoInactivo):
			return response.Error(c, 400, "uno o más productos están inactivos")
		default:
			// Stock insuficiente viene como error con mensaje descriptivo
			return response.Error(c, 400, err.Error())
		}
	}
	return response.Created(c, venta)
}

func (h *Handler) Cancelar(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	var req CancelarVentaRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	if err := h.service.Cancelar(c.Params("id"), req.Motivo, claims.UserID); err != nil {
		switch {
		case errors.Is(err, ErrVentaNoEncontrada):
			return response.Error(c, 404, "venta no encontrada")
		case errors.Is(err, ErrVentaYaCancelada):
			return response.Error(c, 400, "la venta ya está cancelada")
		case errors.Is(err, ErrVentaYaCerrada):
			return response.Error(c, 400, "solo se pueden cancelar ventas cerradas")
		default:
			return response.Error(c, 500, "error al cancelar venta")
		}
	}
	return response.Success(c, fiber.Map{"message": "venta cancelada"})
}

package ventas

import (
	"errors"

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

	// Verificar si algun item es cortesia y el usuario no tiene permiso
	tieneCortesia := false
	for _, d := range req.Detalle {
		if d.EsCortesia {
			tieneCortesia = true
			break
		}
	}
	if tieneCortesia && !claims.Permisos.PuedeCortesia {
		return response.Error(c, 403, "no tienes permiso para registrar cortesías")
	}

	venta, err := h.service.Confirmar(claims.SucursalID, claims.UserID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrDetalleVacio):
			return response.Error(c, 400, "la venta debe tener al menos un producto")
		case errors.Is(err, ErrMetodoPagoInvalido):
			return response.Error(c, 400, "método de pago inválido: EFECTIVO, TARJETA, TRANSFERENCIA")
		case errors.Is(err, ErrProductoInactivo):
			return response.Error(c, 400, "uno o más productos están inactivos")
		default:
			return response.Error(c, 400, err.Error())
		}
	}
	accion := bitacora.AccionConfirmarVenta
	for _, d := range venta.Detalle {
		if d.EsCortesia {
			accion = bitacora.AccionRegistrarCortesia
			break
		}
	}
	resumenProds := make([]fiber.Map, len(venta.Detalle))
	for i, d := range venta.Detalle {
		resumenProds[i] = fiber.Map{
			"nombre":   d.ProductoNombre,
			"cantidad": d.Cantidad,
			"precio":   d.PrecioUnitario,
		}
	}
	h.bitacora.Log(bitacora.Registro{
		UsuarioID:  claims.UserID,
		SucursalID: claims.SucursalID,
		Modulo:     bitacora.ModuloVentas,
		Accion:     accion,
		Entidad:    "ventas",
		EntidadID:  venta.ID,
		DatosNuevos: fiber.Map{
			"ticket":    venta.TicketNumero,
			"total":     venta.Total,
			"tipo":      venta.Tipo,
			"metodo":    req.Pago.Metodo,
			"productos": resumenProds,
			"vendedor":  claims.Nombre,
		},
		IPAddress: c.IP(),
	})

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
	v, _ := h.service.GetByID(c.Params("id"))
	ticket := 0
	total := 0.0
	if v != nil {
		ticket = v.TicketNumero
		total = v.Total
	}
	h.bitacora.Log(bitacora.Registro{
		UsuarioID:   claims.UserID,
		SucursalID:  claims.SucursalID,
		Modulo:      bitacora.ModuloVentas,
		Accion:      bitacora.AccionCancelarVenta,
		Entidad:     "ventas",
		EntidadID:   c.Params("id"),
		DatosNuevos: fiber.Map{
			"motivo": req.Motivo,
			"ticket": ticket,
			"total":  total,
		},
		IPAddress: c.IP(),
	})
	return response.Success(c, fiber.Map{"message": "venta cancelada"})
}

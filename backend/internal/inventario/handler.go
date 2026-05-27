package inventario

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

// ── Productos ────────────────────────────────────────────────

func (h *Handler) GetAll(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	soloActivos := c.QueryBool("activos", false)
	tipo := c.Query("tipo")

	productos, err := h.service.GetAll(claims.SucursalID, soloActivos, tipo)
	if err != nil {
		return response.Error(c, 500, "error al obtener productos")
	}
	return response.Success(c, productos)
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	p, err := h.service.GetByID(c.Params("id"))
	if err != nil {
		if errors.Is(err, ErrProductoNoEncontrado) {
			return response.Error(c, 404, "producto no encontrado")
		}
		return response.Error(c, 500, "error al obtener producto")
	}
	return response.Success(c, p)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	var req CreateProductoRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	p, err := h.service.Create(claims.SucursalID, claims.UserID, req)
	if err != nil {
		if errors.Is(err, ErrDatosRequeridos) {
			return response.Error(c, 400, "nombre es requerido y precio si no tiene presentaciones")
		}
		return response.Error(c, 500, "error al crear producto")
	}

	h.bitacora.Log(bitacora.Registro{
		UsuarioID:   claims.UserID,
		SucursalID:  claims.SucursalID,
		Modulo:      bitacora.ModuloInventario,
		Accion:      bitacora.AccionCrear,
		Entidad:     "productos",
		EntidadID:   p.ID,
		DatosNuevos: p,
		IPAddress:   c.IP(),
	})
	return response.Created(c, p)
}

func (h *Handler) Update(c *fiber.Ctx) error {
	var req UpdateProductoRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	if err := h.service.Update(c.Params("id"), req); err != nil {
		switch {
		case errors.Is(err, ErrProductoNoEncontrado):
			return response.Error(c, 404, "producto no encontrado")
		case errors.Is(err, ErrDatosRequeridos):
			return response.Error(c, 400, err.Error())
		default:
			return response.Error(c, 500, "error al actualizar producto")
		}
	}
	return response.Success(c, fiber.Map{"message": "producto actualizado"})
}

func (h *Handler) UpdateActivo(c *fiber.Ctx) error {
	var body struct {
		Activo bool `json:"activo"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	if err := h.service.UpdateActivo(c.Params("id"), body.Activo); err != nil {
		if errors.Is(err, ErrProductoNoEncontrado) {
			return response.Error(c, 404, "producto no encontrado")
		}
		return response.Error(c, 500, "error al actualizar estado")
	}
	return response.Success(c, fiber.Map{"message": "estado actualizado"})
}

func (h *Handler) GetBajoStock(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	productos, err := h.service.GetBajoStock(claims.SucursalID)
	if err != nil {
		return response.Error(c, 500, "error al obtener productos")
	}
	return response.Success(c, productos)
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	id := c.Params("id")

	p, err := h.service.GetByID(id)
	if err != nil {
		return response.Error(c, 500, "error al obtener producto")
	}
	if p == nil {
		return response.Error(c, 404, "producto no encontrado")
	}

	if err := h.service.Delete(id); err != nil {
		if errors.Is(err, ErrTieneVentas) {
			return response.Error(c, 400, err.Error())
		}
		return response.Error(c, 500, "error al eliminar producto")
	}

	h.bitacora.Log(bitacora.Registro{
		UsuarioID:   claims.UserID,
		SucursalID:  claims.SucursalID,
		Modulo:      bitacora.ModuloInventario,
		Accion:      bitacora.AccionEliminar,
		Entidad:     "productos",
		EntidadID:   id,
		DatosNuevos: fiber.Map{"nombre": p.Nombre, "sku": p.SKU},
		IPAddress:   c.IP(),
	})
	return response.Success(c, fiber.Map{"message": "producto eliminado"})
}

// ── Movimientos ──────────────────────────────────────────────

func (h *Handler) RegistrarMovimiento(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	var req MovimientoRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	m, err := h.service.RegistrarMovimiento(claims.UserID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrProductoNoEncontrado):
			return response.Error(c, 404, "producto no encontrado")
		case errors.Is(err, ErrProductoInactivo):
			return response.Error(c, 400, "el producto está inactivo")
		case errors.Is(err, ErrCantidadInvalida):
			return response.Error(c, 400, "la cantidad debe ser mayor a cero")
		case errors.Is(err, ErrTipoInvalido):
			return response.Error(c, 400, "tipo de movimiento inválido: ENTRADA, SALIDA_VENTA, SALIDA_CORTESIA, AJUSTE_MANUAL, MERMA")
		default:
			if err.Error() != "" {
				return response.Error(c, 400, err.Error())
			}
			return response.Error(c, 500, "error al registrar movimiento")
		}
	}
	h.bitacora.Log(bitacora.Registro{
		UsuarioID:  claims.UserID,
		SucursalID: claims.SucursalID,
		Modulo:     bitacora.ModuloInventario,
		Accion:     bitacora.AccionEntradaStock,
		Entidad:    "movimientos_inventario",
		EntidadID:  m.ID,
		DatosNuevos: fiber.Map{
			"tipo":     m.Tipo,
			"cantidad": m.Cantidad,
			"producto": m.ProductoID,
		},
		IPAddress: c.IP(),
	})
	return response.Created(c, m)
}

func (h *Handler) GetMovimientos(c *fiber.Ctx) error {
	filtros := FiltrosMovimiento{
		ProductoID: c.Query("producto_id"),
		Tipo:       c.Query("tipo"),
		Limite:     c.QueryInt("limite", 50),
	}

	movimientos, err := h.service.GetMovimientos(filtros)
	if err != nil {
		return response.Error(c, 500, "error al obtener movimientos")
	}
	return response.Success(c, movimientos)
}

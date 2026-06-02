package finanzas

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

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

// ── Gastos ───────────────────────────────────────────────────

func (h *Handler) CreateGasto(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	var req CreateGastoRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	g, err := h.service.CreateGasto(claims.SucursalID, claims.UserID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrMontoInvalido):
			return response.Error(c, 400, "el monto debe ser mayor a cero")
		case errors.Is(err, ErrTipoInvalido):
			return response.Error(c, 400, "tipo inválido: RENTA, SERVICIOS, INSUMOS, NOMINA, MANTENIMIENTO, OTRO")
		case errors.Is(err, ErrFechaInvalida):
			return response.Error(c, 400, "formato de fecha inválido, use YYYY-MM-DD")
		default:
			return response.Error(c, 500, "error al registrar gasto")
		}
	}
	h.bitacora.Log(bitacora.Registro{
		UsuarioID:   claims.UserID,
		SucursalID:  claims.SucursalID,
		Modulo:      bitacora.ModuloFinanzas,
		Accion:      bitacora.AccionRegistrarGasto,
		Entidad:     "gastos",
		EntidadID:   g.ID,
		DatosNuevos: fiber.Map{"tipo": g.Tipo, "monto": g.Monto},
		IPAddress:   c.IP(),
	})
	return response.Created(c, g)
}

func (h *Handler) GetGastos(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	filtros := FiltrosPeriodo{
		SucursalID: claims.SucursalID,
		Desde:      c.Query("desde"),
		Hasta:      c.Query("hasta"),
	}
	gastos, err := h.service.GetGastos(filtros)
	if err != nil {
		return response.Error(c, 500, "error al obtener gastos")
	}
	return response.Success(c, gastos)
}

func (h *Handler) DeleteGasto(c *fiber.Ctx) error {
	if err := h.service.DeleteGasto(c.Params("id")); err != nil {
		if err.Error() == "gasto no encontrado" {
			return response.Error(c, 404, "gasto no encontrado")
		}
		return response.Error(c, 500, "error al eliminar gasto")
	}
	return response.Success(c, fiber.Map{"message": "gasto eliminado"})
}

// ── Reportes ─────────────────────────────────────────────────

func (h *Handler) GetResumenDia(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	fecha := c.Query("fecha")

	resumen, err := h.service.GetResumenDia(claims.SucursalID, fecha)
	if err != nil {
		return response.Error(c, 500, "error al obtener resumen")
	}
	return response.Success(c, resumen)
}

func (h *Handler) GetResumenPeriodo(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	filtros := FiltrosPeriodo{
		SucursalID: claims.SucursalID,
		Desde:      c.Query("desde"),
		Hasta:      c.Query("hasta"),
	}

	resumen, err := h.service.GetResumenPeriodo(filtros)
	if err != nil {
		if errors.Is(err, ErrDatosRequeridos) {
			return response.Error(c, 400, "los parámetros 'desde' y 'hasta' son requeridos")
		}
		return response.Error(c, 500, "error al obtener resumen")
	}
	return response.Success(c, resumen)
}

func (h *Handler) GetResumenSemana(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	resumen, err := h.service.GetResumenSemana(claims.SucursalID)
	if err != nil {
		return response.Error(c, 500, "error al obtener resumen semanal")
	}
	return response.Success(c, resumen)
}

// ── Cierre de caja ───────────────────────────────────────────

func (h *Handler) CerrarCaja(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	var req CerrarCajaRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, 400, "body inválido")
	}

	cierre, err := h.service.CerrarCaja(claims.SucursalID, claims.UserID, req)
	if err != nil {
		return response.Error(c, 500, "error al cerrar caja")
	}
	h.bitacora.Log(bitacora.Registro{
		UsuarioID:  claims.UserID,
		SucursalID: claims.SucursalID,
		Modulo:     bitacora.ModuloCaja,
		Accion:     bitacora.AccionCerrarCaja,
		Entidad:    "cierres_caja",
		EntidadID:  cierre.ID,
		DatosNuevos: fiber.Map{
			"total_ventas": cierre.TotalVentas,
			"total_gastos": cierre.TotalGastos,
		},
		IPAddress: c.IP(),
	})
	return response.Created(c, cierre)
}

func (h *Handler) GetCierres(c *fiber.Ctx) error {
	claims := auth.GetClaims(c)
	limite := c.QueryInt("limite", 30)

	cierres, err := h.service.GetCierres(claims.SucursalID, limite)
	if err != nil {
		return response.Error(c, 500, "error al obtener cierres")
	}
	return response.Success(c, cierres)
}

func (h *Handler) GetCierre(c *fiber.Ctx) error {
	cierre, err := h.service.GetCierre(c.Params("id"))
	if err != nil {
		return response.Error(c, 500, "error al obtener cierre")
	}
	return response.Success(c, cierre)
}

func (h *Handler) GuardarPDF(c *fiber.Ctx) error {
	id := c.Params("id")
	file, err := c.FormFile("pdf")
	if err != nil {
		return response.Error(c, 400, "archivo PDF requerido")
	}

	dir := "data/cierres"
	filename := fmt.Sprintf("%s_%s.pdf", id[:8], time.Now().Format("20060102_150405"))
	path := filepath.Join(dir, filename)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return response.Error(c, 500, "error al crear directorio")
	}

	if err := c.SaveFile(file, path); err != nil {
		return response.Error(c, 500, "error al guardar archivo")
	}

	if err := h.service.GuardarPDF(id, path); err != nil {
		return response.Error(c, 500, "error al registrar PDF en base de datos")
	}

	h.bitacora.Log(bitacora.Registro{
		UsuarioID:  auth.GetClaims(c).UserID,
		SucursalID: auth.GetClaims(c).SucursalID,
		Modulo:     bitacora.ModuloCaja,
		Accion:     "GENERAR_PDF",
		Entidad:    "cierres_caja",
		EntidadID:  id,
		IPAddress:  c.IP(),
	})

	return response.Success(c, fiber.Map{"message": "PDF guardado", "path": path})
}

func (h *Handler) VerPDF(c *fiber.Ctx) error {
	cierre, err := h.service.GetCierre(c.Params("id"))
	if err != nil || cierre.PdfPath == "" {
		return response.Error(c, 404, "PDF no encontrado")
	}

	return c.SendFile(cierre.PdfPath, true)
}

package finanzas

import (
	"paleteria-system/internal/auth"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	repo := NewRepository(db)
	service := NewService(repo)
	handler := NewHandler(service)

	f := router.Group("/finanzas", auth.Middleware())

	// Gastos — solo admin puede registrar y eliminar
	f.Get("/gastos", auth.RequireAdmin(), handler.GetGastos)
	f.Post("/gastos",
		auth.RequirePermiso(func(p auth.Permisos) bool { return p.RegistrarGastos }),
		handler.CreateGasto,
	)
	f.Delete("/gastos/:id", auth.RequireAdmin(), handler.DeleteGasto)

	// Reportes — solo admin
	f.Get("/resumen/dia",
		auth.RequirePermiso(func(p auth.Permisos) bool { return p.VerReportes }),
		handler.GetResumenDia,
	)
	f.Get("/resumen/periodo",
		auth.RequirePermiso(func(p auth.Permisos) bool { return p.VerReportes }),
		handler.GetResumenPeriodo,
	)

	// Cierre de caja — solo quien tenga permiso
	f.Post("/caja/cerrar",
		auth.RequirePermiso(func(p auth.Permisos) bool { return p.CerrarCaja }),
		handler.CerrarCaja,
	)
	f.Get("/caja/historial", auth.RequireAdmin(), handler.GetCierres)
}

package finanzas

import (
	"paleteria-system/internal/auth"
	"paleteria-system/internal/bitacora"
	"paleteria-system/pkg/claims"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	repo := NewRepository(db)
	service := NewService(repo)
	b := bitacora.NewService(db)
	handler := NewHandler(service, b)

	f := router.Group("/finanzas", auth.Middleware())

	f.Get("/gastos", auth.RequireAdmin(), handler.GetGastos)
	f.Post("/gastos",
		auth.RequirePermiso(func(p claims.Permisos) bool { return p.RegistrarGastos }),
		handler.CreateGasto,
	)
	f.Delete("/gastos/:id", auth.RequireAdmin(), handler.DeleteGasto)

	f.Get("/resumen/dia",
		auth.RequirePermiso(func(p claims.Permisos) bool { return p.VerReportes }),
		handler.GetResumenDia,
	)
	f.Get("/resumen/periodo",
		auth.RequirePermiso(func(p claims.Permisos) bool { return p.VerReportes }),
		handler.GetResumenPeriodo,
	)

	f.Post("/caja/cerrar",
		auth.RequirePermiso(func(p claims.Permisos) bool { return p.CerrarCaja }),
		handler.CerrarCaja,
	)
	f.Get("/caja/historial", auth.RequireAdmin(), handler.GetCierres)
}

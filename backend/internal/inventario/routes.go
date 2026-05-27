package inventario

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

	inv := router.Group("/inventario", auth.Middleware())

	inv.Get("/productos", handler.GetAll)
	inv.Get("/productos/bajo-stock", handler.GetBajoStock)
	inv.Get("/productos/:id", handler.GetByID)

	inv.Post("/productos",
		auth.RequirePermiso(func(p claims.Permisos) bool { return p.GestionarInventario }),
		handler.Create,
	)
	inv.Put("/productos/:id",
		auth.RequirePermiso(func(p claims.Permisos) bool { return p.GestionarInventario }),
		handler.Update,
	)
	inv.Patch("/productos/:id/estado",
		auth.RequirePermiso(func(p claims.Permisos) bool { return p.GestionarInventario }),
		handler.UpdateActivo,
	)
	inv.Post("/productos/:id/eliminar",
		auth.RequireAdmin(),
		handler.Delete,
	)

	inv.Get("/movimientos", handler.GetMovimientos)
	inv.Post("/movimientos",
		auth.RequirePermiso(func(p claims.Permisos) bool { return p.GestionarInventario }),
		handler.RegistrarMovimiento,
	)
}

package inventario

import (
	"paleteria-system/internal/auth"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(router fiber.Router, db *pgxpool.Pool) {
	repo := NewRepository(db)
	service := NewService(repo)
	handler := NewHandler(service)

	inv := router.Group("/inventario", auth.Middleware())

	// Productos — admin puede todo, vendedor solo puede ver
	inv.Get("/productos", handler.GetAll)
	inv.Get("/productos/bajo-stock", handler.GetBajoStock)
	inv.Get("/productos/:id", handler.GetByID)

	inv.Post("/productos",
		auth.RequirePermiso(func(p auth.Permisos) bool { return p.GestionarInventario }),
		handler.Create,
	)
	inv.Put("/productos/:id",
		auth.RequirePermiso(func(p auth.Permisos) bool { return p.GestionarInventario }),
		handler.Update,
	)
	inv.Patch("/productos/:id/estado",
		auth.RequirePermiso(func(p auth.Permisos) bool { return p.GestionarInventario }),
		handler.UpdateActivo,
	)

	// Movimientos — solo admin/inventario
	inv.Get("/movimientos", handler.GetMovimientos)
	inv.Post("/movimientos",
		auth.RequirePermiso(func(p auth.Permisos) bool { return p.GestionarInventario }),
		handler.RegistrarMovimiento,
	)
}

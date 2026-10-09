package test

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"paleteria-system/internal/auth"
	"paleteria-system/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type productoTest struct {
	ID             string
	Nombre         string
	Precio         float64
	Presentaciones string
}

type presentacionTest struct {
	Precio float64 `json:"precio"`
}

func precioVenta(p productoTest, rng *rand.Rand) float64 {
	if p.Presentaciones == "" {
		return p.Precio
	}
	var pres []presentacionTest
	if err := json.Unmarshal([]byte(p.Presentaciones), &pres); err != nil || len(pres) == 0 {
		return p.Precio
	}
	var precios []float64
	for _, pr := range pres {
		if pr.Precio > 0 {
			precios = append(precios, pr.Precio)
		}
	}
	if len(precios) == 0 {
		return p.Precio
	}
	return precios[rng.Intn(len(precios))]
}

func GenerarVentas(db *pgxpool.Pool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := auth.GetClaims(c)

		ctx := context.Background()

		// Obtener productos activos de tipo VENTA
		rows, err := db.Query(ctx, `
			SELECT id, nombre, precio, COALESCE(presentaciones::text,'')
			FROM productos WHERE activo=true AND tipo='VENTA' ORDER BY nombre
		`)
		if err != nil {
			return response.Error(c, 500, "error obteniendo productos")
		}
		defer rows.Close()

		var prods []productoTest
		for rows.Next() {
			var p productoTest
			if err := rows.Scan(&p.ID, &p.Nombre, &p.Precio, &p.Presentaciones); err != nil {
				continue
			}
			prods = append(prods, p)
		}
		if len(prods) == 0 {
			return response.Error(c, 400, "no hay productos de venta")
		}

		var paletas []productoTest
		for _, p := range prods {
			if strings.Contains(strings.ToLower(p.Nombre), "paleta") {
				paletas = append(paletas, p)
			}
		}
		if len(paletas) == 0 {
			return response.Error(c, 400, "no hay productos de paleta para generar pruebas")
		}

		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		hoy := time.Now()
		totalCreadas := 0

		for hora := 10; hora <= 21; hora++ {
			numVentas := 2 + rng.Intn(3) // 2-4 ventas por hora
			for vi := 0; vi < numVentas; vi++ {
				// Hora con minutos aleatorios
				ts := time.Date(hoy.Year(), hoy.Month(), hoy.Day(), hora, rng.Intn(60), rng.Intn(60), 0, hoy.Location())

				numItems := 1 + rng.Intn(3)
				var subtotal float64
				type item struct {
					prod   productoTest
					cant   float64
					precio float64
				}
				var items []item

				for ii := 0; ii < numItems; ii++ {
					prod := prods[rng.Intn(len(prods))]
					if rng.Float64() < 0.7 {
						prod = paletas[rng.Intn(len(paletas))]
					}
					precio := precioVenta(prod, rng)
					cant := float64(1 + rng.Intn(3))
					items = append(items, item{prod, cant, precio})
					subtotal += precio * cant
				}

				metodos := []string{"EFECTIVO", "TARJETA", "TRANSFERENCIA"}
				metodo := metodos[rng.Intn(3)]

				tx, err := db.Begin(ctx)
				if err != nil {
					continue
				}

				var ventaID string
				err = tx.QueryRow(ctx, `
					INSERT INTO ventas (sucursal_id, vendedor_id, tipo, estado, subtotal, total, created_at, updated_at)
					VALUES ($1,$2,'NORMAL','CERRADA',$3,$3,$4,$4)
					RETURNING id
				`, claims.SucursalID, claims.UserID, subtotal, ts).Scan(&ventaID)
				if err != nil {
					tx.Rollback(ctx)
					continue
				}

				for _, it := range items {
					_, err = tx.Exec(ctx, `
						INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal, es_cortesia)
						VALUES ($1,$2,$3,$4,$5,false)
					`, ventaID, it.prod.ID, it.cant, it.precio, it.precio*it.cant)
					if err != nil {
						tx.Rollback(ctx)
						continue
					}
				}

				estadoPago := "CONFIRMADO"
				_, err = tx.Exec(ctx, `
					INSERT INTO pagos (venta_id, metodo, monto, estado, created_at, updated_at)
					VALUES ($1,$2,$3,$4,$5,$5)
				`, ventaID, metodo, subtotal, estadoPago, ts)
				if err != nil {
					tx.Rollback(ctx)
					continue
				}

				tx.Commit(ctx)
				totalCreadas++
			}
		}

		return response.Success(c, fiber.Map{
			"message": fmt.Sprintf("%d ventas de prueba generadas", totalCreadas),
			"total":   totalCreadas,
		})
	}
}

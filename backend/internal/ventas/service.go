package ventas

import (
	"context"
	"errors"
	"fmt"
	"time"

	"paleteria-system/internal/cortesias"
)

var (
	ErrVentaNoEncontrada    = errors.New("venta no encontrada")
	ErrVentaYaCerrada       = errors.New("la venta ya está cerrada")
	ErrVentaYaCancelada     = errors.New("la venta ya está cancelada")
	ErrCortesiaSinAutorizar = errors.New("las cortesías requieren autorización")
	ErrDetalleVacio         = errors.New("la venta debe tener al menos un producto")
	ErrMetodoPagoInvalido   = errors.New("método de pago inválido: EFECTIVO, TARJETA, TRANSFERENCIA")
	ErrProductoInactivo     = errors.New("uno o más productos están inactivos")
	ErrStockInsuficiente    = errors.New("stock insuficiente")
	ErrDatosRequeridos      = errors.New("faltan datos requeridos")
)

var metodosValidos = map[string]bool{
	MetodoEfectivo:      true,
	MetodoTarjeta:       true,
	MetodoTransferencia: true,
}

type Service struct {
	repo      *Repository
	cortesias *cortesias.Service
}

func NewService(repo *Repository, cs *cortesias.Service) *Service {
	return &Service{repo: repo, cortesias: cs}
}

func (s *Service) GetAll(filtros FiltrosVenta) ([]Venta, error) {
	if filtros.Limite == 0 {
		filtros.Limite = 50
	}
	return s.repo.FindAll(filtros)
}

func (s *Service) GetByID(id string) (*Venta, error) {
	v, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if v == nil {
		return nil, ErrVentaNoEncontrada
	}
	return v, nil
}

func (s *Service) Confirmar(sucursalID, vendedorID string, req CrearVentaRequest, rolNombre string) (*Venta, error) {
	if len(req.Detalle) == 0 {
		return nil, ErrDetalleVacio
	}

	esFinde := time.Now().Weekday() == time.Friday || time.Now().Weekday() == time.Saturday || time.Now().Weekday() == time.Sunday
	enviarACaja := req.Abierta || (rolNombre == "vendedor" && esFinde)

	if !enviarACaja && !metodosValidos[req.Pago.Metodo] {
		return nil, ErrMetodoPagoInvalido
	}

	ids := make([]string, len(req.Detalle))
	for i, d := range req.Detalle {
		ids[i] = d.ProductoID
	}
	productos, err := s.repo.GetProductosParaVenta(ids)
	if err != nil {
		return nil, err
	}

	var detalle []DetalleVenta
	var subtotal float64

	for _, d := range req.Detalle {
		if d.Cantidad <= 0 {
			return nil, fmt.Errorf("cantidad inválida para el producto %s", d.ProductoID)
		}
		p, ok := productos[d.ProductoID]
		if !ok {
			return nil, fmt.Errorf("producto %s no encontrado", d.ProductoID)
		}
		if !p.activo {
			return nil, ErrProductoInactivo
		}

		precioUnitario := d.PrecioUnitario
		if precioUnitario <= 0 {
			precioUnitario = p.precio
		}
		factorConsumo := d.FactorConsumo
		if factorConsumo <= 0 {
			factorConsumo = 1
		}

		lineaSubtotal := precioUnitario * d.Cantidad
		if !d.EsCortesia {
			subtotal += lineaSubtotal
		}

		detalle = append(detalle, DetalleVenta{
			ProductoID:     d.ProductoID,
			ProductoNombre: p.nombre,
			Cantidad:       d.Cantidad,
			PrecioUnitario: precioUnitario,
			Subtotal:       lineaSubtotal,
			EsCortesia:     d.EsCortesia,
			FactorConsumo:  factorConsumo,
		})
	}

	tipo := TipoNormal
	esTodoCortesia := true
	for _, d := range detalle {
		if !d.EsCortesia {
			esTodoCortesia = false
			break
		}
	}
	if esTodoCortesia && len(detalle) > 0 {
		tipo = TipoCortesia
	}

	venta := &Venta{
		SucursalID: sucursalID,
		VendedorID: vendedorID,
		Tipo:       tipo,
		Estado:     EstadoAbierta,
		Subtotal:   subtotal,
		Total:      subtotal,
	}

	if enviarACaja {
		ctx := context.Background()
		tx, err := s.repo.Db.Begin(ctx)
		if err != nil {
			return nil, err
		}
		defer tx.Rollback(ctx)

		if err := s.repo.InsertVenta(ctx, tx, venta); err != nil {
			return nil, err
		}
		if err := s.repo.InsertDetalleSinDescontar(ctx, tx, venta, detalle); err != nil {
			return nil, err
		}
		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}
		venta.Detalle = detalle
		return venta, nil
	}

	venta.Estado = EstadoCerrada

	pago := Pago{
		Metodo:        req.Pago.Metodo,
		Monto:         subtotal,
		MontoRecibido: req.Pago.MontoRecibido,
	}

	ctx := context.Background()
	tx, err := s.repo.Db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if err := s.repo.InsertVenta(ctx, tx, venta); err != nil {
		return nil, err
	}

	if s.cortesias != nil {
		getStock := func(productoID string) (cortesias.ProductoStockInfo, error) {
			ps, err := s.repo.GetProductoStock(ctx, tx, productoID)
			if err != nil {
				return cortesias.ProductoStockInfo{}, err
			}
			return cortesias.ProductoStockInfo{
				Nombre: ps.nombre,
				Stock:  ps.stock,
				Activo: ps.activo,
			}, nil
		}

		cInfo, err := s.cortesias.EvaluarCortesia(ctx, tx, sucursalID, subtotal, vendedorID, venta.ID, getStock)
		if err != nil && !errors.Is(err, cortesias.ErrLimiteAlcanzado) && !errors.Is(err, cortesias.ErrSinStock) {
			return nil, err
		}
		if err == nil && cInfo != nil {
			ps, err := s.repo.GetProductoStock(ctx, tx, cInfo.ProductoID)
			precioCortesia := 0.0
			if err == nil {
				precioCortesia = ps.precio
			}
			detalle = append(detalle, DetalleVenta{
				ProductoID:     cInfo.ProductoID,
				ProductoNombre: cInfo.ProductoNombre,
				Cantidad:       float64(cInfo.Cantidad),
				PrecioUnitario: precioCortesia,
				Subtotal:       precioCortesia * float64(cInfo.Cantidad),
				EsCortesia:     true,
				FactorConsumo:  1,
			})
			venta.CortesiaAplicada = cInfo
		}
		}

	if err := s.repo.InsertDetalleYDescontar(ctx, tx, venta, detalle); err != nil {
		return nil, err
	}

	if err := s.repo.InsertPago(ctx, tx, pago, venta); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	venta.Detalle = detalle
	venta.Pagos = []Pago{pago}

	return venta, nil
}

func (s *Service) Cancelar(id, motivo, usuarioID string) error {
	v, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if v == nil {
		return ErrVentaNoEncontrada
	}
	if v.Estado == EstadoCancelada {
		return ErrVentaYaCancelada
	}
	if v.Estado != EstadoCerrada {
		return ErrVentaYaCerrada
	}
	return s.repo.CancelarVenta(id, motivo, usuarioID)
}

func (s *Service) GetTopProductos(sucursalID, fecha string, limite int) ([]TopProducto, error) {
	if limite == 0 {
		limite = 5
	}
	return s.repo.GetTopProductos(sucursalID, fecha, limite)
}

func (s *Service) GetPendientes(sucursalID string) ([]Venta, error) {
	return s.repo.FindPendientes(sucursalID)
}

func (s *Service) Cobrar(ventaID, usuarioID string, pago Pago) (*Venta, error) {
	v, err := s.repo.FindByID(ventaID)
	if err != nil {
		return nil, err
	}
	if v == nil {
		return nil, ErrVentaNoEncontrada
	}
	if v.Estado != EstadoAbierta {
		return nil, ErrVentaYaCerrada
	}
	if !metodosValidos[pago.Metodo] {
		return nil, ErrMetodoPagoInvalido
	}

	if err := s.repo.CobrarVenta(ventaID, pago, usuarioID); err != nil {
		return nil, err
	}

	v.Estado = EstadoCerrada
	v.Pagos = []Pago{pago}
	return v, nil
}

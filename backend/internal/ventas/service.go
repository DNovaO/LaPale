package ventas

import (
	"errors"
	"fmt"
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
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
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

func (s *Service) Confirmar(sucursalID, vendedorID string, req CrearVentaRequest) (*Venta, error) {
	// Validaciones básicas
	if len(req.Detalle) == 0 {
		return nil, ErrDetalleVacio
	}
	if !metodosValidos[req.Pago.Metodo] {
		return nil, ErrMetodoPagoInvalido
	}

	// Cortesía requiere autorización
	tipo := TipoNormal
	if req.Tipo == TipoCortesia {
		if req.AutorizadoPor == "" {
			return nil, ErrCortesiaSinAutorizar
		}
		tipo = TipoCortesia
	}

	// Obtener productos de la DB
	ids := make([]string, len(req.Detalle))
	for i, d := range req.Detalle {
		ids[i] = d.ProductoID
	}
	productos, err := s.repo.GetProductosParaVenta(ids)
	if err != nil {
		return nil, err
	}

	// Validar productos y calcular totales
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

		esCortesia := tipo == TipoCortesia
		precioUnitario := p.precio
		if esCortesia {
			precioUnitario = 0
		}

		lineaSubtotal := precioUnitario * float64(d.Cantidad)
		subtotal += lineaSubtotal

		detalle = append(detalle, DetalleVenta{
			ProductoID:     d.ProductoID,
			ProductoNombre: p.nombre,
			Cantidad:       d.Cantidad,
			PrecioUnitario: precioUnitario,
			Subtotal:       lineaSubtotal,
			EsCortesia:     esCortesia,
		})
	}

	venta := &Venta{
		SucursalID:    sucursalID,
		VendedorID:    vendedorID,
		AutorizadoPor: req.AutorizadoPor,
		Tipo:          tipo,
		Estado:        EstadoCerrada,
		Subtotal:      subtotal,
		Total:         subtotal,
		Notas:         req.Notas,
	}

	pago := Pago{
		Metodo:        req.Pago.Metodo,
		Monto:         subtotal,
		MontoRecibido: req.Pago.MontoRecibido,
	}

	if err := s.repo.ConfirmarVenta(venta, detalle, pago, productos); err != nil {
		return nil, err
	}
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

package inventario

import "errors"

var (
	ErrProductoNoEncontrado = errors.New("producto no encontrado")
	ErrProductoInactivo     = errors.New("producto inactivo")
	ErrDatosRequeridos      = errors.New("faltan datos requeridos")
	ErrStockInsuficiente    = errors.New("stock insuficiente")
	ErrTipoInvalido         = errors.New("tipo de movimiento inválido")
	ErrCantidadInvalida     = errors.New("la cantidad debe ser mayor a cero")
)

var tiposValidos = map[string]bool{
	TipoEntrada:        true,
	TipoSalidaVenta:    true,
	TipoSalidaCortesia: true,
	TipoAjusteManual:   true,
	TipoMerma:          true,
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// ── Productos ────────────────────────────────────────────────

func (s *Service) GetAll(sucursalID string, soloActivos bool) ([]Producto, error) {
	return s.repo.FindAllProductos(sucursalID, soloActivos)
}

func (s *Service) GetByID(id string) (*Producto, error) {
	p, err := s.repo.FindProductoByID(id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrProductoNoEncontrado
	}
	return p, nil
}

func (s *Service) Create(sucursalID string, req CreateProductoRequest) (*Producto, error) {
	if req.Nombre == "" || req.Precio <= 0 {
		return nil, ErrDatosRequeridos
	}

	p := &Producto{
		SucursalID:  sucursalID,
		Nombre:      req.Nombre,
		SKU:         req.SKU,
		Descripcion: req.Descripcion,
		Precio:      req.Precio,
		StockActual: req.StockInicial,
		StockMinimo: req.StockMinimo,
	}

	if err := s.repo.CreateProducto(p); err != nil {
		return nil, err
	}

	// Si tiene stock inicial, registrar movimiento de entrada
	if req.StockInicial > 0 {
		_ = s.repo.RegistrarMovimiento(&Movimiento{
			ProductoID:    p.ID,
			UsuarioID:     sucursalID, // se sobreescribe en el handler con el user real
			Tipo:          TipoEntrada,
			Cantidad:      req.StockInicial,
			Observaciones: "Stock inicial al crear producto",
		})
	}

	return p, nil
}

func (s *Service) Update(id string, req UpdateProductoRequest) error {
	if req.Nombre == "" || req.Precio <= 0 {
		return ErrDatosRequeridos
	}
	p, err := s.repo.FindProductoByID(id)
	if err != nil {
		return err
	}
	if p == nil {
		return ErrProductoNoEncontrado
	}
	return s.repo.UpdateProducto(id, req)
}

func (s *Service) UpdateActivo(id string, activo bool) error {
	p, err := s.repo.FindProductoByID(id)
	if err != nil {
		return err
	}
	if p == nil {
		return ErrProductoNoEncontrado
	}
	return s.repo.UpdateActivo(id, activo)
}

// ── Movimientos ──────────────────────────────────────────────

func (s *Service) RegistrarMovimiento(usuarioID string, req MovimientoRequest) (*Movimiento, error) {
	if req.Cantidad <= 0 {
		return nil, ErrCantidadInvalida
	}
	if !tiposValidos[req.Tipo] {
		return nil, ErrTipoInvalido
	}

	p, err := s.repo.FindProductoByID(req.ProductoID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrProductoNoEncontrado
	}
	if !p.Activo {
		return nil, ErrProductoInactivo
	}

	// Entradas = positivo, salidas = negativo
	cantidad := req.Cantidad
	if req.Tipo != TipoEntrada {
		cantidad = -req.Cantidad
	}

	m := &Movimiento{
		ProductoID:    req.ProductoID,
		UsuarioID:     usuarioID,
		Tipo:          req.Tipo,
		Cantidad:      cantidad,
		Observaciones: req.Observaciones,
	}

	if err := s.repo.RegistrarMovimiento(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *Service) GetMovimientos(filtros FiltrosMovimiento) ([]Movimiento, error) {
	if filtros.Limite == 0 {
		filtros.Limite = 50 // default
	}
	return s.repo.FindMovimientos(filtros)
}

func (s *Service) GetBajoStock(sucursalID string) ([]Producto, error) {
	return s.repo.FindProductosBajoStock(sucursalID)
}

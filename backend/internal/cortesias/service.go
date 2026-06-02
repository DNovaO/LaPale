package cortesias

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrReglaNoEncontrada = errors.New("regla no encontrada")
	ErrDatosRequeridos   = errors.New("faltan datos requeridos")
	ErrLimiteAlcanzado   = errors.New("límite diario alcanzado para esta regla")
	ErrSinStock          = errors.New("producto de cortesía sin stock suficiente")
	ErrRangoSolapado     = errors.New("el rango de montos se solapa con otra regla activa")
)

type Service struct {
	repo *Repository
	db   *pgxpool.Pool
}

func NewService(repo *Repository, db *pgxpool.Pool) *Service {
	return &Service{repo: repo, db: db}
}

func (s *Service) GetAll(sucursalID string) ([]ReglaCortesia, error) {
	return s.repo.FindAll(sucursalID)
}

func (s *Service) GetByID(id string) (*ReglaCortesia, error) {
	rg, err := s.repo.FindByID(id)
	if err != nil {
		return nil, ErrReglaNoEncontrada
	}
	return rg, nil
}

func (s *Service) Create(sucursalID string, req CreateReglaRequest) (*ReglaCortesia, error) {
	if req.Nombre == "" || req.ProductoID == "" || req.Cantidad <= 0 {
		return nil, ErrDatosRequeridos
	}

	solapa, err := s.repo.ExisteSolapamiento(sucursalID, req.MontoMinimo, req.MontoMaximo, "")
	if err != nil {
		return nil, err
	}
	if solapa {
		return nil, ErrRangoSolapado
	}

	rg := &ReglaCortesia{
		SucursalID:   sucursalID,
		Nombre:       req.Nombre,
		MontoMinimo:  req.MontoMinimo,
		MontoMaximo:  req.MontoMaximo,
		ProductoID:   req.ProductoID,
		Cantidad:     req.Cantidad,
		LimiteDiario: req.LimiteDiario,
	}
	if err := s.repo.Create(rg); err != nil {
		return nil, err
	}
	return rg, nil
}

func (s *Service) Update(id string, req UpdateReglaRequest) error {
	if req.Nombre == "" || req.ProductoID == "" || req.Cantidad <= 0 {
		return ErrDatosRequeridos
	}

	rg, err := s.repo.FindByID(id)
	if err != nil {
		return ErrReglaNoEncontrada
	}

	solapa, err := s.repo.ExisteSolapamiento(rg.SucursalID, req.MontoMinimo, req.MontoMaximo, id)
	if err != nil {
		return err
	}
	if solapa {
		return ErrRangoSolapado
	}

	r := &ReglaCortesia{
		Nombre:       req.Nombre,
		MontoMinimo:  req.MontoMinimo,
		MontoMaximo:  req.MontoMaximo,
		ProductoID:   req.ProductoID,
		Cantidad:     req.Cantidad,
		LimiteDiario: req.LimiteDiario,
	}
	return s.repo.Update(id, r)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}

func (s *Service) ToggleActiva(id string, activa bool) error {
	return s.repo.ToggleActiva(id, activa)
}

type ProductoStockInfo struct {
	Nombre string
	Stock  float64
	Activo bool
}

func (s *Service) EvaluarCortesia(
	ctx context.Context, tx pgx.Tx,
	sucursalID string, monto float64, vendedorID, ventaID string,
	getProductoStock func(productoID string) (ProductoStockInfo, error),
) (*CortesiaInfo, error) {
	rg, err := s.repo.FindMatchingForUpdate(ctx, tx, sucursalID, monto)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	today := time.Now().Truncate(24 * time.Hour)
	contador := rg.ContadorDiario
	if rg.FechaContador != nil && !rg.FechaContador.Truncate(24*time.Hour).Equal(today) {
		contador = 0
	}

	if rg.LimiteDiario > 0 && contador+rg.Cantidad > rg.LimiteDiario {
		return nil, ErrLimiteAlcanzado
	}

	pInfo, err := getProductoStock(rg.ProductoID)
	if err != nil {
		return nil, err
	}
	if pInfo.Stock < float64(rg.Cantidad) {
		return nil, ErrSinStock
	}

	now := time.Now()
	if err := s.repo.IncrementarContador(ctx, tx, rg.ID, now, rg.Cantidad); err != nil {
		return nil, err
	}

	o := &CortesiaOtorgada{
		VentaID:     ventaID,
		ReglaID:     rg.ID,
		ProductoID:  rg.ProductoID,
		Cantidad:    rg.Cantidad,
		MontoCompra: monto,
		VendedorID:  vendedorID,
		SucursalID:  sucursalID,
	}
	if err := s.repo.InsertOtorgada(ctx, tx, o); err != nil {
		return nil, fmt.Errorf("error al registrar cortesía otorgada: %w", err)
	}

	return &CortesiaInfo{
		ProductoID:     rg.ProductoID,
		ProductoNombre: rg.ProductoNombre,
		Cantidad:       rg.Cantidad,
		ReglaID:        rg.ID,
		ReglaNombre:    rg.Nombre,
	}, nil
}

func (s *Service) GetDashboard(sucursalID string) (*DashboardCortesia, error) {
	return s.repo.GetDashboard(sucursalID)
}

func (s *Service) PreviewCortesia(sucursalID string, monto float64) (*CortesiaInfo, error) {
	rg, err := s.repo.FindMatchingReadOnly(sucursalID, monto)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	today := time.Now().Truncate(24 * time.Hour)
	contador := rg.ContadorDiario
	if rg.FechaContador != nil && !rg.FechaContador.Truncate(24*time.Hour).Equal(today) {
		contador = 0
	}

	info := &CortesiaInfo{
		ProductoID:     rg.ProductoID,
		ProductoNombre: rg.ProductoNombre,
		Cantidad:       rg.Cantidad,
		ReglaID:        rg.ID,
		ReglaNombre:    rg.Nombre,
	}

	if rg.LimiteDiario > 0 && contador+rg.Cantidad > rg.LimiteDiario {
		return info, ErrLimiteAlcanzado
	}

	return info, nil
}

func (s *Service) GetHistorial(filtros FiltrosHistorial) ([]CortesiaOtorgada, error) {
	if filtros.Limite == 0 {
		filtros.Limite = 100
	}
	return s.repo.GetHistorial(filtros)
}

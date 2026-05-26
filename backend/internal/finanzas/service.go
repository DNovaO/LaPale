package finanzas

import (
	"errors"
	"time"
)

var (
	ErrDatosRequeridos   = errors.New("faltan datos requeridos")
	ErrMontoInvalido     = errors.New("el monto debe ser mayor a cero")
	ErrTipoInvalido      = errors.New("tipo de gasto inválido")
	ErrFechaInvalida     = errors.New("formato de fecha inválido, use YYYY-MM-DD")
	ErrGastoNoEncontrado = errors.New("gasto no encontrado")
)

var tiposGastoValidos = map[string]bool{
	TipoRenta: true, TipoServicios: true, TipoInsumos: true,
	TipoNomina: true, TipoMantenimiento: true, TipoOtro: true,
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// ── Gastos ───────────────────────────────────────────────────

func (s *Service) CreateGasto(sucursalID, usuarioID string, req CreateGastoRequest) (*Gasto, error) {
	if req.Monto <= 0 {
		return nil, ErrMontoInvalido
	}
	if !tiposGastoValidos[req.Tipo] {
		return nil, ErrTipoInvalido
	}
	fecha := req.Fecha
	if fecha == "" {
		fecha = time.Now().Format("2006-01-02")
	}
	if _, err := time.Parse("2006-01-02", fecha); err != nil {
		return nil, ErrFechaInvalida
	}

	g := &Gasto{
		SucursalID:    sucursalID,
		UsuarioID:     usuarioID,
		Tipo:          req.Tipo,
		Monto:         req.Monto,
		Descripcion:   req.Descripcion,
		Observaciones: req.Observaciones,
		Fecha:         fecha,
	}
	if err := s.repo.CreateGasto(g); err != nil {
		return nil, err
	}
	return g, nil
}

func (s *Service) GetGastos(filtros FiltrosPeriodo) ([]Gasto, error) {
	return s.repo.FindGastos(filtros)
}

func (s *Service) DeleteGasto(id string) error {
	return s.repo.DeleteGasto(id)
}

// ── Reportes ─────────────────────────────────────────────────

func (s *Service) GetResumenDia(sucursalID, fecha string) (*ResumenDia, error) {
	if fecha == "" {
		fecha = time.Now().Format("2006-01-02")
	}
	return s.repo.GetResumenDia(sucursalID, fecha)
}

func (s *Service) GetResumenPeriodo(filtros FiltrosPeriodo) (*ResumenPeriodo, error) {
	if filtros.Desde == "" || filtros.Hasta == "" {
		return nil, ErrDatosRequeridos
	}
	return s.repo.GetResumenPeriodo(filtros)
}

// ── Cierre de caja ───────────────────────────────────────────

func (s *Service) CerrarCaja(sucursalID, usuarioID string, req CerrarCajaRequest) (*CierreCaja, error) {
	// Calcular el resumen del día automáticamente
	hoy := time.Now().Format("2006-01-02")
	resumen, err := s.repo.GetResumenDia(sucursalID, hoy)
	if err != nil {
		return nil, err
	}

	cierre := &CierreCaja{
		SucursalID:         sucursalID,
		UsuarioID:          usuarioID,
		TotalEfectivo:      resumen.TotalEfectivo,
		TotalTarjeta:       resumen.TotalTarjeta,
		TotalTransferencia: resumen.TotalTransferencia,
		TotalCortesias:     resumen.TotalCortesias,
		NumCortesias:       resumen.NumCortesias,
		TotalGastos:        resumen.TotalGastos,
		TotalVentas:        resumen.TotalVentas,
		NumVentas:          resumen.NumVentas,
		Notas:              req.Notas,
	}

	if err := s.repo.CerrarCaja(cierre); err != nil {
		return nil, err
	}
	return cierre, nil
}

func (s *Service) GetCierres(sucursalID string, limite int) ([]CierreCaja, error) {
	if limite == 0 {
		limite = 30
	}
	return s.repo.FindCierres(sucursalID, limite)
}

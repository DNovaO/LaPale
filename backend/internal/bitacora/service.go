package bitacora

import "github.com/jackc/pgx/v5/pgxpool"

type Service struct {
	repo *Repository
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{repo: NewRepository(db)}
}

func (s *Service) LogLogin(usuarioID, sucursalID, ipAddress, userAgent string) {
	reg := Registro{
		UsuarioID:  usuarioID,
		SucursalID: sucursalID,
		Modulo:     ModuloAuth,
		Accion:     AccionLogin,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
	}
	s.Log(reg)
}

// Log registra un evento en bitácora de forma no bloqueante.
// Se llama con goroutine para no añadir latencia al request principal.
func (s *Service) Log(reg Registro) {
	go func() {
		if err := s.repo.Registrar(&reg); err != nil {
			// Solo log — nunca debe romper el flujo principal
			_ = err
		}
	}()
}

func (s *Service) GetAll(filtros FiltrosBitacora) ([]Registro, error) {
	if filtros.Limite == 0 {
		filtros.Limite = 100
	}
	return s.repo.FindAll(filtros)
}

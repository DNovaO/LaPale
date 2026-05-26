package usuarios

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUsuarioNoEncontrado = errors.New("usuario no encontrado")
	ErrUsernameOcupado     = errors.New("el username ya está en uso")
	ErrDatosRequeridos     = errors.New("faltan datos requeridos")
	ErrPasswordMuyCorto    = errors.New("la contraseña debe tener al menos 6 caracteres")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetAll(sucursalID string) ([]Usuario, error) {
	return s.repo.FindAll(sucursalID)
}

func (s *Service) GetByID(id string) (*Usuario, error) {
	u, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, ErrUsuarioNoEncontrado
	}
	return u, nil
}

func (s *Service) Create(req CreateUsuarioRequest) (*Usuario, error) {
	if req.Nombre == "" || req.Username == "" || req.Password == "" || req.RolID == "" || req.SucursalID == "" {
		return nil, ErrDatosRequeridos
	}
	if len(req.Password) < 6 {
		return nil, ErrPasswordMuyCorto
	}

	exists, err := s.repo.ExistsByUsername(req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrUsernameOcupado
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := &Usuario{
		SucursalID: req.SucursalID,
		RolID:      req.RolID,
		Nombre:     req.Nombre,
		Username:   req.Username,
	}

	if err := s.repo.Create(u, string(hash)); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *Service) Update(id string, req UpdateUsuarioRequest) error {
	if req.Nombre == "" || req.RolID == "" {
		return ErrDatosRequeridos
	}
	u, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUsuarioNoEncontrado
	}
	return s.repo.Update(id, req)
}

func (s *Service) UpdateEstado(id string, activo bool) error {
	u, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if u == nil {
		return ErrUsuarioNoEncontrado
	}
	return s.repo.UpdateEstado(id, activo)
}

func (s *Service) ChangePassword(id string, req ChangePasswordRequest) error {
	if len(req.Password) < 6 {
		return ErrPasswordMuyCorto
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.UpdatePassword(id, string(hash))
}

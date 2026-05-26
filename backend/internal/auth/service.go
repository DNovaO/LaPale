package auth

import (
	"encoding/json"
	"errors"
)

var (
	ErrCredencialesInvalidas = errors.New("credenciales inválidas")
	ErrUsuarioInactivo       = errors.New("usuario inactivo")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Login(req LoginRequest) (*LoginResponse, error) {
	user, err := s.repo.FindByUsername(req.Username)
	if err != nil {
		return nil, ErrCredencialesInvalidas
	}
	// Usuario no existe — mismo mensaje que contraseña incorrecta (no revelar info)
	if user == nil {
		return nil, ErrCredencialesInvalidas
	}
	if !user.Activo {
		return nil, ErrUsuarioInactivo
	}
	if err := CheckPassword(req.Password, user.PasswordHash); err != nil {
		return nil, ErrCredencialesInvalidas
	}

	permisos, err := parsePermisos(user.Permisos)
	if err != nil {
		return nil, err
	}

	token, err := GenerateJWT(user, permisos)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token: token,
		User: UserPublic{
			ID:         user.ID,
			Nombre:     user.Nombre,
			Username:   user.Username,
			RolNombre:  user.RolNombre,
			SucursalID: user.SucursalID,
			Permisos:   permisos,
		},
	}, nil
}

func parsePermisos(raw []byte) (Permisos, error) {
	var p Permisos
	if err := json.Unmarshal(raw, &p); err != nil {
		return p, err
	}
	return p, nil
}

package auth

import "errors"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Login(req LoginRequest) (*LoginResponse, error) {

	user, err := s.repo.FindByUsername(req.Username)

	if err != nil {
		return nil, errors.New("credenciales inválidas")
	}

	if !user.Activo {
		return nil, errors.New("usuario inactivo")
	}

	err = CheckPassword(req.Password, user.PasswordHash)

	if err != nil {
		return nil, errors.New("credenciales inválidas")
	}

	token, err := GenerateJWT(user.ID)

	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token: token,
		User: map[string]any{
			"id":       user.ID,
			"nombre":   user.Nombre,
			"username": user.Username,
		},
	}, nil
}

package auth

import (
	"errors"
	"os"
	"time"

	"paleteria-system/pkg/claims"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateJWT(user *User, permisos claims.Permisos) (string, error) {
	expStr := os.Getenv("JWT_EXPIRES")
	exp, err := time.ParseDuration(expStr)
	if err != nil {
		exp = 24 * time.Hour
	}

	uc := claims.UserClaims{
		UserID:     user.ID,
		Username:   user.Username,
		Nombre:     user.Nombre,
		RolNombre:  user.RolNombre,
		SucursalID: user.SucursalID,
		Permisos:   permisos,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(exp)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, uc)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func ParseJWT(tokenStr string) (*claims.UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &claims.UserClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de firma inesperado")
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil {
		return nil, err
	}
	uc, ok := token.Claims.(*claims.UserClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token inválido")
	}
	return uc, nil
}

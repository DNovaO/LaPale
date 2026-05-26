package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims contiene todo lo que los handlers necesitan saber del usuario
// sin tocar la base de datos en cada request
type Claims struct {
	UserID     string   `json:"user_id"`
	Username   string   `json:"username"`
	Nombre     string   `json:"nombre"`
	RolNombre  string   `json:"rol"`
	SucursalID string   `json:"sucursal_id"`
	Permisos   Permisos `json:"permisos"`
	jwt.RegisteredClaims
}

func GenerateJWT(user *User, permisos Permisos) (string, error) {
	expStr := os.Getenv("JWT_EXPIRES")
	exp, err := time.ParseDuration(expStr)
	if err != nil {
		exp = 24 * time.Hour // fallback seguro
	}

	claims := Claims{
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

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func ParseJWT(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de firma inesperado")
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("token inválido")
	}
	return claims, nil
}

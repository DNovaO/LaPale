package auth

import "golang.org/x/crypto/bcrypt"

func CheckPassword(password string, hash string) error {
	return bcrypt.CompareHashAndPassword(
		[]byte(hash),
		[]byte(password),
	)
}

package database

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect() (*pgxpool.Pool, error) {

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	db, err := pgxpool.New(context.Background(), dsn)

	if err != nil {
		return nil, err
	}

	err = db.Ping(context.Background())

	if err != nil {
		return nil, err
	}

	fmt.Println("PostgreSQL connected")

	return db, nil
}

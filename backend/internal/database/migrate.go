package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(db *pgxpool.Pool) error {
	ctx := context.Background()

	if err := ensureMigrationTable(ctx, db); err != nil {
		return fmt.Errorf("creando tabla de migraciones: %w", err)
	}

	migrationsDir := "migrations"
	if _, err := os.Stat(migrationsDir); os.IsNotExist(err) {
		log.Println("Directorio migrations no encontrado, omitiendo migraciones")
		return nil
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("leyendo directorio migrations: %w", err)
	}

	type migration struct {
		version string
		upFile  string
	}
	var migrations []migration
	for _, e := range entries {
		name := e.Name()
		if e.IsDir() || !strings.HasSuffix(name, ".up.sql") {
			continue
		}
		version := strings.TrimSuffix(name, ".up.sql")
		migrations = append(migrations, migration{version: version, upFile: filepath.Join(migrationsDir, name)})
	}

	for _, m := range migrations {
		applied, err := isApplied(ctx, db, m.version)
		if err != nil {
			return fmt.Errorf("verificando migración %s: %w", m.version, err)
		}
		if applied {
			log.Printf("Migracion %s ya aplicada, saltando", m.version)
			continue
		}

		content, err := os.ReadFile(m.upFile)
		if err != nil {
			return fmt.Errorf("leyendo archivo %s: %w", m.upFile, err)
		}

		log.Printf("Aplicando migracion %s...", m.version)
		tx, err := db.Begin(ctx)
		if err != nil {
			return fmt.Errorf("iniciando transaccion: %w", err)
		}
		defer tx.Rollback(ctx)

		if _, err = tx.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("ejecutando migracion %s: %w", m.version, err)
		}

		if _, err = tx.Exec(ctx,
			`INSERT INTO schema_migrations (version) VALUES ($1)`, m.version,
		); err != nil {
			return fmt.Errorf("registrando migracion %s: %w", m.version, err)
		}

		if err = tx.Commit(ctx); err != nil {
			return fmt.Errorf("confirmando migracion %s: %w", m.version, err)
		}
		log.Printf("Migracion %s aplicada correctamente", m.version)
	}

	return nil
}

func ensureMigrationTable(ctx context.Context, db *pgxpool.Pool) error {
	_, err := db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version   VARCHAR(50) PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	return err
}

func isApplied(ctx context.Context, db *pgxpool.Pool, version string) (bool, error) {
	var count int
	err := db.QueryRow(ctx,
		`SELECT COUNT(*) FROM schema_migrations WHERE version = $1`, version,
	).Scan(&count)
	return count > 0, err
}

-- ============================================================
-- 8. SNAPSHOT DE NOMBRE DE USUARIO + BORRADO FORZOSO DE USUARIOS
-- ============================================================
-- Guarda el nombre del usuario en cada registro histórico para que,
-- al eliminar una cuenta, el historial conserve el nombre.
-- Las FK a usuarios() pasan de ON DELETE RESTRICT a ON DELETE SET NULL.

-- 1. Columnas snapshot (quién hizo el registro, aunque su cuenta se elimine)
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS vendedor_nombre VARCHAR(100);
ALTER TABLE movimientos_inventario ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(100);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(100);
ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(100);
ALTER TABLE bitacora_actividad ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(100);
ALTER TABLE cortesias_otorgadas ADD COLUMN IF NOT EXISTS vendedor_nombre VARCHAR(100);

-- 2. Backfill con los nombres actuales
UPDATE ventas v SET vendedor_nombre = u.nombre
FROM usuarios u WHERE v.vendedor_id = u.id AND v.vendedor_nombre IS NULL;

UPDATE movimientos_inventario m SET usuario_nombre = u.nombre
FROM usuarios u WHERE m.usuario_id = u.id AND m.usuario_nombre IS NULL;

UPDATE gastos g SET usuario_nombre = u.nombre
FROM usuarios u WHERE g.usuario_id = u.id AND g.usuario_nombre IS NULL;

UPDATE cierres_caja c SET usuario_nombre = u.nombre
FROM usuarios u WHERE c.usuario_id = u.id AND c.usuario_nombre IS NULL;

UPDATE bitacora_actividad b SET usuario_nombre = u.nombre
FROM usuarios u WHERE b.usuario_id = u.id AND b.usuario_nombre IS NULL;

UPDATE cortesias_otorgadas co SET vendedor_nombre = u.nombre
FROM usuarios u WHERE co.vendedor_id = u.id AND co.vendedor_nombre IS NULL;

-- 3. Relajar las FK a usuarios(): de RESTRICT a SET NULL.
-- Se resuelve el nombre real de cada constraint vía catálogo para no
-- depender del nombre autogenerado por Postgres.
DO $$
DECLARE
	par RECORD;
	cname TEXT;
BEGIN
	FOR par IN
		SELECT * FROM (VALUES
			('ventas', 'vendedor_id'),
			('movimientos_inventario', 'usuario_id'),
			('gastos', 'usuario_id'),
			('cierres_caja', 'usuario_id'),
			('bitacora_actividad', 'usuario_id'),
			('cortesias_otorgadas', 'vendedor_id')
		) AS t(tname, cname_col)
	LOOP
		SELECT c.conname INTO cname
		FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
		WHERE c.contype = 'f'
			AND c.confrelid = 'usuarios'::regclass
			AND c.conrelid = par.tname::regclass
			AND a.attname = par.cname_col
		LIMIT 1;

		IF cname IS NOT NULL THEN
			EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', par.tname, cname);
			cname := NULL;
		END IF;

		EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', par.tname, par.cname_col);

		PERFORM 1
		FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
		WHERE c.contype = 'f'
			AND c.confrelid = 'usuarios'::regclass
			AND c.conrelid = par.tname::regclass
			AND a.attname = par.cname_col;
		IF NOT FOUND THEN
			EXECUTE format(
				'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES usuarios(id) ON DELETE SET NULL',
				par.tname, par.tname || '_' || par.cname_col || '_fkey', par.cname_col
			);
		END IF;
	END LOOP;
END $$;

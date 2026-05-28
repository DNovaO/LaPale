CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- ROLES
-- =========================

INSERT INTO roles (
    nombre,
    permisos
)
VALUES (
    'administrador',
    '{"puede_cortesia":true,"ver_reportes":true,"gestionar_inventario":true,"gestionar_usuarios":true,"registrar_gastos":true,"cerrar_caja":true}'::jsonb
)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (
    nombre,
    permisos
)
VALUES (
    'vendedor',
    '{"puede_cortesia":false,"ver_reportes":false,"gestionar_inventario":false,"gestionar_usuarios":false,"registrar_gastos":false,"cerrar_caja":false}'::jsonb
)
ON CONFLICT (nombre) DO NOTHING;

-- =========================
-- SUCURSAL
-- =========================

INSERT INTO sucursales (
    nombre,
    direccion,
    telefono
)
VALUES (
    'La Pale',
    'Mariano Escobedo #123',
    '555-0100'
)
ON CONFLICT (nombre) DO NOTHING;

-- =========================
-- ADMIN
-- =========================

INSERT INTO usuarios (
    sucursal_id,
    rol_id,
    nombre,
    username,
    password_hash
)
VALUES (
    (
        SELECT id
        FROM sucursales
        WHERE nombre = 'La Pale'
    ),
    (
        SELECT id
        FROM roles
        WHERE nombre = 'administrador'
    ),
    'Administrador',
    'admin',
    crypt('admin123', gen_salt('bf', 10))
)
ON CONFLICT (username) DO NOTHING;

-- =========================
-- VENDEDOR
-- =========================

INSERT INTO usuarios (
    sucursal_id,
    rol_id,
    nombre,
    username,
    password_hash
)
VALUES (
    (
        SELECT id
        FROM sucursales
        WHERE nombre = 'La Pale'
    ),
    (
        SELECT id
        FROM roles
        WHERE nombre = 'vendedor'
    ),
    'Vendedor Demo',
    'vendedor',
    crypt('vend123', gen_salt('bf', 10))
)
ON CONFLICT (username) DO NOTHING;
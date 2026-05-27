-- Roles con IDs fijos
INSERT INTO roles (id, nombre, permisos)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'administrador',
    '{"puede_cortesia":true,"ver_reportes":true,"gestionar_inventario":true,"gestionar_usuarios":true,"registrar_gastos":true,"cerrar_caja":true}'::jsonb
)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (id, nombre, permisos)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'vendedor',
    '{"puede_cortesia":false,"ver_reportes":false,"gestionar_inventario":false,"gestionar_usuarios":false,"registrar_gastos":false,"cerrar_caja":false}'::jsonb
)
ON CONFLICT (nombre) DO NOTHING;

-- Sucursal principal
INSERT INTO sucursales (id, nombre, direccion, telefono)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'La Pale Principal',
    'Calle Principal #123',
    '555-0100'
)
ON CONFLICT (nombre) DO NOTHING;

-- Usuario administrador (admin / admin123)
INSERT INTO usuarios (id, sucursal_id, rol_id, nombre, username, password_hash)
VALUES (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Administrador',
    'admin',
    crypt('admin123', gen_salt('bf', 10))
)
ON CONFLICT (username) DO NOTHING;

-- Usuario vendedor (vendedor / vend123)
INSERT INTO usuarios (id, sucursal_id, rol_id, nombre, username, password_hash)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Vendedor Demo',
    'vendedor',
    crypt('vend123', gen_salt('bf', 10))
)
ON CONFLICT (username) DO NOTHING;

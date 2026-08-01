-- Actualizar permisos de vendedor (agregar cortesías)
UPDATE roles SET permisos = '{"puede_cortesia":true,"ver_reportes":false,"gestionar_inventario":false,"gestionar_usuarios":false,"registrar_gastos":false,"cerrar_caja":false}'::jsonb
WHERE nombre = 'vendedor';

-- Crear rol supervisor si no existe
INSERT INTO roles (nombre, permisos)
VALUES (
    'supervisor',
    '{"puede_cortesia":true,"ver_reportes":true,"gestionar_inventario":true,"gestionar_usuarios":false,"registrar_gastos":false,"cerrar_caja":false}'::jsonb
)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, permisos) VALUES (
    'cajero',
    '{"puede_cortesia":false,"ver_reportes":true,"gestionar_inventario":false,"gestionar_usuarios":false,"registrar_gastos":false,"cerrar_caja":false}'::jsonb
) ON CONFLICT (nombre) DO NOTHING;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. MULTI-SUCURSAL
-- ============================================================

CREATE TABLE IF NOT EXISTS sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    direccion TEXT,
    telefono VARCHAR(20),
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. USUARIOS Y ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    permisos JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_sucursal_activo
ON usuarios(sucursal_id, activo);

-- ============================================================
-- 3. PRODUCTOS E INVENTARIO
-- ============================================================

CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    sku VARCHAR(50),
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_sucursal_activo
ON productos(sucursal_id, activo);

CREATE INDEX IF NOT EXISTS idx_productos_sku
ON productos(sku);

ALTER TABLE productos ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'VENTA';

ALTER TABLE productos ADD COLUMN IF NOT EXISTS medida VARCHAR(20) NOT NULL DEFAULT 'UNIDAD';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS presentaciones JSONB;

ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen TEXT;

ALTER TABLE productos ALTER COLUMN stock_actual TYPE DECIMAL(10,3);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    tipo VARCHAR(30) NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_antes INTEGER NOT NULL,
    stock_despues INTEGER NOT NULL,
    referencia_id UUID,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_producto_fecha
ON movimientos_inventario(producto_id, created_at);

CREATE INDEX IF NOT EXISTS idx_movimientos_tipo
ON movimientos_inventario(tipo);

CREATE INDEX IF NOT EXISTS idx_movimientos_usuario
ON movimientos_inventario(usuario_id);

ALTER TABLE movimientos_inventario ALTER COLUMN cantidad TYPE DECIMAL(10,3);
ALTER TABLE movimientos_inventario ALTER COLUMN stock_antes TYPE DECIMAL(10,3);
ALTER TABLE movimientos_inventario ALTER COLUMN stock_despues TYPE DECIMAL(10,3);

-- ============================================================
-- 4. VENTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    autorizado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    notas TEXT,
    ticket_numero SERIAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventas_sucursal_estado
ON ventas(sucursal_id, estado);

CREATE INDEX IF NOT EXISTS idx_ventas_sucursal_fecha
ON ventas(sucursal_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ventas_vendedor
ON ventas(vendedor_id);

CREATE INDEX IF NOT EXISTS idx_ventas_tipo
ON ventas(tipo);

CREATE TABLE IF NOT EXISTS detalle_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    es_cortesia BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_detalle_venta_venta
ON detalle_venta(venta_id);

CREATE INDEX IF NOT EXISTS idx_detalle_venta_producto
ON detalle_venta(producto_id);

ALTER TABLE detalle_venta ALTER COLUMN cantidad TYPE DECIMAL(10,3);

-- ============================================================
-- 5. PAGOS
-- ============================================================

CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    metodo VARCHAR(20) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    monto_recibido DECIMAL(10,2),
    cambio DECIMAL(10,2),
    mp_payment_id VARCHAR(100),
    mp_status VARCHAR(50),
    mp_external_ref VARCHAR(100),
    referencia_externa VARCHAR(200),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_venta
ON pagos(venta_id);

CREATE INDEX IF NOT EXISTS idx_pagos_estado
ON pagos(estado);

CREATE INDEX IF NOT EXISTS idx_pagos_mp_payment
ON pagos(mp_payment_id);

-- ============================================================
-- 6. GASTOS Y CIERRES
-- ============================================================

CREATE TABLE IF NOT EXISTS gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    tipo VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    observaciones TEXT,
    fecha DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_sucursal_fecha
ON gastos(sucursal_id, fecha);

CREATE INDEX IF NOT EXISTS idx_gastos_tipo
ON gastos(tipo);

CREATE INDEX IF NOT EXISTS idx_gastos_usuario
ON gastos(usuario_id);

CREATE TABLE IF NOT EXISTS cierres_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    total_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_tarjeta DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_transferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_cortesias DECIMAL(10,2) NOT NULL DEFAULT 0,
    num_cortesias INTEGER NOT NULL DEFAULT 0,
    total_gastos DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_ventas DECIMAL(10,2) NOT NULL DEFAULT 0,
    num_ventas INTEGER NOT NULL DEFAULT 0,
    reporte_enviado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_cierre TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_cierres_sucursal_fecha
ON cierres_caja(sucursal_id, fecha_cierre);

CREATE INDEX IF NOT EXISTS idx_cierres_usuario
ON cierres_caja(usuario_id);

-- ============================================================
-- 7. BITÁCORA
-- ============================================================

CREATE TABLE IF NOT EXISTS bitacora_actividad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    modulo VARCHAR(30) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(50),
    entidad_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bitacora_sucursal_fecha
ON bitacora_actividad(sucursal_id, created_at);

CREATE INDEX IF NOT EXISTS idx_bitacora_usuario
ON bitacora_actividad(usuario_id);

CREATE INDEX IF NOT EXISTS idx_bitacora_modulo
ON bitacora_actividad(modulo);

CREATE INDEX IF NOT EXISTS idx_bitacora_accion
ON bitacora_actividad(accion);

CREATE INDEX IF NOT EXISTS idx_bitacora_entidad
ON bitacora_actividad(entidad, entidad_id);
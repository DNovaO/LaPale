-- ============================================================
-- 8. REGLAS DE CORTESÍA + HISTÓRICO DE CORTESÍAS OTORGADAS
-- ============================================================

CREATE TABLE IF NOT EXISTS reglas_cortesia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    monto_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
    monto_maximo DECIMAL(10,2),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    prioridad INTEGER NOT NULL DEFAULT 0,
    limite_diario INTEGER NOT NULL DEFAULT 0,
    contador_diario INTEGER NOT NULL DEFAULT 0,
    fecha_contador DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reglas_cortesia_sucursal_activa
ON reglas_cortesia(sucursal_id, activa);

CREATE TABLE IF NOT EXISTS cortesias_otorgadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    regla_id UUID NOT NULL REFERENCES reglas_cortesia(id) ON DELETE RESTRICT,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1,
    monto_compra DECIMAL(10,2) NOT NULL,
    vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cortesias_otorgadas_sucursal_fecha
ON cortesias_otorgadas(sucursal_id, created_at);

CREATE INDEX IF NOT EXISTS idx_cortesias_otorgadas_regla
ON cortesias_otorgadas(regla_id);

CREATE INDEX IF NOT EXISTS idx_cortesias_otorgadas_vendedor
ON cortesias_otorgadas(vendedor_id);

CREATE INDEX IF NOT EXISTS idx_cortesias_otorgadas_venta
ON cortesias_otorgadas(venta_id);

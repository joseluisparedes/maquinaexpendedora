-- ====================================================================
-- SISTEMA DE FINANZAS — MÁQUINA EXPENDEDORA
-- Tablas con prefijo 'vending_' para convivir en tu proyecto Supabase
-- ====================================================================

-- 1. Participantes (Socios, Operadora, Directora)
CREATE TABLE IF NOT EXISTS public.vending_participantes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  es_socio BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Configuración de Reparto de Ganancias y Sobrantes
CREATE TABLE IF NOT EXISTS public.vending_config_reparto (
  id TEXT PRIMARY KEY,
  vigente_desde DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ganancia', 'sobrante')),
  detalles JSONB NOT NULL, -- [{ participante_id, porcentaje }]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Movimientos (Ganar / Comprar)
CREATE TABLE IF NOT EXISTS public.vending_movimientos (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('GANAR', 'COMPRAR')),
  descripcion TEXT,
  registrado_por TEXT REFERENCES public.vending_participantes(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'REGISTRADO' CHECK (estado IN ('REGISTRADO', 'ANULADO')),
  motivo_anulacion TEXT,
  origen_movimiento_id TEXT,
  comprobante_url TEXT,

  -- Campos para GANAR
  monto_ganado NUMERIC(12, 2),
  periodo_desde DATE,
  periodo_hasta DATE,
  origen_ganancia TEXT CHECK (origen_ganancia IN ('RECAUDACION', 'SOBRANTE_COMPRA')),
  snapshot_porcentajes JSONB,
  reparto JSONB,

  -- Campos para COMPRAR
  monto_asignado NUMERIC(12, 2),
  monto_adicional NUMERIC(12, 2),
  monto_sobrante NUMERIC(12, 2),
  total_gastado NUMERIC(12, 2),
  proveedor TEXT,
  destino_sobrante TEXT CHECK (destino_sobrante IN ('CAJA', 'REPARTO', 'NINGUNO')),
  quien_aporto_adicional TEXT REFERENCES public.vending_participantes(id) ON DELETE SET NULL,
  aportes_adicionales JSONB,
  detalle_productos JSONB,
  movimiento_sobrante_repartido_id TEXT,

  creado_el TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar Seguridad por Fila (RLS)
ALTER TABLE public.vending_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vending_config_reparto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vending_movimientos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para permitir lectura y escritura desde la aplicación
DROP POLICY IF EXISTS "Permitir todo a vending_participantes" ON public.vending_participantes;
CREATE POLICY "Permitir todo a vending_participantes" ON public.vending_participantes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a vending_config_reparto" ON public.vending_config_reparto;
CREATE POLICY "Permitir todo a vending_config_reparto" ON public.vending_config_reparto FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a vending_movimientos" ON public.vending_movimientos;
CREATE POLICY "Permitir todo a vending_movimientos" ON public.vending_movimientos FOR ALL USING (true) WITH CHECK (true);

-- 6. Insertar Datos Iniciales (5 Participantes)
INSERT INTO public.vending_participantes (id, nombre, rol, es_socio, activo)
VALUES
  ('part-1', 'Socio 1', 'Socio Inversionista', true, true),
  ('part-2', 'Socio 2', 'Socio Inversionista', true, true),
  ('part-3', 'Socio 3', 'Socio Inversionista', true, true),
  ('part-4', 'Operador/a', 'Operador de Máquina', false, true),
  ('part-5', 'Directora', 'Directora del Colegio', false, true)
ON CONFLICT (id) DO NOTHING;

-- 7. Insertar Configuración Inicial de Reparto (Ganancias 100% y Sobrantes 100%)
INSERT INTO public.vending_config_reparto (id, vigente_desde, tipo, detalles)
VALUES
  (
    'cfg-gan-1',
    '2026-01-01',
    'ganancia',
    '[
      {"participante_id": "part-1", "porcentaje": 25},
      {"participante_id": "part-2", "porcentaje": 25},
      {"participante_id": "part-3", "porcentaje": 25},
      {"participante_id": "part-4", "porcentaje": 15},
      {"participante_id": "part-5", "porcentaje": 10}
    ]'::jsonb
  ),
  (
    'cfg-sob-1',
    '2026-01-01',
    'sobrante',
    '[
      {"participante_id": "part-1", "porcentaje": 33.34},
      {"participante_id": "part-2", "porcentaje": 33.33},
      {"participante_id": "part-3", "porcentaje": 33.33}
    ]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

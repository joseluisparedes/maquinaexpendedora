import React, { useState } from 'react'
import {
  ShieldCheck,
  AlertCircle,
  Calendar,
  Save,
  Clock,
  Download,
  Upload,
  CheckCircle,
  Database,
  Copy,
  Check,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import type { ConfigReparto, Participante } from '../types'
import { StorageService } from '../utils/storage'

interface ConfiguracionViewProps {
  configs: ConfigReparto[]
  participantes: Participante[]
  conectadoSupabase: boolean
  mensajeSupabase: string
  onGuardarConfig: (nuevaConfig: ConfigReparto) => void
  onRecargarTodo: () => void
  onVerificarConexion: () => void
  onVaciarMovimientos: () => void
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  configs,
  participantes,
  conectadoSupabase,
  mensajeSupabase,
  onGuardarConfig,
  onRecargarTodo,
  onVerificarConexion,
  onVaciarMovimientos,
}) => {
  const hoyStr = new Date().toISOString().slice(0, 10)

  // Obtener config vigentes actuales
  const configGananciaActual = StorageService.getConfiguracionVigente('ganancia')
  const configSobranteActual = StorageService.getConfiguracionVigente('sobrante')

  // Formulario nueva vigencia de Ganancias
  const [fechaDesdeGanancia, setFechaDesdeGanancia] = useState(hoyStr)
  const [porcentajesGanancia, setPorcentajesGanancia] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    participantes.forEach((p) => {
      const exist = configGananciaActual?.detalles.find((d) => d.participante_id === p.id)
      init[p.id] = exist ? exist.porcentaje : 0
    })
    return init
  })

  // Formulario nueva vigencia de Sobrantes (solo socios)
  const socios = participantes.filter((p) => p.es_socio)
  const [fechaDesdeSobrante, setFechaDesdeSobrante] = useState(hoyStr)
  const [porcentajesSobrante, setPorcentajesSobrante] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    socios.forEach((p) => {
      const exist = configSobranteActual?.detalles.find((d) => d.participante_id === p.id)
      init[p.id] = exist ? exist.porcentaje : 33.33
    })
    return init
  })

  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [copiadoSQL, setCopiadoSQL] = useState(false)

  // Sumas de validación
  const sumaGanancias = Number(
    Object.values(porcentajesGanancia)
      .reduce((acc, val) => acc + (Number(val) || 0), 0)
      .toFixed(2)
  )

  const sumaSobrantes = Number(
    Object.values(porcentajesSobrante)
      .reduce((acc, val) => acc + (Number(val) || 0), 0)
      .toFixed(2)
  )

  const cuadraGanancias = Math.abs(sumaGanancias - 100) < 0.01
  const cuadraSobrantes = Math.abs(sumaSobrantes - 100) < 0.01

  const handleGuardarGanancias = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cuadraGanancias) {
      alert(`La suma debe ser exactamente 100%. Actualmente suma ${sumaGanancias}%.`)
      return
    }

    const nueva: ConfigReparto = {
      id: 'cfg-gan-' + Date.now(),
      vigente_desde: fechaDesdeGanancia,
      tipo: 'ganancia',
      detalles: Object.entries(porcentajesGanancia).map(([partId, pct]) => ({
        participante_id: partId,
        porcentaje: Number(pct),
      })),
    }

    onGuardarConfig(nueva)
    setMensajeExito('¡Nueva vigencia de reparto de ganancias guardada exitosamente!')
    setTimeout(() => setMensajeExito(null), 4000)
  }

  const handleGuardarSobrantes = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cuadraSobrantes) {
      alert(`La suma debe ser exactamente 100%. Actualmente suma ${sumaSobrantes}%.`)
      return
    }

    const nueva: ConfigReparto = {
      id: 'cfg-sob-' + Date.now(),
      vigente_desde: fechaDesdeSobrante,
      tipo: 'sobrante',
      detalles: Object.entries(porcentajesSobrante).map(([partId, pct]) => ({
        participante_id: partId,
        porcentaje: Number(pct),
      })),
    }

    onGuardarConfig(nueva)
    setMensajeExito('¡Nueva vigencia de reparto de sobrantes guardada exitosamente!')
    setTimeout(() => setMensajeExito(null), 4000)
  }

  // Backup & Restore
  const handleDescargarBackup = () => {
    const jsonStr = StorageService.exportarBackup()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_vending_${hoyStr}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleImportarBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (StorageService.importarBackup(content)) {
        alert('Datos importados correctamente.')
        onRecargarTodo()
      } else {
        alert('Archivo de backup inválido.')
      }
    }
    reader.readAsText(file)
  }

  const sqlMigracion = `-- Ejecutar en el SQL Editor de proy_tareasjlph (Supabase):
CREATE TABLE IF NOT EXISTS public.vending_participantes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  es_socio BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vending_config_reparto (
  id TEXT PRIMARY KEY,
  vigente_desde DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ganancia', 'sobrante')),
  detalles JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

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
  monto_ganado NUMERIC(12, 2),
  periodo_desde DATE,
  periodo_hasta DATE,
  origen_ganancia TEXT CHECK (origen_ganancia IN ('RECAUDACION', 'SOBRANTE_COMPRA')),
  snapshot_porcentajes JSONB,
  reparto JSONB,
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

ALTER TABLE public.vending_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vending_config_reparto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vending_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a vending_participantes" ON public.vending_participantes;
CREATE POLICY "Permitir todo a vending_participantes" ON public.vending_participantes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a vending_config_reparto" ON public.vending_config_reparto;
CREATE POLICY "Permitir todo a vending_config_reparto" ON public.vending_config_reparto FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a vending_movimientos" ON public.vending_movimientos;
CREATE POLICY "Permitir todo a vending_movimientos" ON public.vending_movimientos FOR ALL USING (true) WITH CHECK (true);`

  const handleCopiarSQL = () => {
    navigator.clipboard.writeText(sqlMigracion)
    setCopiadoSQL(true)
    setTimeout(() => setCopiadoSQL(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Alerta de éxito */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* ESTADO DE CONEXIÓN CON SUPABASE (PROY_TAREASJLPH) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${conectadoSupabase ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Conexión con Supabase (Proyecto: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700">proy_tareasjlph</code>)
                </h3>
                {conectadoSupabase ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Sincronizado
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Pendiente SQL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {mensajeSupabase}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onVerificarConexion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Probar Conexión
            </button>
            <button
              onClick={handleCopiarSQL}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              {copiadoSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiadoSQL ? '¡SQL Copiado!' : 'Copiar Script SQL'}
            </button>
          </div>
        </div>

        {!conectadoSupabase && (
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
            <p className="font-bold">Para activar la sincronización en la nube (S/ 0.00 adicional):</p>
            <ol className="list-decimal list-inside space-y-0.5 text-amber-800">
              <li>Haz clic arriba en <strong>"Copiar Script SQL"</strong>.</li>
              <li>Abre tu panel de Supabase en el proyecto <strong>proy_tareasjlph</strong> e ingresa a <strong>SQL Editor</strong>.</li>
              <li>Pega el script y presiona <strong>Run</strong>. Las tablas <code className="bg-amber-100 px-1 rounded">vending_*</code> se crearán sin tocar tus tablas de tareas.</li>
              <li>Regresa aquí y presiona <strong>"Probar Conexión"</strong>. ¡Listo!</li>
            </ol>
          </div>
        )}
      </div>

      {/* Explicación de la Regla de Negocio */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 p-4 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 leading-relaxed">
          <p className="font-bold text-sm text-indigo-900 mb-0.5">
            Regla de Vigencias y Snapshots Históricos
          </p>
          Los porcentajes se guardan con fecha de vigencia. Si se modifican, los movimientos
          registrados en el pasado <span className="underline font-bold">conservan su porcentaje original</span>{' '}
          para garantizar que la contabilidad y los reportes históricos permanezcan intactos.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CONFIG 1: REPARTO DE GANANCIAS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                1. Reparto de Ganancias (100%)
              </h3>
              <p className="text-xs text-slate-500">
                Aplica a cada movimiento de tipo Recaudación/Ganar
              </p>
            </div>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              Todos los participantes
            </span>
          </div>

          <form onSubmit={handleGuardarGanancias} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Vigente desde:
              </label>
              <input
                type="date"
                required
                value={fechaDesdeGanancia}
                onChange={(e) => setFechaDesdeGanancia(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
              />
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {participantes.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-3 bg-white text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{part.nombre}</span>
                    <span className="text-slate-400 ml-1.5">({part.rol})</span>
                  </div>
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={porcentajesGanancia[part.id] ?? ''}
                      onChange={(e) =>
                        setPorcentajesGanancia({
                          ...porcentajesGanancia,
                          [part.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-xs"
                    />
                    <span className="text-slate-500 font-bold">%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Verificación de suma al 100% */}
            <div
              className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold ${
                cuadraGanancias
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>Suma total de porcentajes:</span>
              <span className="text-sm font-black">{sumaGanancias} %</span>
            </div>

            {!cuadraGanancias && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                La suma debe dar exactamente 100.00%. Diferencia:{' '}
                {(100 - sumaGanancias).toFixed(2)}%
              </p>
            )}

            <button
              type="submit"
              disabled={!cuadraGanancias}
              className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                cuadraGanancias
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Guardar Nueva Vigencia de Ganancias
            </button>
          </form>
        </div>

        {/* CONFIG 2: REPARTO DE SOBRANTES (SOLO SOCIOS) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Reparto de Sobrantes de Compra (100%)
              </h3>
              <p className="text-xs text-slate-500">
                Aplica cuando sobra dinero de una compra y se reparte
              </p>
            </div>
            <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
              Solo Socios Inversionistas
            </span>
          </div>

          <form onSubmit={handleGuardarSobrantes} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Vigente desde:
              </label>
              <input
                type="date"
                required
                value={fechaDesdeSobrante}
                onChange={(e) => setFechaDesdeSobrante(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
              />
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {socios.map((socio) => (
                <div
                  key={socio.id}
                  className="flex items-center justify-between p-3 bg-white text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{socio.nombre}</span>
                    <span className="text-slate-400 ml-1.5">(Socio Inversionista)</span>
                  </div>
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={porcentajesSobrante[socio.id] ?? ''}
                      onChange={(e) =>
                        setPorcentajesSobrante({
                          ...porcentajesSobrante,
                          [socio.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-xs"
                    />
                    <span className="text-slate-500 font-bold">%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Verificación de suma al 100% */}
            <div
              className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold ${
                cuadraSobrantes
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>Suma total de porcentajes:</span>
              <span className="text-sm font-black">{sumaSobrantes} %</span>
            </div>

            {!cuadraSobrantes && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                La suma debe dar exactamente 100.00%. Diferencia:{' '}
                {(100 - sumaSobrantes).toFixed(2)}%
              </p>
            )}

            <button
              type="submit"
              disabled={!cuadraSobrantes}
              className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                cuadraSobrantes
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Guardar Nueva Vigencia de Sobrantes
            </button>
          </form>
        </div>
      </div>

      {/* Historial de Vigencias Guardadas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Historial de Esquemas Guardados</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configs.map((cfg) => (
            <div key={cfg.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold uppercase text-indigo-700">
                  {cfg.tipo === 'ganancia' ? 'Reparto Ganancias' : 'Reparto Sobrantes'}
                </span>
                <span className="text-slate-500">Desde: {cfg.vigente_desde}</span>
              </div>
              <div className="space-y-1">
                {cfg.detalles.map((d) => {
                  const p = participantes.find((part) => part.id === d.participante_id)
                  return (
                    <div key={d.participante_id} className="flex justify-between text-slate-700">
                      <span>{p?.nombre || d.participante_id}</span>
                      <span className="font-bold">{d.porcentaje} %</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gestión de Datos y Copias de Seguridad */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Copia de Seguridad y Restauración Local
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Exporta todos los participantes, configuraciones y movimientos a un archivo JSON para respaldo o muévelos a otra computadora.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDescargarBackup}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar Respaldo JSON
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Importar Respaldo JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportarBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={onVaciarMovimientos}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Elimina todos los movimientos para empezar de cero"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            Vaciar Todos los Movimientos (Reiniciar a 0)
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import {
  Camera,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  XCircle,
  Sparkles,
} from 'lucide-react'
import type { CicloMaquina, Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface TarjetaCicloActivoProps {
  ciclo: CicloMaquina | null
  movimientos: Movimiento[]
  usuarioActual: Participante
  onAbrirCerrarAbastecimiento?: () => void
  onAbrirComprar?: () => void
  onAbrirGanar?: () => void
  onVerDetalleCiclo?: (ciclo: CicloMaquina) => void
  onCancelarCiclo?: (cicloId: string) => Promise<void>
}

export const TarjetaCicloActivo: React.FC<TarjetaCicloActivoProps> = ({
  ciclo,
  movimientos,
  usuarioActual,
  onAbrirCerrarAbastecimiento,
  onAbrirComprar,
  onAbrirGanar,
  onVerDetalleCiclo,
  onCancelarCiclo,
}) => {
  const [fotoZoom, setFotoZoom] = useState<string | null>(null)
  const esAdmin = usuarioActual.rol === 'Administrador'

  if (!ciclo || ciclo.estado === 'CERRADO') return null

  const esAbastecimiento = ciclo.tipo === 'ABASTECIMIENTO'
  const movVinculado = ciclo.movimiento_ids && ciclo.movimiento_ids.length > 0
    ? movimientos.find((m) => ciclo.movimiento_ids?.includes(m.id))
    : null

  const tieneCompraRegistrada = esAbastecimiento && Boolean(movVinculado || ciclo.estado === 'EN_PROCESO')

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 border-2 border-indigo-200 rounded-3xl p-4 sm:p-5 shadow-md relative overflow-hidden space-y-4">
      {/* Luz superior decorativa */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 ${
          esAbastecimiento ? 'bg-amber-400' : 'bg-emerald-400'
        }`}
      />

      {/* Cabecera del Ciclo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
              esAbastecimiento
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
            }`}
          >
            {esAbastecimiento ? (
              <ShoppingBag className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {ciclo.codigo}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  esAbastecimiento
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                Ruta de {esAbastecimiento ? 'Abastecimiento' : 'Ganancia'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Iniciado por <strong className="text-slate-800">{ciclo.iniciado_por_nombre || 'Operadora'}</strong> el {ciclo.fecha_inicio} a las {ciclo.hora_inicio}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {onVerDetalleCiclo && (
            <button
              type="button"
              onClick={() => onVerDetalleCiclo(ciclo)}
              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
            >
              Ver detalle
            </button>
          )}

          {esAdmin && onCancelarCiclo && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas cancelar este ciclo activo?')) {
                  onCancelarCiclo(ciclo.id)
                }
              }}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title="Cancelar ciclo activo (Solo Admin)"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Indicador de Etapas / Visual Stepper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Progreso del Ciclo:
          </span>
          <span className="text-[11px] font-semibold text-slate-500 italic">
            {ciclo.etapa_actual}
          </span>
        </div>

        {/* Barra de Pasos */}
        {esAbastecimiento ? (
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Paso 1: Foto Antes */}
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Paso 1
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-bold leading-tight text-[11px]">Foto Antes</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[9px] text-emerald-700">Auditado</span>
                {ciclo.foto_antes_url && (
                  <button
                    type="button"
                    onClick={() => setFotoZoom(ciclo.foto_antes_url)}
                    className="p-1 text-emerald-800 hover:bg-emerald-100 rounded-md cursor-pointer"
                    title="Ver foto antes"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Paso 2: Compra de Mercadería */}
            <div
              className={`p-2.5 rounded-2xl border flex flex-col justify-between transition-colors ${
                tieneCompraRegistrada
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Paso 2
                </span>
                {tieneCompraRegistrada ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <p className="font-bold leading-tight text-[11px]">Compra</p>
              <span className="text-[9px] mt-1">
                {tieneCompraRegistrada
                  ? movVinculado
                    ? formatearMoneda(movVinculado.total_gastado || 0)
                    : 'Registrada'
                  : 'En espera'}
              </span>
            </div>

            {/* Paso 3: Foto Después y Cierre */}
            <div
              className={`p-2.5 rounded-2xl border flex flex-col justify-between transition-colors ${
                ciclo.foto_despues_url
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : tieneCompraRegistrada
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Paso 3
                </span>
                {ciclo.foto_despues_url ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <p className="font-bold leading-tight text-[11px]">Foto Después</p>
              <span className="text-[9px] mt-1">
                {ciclo.foto_despues_url ? 'Completado' : 'Pendiente'}
              </span>
            </div>
          </div>
        ) : (
          /* Stepper para Ruta de Ganancia */
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Paso 1: Foto Antes de Sacar Dinero */}
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Paso 1
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-bold leading-tight text-[11px]">Foto Previa</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[9px] text-emerald-700">Auditado</span>
                {ciclo.foto_antes_url && (
                  <button
                    type="button"
                    onClick={() => setFotoZoom(ciclo.foto_antes_url)}
                    className="p-1 text-emerald-800 hover:bg-emerald-100 rounded-md cursor-pointer"
                    title="Ver foto antes"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Paso 2: Conteo y Reparto Automático */}
            <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-300 text-emerald-950 flex flex-col justify-between animate-pulse">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Paso 2
                </span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-bold leading-tight text-[11px]">Recaudar y Repartir</p>
              <span className="text-[9px] text-emerald-700 mt-1">
                {movVinculado ? `+${formatearMoneda(movVinculado.monto_ganado || 0)}` : 'Por registrar'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botón de Acción Principal del Ciclo */}
      <div className="pt-1">
        {esAbastecimiento ? (
          tieneCompraRegistrada ? (
            /* Si la compra ya se hizo, el siguiente paso es que la operadora suba la foto después */
            <button
              type="button"
              onClick={onAbrirCerrarAbastecimiento}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>Subir Foto DESPUÉS para Cerrar Ciclo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            /* Si no se ha hecho la compra, llamar a comprar */
            <button
              type="button"
              onClick={onAbrirComprar}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar Compra para este Ciclo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )
        ) : (
          /* Si es ganancia, llamar a registrar ganancia */
          <button
            type="button"
            onClick={onAbrirGanar}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Ganancia y Reparto del Ciclo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Modal Zoom Foto */}
      {fotoZoom && (
        <div
          onClick={() => setFotoZoom(null)}
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-xl max-h-[90vh]">
            <img
              src={fotoZoom}
              alt="Foto Antes"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

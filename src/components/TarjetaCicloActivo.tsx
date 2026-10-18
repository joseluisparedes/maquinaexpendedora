import React, { useState } from 'react'
import {
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
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
  onVerDetalleCiclo,
  onCancelarCiclo,
}) => {
  const [zoomModal, setZoomModal] = useState<{
    fotos: string[]
    indice: number
    titulo: string
  } | null>(null)
  const esAdmin = usuarioActual.rol === 'Administrador'

  if (!ciclo || ciclo.estado === 'CERRADO') return null

  const esAbastecimiento = ciclo.tipo === 'ABASTECIMIENTO'
  const movVinculado = ciclo.movimiento_ids && ciclo.movimiento_ids.length > 0
    ? movimientos.find((m) => ciclo.movimiento_ids?.includes(m.id))
    : null

  const tieneCompraRegistrada = esAbastecimiento && Boolean(movVinculado || ciclo.estado === 'EN_PROCESO')

  const fotosAntes =
    ciclo.fotos_antes_urls && ciclo.fotos_antes_urls.length > 0
      ? ciclo.fotos_antes_urls
      : ciclo.foto_antes_url
      ? [ciclo.foto_antes_url]
      : []

  const fotosDespues =
    ciclo.fotos_despues_urls && ciclo.fotos_despues_urls.length > 0
      ? ciclo.fotos_despues_urls
      : ciclo.foto_despues_url
      ? [ciclo.foto_despues_url]
      : []

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
                <span className="text-[9px] text-emerald-700 font-bold">
                  {fotosAntes.length > 1 ? `${fotosAntes.length} fotos` : 'Auditado'}
                </span>
                {fotosAntes.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setZoomModal({
                        fotos: fotosAntes,
                        indice: 0,
                        titulo: `Fotos ANTES de máquina (${fotosAntes.length})`,
                      })
                    }
                    className="p-1 text-emerald-800 hover:bg-emerald-100 rounded-md cursor-pointer flex items-center gap-0.5"
                    title="Ver fotos antes"
                  >
                    <Eye className="w-3 h-3" />
                    {fotosAntes.length > 1 && (
                      <span className="text-[9px] font-black">{fotosAntes.length}</span>
                    )}
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
              <span className="text-[9px] mt-1 font-semibold">
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
                fotosDespues.length > 0
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
                {fotosDespues.length > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <p className="font-bold leading-tight text-[11px]">Foto Después</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[9px] font-semibold">
                  {fotosDespues.length > 0
                    ? fotosDespues.length > 1
                      ? `${fotosDespues.length} fotos`
                      : 'Auditado'
                    : 'Pendiente'}
                </span>
                {fotosDespues.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setZoomModal({
                        fotos: fotosDespues,
                        indice: 0,
                        titulo: `Fotos DESPUÉS de máquina (${fotosDespues.length})`,
                      })
                    }
                    className="p-1 text-emerald-800 hover:bg-emerald-100 rounded-md cursor-pointer flex items-center gap-0.5"
                    title="Ver fotos después"
                  >
                    <Eye className="w-3 h-3" />
                    {fotosDespues.length > 1 && (
                      <span className="text-[9px] font-black">{fotosDespues.length}</span>
                    )}
                  </button>
                )}
              </div>
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
                <span className="text-[9px] text-emerald-700 font-bold">
                  {fotosAntes.length > 1 ? `${fotosAntes.length} fotos` : 'Auditado'}
                </span>
                {fotosAntes.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setZoomModal({
                        fotos: fotosAntes,
                        indice: 0,
                        titulo: `Fotos PREVIAS de máquina (${fotosAntes.length})`,
                      })
                    }
                    className="p-1 text-emerald-800 hover:bg-emerald-100 rounded-md cursor-pointer flex items-center gap-0.5"
                    title="Ver foto antes"
                  >
                    <Eye className="w-3 h-3" />
                    {fotosAntes.length > 1 && (
                      <span className="text-[9px] font-black">{fotosAntes.length}</span>
                    )}
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
              <span className="text-[9px] text-emerald-700 mt-1 font-semibold">
                {movVinculado ? `+${formatearMoneda(movVinculado.monto_ganado || 0)}` : 'Por registrar'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Estado Actual del Ciclo (Informativo, sin botones duplicados) */}
      <div className="pt-1">
        {esAbastecimiento ? (
          tieneCompraRegistrada ? (
            <div className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Compra registrada.</strong> Listo para que la operadora abastezca la máquina y tome la foto final.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Paso 2 pendiente:</strong> Esperando que los socios registren la compra de mercadería.
              </span>
            </div>
          )
        ) : (
          <div className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Paso 2 pendiente:</strong> Esperando registro del conteo de recaudación y reparto entre socios.
            </span>
          </div>
        )}
      </div>

      {/* Modal Zoom Foto con Carrusel */}
      {zoomModal && (
        <div
          onClick={() => setZoomModal(null)}
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between text-white text-xs font-bold mb-2 px-1">
              <span>{zoomModal.titulo}</span>
              <button
                type="button"
                onClick={() => setZoomModal(null)}
                className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="relative w-full max-h-[80vh] flex items-center justify-center">
              <img
                src={zoomModal.fotos[zoomModal.indice]}
                alt="Vista ampliada"
                className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />

              {zoomModal.fotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setZoomModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              indice: (prev.indice - 1 + prev.fotos.length) % prev.fotos.length,
                            }
                          : null
                      )
                    }
                    className="absolute left-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer backdrop-blur-xs transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setZoomModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              indice: (prev.indice + 1) % prev.fotos.length,
                            }
                          : null
                      )
                    }
                    className="absolute right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer backdrop-blur-xs transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {zoomModal.fotos.length > 1 && (
              <div className="flex items-center gap-1.5 mt-3">
                {zoomModal.fotos.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === zoomModal.indice ? 'bg-white scale-125' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

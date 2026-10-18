import React, { useState } from 'react'
import {
  X,
  Camera,
  ShoppingBag,
  TrendingUp,
  Clock,
  Eye,
  Receipt,
} from 'lucide-react'
import type { CicloMaquina, Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface DetalleCicloModalProps {
  isOpen: boolean
  onClose: () => void
  ciclo: CicloMaquina | null
  movimientos: Movimiento[]
  participantes?: Participante[]
  onVerMovimiento?: (m: Movimiento) => void
}

export const DetalleCicloModal: React.FC<DetalleCicloModalProps> = ({
  isOpen,
  onClose,
  ciclo,
  movimientos,
  onVerMovimiento,
}) => {
  const [fotoEnZoom, setFotoEnZoom] = useState<string | null>(null)

  if (!isOpen || !ciclo) return null

  const esAbastecimiento = ciclo.tipo === 'ABASTECIMIENTO'
  const movsVinculados = movimientos.filter((m) =>
    ciclo.movimiento_ids?.includes(m.id) || m.ciclo_id === ciclo.id
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Ciclo */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            esAbastecimiento
              ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-50 border-amber-100'
              : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-50 border-emerald-100'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                esAbastecimiento
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
              }`}
            >
              {esAbastecimiento ? (
                <ShoppingBag className="w-5 h-5 stroke-[2.3]" />
              ) : (
                <TrendingUp className="w-5 h-5 stroke-[2.3]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {ciclo.codigo}
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    esAbastecimiento
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  Ruta de {esAbastecimiento ? 'Abastecimiento' : 'Ganancia'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ciclo.estado === 'CERRADO'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-emerald-600 text-white animate-pulse'
                  }`}
                >
                  {ciclo.estado}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {ciclo.etapa_actual}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          
          {/* COMPARATIVA VISUAL: FOTO ANTES VS FOTO DESPUÉS */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              Auditoría Fotográfica de la Máquina:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Foto Antes */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 space-y-2 pb-2.5">
                <div className="px-3 pt-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Foto ANTES (Inicio)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {ciclo.fecha_inicio} • {ciclo.hora_inicio}
                  </span>
                </div>

                <div
                  onClick={() => setFotoEnZoom(ciclo.foto_antes_url)}
                  className="relative aspect-video bg-slate-900 group cursor-pointer overflow-hidden"
                >
                  <img
                    src={ciclo.foto_antes_url}
                    alt="Foto Antes"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>

                {ciclo.observaciones_antes && (
                  <p className="px-3 text-[11px] text-slate-600 italic">
                    "{ciclo.observaciones_antes}"
                  </p>
                )}
                <p className="px-3 text-[10px] text-slate-400">
                  Por: <strong className="text-slate-600">{ciclo.iniciado_por_nombre || 'Operador'}</strong>
                </p>
              </div>

              {/* Foto Después (o Pendiente) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 space-y-2 pb-2.5">
                <div className="px-3 pt-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ciclo.foto_despues_url ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    Foto DESPUÉS (Cierre)
                  </span>
                  {ciclo.fecha_despues && (
                    <span className="text-[10px] text-slate-400">
                      {ciclo.fecha_despues} • {ciclo.hora_despues}
                    </span>
                  )}
                </div>

                {ciclo.foto_despues_url ? (
                  <div
                    onClick={() => setFotoEnZoom(ciclo.foto_despues_url!)}
                    className="relative aspect-video bg-slate-900 group cursor-pointer overflow-hidden"
                  >
                    <img
                      src={ciclo.foto_despues_url}
                      alt="Foto Después"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-100 border border-dashed border-slate-300 rounded-xl m-2 flex flex-col items-center justify-center text-slate-400 text-xs p-3 text-center space-y-1">
                    <Clock className="w-6 h-6 text-slate-300" />
                    <span>
                      {esAbastecimiento
                        ? 'En espera de foto final tras el llenado de mercadería'
                        : 'No aplica (Cierre automático con reparto)'}
                    </span>
                  </div>
                )}

                {ciclo.observaciones_despues && (
                  <p className="px-3 text-[11px] text-slate-600 italic">
                    "{ciclo.observaciones_despues}"
                  </p>
                )}
                {ciclo.cerrado_por_nombre && (
                  <p className="px-3 text-[10px] text-slate-400">
                    Cerrado por: <strong className="text-slate-600">{ciclo.cerrado_por_nombre}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* MOVIMIENTOS GENERADOS EN ESTE CICLO */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              Movimientos Contables Vinculados ({movsVinculados.length}):
            </h4>

            {movsVinculados.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                Aún no se ha registrado el movimiento financiero de este ciclo.
              </p>
            ) : (
              <div className="space-y-2">
                {movsVinculados.map((mov) => (
                  <div
                    key={mov.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {mov.codigo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            mov.tipo === 'GANAR'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {mov.tipo}
                        </span>
                      </div>
                      <p className="text-slate-800 font-bold mt-1">
                        {mov.descripcion || 'Sin descripción'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {mov.fecha}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900">
                        {mov.tipo === 'GANAR'
                          ? `+${formatearMoneda(mov.monto_ganado || 0)}`
                          : `-${formatearMoneda(mov.total_gastado || 0)}`}
                      </span>

                      {onVerMovimiento && (
                        <button
                          type="button"
                          onClick={() => onVerMovimiento(mov)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Ver detalle del movimiento"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {/* Modal de Zoom */}
        {fotoEnZoom && (
          <div
            onClick={() => setFotoEnZoom(null)}
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
          >
            <div className="relative max-w-2xl max-h-[90vh]">
              <img
                src={fotoEnZoom}
                alt="Vista ampliada"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'
import type { CicloMaquina, Movimiento } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface EliminarCicloModalProps {
  isOpen: boolean
  onClose: () => void
  ciclo: CicloMaquina | null
  movimientos: Movimiento[]
  onConfirmarEliminacion: (cicloId: string) => Promise<void>
}

export const EliminarCicloModal: React.FC<EliminarCicloModalProps> = ({
  isOpen,
  onClose,
  ciclo,
  movimientos,
  onConfirmarEliminacion,
}) => {
  const [eliminando, setEliminando] = useState(false)

  if (!isOpen || !ciclo) return null

  // Movimientos vinculados
  const movsVinculados = movimientos.filter(
    (m) => ciclo.movimiento_ids?.includes(m.id) || m.ciclo_id === ciclo.id
  )

  const handleEliminar = async () => {
    setEliminando(true)
    try {
      await onConfirmarEliminacion(ciclo.id)
      onClose()
    } catch (err) {
      console.error('Error al eliminar ciclo:', err)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-5 sm:px-6 py-4 border-b border-rose-100 bg-rose-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-950 leading-tight">
                ¿Eliminar Ciclo de Operación?
              </h3>
              <p className="text-xs text-rose-700/80 font-medium">
                Esta acción eliminará registros en cascada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={eliminando}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                {ciclo.codigo}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {ciclo.tipo} • {ciclo.estado}
              </span>
            </div>
            <p className="text-slate-600 text-xs">
              Iniciado el {ciclo.fecha_inicio} a las {ciclo.hora_inicio} por{' '}
              <strong className="text-slate-800">{ciclo.iniciado_por_nombre || 'Operador'}</strong>
            </p>
          </div>

          {/* Registros afectados */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950">
            <span className="font-black uppercase tracking-wider text-[10px] text-amber-800 block">
              Registros que se eliminarán permanentemente:
            </span>
            <ul className="space-y-1.5 text-slate-700">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">•</span>
                <span>
                  El ciclo <strong>{ciclo.codigo}</strong> y todas sus fotos registradas.
                </span>
              </li>
              {movsVinculados.length > 0 ? (
                movsVinculados.map((m) => (
                  <li key={m.id} className="flex items-start gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>
                      Movimiento contable <strong>{m.codigo}</strong> ({m.tipo}) de{' '}
                      <strong className="text-slate-900 font-mono">
                        {formatearMoneda(m.monto_ganado || m.total_gastado || 0)}
                      </strong>
                    </span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-1.5 text-slate-500 italic">
                  <span className="text-slate-400">•</span>
                  <span>Sin movimientos contables asociados.</span>
                </li>
              )}
              <li className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">•</span>
                <span>
                  El <strong>Saldo de Caja</strong> y los reportes de ganancia se recalcularán de inmediato.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pie con botones */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={eliminando}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEliminar}
            disabled={eliminando}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {eliminando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Todo</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

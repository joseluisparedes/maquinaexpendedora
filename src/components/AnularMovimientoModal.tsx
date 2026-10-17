import React, { useState } from 'react'
import { X, AlertTriangle, Ban } from 'lucide-react'
import type { Movimiento } from '../types'

interface AnularMovimientoModalProps {
  movimiento: Movimiento | null
  onClose: () => void
  onConfirmarAnulacion: (movimientoId: string, motivo: string) => void
}

export const AnularMovimientoModal: React.FC<AnularMovimientoModalProps> = ({
  movimiento,
  onClose,
  onConfirmarAnulacion,
}) => {
  const [motivo, setMotivo] = useState('')

  if (!movimiento) return null

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivo.trim()) {
      alert('Debes indicar un motivo para anular este movimiento.')
      return
    }
    onConfirmarAnulacion(movimiento.id, motivo.trim())
    setMotivo('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-rose-900">Anular Movimiento</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmar} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            De acuerdo a la regla de auditoría,{' '}
            <strong className="text-slate-900">los movimientos no se eliminan</strong>; quedan marcados
            como <strong className="text-rose-700">ANULADOS</strong> y ya no afectarán los saldos
            ni repartos.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex justify-between font-bold text-slate-800">
              <span>{movimiento.codigo}</span>
              <span>{movimiento.fecha}</span>
            </div>
            <p className="text-slate-600 mt-1 truncate">{movimiento.descripcion}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Motivo de la anulación (Obligatorio) *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ej: Error en el monto digitado, factura duplicada, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Ban className="w-4 h-4" />
              Confirmar Anulación
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

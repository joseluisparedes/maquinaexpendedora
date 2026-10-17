import React from 'react'
import { X, TrendingUp, ShoppingBag, CheckCircle2, Ban } from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface DetalleMovimientoModalProps {
  movimiento: Movimiento | null
  onClose: () => void
  participantes: Participante[]
}

export const DetalleMovimientoModal: React.FC<DetalleMovimientoModalProps> = ({
  movimiento,
  onClose,
  participantes,
}) => {
  if (!movimiento) return null

  const partMap = new Map<string, Participante>()
  participantes.forEach((p) => partMap.set(p.id, p))

  const regPor = partMap.get(movimiento.registrado_por)?.nombre || movimiento.registrado_por
  const esGanar = movimiento.tipo === 'GANAR'
  const esAnulado = movimiento.estado === 'ANULADO'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 text-base">{movimiento.codigo}</span>
            {esAnulado ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                <Ban className="w-3 h-3" /> Anulado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Registrado
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {/* Alerta de Anulado si aplica */}
          {esAnulado && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
              <p className="font-bold">Movimiento Anulado</p>
              <p className="text-xs mt-0.5">
                Motivo: {movimiento.motivo_anulacion || 'Sin motivo especificado'}
              </p>
            </div>
          )}

          {/* Datos Principales */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Tipo</p>
              <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                {esGanar ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                )}
                {movimiento.tipo}
                {movimiento.origen_ganancia === 'SOBRANTE_COMPRA' && ' (Sobrante repartido)'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Fecha</p>
              <p className="font-bold text-slate-900 mt-0.5">{movimiento.fecha}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Registrado Por</p>
              <p className="font-bold text-slate-900 mt-0.5">{regPor}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Monto Total</p>
              <p className="font-black text-slate-900 mt-0.5 text-base">
                {esGanar
                  ? formatearMoneda(movimiento.monto_ganado || 0)
                  : formatearMoneda(movimiento.total_gastado || 0)}
              </p>
            </div>
          </div>

          {/* Descripción */}
          {movimiento.descripcion && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Descripción / Glosa</p>
              <p className="text-slate-800 mt-1 font-medium">{movimiento.descripcion}</p>
            </div>
          )}

          {/* Desglose GANAR: Snapshot de Porcentajes y Reparto */}
          {esGanar && movimiento.reparto && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 uppercase">
                  Desglose del Reparto (Snapshot histórico)
                </p>
                <span className="text-[11px] text-slate-400">Centavos redondeados al último</span>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {movimiento.reparto.map((item) => {
                  const p = partMap.get(item.participante_id)
                  return (
                    <div
                      key={item.participante_id}
                      className="flex items-center justify-between px-3.5 py-2.5 text-xs bg-white"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{p?.nombre || item.participante_id}</span>
                        <span className="text-slate-400 ml-1.5">({item.porcentaje_aplicado}%)</span>
                      </div>
                      <span className="font-black text-emerald-700">
                        {formatearMoneda(item.monto)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Desglose COMPRAR */}
          {!esGanar && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Monto Asignado (Caja):</span>
                  <span className="font-bold text-slate-900">
                    {formatearMoneda(movimiento.monto_asignado || 0)}
                  </span>
                </div>
                {(movimiento.monto_adicional || 0) > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>
                      Monto Extra Aportado ({partMap.get(movimiento.quien_aporto_adicional || '')?.nombre || 'Socio'}):
                    </span>
                    <span className="font-bold">+{formatearMoneda(movimiento.monto_adicional || 0)}</span>
                  </div>
                )}
                {(movimiento.monto_sobrante || 0) > 0 && (
                  <div className="flex justify-between text-indigo-700">
                    <span>
                      Monto Sobrante ({movimiento.destino_sobrante === 'CAJA' ? 'Devuelto a caja' : 'Repartido a socios'}):
                    </span>
                    <span className="font-bold">−{formatearMoneda(movimiento.monto_sobrante || 0)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
                  <span>Gasto Total Real:</span>
                  <span className="text-sm font-black">{formatearMoneda(movimiento.total_gastado || 0)}</span>
                </div>
              </div>

              {movimiento.detalle_productos && movimiento.detalle_productos.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase mb-2">
                    Productos Adquiridos ({movimiento.detalle_productos.length})
                  </p>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {movimiento.detalle_productos.map((prod) => (
                      <div key={prod.id} className="flex items-center justify-between px-3.5 py-2">
                        <div>
                          <p className="font-bold text-slate-800">{prod.producto}</p>
                          <p className="text-[10px] text-slate-400">
                            {prod.cantidad} unid. × {formatearMoneda(prod.costo_unitario)}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatearMoneda(prod.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

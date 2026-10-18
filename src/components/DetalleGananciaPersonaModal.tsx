import React, { useMemo } from 'react'
import {
  X,
  TrendingUp,
  Eye,
  Receipt,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface DetalleGananciaPersonaModalProps {
  isOpen: boolean
  onClose: () => void
  participante: Participante | null
  movimientos: Movimiento[]
  onVerMovimiento?: (m: Movimiento) => void
}

export const DetalleGananciaPersonaModal: React.FC<DetalleGananciaPersonaModalProps> = ({
  isOpen,
  onClose,
  participante,
  movimientos,
  onVerMovimiento,
}) => {
  if (!isOpen || !participante) return null

  // Calcular desglose de ganancias del participante
  const { itemsGanancia, totalRecaudacion, totalSobrantes, totalGanado, aportesPendientes } = useMemo(() => {
    let rec = 0
    let sob = 0
    let apPuestos = 0
    let apPend = 0
    const items: Array<{
      movimiento: Movimiento
      monto: number
      porcentaje: number
      tipoOrigen: 'RECAUDACION' | 'SOBRANTE_COMPRA'
    }> = []

    const activos = movimientos.filter((m) => m.estado === 'REGISTRADO')

    activos.forEach((mov) => {
      if (mov.tipo === 'GANAR' && mov.reparto) {
        const itemRep = mov.reparto.find((r) => r.participante_id === participante.id)
        if (itemRep && itemRep.monto > 0) {
          const esSobrante = mov.origen_ganancia === 'SOBRANTE_COMPRA'
          if (esSobrante) {
            sob += itemRep.monto
          } else {
            rec += itemRep.monto
          }
          items.push({
            movimiento: mov,
            monto: itemRep.monto,
            porcentaje: itemRep.porcentaje_aplicado,
            tipoOrigen: esSobrante ? 'SOBRANTE_COMPRA' : 'RECAUDACION',
          })
        }
      } else if (mov.tipo === 'COMPRAR') {
        if (mov.aportes_adicionales) {
          mov.aportes_adicionales.forEach((ap) => {
            if (ap.participante_id === participante.id) {
              apPuestos += ap.monto
              if (ap.estado === 'PENDIENTE') {
                apPend += ap.monto
              }
            }
          })
        } else if (mov.quien_aporto_adicional === participante.id && (mov.monto_adicional || 0) > 0) {
          apPuestos += mov.monto_adicional || 0
          if (!mov.aporte_devuelto) {
            apPend += mov.monto_adicional || 0
          }
        }
      }
    })

    // Ordenar de más reciente a más antiguo
    items.sort((a, b) => b.movimiento.fecha.localeCompare(a.movimiento.fecha))

    return {
      itemsGanancia: items,
      totalRecaudacion: rec,
      totalSobrantes: sob,
      totalGanado: rec + sob,
      aportesPuestos: apPuestos,
      aportesPendientes: apPend,
    }
  }, [participante, movimientos])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Participante */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-slate-50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
              {participante.nombre.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {participante.nombre}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {participante.rol}
                </span>
                {participante.es_socio && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Socio
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Auditoría detallada de ganancias y repartos recibidos
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

        {/* Resumen Financiero de la Persona */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              Total Percibido
            </span>
            <span className="text-lg font-black text-indigo-700 block mt-0.5">
              {formatearMoneda(totalGanado)}
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              Por Recaudaciones
            </span>
            <span className="text-sm font-black text-emerald-700 block mt-0.5">
              {formatearMoneda(totalRecaudacion)}
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              Por Sobrantes
            </span>
            <span className="text-sm font-black text-amber-700 block mt-0.5">
              {formatearMoneda(totalSobrantes)}
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              Pendiente Reembolso
            </span>
            <span className={`text-sm font-black block mt-0.5 ${aportesPendientes > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {aportesPendientes > 0 ? formatearMoneda(aportesPendientes) : 'Al día'}
            </span>
          </div>
        </div>

        {/* Lista Detallada de Movimientos donde ganó */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              Historial de Liquidaciones ({itemsGanancia.length})
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">
              Orden cronológico descendente
            </span>
          </div>

          {itemsGanancia.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <TrendingUp className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">Sin ganancias registradas aún</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No hay movimientos de recaudación ni sobrantes repartidos a este participante en el historial seleccionado.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {itemsGanancia.map((item, idx) => {
                const mov = item.movimiento
                const esSobrante = item.tipoOrigen === 'SOBRANTE_COMPRA'

                return (
                  <div
                    key={`${mov.id}-${idx}`}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {mov.codigo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            esSobrante
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {esSobrante ? 'Sobrante de Compra' : 'Recaudación de Máquina'}
                        </span>
                        {mov.ciclo_id && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ciclo: {mov.ciclo_id}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 font-medium">
                        {mov.descripcion || 'Liquidación del periodo'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {mov.fecha} • Monto Total Distribuido: <strong className="text-slate-600">{formatearMoneda(mov.monto_ganado || 0)}</strong>
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">
                          {item.porcentaje}% del total
                        </span>
                        <span className="text-sm font-black text-emerald-700">
                          +{formatearMoneda(item.monto)}
                        </span>
                      </div>

                      {onVerMovimiento && (
                        <button
                          type="button"
                          onClick={() => onVerMovimiento(mov)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver movimiento completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Los porcentajes se calculan según la configuración vigente a la fecha de cada recaudación.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}

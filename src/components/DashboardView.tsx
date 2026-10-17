import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  PiggyBank,
  BadgeAlert,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Users,
  Store,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { calcularBalance, formatearMoneda } from '../utils/calculations'

interface DashboardViewProps {
  movimientos: Movimiento[]
  participantes: Participante[]
  onNuevoMovimiento: () => void
  onVerMovimientos: () => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  movimientos,
  participantes,
}) => {
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todo' | 'este-mes' | 'mes-anterior' | 'esta-semana'>('todo')

  // Filtrado de movimientos por fecha
  const movimientosFiltrados = useMemo(() => {
    if (filtroPeriodo === 'todo') return movimientos

    const hoy = new Date()
    return movimientos.filter((m) => {
      const fechaMov = new Date(m.fecha + 'T00:00:00')

      if (filtroPeriodo === 'este-mes') {
        return (
          fechaMov.getMonth() === hoy.getMonth() &&
          fechaMov.getFullYear() === hoy.getFullYear()
        )
      }
      if (filtroPeriodo === 'mes-anterior') {
        const mesAnterior = hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1
        const anioMesAnterior = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear()
        return (
          fechaMov.getMonth() === mesAnterior &&
          fechaMov.getFullYear() === anioMesAnterior
        )
      }
      if (filtroPeriodo === 'esta-semana') {
        const hace7Dias = new Date()
        hace7Dias.setDate(hoy.getDate() - 7)
        return fechaMov >= hace7Dias && fechaMov <= hoy
      }
      return true
    })
  }, [movimientos, filtroPeriodo])

  const balance = useMemo(() => calcularBalance(movimientosFiltrados), [movimientosFiltrados])

  // Desglose por participante (cuánto ha ganado y cuánto ha aportado)
  const resumenParticipantes = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nombre: string
        rol: string
        es_socio: boolean
        gananciasRecibidas: number
        sobrantesRecibidos: number
        aportesAdicionales: number
        aportesPendientes: number
      }
    >()

    participantes.forEach((p) => {
      mapa.set(p.id, {
        nombre: p.nombre,
        rol: p.rol,
        es_socio: p.es_socio,
        gananciasRecibidas: 0,
        sobrantesRecibidos: 0,
        aportesAdicionales: 0,
        aportesPendientes: 0,
      })
    })

    movimientosFiltrados
      .filter((m) => m.estado === 'REGISTRADO')
      .forEach((mov) => {
        if (mov.tipo === 'GANAR' && mov.reparto) {
          mov.reparto.forEach((rep) => {
            const part = mapa.get(rep.participante_id)
            if (part) {
              if (mov.origen_ganancia === 'SOBRANTE_COMPRA') {
                part.sobrantesRecibidos += rep.monto
              } else {
                part.gananciasRecibidas += rep.monto
              }
            }
          })
        } else if (mov.tipo === 'COMPRAR') {
          if (mov.aportes_adicionales) {
            mov.aportes_adicionales.forEach((ap) => {
              const part = mapa.get(ap.participante_id)
              if (part) {
                part.aportesAdicionales += ap.monto
                if (ap.estado === 'PENDIENTE') {
                  part.aportesPendientes += ap.monto
                }
              }
            })
          } else if (mov.quien_aporto_adicional && (mov.monto_adicional || 0) > 0) {
            const part = mapa.get(mov.quien_aporto_adicional)
            if (part) {
              part.aportesAdicionales += mov.monto_adicional || 0
              part.aportesPendientes += mov.monto_adicional || 0
            }
          }
        }
      })

    return Array.from(mapa.values())
  }, [participantes, movimientosFiltrados])

  // Agrupación por proveedores
  const gastosPorProveedor = useMemo(() => {
    const provs: Record<string, number> = {}
    movimientosFiltrados
      .filter((m) => m.estado === 'REGISTRADO' && m.tipo === 'COMPRAR')
      .forEach((m) => {
        const proveedor = m.proveedor?.trim() || 'Sin proveedor especificado'
        provs[proveedor] = (provs[proveedor] || 0) + (m.total_gastado || 0)
      })
    return Object.entries(provs).sort((a, b) => b[1] - a[1])
  }, [movimientosFiltrados])

  return (
    <div className="space-y-6">
      {/* Barra de Filtros de Periodo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold">Filtro de Periodo:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'todo', label: 'Todo el Historial' },
            { id: 'este-mes', label: 'Este Mes' },
            { id: 'mes-anterior', label: 'Mes Anterior' },
            { id: 'esta-semana', label: 'Últimos 7 días' },
          ].map((op) => (
            <button
              key={op.id}
              onClick={() => setFiltroPeriodo(op.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filtroPeriodo === op.id
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ganado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Ganado (Bruto)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatearMoneda(balance.totalGanado)}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Recaudación acumulada del periodo
            </p>
          </div>
        </div>

        {/* Total Gastado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Comprado (Gastos)
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatearMoneda(balance.totalGastado)}
            </p>
            <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              Costo real de productos comprados
            </p>
          </div>
        </div>

        {/* Resultado Neto */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Resultado Neto (Utilidad)
            </span>
            <div
              className={`p-2 rounded-xl ${
                balance.resultadoNeto >= 0
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-black tracking-tight ${
                balance.resultadoNeto >= 0 ? 'text-indigo-900' : 'text-rose-600'
              }`}
            >
              {formatearMoneda(balance.resultadoNeto)}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Ganado ({formatearMoneda(balance.totalGanado)}) − Gastado ({formatearMoneda(balance.totalGastado)})
            </p>
          </div>
        </div>

        {/* Saldo en Caja */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
              Saldo Disponible en Caja
            </span>
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tracking-tight text-white">
              {formatearMoneda(balance.saldoCaja)}
            </p>
            <p className="text-xs text-indigo-200 font-medium mt-1">
              Dinero disponible para próximas compras
            </p>
          </div>
        </div>
      </div>

      {/* Sub-indicadores secundarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Aportes Adicionales Puestos</p>
            <p className="text-lg font-bold text-slate-800">{formatearMoneda(balance.totalAdicionalAportado)}</p>
            <p className="text-[11px] text-slate-500">Puesto de bolsillo en compras</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <BadgeAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Aportes Pendientes por Devolver</p>
            <p className={`text-lg font-bold ${balance.totalAportesPendientes > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {formatearMoneda(balance.totalAportesPendientes)}
            </p>
            <p className="text-[11px] text-slate-500">Por reconocer a quien puso extra</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Sobrantes Devueltos a Caja</p>
            <p className="text-lg font-bold text-emerald-700">{formatearMoneda(balance.totalSobrantesCaja)}</p>
            <p className="text-[11px] text-slate-500">Reincorporados al fondo común</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Gráficos Visuales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativa Ganado vs Gastado */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ganado vs. Gastado</h3>
              <p className="text-xs text-slate-500">Comparación de flujos de dinero en el periodo</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {movimientosFiltrados.filter((m) => m.estado === 'REGISTRADO').length} Movimientos
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Ingreso Total (Ganancias)</span>
                <span className="text-emerald-700 font-bold">{formatearMoneda(balance.totalGanado)}</span>
              </div>
              <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                  style={{
                    width: `${
                      balance.totalGanado + balance.totalGastado > 0
                        ? Math.min(100, Math.max(10, (balance.totalGanado / (balance.totalGanado + balance.totalGastado)) * 100))
                        : 50
                    }%`,
                  }}
                >
                  {balance.totalGanado > 0 &&
                    `${Math.round(
                      (balance.totalGanado / (balance.totalGanado + balance.totalGastado || 1)) * 100
                    )}%`}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Egreso Total (Compras de mercadería)</span>
                <span className="text-amber-700 font-bold">{formatearMoneda(balance.totalGastado)}</span>
              </div>
              <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                  style={{
                    width: `${
                      balance.totalGanado + balance.totalGastado > 0
                        ? Math.min(100, Math.max(10, (balance.totalGastado / (balance.totalGanado + balance.totalGastado)) * 100))
                        : 50
                    }%`,
                  }}
                >
                  {balance.totalGastado > 0 &&
                    `${Math.round(
                      (balance.totalGastado / (balance.totalGanado + balance.totalGastado || 1)) * 100
                    )}%`}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 mt-4 text-xs text-slate-600 flex items-center justify-between">
              <span>Margen Neto Operativo:</span>
              <span className="font-bold text-slate-900">
                {balance.totalGanado > 0
                  ? `${((balance.resultadoNeto / balance.totalGanado) * 100).toFixed(1)} %`
                  : '0.0 %'}
              </span>
            </div>
          </div>
        </div>

        {/* Reparto Acumulado por Participante */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Reparto por Participante</h3>
              <p className="text-xs text-slate-500">Total distribuido acumulado</p>
            </div>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3">
            {resumenParticipantes.map((p) => {
              const totalRecibido = p.gananciasRecibidas + p.sobrantesRecibidos
              const porcentajeDelTotal =
                balance.totalGanado > 0 ? (totalRecibido / balance.totalGanado) * 100 : 0

              return (
                <div key={p.nombre} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{p.nombre}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {p.rol}
                      </span>
                    </div>
                    <span className="font-black text-indigo-700">
                      {formatearMoneda(totalRecibido)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, porcentajeDelTotal))}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabla Detallada: Estado de Cuenta por Participante */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Estado de Cuenta por Participante</h3>
            <p className="text-xs text-slate-500">
              Detalle de ganancias recibidas, sobrantes y aportes pendientes de devolución
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Participante</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4 text-right">Ganancias Recibidas</th>
                <th className="py-3 px-4 text-right">Sobrantes Recibidos</th>
                <th className="py-3 px-4 text-right">Total Percibido</th>
                <th className="py-3 px-4 text-right">Aportes Extra Puestos</th>
                <th className="py-3 px-4 text-right">Pendiente de Devolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resumenParticipantes.map((part) => {
                const totalPercibido = part.gananciasRecibidas + part.sobrantesRecibidos
                return (
                  <tr key={part.nombre} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {part.nombre.charAt(0)}
                      </div>
                      {part.nombre}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {part.rol}
                      {part.es_socio && (
                        <span className="ml-1.5 text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                          Socio
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatearMoneda(part.gananciasRecibidas)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatearMoneda(part.sobrantesRecibidos)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-indigo-700">
                      {formatearMoneda(totalPercibido)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {formatearMoneda(part.aportesAdicionales)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                      {part.aportesPendientes > 0 ? formatearMoneda(part.aportesPendientes) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compras por Proveedor */}
      {gastosPorProveedor.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Distribución de Compras por Proveedor</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gastosPorProveedor.map(([prov, total]) => (
              <div key={prov} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-700 truncate">{prov}</p>
                <p className="text-base font-black text-slate-900 mt-1">{formatearMoneda(total)}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {balance.totalGastado > 0
                    ? `${((total / balance.totalGastado) * 100).toFixed(1)}% del gasto total`
                    : '100%'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

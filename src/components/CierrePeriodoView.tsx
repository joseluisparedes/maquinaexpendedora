import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Copy,
  Printer,
  Check,
  Calendar,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { calcularBalance, calcularReparto, formatearMoneda } from '../utils/calculations'
import { StorageService } from '../utils/storage'

interface CierrePeriodoViewProps {
  movimientos: Movimiento[]
  participantes: Participante[]
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const CierrePeriodoView: React.FC<CierrePeriodoViewProps> = ({
  movimientos,
  participantes,
}) => {
  const hoy = new Date()
  const [todosLosMeses, setTodosLosMeses] = useState<boolean>(false)
  const [mesesSeleccionados, setMesesSeleccionados] = useState<number[]>([hoy.getMonth()])
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(hoy.getFullYear())
  const [dropdownMesesAbierto, setDropdownMesesAbierto] = useState(false)
  const [ordenFecha, setOrdenFecha] = useState<'desc' | 'asc'>('desc')
  const [copiado, setCopiado] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickAfuera = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownMesesAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickAfuera)
    return () => document.removeEventListener('mousedown', handleClickAfuera)
  }, [])

  const toggleMes = (mesIdx: number) => {
    if (todosLosMeses) {
      setTodosLosMeses(false)
      setMesesSeleccionados([mesIdx])
      return
    }

    if (mesesSeleccionados.includes(mesIdx)) {
      if (mesesSeleccionados.length > 1) {
        setMesesSeleccionados(mesesSeleccionados.filter((m) => m !== mesIdx))
      }
    } else {
      setMesesSeleccionados([...mesesSeleccionados, mesIdx].sort((a, b) => a - b))
    }
  }

  const handleSeleccionarTodosLosMeses = () => {
    setTodosLosMeses(true)
    setMesesSeleccionados([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  }

  // Filtrar movimientos del período seleccionado y ordenarlos
  const movimientosDelMes = useMemo(() => {
    const filtrados = movimientos.filter((m) => {
      if (m.estado === 'ANULADO') return false
      const f = new Date(m.fecha + 'T00:00:00')
      if (f.getFullYear() !== anioSeleccionado) return false
      if (todosLosMeses) return true
      return mesesSeleccionados.includes(f.getMonth())
    })

    return filtrados.sort((a, b) => {
      if (ordenFecha === 'desc') {
        return b.fecha.localeCompare(a.fecha)
      } else {
        return a.fecha.localeCompare(b.fecha)
      }
    })
  }, [movimientos, mesesSeleccionados, todosLosMeses, anioSeleccionado, ordenFecha])

  const balanceMes = useMemo(() => calcularBalance(movimientosDelMes), [movimientosDelMes])

  // Desglose de reparto calculado sobre la Utilidad Neta del mes (Ganado - Gastado)
  const repartoPorParticipante = useMemo(() => {
    // Si el resultado neto es <= 0, no hay utilidad neta que repartir
    if (balanceMes.resultadoNeto <= 0) {
      return participantes.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        rol: p.rol,
        monto: 0,
        porcentaje: 0,
      }))
    }

    // Obtener la configuración vigente de ganancias para el periodo consultado
    const mesMax = todosLosMeses ? 11 : Math.max(...mesesSeleccionados)
    const fechaFinMes = `${anioSeleccionado}-${String(mesMax + 1).padStart(2, '0')}-28`
    const configGanancia = StorageService.getConfiguracionVigente('ganancia', fechaFinMes)
    const porcentajes = configGanancia?.detalles || []

    const itemsCalculados = calcularReparto(balanceMes.resultadoNeto, porcentajes)

    return participantes.map((p) => {
      const item = itemsCalculados.find((r) => r.participante_id === p.id)
      const conf = porcentajes.find((d) => d.participante_id === p.id)
      return {
        id: p.id,
        nombre: p.nombre,
        rol: p.rol,
        monto: item ? item.monto : 0,
        porcentaje: conf ? conf.porcentaje : 0,
      }
    })
  }, [participantes, balanceMes.resultadoNeto, mesesSeleccionados, todosLosMeses, anioSeleccionado])

  // Texto legible del periodo actual
  const etiquetaPeriodo = useMemo(() => {
    if (todosLosMeses) {
      return `Todo el año ${anioSeleccionado}`
    }
    if (mesesSeleccionados.length === 1) {
      return `${MESES[mesesSeleccionados[0]]} ${anioSeleccionado}`
    }
    if (mesesSeleccionados.length === 12) {
      return `Todos los meses (${anioSeleccionado})`
    }
    const nombres = mesesSeleccionados.map((idx) => MESES[idx].slice(0, 3)).join(', ')
    return `${nombres} (${anioSeleccionado})`
  }, [todosLosMeses, mesesSeleccionados, anioSeleccionado])

  // Formato de texto para WhatsApp
  const textoWhatsApp = useMemo(() => {
    let texto = `*📊 CIERRE: ${etiquetaPeriodo.toUpperCase()}*\n`
    texto += `--------------------------------\n`
    texto += `*Ganado (Recaudación):* ${formatearMoneda(balanceMes.totalGanado)}\n`
    texto += `*Gastado (Mercadería):*  ${formatearMoneda(balanceMes.totalGastado)}\n`
    texto += `*Resultado Neto:*       ${formatearMoneda(balanceMes.resultadoNeto)}\n`
    texto += `--------------------------------\n`

    if (balanceMes.resultadoNeto > 0) {
      texto += `*💰 REPARTO DE UTILIDADES (Sobre Neto):*\n`
      repartoPorParticipante.forEach((p) => {
        const puntos = '.'.repeat(Math.max(2, 16 - p.nombre.length))
        texto += `  ${p.nombre} ${puntos} ${formatearMoneda(p.monto)} (${p.porcentaje}%)\n`
      })
    } else {
      texto += `*💰 REPARTO DE UTILIDADES:* S/ 0.00 (Sin utilidad neta a repartir)\n`
    }

    texto += `--------------------------------\n`
    texto += `*🏦 SALDO EN CAJA:*      ${formatearMoneda(balanceMes.saldoCaja)}\n`
    if (balanceMes.totalAportesPendientes > 0) {
      texto += `*⚠️ Aportes Pendientes:* ${formatearMoneda(balanceMes.totalAportesPendientes)}\n`
    }
    texto += `\n_Generado automáticamente por Sistema de Finanzas Máquina Expendedora_`
    return texto
  }, [etiquetaPeriodo, balanceMes, repartoPorParticipante])

  const handleCopiarWhatsApp = () => {
    navigator.clipboard.writeText(textoWhatsApp)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Controles de Selección de Periodo y Ordenamiento */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mr-1">
            <Calendar className="w-4 h-4" />
            <span>Filtro de Período:</span>
          </div>

          {/* Selector de Meses Multi-select con Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownMesesAbierto(!dropdownMesesAbierto)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 font-bold text-slate-800 text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              <span>
                {todosLosMeses
                  ? 'Todos los meses'
                  : mesesSeleccionados.length === 1
                  ? MESES[mesesSeleccionados[0]]
                  : `${mesesSeleccionados.length} meses seleccionados`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {dropdownMesesAbierto && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Seleccionar Meses</span>
                  <button
                    type="button"
                    onClick={handleSeleccionarTodosLosMeses}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    Marcar todos
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {MESES.map((m, idx) => {
                    const seleccionado = todosLosMeses || mesesSeleccionados.includes(idx)
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMes(idx)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          seleccionado
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{m}</span>
                        {seleccionado && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botón directo "Todos los meses" */}
          <button
            type="button"
            onClick={handleSeleccionarTodosLosMeses}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
              todosLosMeses
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            Todos los meses
          </button>

          {/* Selector de Año */}
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
            className="bg-slate-100 font-bold text-slate-800 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Ordenamiento por Fechas */}
          <button
            type="button"
            onClick={() => setOrdenFecha(ordenFecha === 'desc' ? 'asc' : 'desc')}
            title="Alternar orden cronológico de movimientos"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 cursor-pointer transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{ordenFecha === 'desc' ? 'Fechas: Más recientes' : 'Fechas: Más antiguos'}</span>
          </button>
        </div>

        {/* Acciones WhatsApp / Imprimir */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleCopiarWhatsApp}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiado ? '¡Copiado!' : 'Copiar para WhatsApp'}
          </button>

          <button
            onClick={handleImprimir}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Tarjeta del Reporte Formateado */}
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        <div className="text-center pb-4 border-b border-slate-100">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
            Informe Oficial de Cierre
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Cierre: {etiquetaPeriodo}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Máquina Expendedora del Colegio • Resumen Financiero
          </p>
        </div>

        {/* Resumen General */}
        <div className="space-y-2 text-sm font-mono bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
          <div className="flex justify-between">
            <span className="text-slate-600">Ganado:</span>
            <span className="font-bold text-slate-900">
              {formatearMoneda(balanceMes.totalGanado)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Gastado:</span>
            <span className="font-bold text-slate-900">
              {formatearMoneda(balanceMes.totalGastado)}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold">
            <span className="text-slate-900">Neto:</span>
            <span className={balanceMes.resultadoNeto >= 0 ? 'text-indigo-600' : 'text-rose-600'}>
              {formatearMoneda(balanceMes.resultadoNeto)}
            </span>
          </div>
        </div>

        {/* Reparto Detallado */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reparto de Utilidades:
            </p>
            {balanceMes.resultadoNeto > 0 ? (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                Sobre Utilidad Neta ({formatearMoneda(balanceMes.resultadoNeto)})
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                Sin utilidad a repartir
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs sm:text-sm font-mono border border-slate-100 rounded-2xl p-4 bg-white shadow-xs">
            {balanceMes.resultadoNeto <= 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2 font-sans">
                No hay utilidades a repartir en este periodo porque el Resultado Neto es {formatearMoneda(balanceMes.resultadoNeto)}.
              </p>
            ) : (
              repartoPorParticipante.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-700">
                    {p.nombre} <span className="text-slate-400">({p.porcentaje}%)</span>
                  </span>
                  <span className="font-bold text-emerald-700">{formatearMoneda(p.monto)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Saldo en Caja */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between font-mono">
          <div>
            <span className="text-xs font-bold uppercase text-slate-300 block">Saldo en Caja:</span>
            <span className="text-[10px] text-slate-400 font-sans">Fondo operativo disponible para compras</span>
          </div>
          <span className={`text-lg font-black ${balanceMes.saldoCaja >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatearMoneda(balanceMes.saldoCaja)}
          </span>
        </div>

        {/* Pie */}
        <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          Total de movimientos analizados en el periodo: {movimientosDelMes.length} • Generado con vigencia auditada.
        </div>
      </div>
    </div>
  )
}

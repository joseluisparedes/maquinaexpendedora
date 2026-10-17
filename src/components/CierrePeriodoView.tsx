import React, { useState, useMemo } from 'react'
import {
  Copy,
  Printer,
  Check,
  Calendar,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { calcularBalance, formatearMoneda } from '../utils/calculations'

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
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(hoy.getMonth())
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(hoy.getFullYear())
  const [copiado, setCopiado] = useState(false)

  // Filtrar movimientos del mes seleccionado
  const movimientosDelMes = useMemo(() => {
    return movimientos.filter((m) => {
      if (m.estado === 'ANULADO') return false
      const f = new Date(m.fecha + 'T00:00:00')
      return f.getMonth() === mesSeleccionado && f.getFullYear() === anioSeleccionado
    })
  }, [movimientos, mesSeleccionado, anioSeleccionado])

  const balanceMes = useMemo(() => calcularBalance(movimientosDelMes), [movimientosDelMes])

  // Desglose de reparto recibido en este mes por cada participante
  const repartoPorParticipante = useMemo(() => {
    const mapa = new Map<string, number>()
    participantes.forEach((p) => mapa.set(p.id, 0))

    movimientosDelMes.forEach((mov) => {
      if (mov.tipo === 'GANAR' && mov.reparto) {
        mov.reparto.forEach((item) => {
          mapa.set(item.participante_id, (mapa.get(item.participante_id) || 0) + item.monto)
        })
      }
    })

    return participantes.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      rol: p.rol,
      monto: Number((mapa.get(p.id) || 0).toFixed(2)),
    }))
  }, [participantes, movimientosDelMes])

  // Formato de texto para WhatsApp según Sección 6.5
  const textoWhatsApp = useMemo(() => {
    const nombreMes = MESES[mesSeleccionado]
    let texto = `*📊 CIERRE: ${nombreMes.toUpperCase()} ${anioSeleccionado}*\n`
    texto += `--------------------------------\n`
    texto += `*Ganado (Bruto):*  ${formatearMoneda(balanceMes.totalGanado)}\n`
    texto += `*Gastado (Compras):* ${formatearMoneda(balanceMes.totalGastado)}\n`
    texto += `*Resultado Neto:*   ${formatearMoneda(balanceMes.resultadoNeto)}\n`
    texto += `--------------------------------\n`
    texto += `*💰 REPARTO DE UTILIDADES:*\n`

    repartoPorParticipante.forEach((p) => {
      const puntos = '.'.repeat(Math.max(2, 18 - p.nombre.length))
      texto += `  ${p.nombre} ${puntos} ${formatearMoneda(p.monto)}\n`
    })

    texto += `--------------------------------\n`
    texto += `*🏦 SALDO EN CAJA:*  ${formatearMoneda(balanceMes.saldoCaja)}\n`
    if (balanceMes.totalAportesPendientes > 0) {
      texto += `*⚠️ Aportes Pendientes:* ${formatearMoneda(balanceMes.totalAportesPendientes)}\n`
    }
    texto += `\n_Generado automáticamente por Sistema de Finanzas Máquina Expendedora_`
    return texto
  }, [mesSeleccionado, anioSeleccionado, balanceMes, repartoPorParticipante])

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
      {/* Controles de Selección de Periodo */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <div className="flex items-center gap-2">
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              className="bg-slate-100 font-bold text-slate-800 text-xs sm:text-sm px-3 py-2 rounded-xl border-none focus:ring-2 focus:ring-indigo-500"
            >
              {MESES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="bg-slate-100 font-bold text-slate-800 text-xs sm:text-sm px-3 py-2 rounded-xl border-none focus:ring-2 focus:ring-indigo-500"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopiarWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiado ? '¡Copiado!' : 'Copiar para WhatsApp'}
          </button>

          <button
            onClick={handleImprimir}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
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
            Cierre: {MESES[mesSeleccionado]} {anioSeleccionado}
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
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Reparto de Utilidades:
          </p>
          <div className="space-y-2 text-xs sm:text-sm font-mono border border-slate-100 rounded-2xl p-4 bg-white shadow-xs">
            {repartoPorParticipante.map((p) => (
              <div key={p.id} className="flex justify-between items-center py-0.5">
                <span className="text-slate-700">
                  {p.nombre} <span className="text-slate-400">({p.rol})</span>
                </span>
                <span className="font-bold text-slate-900">{formatearMoneda(p.monto)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Saldo en Caja */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between font-mono">
          <span className="text-xs font-bold uppercase text-slate-300">Saldo en Caja:</span>
          <span className="text-lg font-black text-emerald-400">
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

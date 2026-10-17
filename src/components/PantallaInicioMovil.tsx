import React from 'react'
import {
  Coins,
  TrendingUp,
  ShoppingBag,
  ArrowRight,
  Wallet,
  Cloud,
  CloudOff,
  FileSpreadsheet,
  Clock,
} from 'lucide-react'
import type { Movimiento } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface PantallaInicioMovilProps {
  saldoCaja: number
  conectadoSupabase: boolean
  movimientos: Movimiento[]
  onAbrirGanar: () => void
  onAbrirComprar: () => void
  onIngresarSistema: () => void
  onIrACierre: () => void
  onVerDetalle: (m: Movimiento) => void
}

export const PantallaInicioMovil: React.FC<PantallaInicioMovilProps> = ({
  saldoCaja,
  conectadoSupabase,
  movimientos,
  onAbrirGanar,
  onAbrirComprar,
  onIngresarSistema,
  onIrACierre,
  onVerDetalle,
}) => {
  const ultimosMovimientos = movimientos.slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Barra Superior con Enlace para Ingresar al Sistema */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight">
                  Finanzas Vending
                </span>
                {conectadoSupabase ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full border border-emerald-200">
                    <Cloud className="w-2.5 h-2.5 text-emerald-600" />
                    Nube
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                    <CloudOff className="w-2.5 h-2.5 text-slate-400" />
                    Local
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Colegio • Registro Rápido</p>
            </div>
          </div>

          {/* Enlace para Ingresar al Sistema Completo */}
          <button
            onClick={onIngresarSistema}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200/80 transition-all cursor-pointer shadow-2xs"
          >
            <span>Ingresar al Sistema</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        </div>
      </header>

      {/* Contenedor Central Adaptado al Celular */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col justify-between space-y-5">
        {/* Tarjeta de Saldo en Caja */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                Saldo Disponible en Caja
              </span>
              <p className="text-3xl font-black tracking-tight text-white mt-0.5">
                {formatearMoneda(saldoCaja)}
              </p>
              <p className="text-[11px] text-indigo-200/80 mt-1">
                Fondo disponible para próximas compras
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Sección de los 2 BOTONES PRINCIPALES */}
        <div className="space-y-3.5 my-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
            ¿Qué deseas registrar ahora?
          </p>

          {/* BOTÓN 1: GANAR (RECAUDACIÓN) */}
          <button
            onClick={onAbrirGanar}
            className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-5 rounded-3xl shadow-md shadow-emerald-200/50 hover:shadow-lg hover:shadow-emerald-300/50 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-emerald-400/30"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <TrendingUp className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight block">
                  GANAR
                </span>
                <span className="text-xs text-emerald-100 font-medium">
                  Registrar recaudación retirada
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* BOTÓN 2: COMPRAR (MERCADERÍA) */}
          <button
            onClick={onAbrirComprar}
            className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white p-5 rounded-3xl shadow-md shadow-amber-200/50 hover:shadow-lg hover:shadow-amber-300/50 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-amber-400/30"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <ShoppingBag className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight block">
                  COMPRAR
                </span>
                <span className="text-xs text-amber-100 font-medium">
                  Registrar compra de productos
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Acceso Rápido a Cierre y Movimientos Recientes */}
        <div className="space-y-3 pt-2">
          {/* Botón rápido a Reporte de Cierre */}
          <button
            onClick={onIrACierre}
            className="w-full py-2.5 px-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              Generar Cierre Mensual para WhatsApp
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Últimos registros */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Movimientos Recientes
              </span>
              <button
                onClick={onIngresarSistema}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Ver todos ({movimientos.length})
              </button>
            </div>

            {ultimosMovimientos.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2">
                No hay movimientos registrados. Toca GANAR o COMPRAR para registrar el primero.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {ultimosMovimientos.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onVerDetalle(m)}
                    className="py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-1 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800 truncate max-w-[190px]">
                        {m.descripcion || m.codigo}
                      </p>
                      <p className="text-[10px] text-slate-400">{m.fecha} • {m.tipo}</p>
                    </div>
                    <span
                      className={`font-black ${
                        m.tipo === 'GANAR' ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {m.tipo === 'GANAR'
                        ? `+${formatearMoneda(m.monto_ganado || 0)}`
                        : formatearMoneda(m.total_gastado || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="text-center py-3 text-[11px] text-slate-400 border-t border-slate-200/60 bg-white">
        Máquina Expendedora • Colegio • Conectado a Supabase
      </footer>
    </div>
  )
}

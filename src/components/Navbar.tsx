import React from 'react'
import {
  Coins,
  LayoutDashboard,
  ReceiptText,
  Users,
  Settings,
  FileSpreadsheet,
  Wallet,
  RefreshCw,
  PlusCircle,
  Cloud,
  CloudOff,
} from 'lucide-react'
import { formatearMoneda } from '../utils/calculations'

interface NavbarProps {
  vistaActual: 'dashboard' | 'movimientos' | 'participantes' | 'config' | 'cierre'
  setVistaActual: (v: 'dashboard' | 'movimientos' | 'participantes' | 'config' | 'cierre') => void
  saldoCaja: number
  conectadoSupabase: boolean
  onNuevoMovimiento: () => void
  onReset: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  vistaActual,
  setVistaActual,
  saldoCaja,
  conectadoSupabase,
  onNuevoMovimiento,
  onReset,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'movimientos', label: 'Movimientos', icon: ReceiptText },
    { id: 'cierre', label: 'Cierre & Reportes', icon: FileSpreadsheet },
    { id: 'participantes', label: 'Participantes', icon: Users },
    { id: 'config', label: 'Config. Reparto', icon: Settings },
  ] as const

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  Finanzas Vending
                </span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200/60">
                  Colegio
                </span>
                {conectadoSupabase ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200"
                    title="Conectado y sincronizado con Supabase"
                  >
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    Supabase
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full"
                    title="Operando en almacenamiento local"
                  >
                    <CloudOff className="w-3 h-3 text-slate-400" />
                    Modo Local
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Control de compras, recaudaciones y utilidades
              </p>
            </div>
          </div>

          {/* Saldo de Caja y Acciones Rápidas */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl shadow-xs">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  Saldo en Caja
                </p>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-800">
                  {formatearMoneda(saldoCaja)}
                </p>
              </div>
            </div>

            <button
              onClick={onNuevoMovimiento}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo</span> Movimiento
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto space-x-1 sm:space-x-4 border-t border-slate-100 py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const activo = vistaActual === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setVistaActual(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activo
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${activo ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            )
          })}

          <div className="ml-auto pl-2 flex items-center">
            <button
              onClick={onReset}
              title="Restaurar datos de ejemplo"
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

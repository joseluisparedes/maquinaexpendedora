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
  ArrowLeft,
  Camera,
  LogOut,
  Bell,
  Sparkles,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import type { CicloMaquina, Participante, PermisosRol } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface NavbarProps {
  vistaActual: 'dashboard' | 'movimientos' | 'ciclos' | 'participantes' | 'config' | 'cierre'
  setVistaActual: (v: 'dashboard' | 'movimientos' | 'ciclos' | 'participantes' | 'config' | 'cierre') => void
  saldoCaja: number
  conectadoSupabase: boolean
  usuarioActual: Participante
  permisos: PermisosRol
  cicloActivo?: CicloMaquina | null
  onNuevoMovimiento: () => void
  onAbrirFotoMaquina: () => void
  onAbrirDetalleCaja?: () => void
  cantidadAportesPendientes?: number
  montoAportesPendientes?: number
  onAbrirDevolucionAportes?: () => void
  onReset: () => void
  onVolverInicio: () => void
  onCerrarSesion: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  vistaActual,
  setVistaActual,
  saldoCaja,
  conectadoSupabase,
  usuarioActual,
  permisos,
  cicloActivo,
  onNuevoMovimiento,
  onAbrirFotoMaquina,
  onAbrirDetalleCaja,
  cantidadAportesPendientes = 0,
  montoAportesPendientes = 0,
  onAbrirDevolucionAportes,
  onReset,
  onVolverInicio,
  onCerrarSesion,
}) => {
  // Solo se muestran las pestañas a las que el rol tiene permiso explícito
  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: permisos.puede_ver_dashboard,
    },
    {
      id: 'movimientos' as const,
      label: 'Movimientos',
      icon: ReceiptText,
      visible: permisos.puede_ver_movimientos,
    },
    {
      id: 'ciclos' as const,
      label: 'Ciclos de Máquina',
      icon: Sparkles,
      visible: permisos.puede_ver_movimientos || permisos.puede_foto_maquina,
    },
    {
      id: 'cierre' as const,
      label: 'Cierre & Reportes',
      icon: FileSpreadsheet,
      visible: permisos.puede_ver_cierre,
    },
    {
      id: 'participantes' as const,
      label: 'Personas & Roles',
      icon: Users,
      visible: permisos.puede_gestionar_usuarios, // Solo Administrador
    },
    {
      id: 'config' as const,
      label: 'Configuración General',
      icon: Settings,
      visible: permisos.puede_config_reparto, // Solo Administrador
    },
  ].filter((t) => t.visible)

  const mostrarFinanzas = permisos.puede_ganar || permisos.puede_comprar || permisos.puede_ver_dashboard

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca con botón Volver al Inicio Rápido */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onVolverInicio}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Volver a la pantalla de botones rápidos"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                  Finanzas Vending
                </span>
                {conectadoSupabase ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200"
                    title="Conectado y sincronizado con Supabase"
                  >
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    <span className="hidden sm:inline">Supabase</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full"
                    title="Operando en almacenamiento local"
                  >
                    <CloudOff className="w-3 h-3 text-slate-400" />
                    <span className="hidden sm:inline">Local</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Saldo de Caja, Acciones Rápidas y Usuario */}
          <div className="flex items-center gap-2 sm:gap-3">
            {mostrarFinanzas && (
              <button
                type="button"
                onClick={onAbrirDetalleCaja}
                className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/90 active:scale-95 border border-emerald-200/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-xs transition-all cursor-pointer group"
                title="Haz clic para ver el detalle de la caja y sus movimientos"
              >
                <Wallet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">
                    Caja
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-emerald-800">
                    {formatearMoneda(saldoCaja)}
                  </p>
                </div>
              </button>
            )}

            {/* Campanita de Notificación de Aportes Pendientes */}
            {mostrarFinanzas && (
              <button
                type="button"
                onClick={onAbrirDevolucionAportes}
                className={`relative p-2 rounded-xl transition-all cursor-pointer group active:scale-95 ${
                  cantidadAportesPendientes > 0
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                }`}
                title={
                  cantidadAportesPendientes > 0
                    ? `Tienes ${cantidadAportesPendientes} aporte(s) pendiente(s) por devolver (+${formatearMoneda(montoAportesPendientes)})`
                    : 'Sin aportes pendientes por devolver'
                }
              >
                <Bell className={`w-5 h-5 ${cantidadAportesPendientes > 0 ? 'text-amber-700 animate-wiggle' : ''}`} />
                {cantidadAportesPendientes > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs">
                    {cantidadAportesPendientes}
                  </span>
                )}
              </button>
            )}

            {/* Botón Foto Máquina solo para operador */}
            {permisos.puede_foto_maquina && !permisos.puede_ganar && !permisos.puede_comprar && (
              <button
                onClick={onAbrirFotoMaquina}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                title="Tomar o subir foto de la máquina"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden md:inline">Foto Máquina</span>
              </button>
            )}

            {/* Botón Nuevo Movimiento contextual según el ciclo activo */}
            {(permisos.puede_ganar || permisos.puede_comprar) && (
              <button
                onClick={onNuevoMovimiento}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95 ${
                  cicloActivo?.tipo === 'ABASTECIMIENTO'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                    : cicloActivo?.tipo === 'GANANCIA'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
                title={
                  cicloActivo
                    ? `Registrar movimiento para ciclo ${cicloActivo.codigo}`
                    : 'Registrar movimiento (requiere ciclo activo)'
                }
              >
                {cicloActivo?.tipo === 'ABASTECIMIENTO' ? (
                  <>
                    <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                    <span className="hidden sm:inline">Comprar</span>
                  </>
                ) : cicloActivo?.tipo === 'GANANCIA' ? (
                  <>
                    <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                    <span className="hidden sm:inline">Ganar</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo</span>
                  </>
                )}
              </button>
            )}

            {/* Badge de Usuario y Botón de Salir */}
            <div className="flex items-center gap-1 pl-1 sm:pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right text-xs">
                <p className="font-bold text-slate-800 leading-tight">{usuarioActual.nombre}</p>
                <p className="text-[10px] text-slate-400 font-medium">{usuarioActual.rol}</p>
              </div>

              <button
                onClick={onCerrarSesion}
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                title={`Cerrar sesión de ${usuarioActual.nombre}`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (filtradas por permisos de rol) */}
        {tabs.length > 0 && (
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

            {/* Botón vaciar movimientos solo para Administrador */}
            {permisos.puede_gestionar_usuarios && (
              <div className="ml-auto pl-2 flex items-center">
                <button
                  onClick={onReset}
                  title="Vaciar movimientos (Solo Admin)"
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

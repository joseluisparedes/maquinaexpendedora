import React, { useState } from 'react'
import {
  LayoutDashboard,
  ReceiptText,
  Sparkles,
  FileSpreadsheet,
  Users,
  Settings,
  ArrowLeft,
  X,
  PlusCircle,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import type { CicloMaquina, PermisosRol } from '../types'

interface MobileBottomNavProps {
  vistaActual: 'dashboard' | 'movimientos' | 'ciclos' | 'participantes' | 'config' | 'cierre'
  setVistaActual: (v: 'dashboard' | 'movimientos' | 'ciclos' | 'participantes' | 'config' | 'cierre') => void
  permisos: PermisosRol
  cicloActivo?: CicloMaquina | null
  onNuevoMovimiento?: () => void
  onVolverInicio: () => void
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  vistaActual,
  setVistaActual,
  permisos,
  cicloActivo,
  onNuevoMovimiento,
  onVolverInicio,
}) => {
  const [menuMasAbierto, setMenuMasAbierto] = useState(false)

  const items = [
    {
      id: 'dashboard' as const,
      label: 'Inicio',
      icon: LayoutDashboard,
      visible: permisos.puede_ver_dashboard,
    },
    {
      id: 'ciclos' as const,
      label: 'Ciclos',
      icon: Sparkles,
      visible: permisos.puede_ver_movimientos || permisos.puede_foto_maquina,
    },
    {
      id: 'movimientos' as const,
      label: 'Movimientos',
      icon: ReceiptText,
      visible: permisos.puede_ver_movimientos,
    },
    {
      id: 'cierre' as const,
      label: 'Cierre',
      icon: FileSpreadsheet,
      visible: permisos.puede_ver_cierre,
    },
  ].filter((i) => i.visible)

  const tieneMasOpciones =
    permisos.puede_gestionar_usuarios || permisos.puede_config_reparto

  return (
    <>
      {/* Drawer / Menú Bottom Sheet para opciones adicionales de Administrador */}
      {menuMasAbierto && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in md:hidden"
          onClick={() => setMenuMasAbierto(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 space-y-4 pb-safe animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-1" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-black text-slate-900 text-sm tracking-tight">
                Más Opciones del Sistema
              </span>
              <button
                type="button"
                onClick={() => setMenuMasAbierto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {permisos.puede_gestionar_usuarios && (
                <button
                  type="button"
                  onClick={() => {
                    setVistaActual('participantes')
                    setMenuMasAbierto(false)
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all active:scale-95 ${
                    vistaActual === 'participantes'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <Users className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="font-bold text-xs block">Personas & Roles</span>
                    <span className="text-[10px] text-slate-500">Gestión de usuarios y PINs</span>
                  </div>
                </button>
              )}

              {permisos.puede_config_reparto && (
                <button
                  type="button"
                  onClick={() => {
                    setVistaActual('config')
                    setMenuMasAbierto(false)
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all active:scale-95 ${
                    vistaActual === 'config'
                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <Settings className="w-5 h-5 text-purple-600" />
                  <div>
                    <span className="font-bold text-xs block">Configuración</span>
                    <span className="text-[10px] text-slate-500">Repartos y Supabase</span>
                  </div>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setMenuMasAbierto(false)
                onVolverInicio()
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Botones Rápidos (Táctil)</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de Navegación Inferior Fija para Móviles */}
      <nav
        aria-label="Navegación móvil inferior"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 pt-1 pb-safe md:hidden flex items-center justify-around"
      >
        {items.map((item) => {
          const Icon = item.icon
          const activo = vistaActual === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMenuMasAbierto(false)
                setVistaActual(item.id)
              }}
              className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all cursor-pointer active:scale-90 ${
                activo
                  ? 'text-indigo-600 font-black'
                  : 'text-slate-400 hover:text-slate-600 font-semibold'
              }`}
            >
              <div
                className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                  activo ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-4 h-4 ${activo ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          )
        })}

        {/* Botón flotante central contextual de nuevo movimiento si aplica */}
        {onNuevoMovimiento && (permisos.puede_ganar || permisos.puede_comprar) && (
          <button
            type="button"
            onClick={onNuevoMovimiento}
            className={`w-11 h-11 rounded-full text-white shadow-md flex items-center justify-center shrink-0 -mt-4 transition-transform active:scale-90 cursor-pointer ${
              cicloActivo?.tipo === 'ABASTECIMIENTO'
                ? 'bg-amber-600 hover:bg-amber-700 ring-4 ring-amber-100 shadow-amber-300'
                : cicloActivo?.tipo === 'GANANCIA'
                ? 'bg-emerald-600 hover:bg-emerald-700 ring-4 ring-emerald-100 shadow-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-100 shadow-indigo-300'
            }`}
            title="Registrar nuevo movimiento"
          >
            {cicloActivo?.tipo === 'ABASTECIMIENTO' ? (
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
            ) : cicloActivo?.tipo === 'GANANCIA' ? (
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        )}

        {/* Botón Más Opciones (para administradores) o Volver a Inicio Rápido */}
        {tieneMasOpciones ? (
          <button
            type="button"
            onClick={() => setMenuMasAbierto((prev) => !prev)}
            className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all cursor-pointer active:scale-90 ${
              vistaActual === 'participantes' || vistaActual === 'config'
                ? 'text-indigo-600 font-black'
                : 'text-slate-400 hover:text-slate-600 font-semibold'
            }`}
          >
            <div
              className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                vistaActual === 'participantes' || vistaActual === 'config'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-500'
              }`}
            >
              <Settings className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-[10px] tracking-tight">Más</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onVolverInicio}
            className="flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-slate-600 font-semibold rounded-2xl cursor-pointer active:scale-90"
          >
            <div className="w-9 h-7 rounded-xl flex items-center justify-center text-slate-500">
              <ArrowLeft className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-[10px] tracking-tight">Rápido</span>
          </button>
        )}
      </nav>
    </>
  )
}

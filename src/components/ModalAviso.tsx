import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Camera,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'

export interface ModalAvisoData {
  isOpen: boolean
  tipo?: 'info' | 'alerta' | 'exito' | 'error' | 'ciclo_requerido'
  titulo: string
  mensaje: string
  detalle?: string
  accionPrincipal?: {
    texto: string
    onClick: () => void
    icono?: React.ReactNode
  }
  textoBotonCerrar?: string
}

interface ModalAvisoProps {
  data: ModalAvisoData | null
  onClose: () => void
}

export const ModalAviso: React.FC<ModalAvisoProps> = ({ data, onClose }) => {
  if (!data || !data.isOpen) return null

  const {
    tipo = 'info',
    titulo,
    mensaje,
    detalle,
    accionPrincipal,
    textoBotonCerrar = 'Entendido',
  } = data

  const renderIcono = () => {
    switch (tipo) {
      case 'ciclo_requerido':
        return (
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Camera className="w-7 h-7 stroke-[2.3]" />
          </div>
        )
      case 'alerta':
        return (
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <AlertTriangle className="w-7 h-7 stroke-[2.3]" />
          </div>
        )
      case 'error':
        return (
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-7 h-7 stroke-[2.3]" />
          </div>
        )
      case 'exito':
        return (
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-7 h-7 stroke-[2.3]" />
          </div>
        )
      default:
        return (
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Info className="w-7 h-7 stroke-[2.3]" />
          </div>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-7 text-center space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar X en esquina */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icono central */}
        <div className="flex justify-center pt-2">{renderIcono()}</div>

        {/* Título y Mensaje */}
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
            {titulo}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            {mensaje}
          </p>
        </div>

        {/* Detalle o Explicación de Pasos si es ciclo requerido */}
        {tipo === 'ciclo_requerido' ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left space-y-2 text-xs">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Flujo Obligatorio de Auditoría:
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="text-slate-700 font-medium text-[11px]">
                  <strong>Foto Antes:</strong> La operadora audita la máquina y apertura la ruta.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="text-slate-700 font-medium text-[11px]">
                  <strong>Acción:</strong> Los socios compran mercadería o recaudan ganancia.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="text-slate-700 font-medium text-[11px]">
                  <strong>Cierre:</strong> Foto con vitrina llena o reparto automático.
                </span>
              </div>
            </div>
          </div>
        ) : detalle ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-600 text-left">
            {detalle}
          </div>
        ) : null}

        {/* Botones de Acción */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          {accionPrincipal && (
            <button
              type="button"
              onClick={() => {
                onClose()
                accionPrincipal.onClick()
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-indigo-200/50 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              {accionPrincipal.icono || <ArrowRight className="w-4 h-4" />}
              <span>{accionPrincipal.texto}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer active:scale-95 ${
              accionPrincipal
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 sm:w-auto w-full'
                : 'w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md'
            }`}
          >
            {textoBotonCerrar}
          </button>
        </div>
      </div>
    </div>
  )
}

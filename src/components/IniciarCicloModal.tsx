import React, { useState, useRef } from 'react'
import {
  X,
  Camera,
  Upload,
  ShoppingBag,
  TrendingUp,
  Loader2,
  Check,
  FileText,
  Trash2,
  Eye,
  Sparkles,
} from 'lucide-react'
import type { TipoCiclo, Participante } from '../types'
import { comprimirImagen } from '../utils/imageHelper'

interface IniciarCicloModalProps {
  isOpen: boolean
  onClose: () => void
  usuarioActual: Participante
  onIniciarCiclo: (datos: {
    tipo: TipoCiclo
    fotoAntes: string
    observaciones?: string
  }) => Promise<void>
}

export const IniciarCicloModal: React.FC<IniciarCicloModalProps> = ({
  isOpen,
  onClose,
  usuarioActual,
  onIniciarCiclo,
}) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoCiclo>('ABASTECIMIENTO')
  const [fotoAntes, setFotoAntes] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [procesandoFoto, setProcesandoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [fotoZoom, setFotoZoom] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcesandoFoto(true)
    try {
      const dataUrl = await comprimirImagen(file)
      setFotoAntes(dataUrl)
    } catch {
      alert('Error procesando la imagen. Intenta con otra foto.')
    } finally {
      setProcesandoFoto(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fotoAntes) {
      alert('Es obligatorio tomar la foto ANTES para iniciar cualquier ciclo de máquina.')
      return
    }

    setGuardando(true)
    try {
      await onIniciarCiclo({
        tipo: tipoSeleccionado,
        fotoAntes,
        observaciones: observaciones.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      alert('Error al iniciar el ciclo: ' + (err?.message || 'Error inesperado'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Iniciar Ciclo de Máquina
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Iniciado por {usuarioActual.nombre} • Foto ANTES obligatoria
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          
          {/* PASO 1: FOTO ANTES (OBLIGATORIA) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                Foto ANTES de tocar la máquina (Obligatoria):
              </label>
              {fotoAntes && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Foto lista
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Registra cómo se encuentra la vitrina antes de abrir o retirar dinero.
            </p>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />

            {!fotoAntes ? (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={procesandoFoto}
                  className="py-4 px-3 bg-gradient-to-br from-indigo-50 to-indigo-100/80 hover:from-indigo-100 hover:to-indigo-200 text-indigo-900 border border-indigo-200 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-6 h-6 text-indigo-600 stroke-[2.3]" />
                  <span>Tomar Foto con Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={procesandoFoto}
                  className="py-4 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Upload className="w-6 h-6 text-slate-600 stroke-[2.3]" />
                  <span>Subir desde Galería</span>
                </button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-200 bg-slate-900 aspect-video flex items-center justify-center group">
                <img
                  src={fotoAntes}
                  alt="Foto Antes de la máquina"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFotoZoom(fotoAntes)}
                    className="p-2 bg-white text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-100"
                  >
                    <Eye className="w-4 h-4" /> Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => setFotoAntes(null)}
                    className="p-2 bg-rose-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-rose-700"
                  >
                    <Trash2 className="w-4 h-4" /> Cambiar foto
                  </button>
                </div>
              </div>
            )}

            {procesandoFoto && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-indigo-600 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Optimizando fotografía...</span>
              </div>
            )}
          </div>

          {/* PASO 2: ELEGIR TIPO DE RUTA */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              ¿Qué ruta operativa se ejecutará en este ciclo?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opción A: Ruta de Abastecimiento */}
              <div
                onClick={() => setTipoSeleccionado('ABASTECIMIENTO')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  tipoSeleccionado === 'ABASTECIMIENTO'
                    ? 'bg-amber-50/80 border-amber-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tipoSeleccionado === 'ABASTECIMIENTO'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Abastecimiento</h4>
                    <span className="text-[10px] text-amber-700 font-bold">Mercadería</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hay espirales vacíos. Habilita a los socios para comprar y termina con la foto de la vitrina llena.
                </p>
              </div>

              {/* Opción B: Ruta de Ganancia */}
              <div
                onClick={() => setTipoSeleccionado('GANANCIA')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  tipoSeleccionado === 'GANANCIA'
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tipoSeleccionado === 'GANANCIA'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Ganancia</h4>
                    <span className="text-[10px] text-emerald-700 font-bold">Recaudación</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Se retira el dinero en efectivo. Habilita el registro del monto y el reparto automático entre todos.
                </p>
              </div>
            </div>
          </div>

          {/* PASO 3: OBSERVACIONES (OPCIONAL) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observaciones iniciales (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Espirales 3 y 4 de galletas vacíos; monedero con muchas monedas"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Pie del formulario */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando || !fotoAntes || procesandoFoto}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando ciclo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Iniciar Ciclo en Máquina</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal de Zoom Foto */}
        {fotoZoom && (
          <div
            onClick={() => setFotoZoom(null)}
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
          >
            <div className="relative max-w-xl max-h-[90vh]">
              <img
                src={fotoZoom}
                alt="Foto Antes"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

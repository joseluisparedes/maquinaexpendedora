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
  AlertCircle,
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
    fotosAntes?: string[]
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
  const [fotosAntes, setFotosAntes] = useState<string[]>([])
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0)
  const [observaciones, setObservaciones] = useState('')
  const [procesandoFoto, setProcesandoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null)
  const [fotoZoom, setFotoZoom] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleArchivosSeleccionados = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setErrorValidacion(null)
    setProcesandoFoto(true)
    try {
      const nuevasFotos: string[] = []
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await comprimirImagen(files[i])
        nuevasFotos.push(dataUrl)
      }
      setFotosAntes((prev) => {
        const actualizadas = [...prev, ...nuevasFotos]
        return actualizadas
      })
      // Ajustar foto activa al primer nuevo elemento
      setFotoActivaIndex(fotosAntes.length)
    } catch {
      setErrorValidacion('Error procesando las imágenes. Intenta con otra foto.')
    } finally {
      setProcesandoFoto(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleEliminarFoto = (idxAEliminar: number) => {
    setFotosAntes((prev) => {
      const nuevas = prev.filter((_, idx) => idx !== idxAEliminar)
      if (fotoActivaIndex >= nuevas.length) {
        setFotoActivaIndex(Math.max(0, nuevas.length - 1))
      }
      return nuevas
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorValidacion(null)
    if (fotosAntes.length === 0) {
      setErrorValidacion('Es obligatorio tomar al menos una foto ANTES para iniciar cualquier ciclo de máquina.')
      return
    }

    setGuardando(true)
    try {
      await onIniciarCiclo({
        tipo: tipoSeleccionado,
        fotoAntes: fotosAntes[0],
        fotosAntes: fotosAntes,
        observaciones: observaciones.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setErrorValidacion('Error al iniciar el ciclo: ' + (err?.message || 'Error inesperado'))
    } finally {
      setGuardando(false)
    }
  }

  const fotoPrincipal = fotosAntes[fotoActivaIndex] || fotosAntes[0]

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
                Iniciado por {usuarioActual.nombre} • Auditoría fotográfica inicial
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
          
          {errorValidacion && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* PASO 1: FOTO(S) ANTES (OBLIGATORIA - SOPORTA MÚLTIPLES) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                Foto(s) ANTES de tocar la máquina:
              </label>
              {fotosAntes.length > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> {fotosAntes.length} foto{fotosAntes.length > 1 ? 's' : ''} lista{fotosAntes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Registra el estado de la vitrina, espirales y monedas antes de abrir. Puedes agregar más de una foto.
            </p>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleArchivosSeleccionados}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleArchivosSeleccionados}
              className="hidden"
            />

            {fotosAntes.length === 0 ? (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={procesandoFoto}
                  className="py-4 px-3 bg-gradient-to-br from-indigo-50 to-indigo-100/80 hover:from-indigo-100 hover:to-indigo-200 text-indigo-900 border border-indigo-200 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-6 h-6 text-indigo-600 stroke-[2.3]" />
                  <span>Tomar con Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={procesandoFoto}
                  className="py-4 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Upload className="w-6 h-6 text-slate-600 stroke-[2.3]" />
                  <span>Subir de Galería (1 o varias)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Visualizador de la foto activa */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-200 bg-slate-900 aspect-video flex items-center justify-center group">
                  <img
                    src={fotoPrincipal}
                    alt={`Foto Antes ${fotoActivaIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <span>Foto {fotoActivaIndex + 1} de {fotosAntes.length}</span>
                    {fotoActivaIndex === 0 && <span className="text-amber-400 font-extrabold">• Portada</span>}
                  </div>
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFotoZoom(fotoPrincipal)}
                      className="p-2 bg-white text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4" /> Ver ampliada
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarFoto(fotoActivaIndex)}
                      className="p-2 bg-rose-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-rose-700"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </div>

                {/* Tira de Miniaturas y Botones de Agregar Más */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                  {fotosAntes.map((foto, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFotoActivaIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                        idx === fotoActivaIndex
                          ? 'border-indigo-600 ring-2 ring-indigo-300 scale-105'
                          : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={foto} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] px-1 font-bold rounded-tl">
                        {idx + 1}
                      </span>
                    </div>
                  ))}

                  {/* Botón rápido para tomar otra con cámara */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={procesandoFoto}
                    className="w-14 h-14 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/60 hover:bg-indigo-100/60 flex flex-col items-center justify-center text-indigo-700 shrink-0 cursor-pointer transition-colors"
                    title="Tomar otra foto con cámara"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[9px] font-bold mt-0.5">+Cámara</span>
                  </button>

                  {/* Botón rápido para subir más de galería */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={procesandoFoto}
                    className="w-14 h-14 rounded-xl border border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-700 shrink-0 cursor-pointer transition-colors"
                    title="Subir más de galería"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[9px] font-bold mt-0.5">+Galería</span>
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
              disabled={guardando || fotosAntes.length === 0 || procesandoFoto}
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

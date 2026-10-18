import React, { useState, useRef } from 'react'
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  Loader2,
  Check,
  FileText,
  ShoppingBag,
  Eye,
  Trash2,
} from 'lucide-react'
import type { CicloMaquina, Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'
import { comprimirImagen } from '../utils/imageHelper'

interface CerrarAbastecimientoModalProps {
  isOpen: boolean
  onClose: () => void
  ciclo: CicloMaquina | null
  movimientoCompra?: Movimiento
  usuarioActual: Participante
  onCerrarAbastecimiento: (datos: {
    fotoDespues: string
    observaciones?: string
  }) => Promise<void>
}

export const CerrarAbastecimientoModal: React.FC<CerrarAbastecimientoModalProps> = ({
  isOpen,
  onClose,
  ciclo,
  movimientoCompra,
  usuarioActual,
  onCerrarAbastecimiento,
}) => {
  const [fotoDespues, setFotoDespues] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [procesandoFoto, setProcesandoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [fotoZoom, setFotoZoom] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !ciclo) return null

  const handleArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcesandoFoto(true)
    try {
      const dataUrl = await comprimirImagen(file)
      setFotoDespues(dataUrl)
    } catch {
      alert('Error procesando la imagen.')
    } finally {
      setProcesandoFoto(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fotoDespues) {
      alert('Debes tomar o subir la foto de la máquina abastecida para cerrar el ciclo.')
      return
    }

    setGuardando(true)
    try {
      await onCerrarAbastecimiento({
        fotoDespues,
        observaciones: observaciones.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      alert('Error cerrando el ciclo: ' + (err?.message || 'Error inesperado'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Cerrar Ciclo de Abastecimiento
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Registrado por {usuarioActual.nombre} • Vitrina llena y auditada
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Tarjeta Informativa de la Compra vinculada */}
          {movimientoCompra && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5 text-xs text-amber-950">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                  Mercadería comprada para este ciclo:
                </span>
                <span className="font-mono text-amber-900">{movimientoCompra.codigo}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-800">
                <span>Gasto Total Real:</span>
                <span className="font-black text-slate-900 text-xs">
                  {formatearMoneda(movimientoCompra.total_gastado || 0)}
                </span>
              </div>
              {movimientoCompra.detalle_productos && movimientoCompra.detalle_productos.length > 0 && (
                <p className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60">
                  {movimientoCompra.detalle_productos.length} producto(s) cargados a los resortes.
                </p>
              )}
            </div>
          )}

          {/* FOTO DESPUÉS (OBLIGATORIA) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                Foto DESPUÉS de abastecer (Obligatoria):
              </label>
              {fotoDespues && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Foto lista
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Muestra cómo quedó la máquina completamente abastecida y ordenada.
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

            {!fotoDespues ? (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={procesandoFoto}
                  className="py-4 px-3 bg-gradient-to-br from-emerald-50 to-teal-100/80 hover:from-emerald-100 hover:to-teal-200 text-emerald-950 border border-emerald-300 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-6 h-6 text-emerald-700 stroke-[2.3]" />
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
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 bg-slate-900 aspect-video flex items-center justify-center group">
                <img
                  src={fotoDespues}
                  alt="Foto Después de la máquina"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFotoZoom(fotoDespues)}
                    className="p-2 bg-white text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-100"
                  >
                    <Eye className="w-4 h-4" /> Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => setFotoDespues(null)}
                    className="p-2 bg-rose-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-rose-700"
                  >
                    <Trash2 className="w-4 h-4" /> Cambiar foto
                  </button>
                </div>
              </div>
            )}

            {procesandoFoto && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-600 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Optimizando fotografía...</span>
              </div>
            )}
          </div>

          {/* Observaciones de Cierre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observaciones de cierre (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Todos los espirales llenos, máquina limpia y operativa"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
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
              disabled={guardando || !fotoDespues || procesandoFoto}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cerrando ciclo...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Cerrar Ciclo</span>
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
                alt="Foto Después"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

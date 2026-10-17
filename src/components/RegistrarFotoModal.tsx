import React, { useState, useRef } from 'react'
import {
  Camera,
  X,
  Upload,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import type { FotoMaquina, Participante } from '../types'

interface RegistrarFotoModalProps {
  isOpen: boolean
  onClose: () => void
  usuarioActual: Participante
  onFotoGuardada: (foto: FotoMaquina) => void
}

const OBSERVACIONES_RAPIDAS = [
  'Máquina abastecida y limpia',
  'Faltaban gaseosas y jugos',
  'Monedero y billetero operativos',
  'Revisión preventiva antes de abastecer',
  'Dejando productos con fecha vigente',
]

export const RegistrarFotoModal: React.FC<RegistrarFotoModalProps> = ({
  isOpen,
  onClose,
  usuarioActual,
  onFotoGuardada,
}) => {
  const hoyStr = new Date().toISOString().slice(0, 10)
  const horaActualStr = new Date().toTimeString().slice(0, 5)

  const [tipo, setTipo] = useState<'ANTES' | 'DESPUES'>('DESPUES')
  const [fecha, setFecha] = useState(hoyStr)
  const [hora, setHora] = useState(horaActualStr)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [cargandoImagen, setCargandoImagen] = useState(false)
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null)

  const inputCamaraRef = useRef<HTMLInputElement>(null)
  const inputGaleriaRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleProcesarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorValidacion('Por favor selecciona un archivo de imagen válido (JPG, PNG).')
      return
    }

    setCargandoImagen(true)
    setErrorValidacion(null)

    // Redimensionar / comprimir imagen en canvas para que sea liviana y rápida de guardar
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1280
        const MAX_HEIGHT = 1280
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const base64Comprimido = canvas.toDataURL('image/jpeg', 0.82)
          setFotoUrl(base64Comprimido)
        } else {
          setFotoUrl(event.target?.result as string)
        }
        setCargandoImagen(false)
      }
      img.onerror = () => {
        setErrorValidacion('No se pudo procesar la imagen.')
        setCargandoImagen(false)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fotoUrl) {
      setErrorValidacion('Debes tomar o cargar una foto de la máquina.')
      return
    }

    const nuevaFoto: FotoMaquina = {
      id: 'foto-' + Date.now(),
      fecha,
      hora,
      tipo,
      foto_url: fotoUrl,
      observaciones: observaciones.trim(),
      registrado_por: usuarioActual.id,
      creado_el: new Date().toISOString(),
    }

    onFotoGuardada(nuevaFoto)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="px-5 py-4 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Foto de la Máquina
              </h2>
              <p className="text-xs text-teal-100 font-medium">
                Registrado por: {usuarioActual.nombre} ({usuarioActual.rol})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Selector de Momento: ANTES o DESPUÉS del abasto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Estado / Momento de la foto:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('ANTES')}
                className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  tipo === 'ANTES'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">📦</span>
                <span>Antes del abasto</span>
                <span className="text-[10px] font-normal opacity-90">
                  (Cómo se encontró)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('DESPUES')}
                className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  tipo === 'DESPUES'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">✨</span>
                <span>Después del abasto</span>
                <span className="text-[10px] font-normal opacity-90">
                  (Cómo se está dejando)
                </span>
              </button>
            </div>
          </div>

          {/* Área de Captura de Foto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Fotografía de la máquina:
            </label>

            {/* Inputs ocultos de archivo */}
            <input
              type="file"
              ref={inputCamaraRef}
              accept="image/*"
              capture="environment"
              onChange={handleProcesarArchivo}
              className="hidden"
            />
            <input
              type="file"
              ref={inputGaleriaRef}
              accept="image/*"
              onChange={handleProcesarArchivo}
              className="hidden"
            />

            {!fotoUrl ? (
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-5 text-center bg-slate-50/70 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-cyan-100 text-cyan-700 mx-auto flex items-center justify-center">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {cargandoImagen ? 'Procesando imagen...' : 'Toma una foto con tu celular'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Muestra claramente los pisos de productos y la máquina
                  </p>
                </div>

                <div className="flex gap-2 justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => inputCamaraRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    Abrir Cámara
                  </button>

                  <button
                    type="button"
                    onClick={() => inputGaleriaRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Galería
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black group">
                <img
                  src={fotoUrl}
                  alt="Foto máquina"
                  className="w-full h-56 object-contain bg-slate-900"
                />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => inputCamaraRef.current?.click()}
                    className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                    title="Tomar otra foto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-600" />
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFotoUrl(null)}
                    className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold shadow-md cursor-pointer"
                    title="Eliminar foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold">
                  {tipo === 'ANTES' ? '📦 Antes del abasto' : '✨ Después del abasto'}
                </div>
              </div>
            )}
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                Fecha:
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                Hora:
              </label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          {/* Observaciones y Sugerencias Rápidas */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase">
                Observaciones / Novedades:
              </label>
              <span className="text-[10px] text-slate-400">Opcional</span>
            </div>
            <textarea
              rows={2}
              placeholder="Ej: Se completaron las 4 filas de galletas y 2 de bebidas..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            />

            {/* Chips de sugerencias rápidas */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {OBSERVACIONES_RAPIDAS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() =>
                    setObservaciones((prev) => (prev ? `${prev}. ${sug}` : sug))
                  }
                  className="text-[10px] bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-600 px-2 py-1 rounded-lg border border-slate-200/60 cursor-pointer font-medium transition-colors"
                >
                  +{sug}
                </button>
              ))}
            </div>
          </div>

          {errorValidacion && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!fotoUrl}
              className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 disabled:opacity-40 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              Guardar Foto de la Máquina
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Save,
  AlertTriangle,
  Camera,
  Upload,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface EditarMovimientoModalProps {
  movimiento: Movimiento | null
  isOpen: boolean
  onClose: () => void
  participantes: Participante[]
  onGuardarEdicion: (movimientoActualizado: Movimiento) => void
}

export const EditarMovimientoModal: React.FC<EditarMovimientoModalProps> = ({
  movimiento,
  isOpen,
  onClose,
  participantes,
  onGuardarEdicion,
}) => {
  const [fecha, setFecha] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [registradoPor, setRegistradoPor] = useState('')

  // Campos para GANAR
  const [montoGanado, setMontoGanado] = useState<number | ''>('')
  const [periodoDesde, setPeriodoDesde] = useState('')
  const [periodoHasta, setPeriodoHasta] = useState('')

  // Campos para COMPRAR
  const [proveedor, setProveedor] = useState('')
  const [montoAsignado, setMontoAsignado] = useState<number | ''>('')
  const [montoAdicional, setMontoAdicional] = useState<number | ''>('')
  const [quienAporto, setQuienAporto] = useState('')
  const [montoSobrante, setMontoSobrante] = useState<number | ''>('')
  const [destinoSobrante, setDestinoSobrante] = useState<'CAJA' | 'REPARTO' | 'NINGUNO'>('CAJA')
  const [comprobantes, setComprobantes] = useState<string[]>([])
  const [cargandoFoto, setCargandoFoto] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (movimiento) {
      setFecha(movimiento.fecha)
      setDescripcion(movimiento.descripcion || '')
      setRegistradoPor(movimiento.registrado_por)

      if (movimiento.tipo === 'GANAR') {
        setMontoGanado(movimiento.monto_ganado ?? '')
        setPeriodoDesde(movimiento.periodo_desde || '')
        setPeriodoHasta(movimiento.periodo_hasta || '')
      } else {
        setProveedor(movimiento.proveedor || '')
        setMontoAsignado(movimiento.monto_asignado ?? 0)
        setMontoAdicional(movimiento.monto_adicional ?? 0)
        setQuienAporto(movimiento.quien_aporto_adicional || '')
        setMontoSobrante(movimiento.monto_sobrante ?? 0)
        setDestinoSobrante(movimiento.destino_sobrante || 'CAJA')

        const fotos =
          movimiento.comprobantes && movimiento.comprobantes.length > 0
            ? [...movimiento.comprobantes]
            : movimiento.comprobante_url
            ? [movimiento.comprobante_url]
            : []
        setComprobantes(fotos)
      }
    }
  }, [movimiento, isOpen])

  if (!isOpen || !movimiento) return null

  const esGanar = movimiento.tipo === 'GANAR'
  const socios = participantes.filter((p) => p.es_socio)

  // Cálculo de total gastado para COMPRAR
  const valorAsignado = typeof montoAsignado === 'number' ? montoAsignado : 0
  const valorAdicional = typeof montoAdicional === 'number' ? montoAdicional : 0
  const valorSobrante = typeof montoSobrante === 'number' ? montoSobrante : 0
  const totalGastadoCalculado = Math.max(0, Number((valorAsignado + valorAdicional - valorSobrante).toFixed(2)))

  const handleProcesarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCargandoFoto(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
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
          const base64 = canvas.toDataURL('image/jpeg', 0.8)
          setComprobantes((prev) => [...prev, base64])
        }
        setCargandoFoto(false)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleEliminarFoto = (idx: number) => {
    setComprobantes((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (esGanar) {
      const ganado = typeof montoGanado === 'number' ? montoGanado : 0
      if (ganado <= 0) {
        alert('Por favor ingresa un monto válido mayor a 0.')
        return
      }

      const actualizado: Movimiento = {
        ...movimiento,
        fecha,
        descripcion: descripcion.trim(),
        registrado_por: registradoPor,
        monto_ganado: ganado,
        periodo_desde: periodoDesde || undefined,
        periodo_hasta: periodoHasta || undefined,
      }

      onGuardarEdicion(actualizado)
      onClose()
    } else {
      if (valorAsignado <= 0 && valorAdicional <= 0) {
        alert('Debes ingresar al menos el dinero asignado de caja o el dinero aportado extra.')
        return
      }

      if (valorAdicional > 0 && !quienAporto) {
        alert('Por favor selecciona quién aportó el dinero extra.')
        return
      }

      const actualizado: Movimiento = {
        ...movimiento,
        fecha,
        descripcion: descripcion.trim(),
        registrado_por: registradoPor,
        proveedor: proveedor.trim(),
        monto_asignado: valorAsignado,
        monto_adicional: valorAdicional,
        quien_aporto_adicional: valorAdicional > 0 ? quienAporto : undefined,
        monto_sobrante: valorSobrante,
        destino_sobrante: valorSobrante > 0 ? destinoSobrante : 'NINGUNO',
        total_gastado: totalGastadoCalculado,
        comprobantes,
      }

      onGuardarEdicion(actualizado)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              {esGanar ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Editar Movimiento {movimiento.codigo}
              </h3>
              <p className="text-[11px] text-indigo-200">
                Tipo: {esGanar ? 'Recaudación (Ganar)' : 'Compra de Mercadería (Comprar)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Fecha y Registrado Por */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Fecha:
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                Registrado por:
              </label>
              <select
                value={registradoPor}
                onChange={(e) => setRegistradoPor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
              >
                {participantes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.rol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CAMPOS ESPECÍFICOS DE GANAR */}
          {esGanar && (
            <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
              <div>
                <label className="block font-bold text-emerald-950 uppercase tracking-wider mb-1 text-[11px]">
                  Monto Recaudado (S/):
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={montoGanado}
                  onChange={(e) =>
                    setMontoGanado(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-900 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 text-[10px] uppercase mb-1">
                    Periodo Desde:
                  </label>
                  <input
                    type="date"
                    value={periodoDesde}
                    onChange={(e) => setPeriodoDesde(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 text-[10px] uppercase mb-1">
                    Periodo Hasta:
                  </label>
                  <input
                    type="date"
                    value={periodoHasta}
                    onChange={(e) => setPeriodoHasta(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS DE COMPRAR */}
          {!esGanar && (
            <div className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
              <div>
                <label className="block font-bold text-amber-950 uppercase tracking-wider mb-1 text-[11px]">
                  Lugar(es) de Compra / Proveedor:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Makro, Vega, Metro..."
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Monto Asignado de Caja:
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={montoAsignado}
                    onChange={(e) =>
                      setMontoAsignado(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-800 uppercase mb-1 text-[11px] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    ¿Faltó dinero? (Aporte Extra):
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={montoAdicional}
                    onChange={(e) =>
                      setMontoAdicional(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-xs text-amber-900"
                  />
                </div>
              </div>

              {/* Si hubo dinero adicional, quién lo puso */}
              {valorAdicional > 0 && (
                <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-300">
                  <label className="block font-extrabold text-amber-900 uppercase mb-1 text-[10px]">
                    ¿Quién puso los S/ {valorAdicional} de su bolsillo?
                  </label>
                  <select
                    value={quienAporto}
                    onChange={(e) => setQuienAporto(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-amber-400 rounded-lg font-bold text-xs text-amber-950"
                  >
                    <option value="">Selecciona al socio aportante...</option>
                    {socios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} (Socio Inversionista)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sobrante */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] uppercase mb-1">
                    Dinero Sobrante (S/):
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={montoSobrante}
                    onChange={(e) =>
                      setMontoSobrante(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                {valorSobrante > 0 && (
                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] uppercase mb-1">
                      Destino del Sobrante:
                    </label>
                    <select
                      value={destinoSobrante}
                      onChange={(e) => setDestinoSobrante(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="CAJA">Vuelve a la Caja</option>
                      <option value="REPARTO">Repartir a Socios</option>
                      <option value="NINGUNO">Ninguno</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Total Gastado Calculado */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between font-bold">
                <span className="text-slate-700">Total Gastado Real (Afecta Caja):</span>
                <span className="text-sm font-black text-slate-900">
                  {formatearMoneda(totalGastadoCalculado)}
                </span>
              </div>

              {/* Comprobantes / Fotos adjuntas */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                  Comprobantes / Fotos ({comprobantes.length}):
                </label>

                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleProcesarFoto}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  onChange={handleProcesarFoto}
                  className="hidden"
                />

                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Cámara
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Galería
                  </button>
                  {cargandoFoto && <span className="text-slate-400 self-center">Cargando...</span>}
                </div>

                {comprobantes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {comprobantes.map((foto, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border">
                        <img src={foto} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleEliminarFoto(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Descripción / Glosa */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
              Descripción / Glosa:
            </label>
            <textarea
              rows={2}
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

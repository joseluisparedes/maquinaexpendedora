import React, { useState, useMemo, useRef } from 'react'
import {
  X,
  Bell,
  CheckCircle2,
  Camera,
  Upload,
  Trash2,
  Eye,
  Calendar,
  FileText,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'
import { comprimirImagen } from '../utils/imageHelper'

export interface AportePendienteInfo {
  movimientoId: string
  codigo: string
  fecha: string
  socioId: string
  socioNombre: string
  monto: number
  aporteId?: string
}

interface ModalDevolucionAportesProps {
  isOpen: boolean
  onClose: () => void
  movimientos: Movimiento[]
  participantes: Participante[]
  usuarioActual: Participante
  onGuardarDevolucion: (
    devoluciones: Array<{
      movimientoId: string
      monto: number
      socioId: string
    }>,
    datosDevolucion: {
      fecha: string
      observaciones: string
      comprobantes: string[]
      devueltoPorNombre: string
    }
  ) => Promise<void>
}

export const ModalDevolucionAportes: React.FC<ModalDevolucionAportesProps> = ({
  isOpen,
  onClose,
  movimientos,
  participantes,
  usuarioActual,
  onGuardarDevolucion,
}) => {
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [observaciones, setObservaciones] = useState('')
  const [comprobantes, setComprobantes] = useState<string[]>([])
  const [procesandoImagenes, setProcesandoImagenes] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [fotoEnPantallaCompleta, setFotoEnPantallaCompleta] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const partMap = useMemo(() => {
    const map = new Map<string, Participante>()
    participantes.forEach((p) => map.set(p.id, p))
    return map
  }, [participantes])

  // Obtener todos los aportes actualmente pendientes
  const aportesPendientes = useMemo(() => {
    const activos = movimientos.filter((m) => m.estado === 'REGISTRADO')
    const lista: AportePendienteInfo[] = []

    activos.forEach((m) => {
      if (m.tipo === 'COMPRAR' && (m.monto_adicional || 0) > 0) {
        const idSocio = m.quien_aporto_adicional || 'Desconocido'
        const socioNombre = partMap.get(idSocio)?.nombre || idSocio

        if (m.aportes_adicionales && m.aportes_adicionales.length > 0) {
          m.aportes_adicionales.forEach((ap) => {
            if (ap.estado !== 'DEVUELTO') {
              lista.push({
                movimientoId: m.id,
                codigo: m.codigo,
                fecha: m.fecha,
                socioId: ap.participante_id,
                socioNombre: partMap.get(ap.participante_id)?.nombre || ap.participante_id,
                monto: ap.monto,
                aporteId: ap.id,
              })
            }
          })
        } else if (!m.aporte_devuelto) {
          lista.push({
            movimientoId: m.id,
            codigo: m.codigo,
            fecha: m.fecha,
            socioId: idSocio,
            socioNombre,
            monto: m.monto_adicional || 0,
          })
        }
      }
    })

    return lista
  }, [movimientos, partMap])

  // IDs seleccionados para devolver (por defecto todos seleccionados)
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  // Sincronizar selección inicial cuando se abre
  React.useEffect(() => {
    if (isOpen) {
      setSeleccionados(aportesPendientes.map((a) => `${a.movimientoId}-${a.socioId}`))
      setFecha(new Date().toISOString().split('T')[0])
      setObservaciones('')
      setComprobantes([])
    }
  }, [isOpen, aportesPendientes])

  const toggleSeleccion = (key: string) => {
    setSeleccionados((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const itemsSeleccionados = useMemo(() => {
    return aportesPendientes.filter((a) =>
      seleccionados.includes(`${a.movimientoId}-${a.socioId}`)
    )
  }, [aportesPendientes, seleccionados])

  const totalSeleccionado = useMemo(() => {
    return itemsSeleccionados.reduce((sum, a) => sum + a.monto, 0)
  }, [itemsSeleccionados])

  // Procesar fotos adjuntas
  const handleArchivosSeleccionados = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setProcesandoImagenes(true)
    try {
      const nuevasFotos: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const dataUrl = await comprimirImagen(file)
        nuevasFotos.push(dataUrl)
      }
      setComprobantes((prev) => [...prev, ...nuevasFotos])
    } catch {
      alert('Error procesando alguna de las imágenes.')
    } finally {
      setProcesandoImagenes(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleEliminarFoto = (index: number) => {
    setComprobantes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (itemsSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un aporte para devolver.')
      return
    }

    setGuardando(true)
    try {
      await onGuardarDevolucion(
        itemsSeleccionados.map((item) => ({
          movimientoId: item.movimientoId,
          monto: item.monto,
          socioId: item.socioId,
        })),
        {
          fecha,
          observaciones: observaciones.trim(),
          comprobantes,
          devueltoPorNombre: usuarioActual.nombre,
        }
      )
      onClose()
    } catch (err: any) {
      alert('Error registrando la devolución: ' + (err?.message || 'Error inesperado'))
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Devolución de Aportes a Socios
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Reembolsa el dinero faltante cubierto por los socios
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs sm:text-sm">
          {aportesPendientes.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-base">¡No hay deudas pendientes!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Todos los aportes de socios ya han sido devueltos y liquidados.
              </p>
            </div>
          ) : (
            <>
              {/* Selector de Socios / Aportes a Devolver */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Selecciona los aportes a devolver ({aportesPendientes.length}):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (seleccionados.length === aportesPendientes.length) {
                        setSeleccionados([])
                      } else {
                        setSeleccionados(aportesPendientes.map((a) => `${a.movimientoId}-${a.socioId}`))
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    {seleccionados.length === aportesPendientes.length
                      ? 'Deseleccionar todos'
                      : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-slate-50/50">
                  {aportesPendientes.map((ap) => {
                    const key = `${ap.movimientoId}-${ap.socioId}`
                    const isChecked = seleccionados.includes(key)

                    return (
                      <div
                        key={key}
                        onClick={() => toggleSeleccion(key)}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isChecked ? 'bg-amber-50/80 hover:bg-amber-100/60' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Manejado por div
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                          />
                          <div>
                            <span className="font-black text-slate-900 text-sm block">
                              {ap.socioNombre}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Faltante en <strong className="font-mono text-slate-700">{ap.codigo}</strong> • {ap.fecha}
                            </span>
                          </div>
                        </div>

                        <span className="font-black text-sm text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-xl">
                          +{formatearMoneda(ap.monto)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Resumen de selección */}
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    Total a devolver ({itemsSeleccionados.length} socio{itemsSeleccionados.length !== 1 ? 's' : ''}):
                  </span>
                  <span className="text-base font-black text-emerald-800">
                    {formatearMoneda(totalSeleccionado)}
                  </span>
                </div>
              </div>

              {/* Fecha de Devolución */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Fecha de Devolución
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Observación / Detalle de la Devolución */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Observaciones / Medio de pago (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Transferencia Yape, Efectivo entregado en el colegio, etc."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Comprobantes / Fotos de la Devolución (Opcional y Múltiples) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    Fotos / Vouchers de la Devolución (Opcional)
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {comprobantes.length} adjuntado{comprobantes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Puedes tomar o subir más de una foto del voucher de Yape/Plin o recibo de entrega.
                </p>

                {/* Inputs ocultos para Cámara y Archivos */}
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

                {/* Botones táctiles */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={procesandoImagenes}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200/80 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-cyan-600" />
                    <span>Tomar Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={procesandoImagenes}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Subir Voucher</span>
                  </button>
                </div>

                {procesandoImagenes && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-indigo-600 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Optimizando imágenes...</span>
                  </div>
                )}

                {/* Miniaturas de fotos cargadas */}
                {comprobantes.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {comprobantes.map((foto, index) => (
                      <div
                        key={index}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100"
                      >
                        <img
                          src={foto}
                          alt={`Comprobante devolución ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFotoEnPantallaCompleta(foto)}
                            className="p-1 bg-white/90 text-slate-800 rounded-lg hover:bg-white cursor-pointer"
                            title="Ver en grande"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarFoto(index)}
                            className="p-1 bg-rose-600/90 text-white rounded-lg hover:bg-rose-600 cursor-pointer"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Botones de Pie */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {aportesPendientes.length > 0 && (
              <button
                type="submit"
                disabled={guardando || itemsSeleccionados.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirmar Devolución ({formatearMoneda(totalSeleccionado)})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Modal de Zoom para ver Comprobante en Pantalla Completa */}
        {fotoEnPantallaCompleta && (
          <div
            onClick={() => setFotoEnPantallaCompleta(null)}
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
          >
            <div className="relative max-w-2xl max-h-[90vh]">
              <img
                src={fotoEnPantallaCompleta}
                alt="Vista ampliada"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
              <button
                onClick={() => setFotoEnPantallaCompleta(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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
  ArrowRight,
  Clock,
  DollarSign,
  ShieldCheck,
  Send,
  Download,
} from 'lucide-react'
import type { DeudaSocioCompra, Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'
import { comprimirImagen } from '../utils/imageHelper'
import {
  obtenerMetricasDeudasUsuario,
  obtenerTodasLasDeudas,
  type ResumenDeudaEntreSocios,
} from '../utils/deudasHelper'

interface ModalDevolucionAportesProps {
  isOpen: boolean
  onClose: () => void
  movimientos: Movimiento[]
  participantes: Participante[]
  usuarioActual: Participante
  onGuardarDevolucion?: (
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
  onActualizarDeuda?: (
    movimientoId: string,
    deudaActualizada: DeudaSocioCompra
  ) => Promise<void>
}

export const ModalDevolucionAportes: React.FC<ModalDevolucionAportesProps> = ({
  isOpen,
  onClose,
  movimientos,
  participantes,
  usuarioActual,
  onActualizarDeuda,
}) => {
  const esAdmin = usuarioActual.rol === 'Administrador'

  // Pestaña activa: 'por_pagar' | 'por_cobrar' | 'todas' | 'historial'
  const [tabActiva, setTabActiva] = useState<'por_pagar' | 'por_cobrar' | 'todas' | 'historial'>('por_pagar')

  // Estado para el formulario inline de pago del deudor
  const [deudaSeleccionadaParaPagar, setDeudaSeleccionadaParaPagar] = useState<string | null>(null)
  const [montoPago, setMontoPago] = useState<string>('')
  const [fechaPago, setFechaPago] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [observacionesPago, setObservacionesPago] = useState<string>('')
  const [comprobantesPago, setComprobantesPago] = useState<string[]>([])
  const [procesandoImagenes, setProcesandoImagenes] = useState(false)
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [fotoEnPantallaCompleta, setFotoEnPantallaCompleta] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Obtener métricas y deudas organizadas
  const metricas = useMemo(() => {
    return obtenerMetricasDeudasUsuario(movimientos, participantes, usuarioActual)
  }, [movimientos, participantes, usuarioActual])

  const todasLasDeudas = useMemo(() => {
    return obtenerTodasLasDeudas(movimientos, participantes)
  }, [movimientos, participantes])

  // Ajustar pestaña inicial al abrir
  React.useEffect(() => {
    if (isOpen) {
      if (metricas.pagosPorConfirmar.length > 0) {
        setTabActiva('por_cobrar')
      } else if (metricas.deudasPorPagarPendientes.length > 0) {
        setTabActiva('por_pagar')
      } else if (metricas.cobrosPendientes.length > 0) {
        setTabActiva('por_cobrar')
      } else if (esAdmin && todasLasDeudas.some((d) => d.deuda.estado !== 'SALDADO')) {
        setTabActiva('todas')
      } else {
        setTabActiva('historial')
      }
      setDeudaSeleccionadaParaPagar(null)
      setComprobantesPago([])
      setObservacionesPago('')
      setMontoPago('')
      setFechaPago(new Date().toISOString().split('T')[0])
    }
  }, [isOpen, metricas.pagosPorConfirmar.length, metricas.deudasPorPagarPendientes.length, metricas.cobrosPendientes.length, esAdmin, todasLasDeudas])

  // Iniciar registro de pago para una deuda
  const handleIniciarPago = (resumen: ResumenDeudaEntreSocios) => {
    setDeudaSeleccionadaParaPagar(resumen.deuda.id)
    setMontoPago(String(resumen.deuda.monto_pagado ?? resumen.deuda.monto_cuota))
    setFechaPago(resumen.deuda.fecha_pago || new Date().toISOString().split('T')[0])
    setObservacionesPago(resumen.deuda.observaciones_pago || '')
    setComprobantesPago(resumen.deuda.comprobantes_pago ? [...resumen.deuda.comprobantes_pago] : [])
  }

  // Cancelar registro de pago
  const handleCancelarPago = () => {
    setDeudaSeleccionadaParaPagar(null)
    setComprobantesPago([])
    setObservacionesPago('')
    setMontoPago('')
  }

  // Subir / procesar fotos
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
      setComprobantesPago((prev) => [...prev, ...nuevasFotos])
    } catch {
      alert('Error procesando alguna de las imágenes.')
    } finally {
      setProcesandoImagenes(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleEliminarFoto = (index: number) => {
    setComprobantesPago((prev) => prev.filter((_, i) => i !== index))
  }

  // 1. Guardar pago realizado por el socio deudor (Pasa a estado PAGADO esperando confirmación)
  const handleGuardarPagoDeudor = async (resumen: ResumenDeudaEntreSocios) => {
    const valorMonto = parseFloat(montoPago)
    if (isNaN(valorMonto) || valorMonto <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.')
      return
    }

    if (!onActualizarDeuda) return

    setGuardandoId(resumen.deuda.id)
    try {
      const deudaActualizada: DeudaSocioCompra = {
        ...resumen.deuda,
        monto_pagado: valorMonto,
        estado: 'PAGADO',
        fecha_pago: fechaPago,
        observaciones_pago: observacionesPago.trim() || undefined,
        comprobantes_pago: comprobantesPago.length > 0 ? comprobantesPago : undefined,
      }

      await onActualizarDeuda(resumen.movimiento.id, deudaActualizada)
      setDeudaSeleccionadaParaPagar(null)
    } catch (err: any) {
      alert('Error guardando el pago: ' + (err?.message || 'Error inesperado'))
    } finally {
      setGuardandoId(null)
    }
  }

  // 2. Confirmar y saldar deuda (Lo hace el acreedor o el Admin con el visto bueno final)
  const handleConfirmarSaldado = async (resumen: ResumenDeudaEntreSocios) => {
    if (!onActualizarDeuda) return

    const deudorNombre = resumen.deudor.nombre
    const monto = resumen.deuda.monto_pagado ?? resumen.deuda.monto_cuota

    const confirmar = window.confirm(
      `¿Confirmas que se recibió ${formatearMoneda(monto)} de ${deudorNombre} y que la deuda queda completamente SALDADA?`
    )
    if (!confirmar) return

    setGuardandoId(resumen.deuda.id)
    try {
      const deudaActualizada: DeudaSocioCompra = {
        ...resumen.deuda,
        monto_pagado: monto,
        estado: 'SALDADO',
        fecha_confirmacion: new Date().toISOString().split('T')[0],
        confirmado_por: usuarioActual.nombre,
      }

      await onActualizarDeuda(resumen.movimiento.id, deudaActualizada)
    } catch (err: any) {
      alert('Error confirmando el saldo: ' + (err?.message || 'Error inesperado'))
    } finally {
      setGuardandoId(null)
    }
  }

  // 3. Saldado directo (el acreedor o admin declara saldado directamente sin comprobante previo)
  const handleSaldadoDirecto = async (resumen: ResumenDeudaEntreSocios) => {
    if (!onActualizarDeuda) return

    const deudorNombre = resumen.deudor.nombre
    const cuota = resumen.deuda.monto_cuota

    const motivo = window.prompt(
      `Indica si hay alguna observación para dar por saldada la deuda de ${deudorNombre} (${formatearMoneda(cuota)}):`,
      'Saldado en efectivo / compensado'
    )
    if (motivo === null) return // usuario canceló el prompt

    setGuardandoId(resumen.deuda.id)
    try {
      const deudaActualizada: DeudaSocioCompra = {
        ...resumen.deuda,
        monto_pagado: cuota,
        estado: 'SALDADO',
        fecha_pago: new Date().toISOString().split('T')[0],
        fecha_confirmacion: new Date().toISOString().split('T')[0],
        confirmado_por: usuarioActual.nombre,
        observaciones_pago: motivo.trim() || 'Saldado directo',
      }

      await onActualizarDeuda(resumen.movimiento.id, deudaActualizada)
    } catch (err: any) {
      alert('Error saldando la deuda: ' + (err?.message || 'Error inesperado'))
    } finally {
      setGuardandoId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Cabecera Principal */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Liquidación de Aportes entre Socios
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Gestión de reembolsos cuando faltó dinero en compras de mercadería
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

        {/* Resumen de Balance Rápido */}
        <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100 divide-x divide-slate-200 text-xs">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Tus deudas pendientes:</span>
            <span className={`font-black ${metricas.totalQueDebo > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {formatearMoneda(metricas.totalQueDebo)}
            </span>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Te deben a ti:</span>
            <span className={`font-black ${metricas.totalQueMeDeben > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
              {formatearMoneda(metricas.totalQueMeDeben)}
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 text-xs font-bold px-3 pt-2 gap-1 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setTabActiva('por_pagar')}
            className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tabActiva === 'por_pagar'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>Mis Deudas</span>
            {metricas.deudasPorPagarPendientes.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black">
                {metricas.deudasPorPagarPendientes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('por_cobrar')}
            className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tabActiva === 'por_cobrar'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>Por Cobrar / Confirmar</span>
            {metricas.pagosPorConfirmar.length > 0 ? (
              <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {metricas.pagosPorConfirmar.length}
              </span>
            ) : metricas.cobrosPendientes.length > 0 ? (
              <span className="px-1.5 py-0.2 bg-slate-300 text-slate-700 rounded-full text-[10px]">
                {metricas.cobrosPendientes.length}
              </span>
            ) : null}
          </button>

          {esAdmin && (
            <button
              type="button"
              onClick={() => setTabActiva('todas')}
              className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                tabActiva === 'todas'
                  ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Todas (Admin)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setTabActiva('historial')}
            className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ml-auto ${
              tabActiva === 'historial'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>Saldadas ({metricas.deudasSaldadas.length})</span>
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          
          {/* ============================================================== */}
          {/* TAB 1: MIS DEUDAS POR PAGAR (USUARIO ACTUAL ES EL DEUDOR) */}
          {/* ============================================================== */}
          {tabActiva === 'por_pagar' && (
            <div className="space-y-3">
              {metricas.misDeudasComoDeudor.filter((r) => r.deuda.estado !== 'SALDADO').length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-base">¡No debes nada a los socios!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No tienes cuotas pendientes ni compras donde otro socio haya cubierto faltantes a tu nombre.
                  </p>
                </div>
              ) : (
                metricas.misDeudasComoDeudor
                  .filter((r) => r.deuda.estado !== 'SALDADO')
                  .map((resumen) => {
                    const d = resumen.deuda
                    const editando = deudaSeleccionadaParaPagar === d.id
                    const guardando = guardandoId === d.id

                    return (
                      <div
                        key={d.id}
                        className="bg-white border-2 border-amber-200/80 rounded-2xl p-4 shadow-xs space-y-3"
                      >
                        {/* Cabecera de la deuda */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">
                                Le debes a {resumen.acreedor.nombre}
                              </span>
                              {d.estado === 'PAGADO' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Pago enviado (Esperando confirmación)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  Pendiente de pago
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-xs mt-0.5">
                              Faltante total en compra <strong className="font-mono text-slate-700">{resumen.movimiento.codigo}</strong>: {formatearMoneda(resumen.movimiento.monto_adicional || 0)} ({resumen.movimiento.fecha})
                            </p>
                          </div>

                          <div className="text-right sm:self-center">
                            <span className="text-[11px] text-slate-400 block font-semibold">Tu cuota equitativa</span>
                            <span className="text-base font-black text-amber-700">
                              {formatearMoneda(d.monto_cuota)}
                            </span>
                          </div>
                        </div>

                        {/* Si ya registró un pago previo, mostrar resumen */}
                        {d.estado === 'PAGADO' && !editando && (
                          <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-blue-900">
                                Monto transferido: <span className="text-sm font-black">{formatearMoneda(d.monto_pagado ?? d.monto_cuota)}</span>
                              </span>
                              <span className="text-[11px] text-blue-700">
                                Fecha: {d.fecha_pago || 'Hoy'}
                              </span>
                            </div>
                            {d.observaciones_pago && (
                              <p className="text-blue-800 italic">
                                "{d.observaciones_pago}"
                              </p>
                            )}

                            {/* Miniaturas de comprobantes enviados */}
                            {d.comprobantes_pago && d.comprobantes_pago.length > 0 && (
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-[11px] font-bold text-blue-900">Vouchers:</span>
                                {d.comprobantes_pago.map((foto, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setFotoEnPantallaCompleta(foto)}
                                    className="w-10 h-10 rounded-lg overflow-hidden border border-blue-300 relative group cursor-pointer"
                                  >
                                    <img src={foto} alt="voucher" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                                      <Eye className="w-3.5 h-3.5" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleIniciarPago(resumen)}
                                className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                              >
                                Modificar pago o adjuntar más fotos
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Botón para iniciar el pago si está en estado PENDIENTE */}
                        {d.estado === 'PENDIENTE' && !editando && (
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-slate-500">
                              Puedes transferir el monto completo o acordar un monto diferente.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleIniciarPago(resumen)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Registrar Pago a {resumen.acreedor.nombre}</span>
                            </button>
                          </div>
                        )}

                        {/* FORMULARIO INLINE DE REGISTRO DE PAGO */}
                        {editando && (
                          <div className="mt-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                              <span className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                Detalle de la transferencia a {resumen.acreedor.nombre}
                              </span>
                              <button
                                type="button"
                                onClick={handleCancelarPago}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Monto editable */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                  Monto transferido (S/)
                                </label>
                                <input
                                  type="number"
                                  step="0.10"
                                  min="0.1"
                                  value={montoPago}
                                  onChange={(e) => setMontoPago(e.target.value)}
                                  placeholder="Ej: 30 o 10"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                                <span className="text-[10px] text-slate-400">
                                  Cuota sugerida: {formatearMoneda(d.monto_cuota)}
                                </span>
                              </div>

                              {/* Fecha */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  Fecha de pago
                                </label>
                                <input
                                  type="date"
                                  value={fechaPago}
                                  onChange={(e) => setFechaPago(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            {/* Nota / Observación */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-400" />
                                Observación (Opcional)
                              </label>
                              <input
                                type="text"
                                value={observacionesPago}
                                onChange={(e) => setObservacionesPago(e.target.value)}
                                placeholder="Ej: Te transferí 10 y te desconté 20 que me debías del almuerzo"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              />
                            </div>

                            {/* Comprobantes opcionales (Fotos / Vouchers) */}
                            <div className="space-y-2 pt-1 border-t border-slate-200/80">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-slate-400" />
                                  Fotos / Vouchers de Yape/Plin (Opcional)
                                </label>
                                <span className="text-[10px] text-slate-400">
                                  {comprobantesPago.length} adjuntado(s)
                                </span>
                              </div>

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

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => cameraInputRef.current?.click()}
                                  disabled={procesandoImagenes}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Camera className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>Tomar Foto</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={procesandoImagenes}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Subir Voucher</span>
                                </button>
                              </div>

                              {procesandoImagenes && (
                                <p className="text-[11px] text-indigo-600 font-bold flex items-center gap-1">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Optimizando imagen...
                                </p>
                              )}

                              {comprobantesPago.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {comprobantesPago.map((foto, fIdx) => (
                                    <div
                                      key={fIdx}
                                      className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-300"
                                    >
                                      <img src={foto} alt="voucher" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() => setFotoEnPantallaCompleta(foto)}
                                          className="p-1 bg-white text-slate-800 rounded-md cursor-pointer"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleEliminarFoto(fIdx)}
                                          className="p-1 bg-rose-600 text-white rounded-md cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Botón final para guardar reporte de pago */}
                            <div className="flex items-center justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={handleCancelarPago}
                                disabled={guardando}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGuardarPagoDeudor(resumen)}
                                disabled={guardando || !montoPago}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {guardando ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 stroke-[2.5]" /> Enviar Reporte de Pago
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: POR COBRAR / CONFIRMAR (USUARIO ACTUAL ES EL ACREEDOR) */}
          {/* ============================================================== */}
          {tabActiva === 'por_cobrar' && (
            <div className="space-y-3">
              {metricas.misDeudasComoAcreedor.filter((r) => r.deuda.estado !== 'SALDADO').length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-base">¡No tienes cobros pendientes!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Ningún socio te debe dinero por aportes de compras, o ya has confirmado la recepción de todos ellos.
                  </p>
                </div>
              ) : (
                metricas.misDeudasComoAcreedor
                  .filter((r) => r.deuda.estado !== 'SALDADO')
                  .map((resumen) => {
                    const d = resumen.deuda
                    const yaPago = d.estado === 'PAGADO'
                    const guardando = guardandoId === d.id

                    return (
                      <div
                        key={d.id}
                        className={`rounded-2xl p-4 border-2 shadow-xs space-y-3 transition-colors ${
                          yaPago
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">
                                {resumen.deudor.nombre}
                              </span>
                              {yaPago ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-full animate-pulse shadow-xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  ¡Pago recibido para tu confirmación!
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Pendiente de pago
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-xs mt-0.5">
                              En compra <strong className="font-mono text-slate-700">{resumen.movimiento.codigo}</strong> • {resumen.movimiento.fecha}
                            </p>
                          </div>

                          <div className="text-right sm:self-center">
                            <span className="text-[11px] text-slate-400 block font-semibold">
                              {yaPago ? 'Monto reportado' : 'Cuota debida'}
                            </span>
                            <span className="text-base font-black text-emerald-800">
                              {formatearMoneda(d.monto_pagado ?? d.monto_cuota)}
                            </span>
                          </div>
                        </div>

                        {/* Mensaje / Observación del deudor */}
                        {d.observaciones_pago && (
                          <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                            <strong className="text-slate-900 font-bold">Nota de {resumen.deudor.nombre}:</strong>{' '}
                            <em>"{d.observaciones_pago}"</em>
                          </div>
                        )}

                        {/* Comprobantes adjuntos */}
                        {d.comprobantes_pago && d.comprobantes_pago.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                              <Eye className="w-3 h-3 text-slate-500" />
                              Vouchers adjuntados por {resumen.deudor.nombre}:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {d.comprobantes_pago.map((foto, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFotoEnPantallaCompleta(foto)}
                                  className="w-14 h-14 rounded-xl overflow-hidden border border-slate-300 relative group cursor-pointer shadow-xs"
                                >
                                  <img src={foto} alt="voucher" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                    <Eye className="w-4 h-4" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Botones de acción del acreedor */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                          {!yaPago && (
                            <button
                              type="button"
                              onClick={() => handleSaldadoDirecto(resumen)}
                              disabled={guardando}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                              title="Marcar como saldado si te pagó en efectivo o lo acordaron directamente"
                            >
                              Marcar Saldado Directo
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleConfirmarSaldado(resumen)}
                            disabled={guardando}
                            className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer ${
                              yaPago
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-800 hover:bg-slate-900 text-white'
                            }`}
                          >
                            {guardando ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Confirmar y Saldar Deuda</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB ADMIN: TODAS LAS DEUDAS (SOLO ADMINISTRADOR) */}
          {/* ============================================================== */}
          {esAdmin && tabActiva === 'todas' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs text-indigo-950">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>
                    Vista administrativa de todas las deudas registradas entre socios.
                  </span>
                </div>
              </div>

              {todasLasDeudas.filter((r) => r.deuda.estado !== 'SALDADO').length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-base">¡Todas las deudas están saldadas!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No hay ningún pago pendiente entre ningún socio en todo el sistema.
                  </p>
                </div>
              ) : (
                todasLasDeudas
                  .filter((r) => r.deuda.estado !== 'SALDADO')
                  .map((resumen) => {
                    const d = resumen.deuda
                    const guardando = guardandoId === d.id

                    return (
                      <div
                        key={d.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{resumen.deudor.nombre}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-900">{resumen.acreedor.nombre}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                d.estado === 'PAGADO'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {d.estado}
                            </span>
                          </div>
                          <span className="font-black text-slate-900">
                            {formatearMoneda(d.monto_pagado ?? d.monto_cuota)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            Compra: <strong className="font-mono text-slate-700">{resumen.movimiento.codigo}</strong> ({resumen.movimiento.fecha})
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleConfirmarSaldado(resumen)}
                              disabled={guardando}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                            >
                              Saldar Deuda
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: HISTORIAL SALDADO */}
          {/* ============================================================== */}
          {tabActiva === 'historial' && (
            <div className="space-y-3">
              {metricas.deudasSaldadas.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-base">No hay deudas saldadas registradas</h4>
                  <p className="text-xs text-slate-500">
                    Aún no se ha completado ninguna liquidación de aporte.
                  </p>
                </div>
              ) : (
                metricas.deudasSaldadas.map((resumen) => {
                  const d = resumen.deuda

                  return (
                    <div
                      key={d.id}
                      className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-900">
                            {resumen.deudor.nombre} reembolsó a {resumen.acreedor.nombre}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                            SALDADO
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] pl-6">
                          Compra <strong className="font-mono text-slate-700">{resumen.movimiento.codigo}</strong> • Fecha de confirmación:{' '}
                          {d.fecha_confirmacion || d.fecha_pago || 'Confirmado'}
                          {d.confirmado_por ? ` (por ${d.confirmado_por})` : ''}
                        </p>
                        {d.observaciones_pago && (
                          <p className="text-slate-600 italic text-[11px] pl-6">
                            "{d.observaciones_pago}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pl-6 sm:pl-0 sm:self-center">
                        {d.comprobantes_pago && d.comprobantes_pago.length > 0 && (
                          <div className="flex gap-1">
                            {d.comprobantes_pago.map((foto, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setFotoEnPantallaCompleta(foto)}
                                className="w-8 h-8 rounded-lg overflow-hidden border border-slate-300 relative group cursor-pointer"
                                title="Ver comprobante"
                              >
                                <img src={foto} alt="voucher" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                                  <Eye className="w-3 h-3" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        <span className="text-sm font-black text-slate-800 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                          {formatearMoneda(d.monto_pagado ?? d.monto_cuota)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Solo el acreedor o el administrador tienen la facultad de saldar formalmente la deuda.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {/* Modal de Zoom para ver Comprobante en Pantalla Completa */}
        {fotoEnPantallaCompleta && (
          <div
            onClick={() => setFotoEnPantallaCompleta(null)}
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
          >
            <div
              className="relative max-w-2xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fotoEnPantallaCompleta}
                alt="Vista ampliada"
                className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
              />
              <div className="flex items-center gap-2 mt-3">
                <a
                  href={fotoEnPantallaCompleta}
                  download="comprobante-devolucion.png"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </a>
                <button
                  onClick={() => setFotoEnPantallaCompleta(null)}
                  className="p-1.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

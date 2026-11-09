import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  X,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Save,
  Camera,
  Upload,
  CheckCircle2,
  Coins,
  Store,
  Receipt,
  FileText,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'
import { comprimirImagen } from '../utils/imageHelper'

interface EditarMovimientoModalProps {
  movimiento: Movimiento | null
  isOpen: boolean
  onClose: () => void
  participantes: Participante[]
  onGuardarEdicion: (movimientoActualizado: Movimiento) => void
}

type ResultadoCompra = 'EXACTO' | 'SOBRANTE' | 'ADICIONAL'

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

  // Campos para COMPRAR (con la misma lógica intuitiva que RegistrarMovimientoModal)
  const [montoAsignado, setMontoAsignado] = useState<number | ''>('')
  const [totalBoletaGasto, setTotalBoletaGasto] = useState<number | ''>('')
  const [resultadoCompra, setResultadoCompra] = useState<ResultadoCompra>('EXACTO')
  const [montoAdicional, setMontoAdicional] = useState<number | ''>('')
  const [quienAportoAdicional, setQuienAportoAdicional] = useState<string>('')
  const [montoSobrante, setMontoSobrante] = useState<number | ''>('')
  const [destinoSobrante, setDestinoSobrante] = useState<'CAJA' | 'REPARTO'>('CAJA')
  const [proveedor, setProveedor] = useState('')
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
        const asignado = movimiento.monto_asignado ?? 0
        const adicional = movimiento.monto_adicional ?? 0
        const sobrante = movimiento.monto_sobrante ?? 0
        const total = movimiento.total_gastado ?? Math.max(0, Number((asignado + adicional - sobrante).toFixed(2)))

        setMontoAsignado(asignado)
        setTotalBoletaGasto(total)
        setProveedor(movimiento.proveedor || '')
        setQuienAportoAdicional(movimiento.quien_aporto_adicional || participantes[0]?.id || '')
        setDestinoSobrante(movimiento.destino_sobrante === 'REPARTO' ? 'REPARTO' : 'CAJA')

        if (adicional > 0) {
          setResultadoCompra('ADICIONAL')
          setMontoAdicional(adicional)
          setMontoSobrante('')
        } else if (sobrante > 0) {
          setResultadoCompra('SOBRANTE')
          setMontoSobrante(sobrante)
          setMontoAdicional('')
        } else {
          setResultadoCompra('EXACTO')
          setMontoAdicional('')
          setMontoSobrante('')
        }

        const fotos =
          movimiento.comprobantes && movimiento.comprobantes.length > 0
            ? [...movimiento.comprobantes]
            : movimiento.comprobante_url
            ? [movimiento.comprobante_url]
            : []
        setComprobantes(fotos)
      }
    }
  }, [movimiento, isOpen, participantes])

  // Manejador del cambio en "Total gastado" (Paso 2)
  const handleTotalGastoChange = (nuevoTotal: number | '') => {
    setTotalBoletaGasto(nuevoTotal)

    if (nuevoTotal === '' || isNaN(nuevoTotal as number) || (nuevoTotal as number) < 0) {
      setResultadoCompra('EXACTO')
      setMontoAdicional('')
      setMontoSobrante('')
      return
    }

    const gasto = Number(nuevoTotal)
    const caja = typeof montoAsignado === 'number' ? Math.max(0, montoAsignado) : 0
    const diferencia = Number((gasto - caja).toFixed(2))

    if (diferencia > 0) {
      setResultadoCompra('ADICIONAL')
      setMontoAdicional(diferencia)
      setMontoSobrante('')
    } else if (diferencia < 0) {
      setResultadoCompra('SOBRANTE')
      setMontoSobrante(Math.abs(diferencia))
      setMontoAdicional('')
    } else {
      setResultadoCompra('EXACTO')
      setMontoSobrante('')
      setMontoAdicional('')
    }
  }

  // Si cambia lo que sacó de caja (Paso 1)
  const handleMontoAsignadoChange = (nuevoCaja: number | '') => {
    setMontoAsignado(nuevoCaja)

    if (totalBoletaGasto !== '' && typeof totalBoletaGasto === 'number') {
      const gasto = totalBoletaGasto
      const caja = nuevoCaja === '' ? 0 : Math.max(0, Number(nuevoCaja))
      const diferencia = Number((gasto - caja).toFixed(2))

      if (diferencia > 0) {
        setResultadoCompra('ADICIONAL')
        setMontoAdicional(diferencia)
        setMontoSobrante('')
      } else if (diferencia < 0) {
        setResultadoCompra('SOBRANTE')
        setMontoSobrante(Math.abs(diferencia))
        setMontoAdicional('')
      } else {
        setResultadoCompra('EXACTO')
        setMontoSobrante('')
        setMontoAdicional('')
      }
    } else {
      setResultadoCompra('EXACTO')
      setMontoAdicional('')
      setMontoSobrante('')
    }
  }

  const valorAsignado = typeof montoAsignado === 'number' ? Math.max(0, montoAsignado) : 0
  const valorAdicional =
    resultadoCompra === 'ADICIONAL' && typeof montoAdicional === 'number'
      ? Math.max(0, montoAdicional)
      : 0
  const valorSobrante =
    resultadoCompra === 'SOBRANTE' && typeof montoSobrante === 'number'
      ? Math.max(0, montoSobrante)
      : 0

  const totalGastadoReal = useMemo(() => {
    return Math.max(0, Number((valorAsignado + valorAdicional - valorSobrante).toFixed(2)))
  }, [valorAsignado, valorAdicional, valorSobrante])

  const errorSobrante = useMemo(() => {
    if (resultadoCompra === 'SOBRANTE' && valorSobrante > valorAsignado) {
      return `El vuelto (S/ ${valorSobrante.toFixed(2)}) no puede ser mayor que el dinero sacado de la caja (S/ ${valorAsignado.toFixed(2)})`
    }
    return null
  }, [resultadoCompra, valorSobrante, valorAsignado])

  const socioAportante = useMemo(() => {
    const p = participantes.find((part) => part.id === quienAportoAdicional)
    return p ? p.nombre : 'Socio'
  }, [participantes, quienAportoAdicional])

  const handleProcesarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setCargandoFoto(true)
    try {
      const nuevasFotos: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type.startsWith('image/')) {
          const base64 = await comprimirImagen(file)
          nuevasFotos.push(base64)
        }
      }
      setComprobantes((prev) => [...prev, ...nuevasFotos])
    } catch {
      alert('Ocurrió un error al procesar las imágenes.')
    } finally {
      setCargandoFoto(false)
      e.target.value = ''
    }
  }

  const handleEliminarFoto = (idx: number) => {
    setComprobantes((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!movimiento) return

    if (movimiento.tipo === 'GANAR') {
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
      if (errorSobrante) {
        alert(errorSobrante)
        return
      }

      if (valorAsignado <= 0 && valorAdicional <= 0 && totalGastadoReal <= 0) {
        alert('Debes ingresar un monto válido para la compra.')
        return
      }

      if (resultadoCompra === 'ADICIONAL' && valorAdicional > 0 && !quienAportoAdicional) {
        alert('Por favor selecciona quién aportó el dinero extra.')
        return
      }

      const actualizado: Movimiento = {
        ...movimiento,
        fecha,
        descripcion: descripcion.trim() || 'Compra de mercadería',
        registrado_por: registradoPor,
        proveedor: proveedor.trim(),
        monto_asignado: valorAsignado,
        monto_adicional: resultadoCompra === 'ADICIONAL' ? valorAdicional : 0,
        quien_aporto_adicional:
          resultadoCompra === 'ADICIONAL' && valorAdicional > 0 ? quienAportoAdicional : undefined,
        monto_sobrante: resultadoCompra === 'SOBRANTE' ? valorSobrante : 0,
        destino_sobrante: resultadoCompra === 'SOBRANTE' && valorSobrante > 0 ? destinoSobrante : 'NINGUNO',
        total_gastado: totalGastadoReal,
        comprobantes,
      }

      onGuardarEdicion(actualizado)
      onClose()
    }
  }

  if (!isOpen || !movimiento) return null

  const esGanar = movimiento.tipo === 'GANAR'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 max-w-xl w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col pb-safe overflow-hidden animate-in slide-in-from-bottom duration-200 sm:animate-in sm:zoom-in-95">
        {/* Handle visual móvil */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 mb-1 sm:hidden shrink-0" />

        {/* Cabecera */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
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
                {esGanar ? 'Recaudación (Ganar)' : 'Compra de Mercadería (Comprar)'} • Ajuste de valores
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                Registrado por:
              </label>
              <select
                value={registradoPor}
                onChange={(e) => setRegistradoPor(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs"
              >
                {participantes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.rol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CASO GANAR */}
          {/* ======================================================== */}
          {esGanar && (
            <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
              <div>
                <label className="block font-bold text-emerald-950 uppercase tracking-wider mb-1 text-[11px]">
                  Monto Recaudado (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-lg">
                    S/
                  </span>
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
                    className="w-full pl-11 pr-3 py-2.5 bg-white border border-emerald-300 rounded-xl font-black text-emerald-950 text-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
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

          {/* ======================================================== */}
          {/* CASO COMPRAR (FORMATO IDÉNTICO AL MODAL DE REGISTRO) */}
          {/* ======================================================== */}
          {!esGanar && (
            <div className="space-y-4">
              {/* PASO 1: Dinero Retirado de Caja */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 focus-within:border-amber-500 transition-colors shadow-2xs">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                        1
                      </span>
                      ¿Cuánto dinero sacaste de la Caja? *
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Efectivo llevado de la máquina para pagar (si pagaste 100% de tu bolsillo, pon 0).
                    </p>
                  </div>
                </div>

                <div className="relative mt-2">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">
                    S/
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={montoAsignado}
                    onChange={(e) =>
                      handleMontoAsignadoChange(e.target.value ? parseFloat(e.target.value) : '')
                    }
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Atajos sugeridos */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                    Sugeridos:
                  </span>
                  {[50, 100, 150, 190.2, 200, 300].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMontoAsignadoChange(m)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-[11px] font-bold text-slate-600 hover:text-amber-800 transition-colors shrink-0 cursor-pointer"
                    >
                      S/ {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* PASO 2: Total Gastado en la Compra (Cálculo Automático) */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 focus-within:border-amber-500 transition-colors shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      ¿Cuánto fue el total gastado en la compra? *
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ingresa el monto real de la boleta. El sistema calculará la resta contra la caja de forma automática.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">
                    S/
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={totalBoletaGasto}
                    onChange={(e) =>
                      handleTotalGastoChange(e.target.value ? parseFloat(e.target.value) : '')
                    }
                    className="w-full pl-11 pr-4 py-2.5 bg-amber-50/40 border border-amber-300 rounded-xl text-lg font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Resultado del cálculo automático */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                      Resultado del cálculo automático:
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (También puedes cambiarlo manualmente)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Exacto */}
                    <button
                      type="button"
                      onClick={() => {
                        setResultadoCompra('EXACTO')
                        setMontoSobrante('')
                        setMontoAdicional('')
                        if (totalBoletaGasto !== '') {
                          setTotalBoletaGasto(valorAsignado)
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        resultadoCompra === 'EXACTO'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-extrabold text-xs">🎯 Costó Exacto</span>
                        {resultadoCompra === 'EXACTO' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Gasto = Caja. Sin vueltos ni deudas.
                      </p>
                    </button>

                    {/* Sobró dinero */}
                    <button
                      type="button"
                      onClick={() => {
                        setResultadoCompra('SOBRANTE')
                        setMontoAdicional('')
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        resultadoCompra === 'SOBRANTE'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-extrabold text-xs">💵 Sobró Vuelto</span>
                        {resultadoCompra === 'SOBRANTE' && (
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Costó menos. Hay vuelto en efectivo.
                      </p>
                    </button>

                    {/* Faltó dinero */}
                    <button
                      type="button"
                      onClick={() => {
                        setResultadoCompra('ADICIONAL')
                        setMontoSobrante('')
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        resultadoCompra === 'ADICIONAL'
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-extrabold text-xs">💳 Faltó Dinero</span>
                        {resultadoCompra === 'ADICIONAL' && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Costó más. Alguien puso de su bolsillo.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Detalle si SOBRÓ DINERO */}
                {resultadoCompra === 'SOBRANTE' && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-amber-900 uppercase">
                          ¿Cuánto dinero sobró de vuelto? (S/) *
                        </label>
                        {totalBoletaGasto !== '' && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            Calculado: S/ {valorAsignado.toFixed(2)} - S/ {Number(totalBoletaGasto).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          S/
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0.01"
                          max={valorAsignado > 0 ? valorAsignado : undefined}
                          required
                          placeholder="0.00"
                          value={montoSobrante}
                          onChange={(e) => {
                            const val = e.target.value ? parseFloat(e.target.value) : ''
                            setMontoSobrante(val)
                            if (val !== '' && typeof val === 'number') {
                              setTotalBoletaGasto(Number((valorAsignado - val).toFixed(2)))
                            }
                          }}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                      {errorSobrante && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">
                          ⚠️ {errorSobrante}
                        </p>
                      )}
                    </div>

                    {/* Destino del vuelto */}
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1.5">
                        ¿Qué se hace con este vuelto de S/ {valorSobrante.toFixed(2)}?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setDestinoSobrante('CAJA')}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            destinoSobrante === 'CAJA'
                              ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 font-bold text-amber-950 shadow-2xs'
                              : 'bg-white/60 border-amber-200/80 text-slate-700'
                          }`}
                        >
                          <p className="font-bold flex items-center gap-1 text-slate-900">
                            <Coins className="w-3.5 h-3.5 text-amber-600" />
                            Regresar a la Caja
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                            Queda como saldo a favor de la máquina
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDestinoSobrante('REPARTO')}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            destinoSobrante === 'REPARTO'
                              ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 font-bold text-amber-950 shadow-2xs'
                              : 'bg-white/60 border-amber-200/80 text-slate-700'
                          }`}
                        >
                          <p className="font-bold flex items-center gap-1 text-slate-900">
                            <Coins className="w-3.5 h-3.5 text-indigo-600" />
                            Repartir entre Socios
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                            Se divide según porcentajes pactados
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detalle si FALTÓ DINERO */}
                {resultadoCompra === 'ADICIONAL' && (
                  <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-indigo-950 uppercase">
                            Monto que faltó (S/) *
                          </label>
                          {totalBoletaGasto !== '' && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-300">
                              Calculado: S/ {Number(totalBoletaGasto).toFixed(2)} - S/ {valorAsignado.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            S/
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="0.00"
                            value={montoAdicional}
                            onChange={(e) => {
                              const val = e.target.value ? parseFloat(e.target.value) : ''
                              setMontoAdicional(val)
                              if (val !== '' && typeof val === 'number') {
                                setTotalBoletaGasto(Number((valorAsignado + val).toFixed(2)))
                              }
                            }}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-indigo-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-indigo-950 uppercase mb-1">
                          ¿Quién puso este dinero de su bolsillo?
                        </label>
                        <select
                          value={quienAportoAdicional}
                          onChange={(e) => setQuienAportoAdicional(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-800"
                        >
                          {participantes.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} ({p.rol})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-indigo-100/70 border border-indigo-200 text-[11px] text-indigo-950 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                      <span>
                        Quedará registrado como <strong>deuda pendiente de la máquina hacia {socioAportante}</strong> por S/ {valorAdicional.toFixed(2)}. Se le devolverá en el próximo cierre o recaudación.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* RESUMEN EN TIEMPO REAL */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-200">
                      Resumen Claro de la Operación
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                    En Tiempo Real
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      Gasto Real en Mercadería
                    </p>
                    <p className="text-lg font-black text-amber-400 mt-0.5">
                      {formatearMoneda(totalGastadoReal)}
                    </p>
                    <p className="text-[10px] text-slate-400">Total invertido en productos</p>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      Salida Neta de Caja
                    </p>
                    <p className="text-lg font-black text-white mt-0.5">
                      {formatearMoneda(
                        Math.max(0, valorAsignado - (destinoSobrante === 'CAJA' ? valorSobrante : 0))
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">Efectivo final que salió de la máquina</p>
                  </div>
                </div>

                <div className="bg-white/10 p-3 rounded-xl text-xs text-slate-200 leading-relaxed">
                  <p className="font-bold text-amber-300 mb-0.5">💡 En palabras sencillas:</p>
                  {resultadoCompra === 'EXACTO' && (
                    <p>
                      Sacaste <strong>{formatearMoneda(valorAsignado)}</strong> de la caja y se gastaron{' '}
                      <strong>{formatearMoneda(valorAsignado)}</strong> exactamente en mercadería. No hay vuelto ni deudas.
                    </p>
                  )}
                  {resultadoCompra === 'SOBRANTE' && (
                    <p>
                      Sacaste <strong>{formatearMoneda(valorAsignado)}</strong> de la caja, pero la mercadería costó solo{' '}
                      <strong className="text-amber-300">{formatearMoneda(totalGastadoReal)}</strong>. El vuelto de{' '}
                      <strong>{formatearMoneda(valorSobrante)}</strong>{' '}
                      {destinoSobrante === 'CAJA'
                        ? 'regresa íntegro a la caja de la máquina.'
                        : 'se reparte inmediatamente entre los 3 socios.'}
                    </p>
                  )}
                  {resultadoCompra === 'ADICIONAL' && (
                    <p>
                      Sacaste <strong>{formatearMoneda(valorAsignado)}</strong> de la caja, pero la mercadería costó{' '}
                      <strong className="text-amber-300">{formatearMoneda(totalGastadoReal)}</strong>. Como faltó dinero,{' '}
                      <strong>{socioAportante}</strong> puso <strong>{formatearMoneda(valorAdicional)}</strong> de su bolsillo. La máquina le devolverá este monto.
                    </p>
                  )}
                </div>
              </div>

              {/* Proveedores y Fotos */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px] flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-500" />
                    Lugar(es) de Compra / Proveedor:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Makro, Vega, Metro..."
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Comprobantes / Fotos adjuntas */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
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
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                          <img src={foto} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleEliminarFoto(idx)}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 cursor-pointer"
                            title="Eliminar foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
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

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  X,
  TrendingUp,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  Coins,
  Receipt,
  HelpCircle,
  Users,
  Store,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  Camera,
  ImageIcon,
  Download,
  Eye,
  Loader2,
} from 'lucide-react'
import type { Movimiento, Participante, ProductoDetalle } from '../types'
import { StorageService } from '../utils/storage'
import { calcularReparto, formatearMoneda } from '../utils/calculations'
import { comprimirImagen, descargarImagen } from '../utils/imageHelper'

interface RegistrarMovimientoModalProps {
  isOpen: boolean
  tipoInicial?: 'GANAR' | 'COMPRAR'
  onClose: () => void
  participantes: Participante[]
  onMovimientoGuardado: (mov: Movimiento, movSobranteAsociado?: Movimiento) => void
}

type ResultadoCompra = 'EXACTO' | 'SOBRANTE' | 'ADICIONAL'

export const RegistrarMovimientoModal: React.FC<RegistrarMovimientoModalProps> = ({
  isOpen,
  tipoInicial = 'GANAR',
  onClose,
  participantes,
  onMovimientoGuardado,
}) => {
  const hoyStr = new Date().toISOString().slice(0, 10)
  const [tipo, setTipo] = useState<'GANAR' | 'COMPRAR'>(tipoInicial)
  const [fecha, setFecha] = useState<string>(hoyStr)
  const [descripcion, setDescripcion] = useState<string>('')
  const [registradoPor, setRegistradoPor] = useState<string>(
    participantes[0]?.id || ''
  )

  // Sincronizar tipo cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setTipo(tipoInicial)
      setFecha(new Date().toISOString().slice(0, 10))
      setProveedoresSeleccionados([])
      setTextoProveedor('')
      setComprobantes([])
      setFotoEnPantallaCompleta(null)
    }
  }, [isOpen, tipoInicial])

  // Estado para GANAR
  const [montoGanado, setMontoGanado] = useState<number | ''>('')
  const [periodoDesde, setPeriodoDesde] = useState<string>('')
  const [periodoHasta, setPeriodoHasta] = useState<string>('')
  const [mostrarGuiaGanar, setMostrarGuiaGanar] = useState<boolean>(false)
  const [mostrarPeriodoGanar, setMostrarPeriodoGanar] = useState<boolean>(false)

  // Helpers para periodos rápidos en GANAR
  const setPeriodoUltimosDias = (dias: number) => {
    const hoy = new Date()
    const pasado = new Date()
    pasado.setDate(hoy.getDate() - dias)
    setPeriodoDesde(pasado.toISOString().slice(0, 10))
    setPeriodoHasta(hoy.toISOString().slice(0, 10))
    setMostrarPeriodoGanar(true)
  }

  const setPeriodoMesActual = () => {
    const hoy = new Date()
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    setPeriodoDesde(primero.toISOString().slice(0, 10))
    setPeriodoHasta(hoy.toISOString().slice(0, 10))
    setMostrarPeriodoGanar(true)
  }

  // Estado para COMPRAR
  const [montoAsignado, setMontoAsignado] = useState<number | ''>('')
  const [resultadoCompra, setResultadoCompra] = useState<ResultadoCompra>('EXACTO')
  const [montoAdicional, setMontoAdicional] = useState<number | ''>('')
  const [quienAportoAdicional, setQuienAportoAdicional] = useState<string>(
    participantes[0]?.id || ''
  )
  const [montoSobrante, setMontoSobrante] = useState<number | ''>('')
  const [destinoSobrante, setDestinoSobrante] = useState<'CAJA' | 'REPARTO'>('CAJA')
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState<string[]>([])
  const [textoProveedor, setTextoProveedor] = useState<string>('')
  const [comprobantes, setComprobantes] = useState<string[]>([])
  const [cargandoFoto, setCargandoFoto] = useState<boolean>(false)
  const [fotoEnPantallaCompleta, setFotoEnPantallaCompleta] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [mostrarDetalleProductos, setMostrarDetalleProductos] = useState<boolean>(false)
  const [mostrarGuiaExplicativa, setMostrarGuiaExplicativa] = useState<boolean>(false)
  const [productos, setProductos] = useState<ProductoDetalle[]>([])

  // Manejo de múltiples proveedores
  const agregarProveedor = (nombre: string) => {
    const limpio = nombre.trim()
    if (!limpio) return
    if (!proveedoresSeleccionados.includes(limpio)) {
      setProveedoresSeleccionados([...proveedoresSeleccionados, limpio])
    }
    setTextoProveedor('')
  }

  const toggleProveedor = (nombre: string) => {
    if (proveedoresSeleccionados.includes(nombre)) {
      setProveedoresSeleccionados(proveedoresSeleccionados.filter((p) => p !== nombre))
    } else {
      setProveedoresSeleccionados([...proveedoresSeleccionados, nombre])
    }
  }

  const eliminarProveedor = (nombre: string) => {
    setProveedoresSeleccionados(proveedoresSeleccionados.filter((p) => p !== nombre))
  }

  // Manejo de comprobantes (cámara y galería)
  const handleSeleccionarArchivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      alert('Ocurrió un error al procesar las imágenes. Intenta nuevamente.')
    } finally {
      setCargandoFoto(false)
      e.target.value = ''
    }
  }

  const eliminarComprobante = (index: number) => {
    setComprobantes(comprobantes.filter((_, i) => i !== index))
  }

  // Configuración vigente de reparto
  const configGanancia = useMemo(() => {
    return StorageService.getConfiguracionVigente('ganancia', fecha)
  }, [fecha])

  const configSobrante = useMemo(() => {
    return StorageService.getConfiguracionVigente('sobrante', fecha)
  }, [fecha])

  // Cálculo en vivo del reparto para Ganar
  const repartoCalculado = useMemo(() => {
    if (tipo !== 'GANAR' || typeof montoGanado !== 'number' || montoGanado <= 0) return []
    if (!configGanancia) return []
    return calcularReparto(montoGanado, configGanancia.detalles)
  }, [tipo, montoGanado, configGanancia])

  // Valores normalizados para Comprar según el escenario seleccionado
  const valorAsignado = typeof montoAsignado === 'number' ? Math.max(0, montoAsignado) : 0
  const valorAdicional =
    resultadoCompra === 'ADICIONAL' && typeof montoAdicional === 'number'
      ? Math.max(0, montoAdicional)
      : 0
  const valorSobrante =
    resultadoCompra === 'SOBRANTE' && typeof montoSobrante === 'number'
      ? Math.max(0, montoSobrante)
      : 0

  // Cálculo del total comprado real
  const totalGastadoReal = useMemo(() => {
    return Math.max(0, Number((valorAsignado + valorAdicional - valorSobrante).toFixed(2)))
  }, [valorAsignado, valorAdicional, valorSobrante])

  // Validación de sobrante no mayor a asignado
  const errorSobrante = useMemo(() => {
    if (resultadoCompra === 'SOBRANTE' && valorSobrante > valorAsignado) {
      return `El vuelto (S/ ${valorSobrante.toFixed(2)}) no puede ser mayor que el dinero sacado de la caja (S/ ${valorAsignado.toFixed(2)})`
    }
    return null
  }, [resultadoCompra, valorSobrante, valorAsignado])

  // Proveedores comunes sugeridos
  const proveedoresFrecuentes = ['Makro', 'Vega', 'Metro', 'Mass', 'Mayorista']

  // Manejo de productos en Comprar
  const agregarProducto = () => {
    setProductos([
      ...productos,
      {
        id: 'prod-' + Date.now() + Math.random().toString(36).substring(2, 5),
        producto: '',
        cantidad: 1,
        costo_unitario: 0,
        subtotal: 0,
      },
    ])
    setMostrarDetalleProductos(true)
  }

  const actualizarProducto = (
    index: number,
    campo: keyof ProductoDetalle,
    valor: string | number
  ) => {
    const nuevos = [...productos]
    const prod = { ...nuevos[index], [campo]: valor }
    if (campo === 'cantidad' || campo === 'costo_unitario') {
      const cant = typeof prod.cantidad === 'number' ? prod.cantidad : 0
      const costo = typeof prod.costo_unitario === 'number' ? prod.costo_unitario : 0
      prod.subtotal = Number((cant * costo).toFixed(2))
    }
    nuevos[index] = prod
    setProductos(nuevos)
  }

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index))
  }

  const totalProductos = useMemo(() => {
    return Number(productos.reduce((acc, p) => acc + p.subtotal, 0).toFixed(2))
  }, [productos])

  if (!isOpen) return null

  // Guardar Movimiento
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const codigoGenerado = 'MOV-' + Date.now().toString().slice(-4)
    const movId = 'mov-' + Date.now()

    if (tipo === 'GANAR') {
      const monto = typeof montoGanado === 'number' ? montoGanado : 0
      if (monto <= 0) {
        alert('Por favor ingresa un monto ganado válido (mayor a 0)')
        return
      }

      const nuevoMov: Movimiento = {
        id: movId,
        codigo: codigoGenerado,
        fecha,
        tipo: 'GANAR',
        descripcion: descripcion.trim() || 'Recaudación de máquina expendedora',
        registrado_por: registradoPor,
        estado: 'REGISTRADO',
        monto_ganado: monto,
        periodo_desde: periodoDesde || undefined,
        periodo_hasta: periodoHasta || undefined,
        origen_ganancia: 'RECAUDACION',
        snapshot_porcentajes: configGanancia ? [...configGanancia.detalles] : [],
        reparto: repartoCalculado,
        creado_el: new Date().toISOString(),
      }

      onMovimientoGuardado(nuevoMov)
    } else {
      if (errorSobrante) {
        alert(errorSobrante)
        return
      }

      if (valorAsignado <= 0 && valorAdicional <= 0) {
        alert('Debes ingresar al menos el dinero sacado de la caja o el dinero aportado de bolsillo.')
        return
      }

      let movSobranteGenerado: Movimiento | undefined = undefined
      const destinoFinal = valorSobrante > 0 ? destinoSobrante : 'NINGUNO'
      let idMovSobrante: string | undefined = undefined

      if (valorSobrante > 0 && destinoSobrante === 'REPARTO') {
        idMovSobrante = 'mov-sob-' + Date.now()
        const repartoSocios = configSobrante
          ? calcularReparto(valorSobrante, configSobrante.detalles)
          : []

        movSobranteGenerado = {
          id: idMovSobrante,
          codigo: 'SOB-' + Date.now().toString().slice(-4),
          fecha,
          tipo: 'GANAR',
          descripcion: `Reparto de vuelto sobrante de compra ${codigoGenerado}`,
          registrado_por: registradoPor,
          estado: 'REGISTRADO',
          monto_ganado: valorSobrante,
          origen_ganancia: 'SOBRANTE_COMPRA',
          origen_movimiento_id: movId,
          snapshot_porcentajes: configSobrante ? [...configSobrante.detalles] : [],
          reparto: repartoSocios,
          creado_el: new Date().toISOString(),
        }
      }

      const listaFinalProveedores = [
        ...proveedoresSeleccionados,
        ...(textoProveedor.trim() && !proveedoresSeleccionados.includes(textoProveedor.trim())
          ? [textoProveedor.trim()]
          : []),
      ]

      const nuevoMov: Movimiento = {
        id: movId,
        codigo: codigoGenerado,
        fecha,
        tipo: 'COMPRAR',
        descripcion: descripcion.trim() || 'Compra de mercadería para la máquina',
        registrado_por: registradoPor,
        estado: 'REGISTRADO',
        monto_asignado: valorAsignado,
        monto_adicional: valorAdicional,
        monto_sobrante: valorSobrante,
        total_gastado: totalGastadoReal,
        proveedor: listaFinalProveedores.join(', ') || undefined,
        proveedores: listaFinalProveedores.length > 0 ? listaFinalProveedores : undefined,
        comprobante_url: comprobantes.length > 0 ? comprobantes[0] : undefined,
        comprobantes: comprobantes.length > 0 ? comprobantes : undefined,
        destino_sobrante: destinoFinal,
        quien_aporto_adicional: valorAdicional > 0 ? quienAportoAdicional : undefined,
        aportes_adicionales:
          valorAdicional > 0
            ? [
                {
                  id: 'ap-' + Date.now(),
                  participante_id: quienAportoAdicional,
                  monto: valorAdicional,
                  estado: 'PENDIENTE',
                },
              ]
            : undefined,
        detalle_productos: productos.length > 0 ? productos : undefined,
        movimiento_sobrante_repartido_id: idMovSobrante,
        creado_el: new Date().toISOString(),
      }

      onMovimientoGuardado(nuevoMov, movSobranteGenerado)
    }

    onClose()
  }

  // Nombre de quien aportó adicional para las explicaciones
  const socioAportante = participantes.find((p) => p.id === quienAportoAdicional)?.nombre || 'Socio'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[94vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                tipo === 'COMPRAR'
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-xs'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-xs'
              }`}
            >
              {tipo === 'COMPRAR' ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                {tipo === 'COMPRAR' ? 'Comprar Mercadería' : 'Registrar Recaudación'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {tipo === 'COMPRAR'
                  ? 'Calcula el gasto neto y controla si sobró vuelto o faltó dinero'
                  : 'Registra el dinero recaudado y repártelo automáticamente'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tipo (Ganar / Comprar) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setTipo('GANAR')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tipo === 'GANAR'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Ganar (Recaudación)
            </button>
            <button
              type="button"
              onClick={() => setTipo('COMPRAR')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tipo === 'COMPRAR'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Comprar (Mercadería)
            </button>
          </div>

          <form id="form-movimiento" onSubmit={handleSubmit} className="space-y-5">
            {/* Fecha y Registrado Por */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Fecha del Movimiento
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Registrado Por
                </label>
                <select
                  value={registradoPor}
                  onChange={(e) => setRegistradoPor(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
            {/* SECCIÓN COMPRAR (MERCADERÍA) - CLARA, PASO A PASO Y MÓVIL */}
            {/* ======================================================== */}
            {tipo === 'COMPRAR' && (
              <div className="space-y-4">
                {/* Botón de ayuda desplegable */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3">
                  <button
                    type="button"
                    onClick={() => setMostrarGuiaExplicativa(!mostrarGuiaExplicativa)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-amber-900 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-700" />
                      ¿Cómo funciona este formulario de compra?
                    </span>
                    {mostrarGuiaExplicativa ? (
                      <ChevronUp className="w-4 h-4 text-amber-700" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-amber-700" />
                    )}
                  </button>
                  {mostrarGuiaExplicativa && (
                    <div className="mt-2 text-[11px] text-amber-900/90 space-y-1.5 border-t border-amber-200/60 pt-2 leading-relaxed">
                      <p>
                        <strong>1. Dinero de Caja:</strong> Pon cuánto dinero sacaste del fondo de la máquina para ir a la tienda.
                      </p>
                      <p>
                        <strong>2. ¿Qué pasó al pagar?:</strong>
                        <br />• <em>Gasto exacto:</em> Se gastó todo lo que sacaste.
                        <br />• <em>Sobró vuelto:</em> La compra costó menos y traes vuelto en efectivo.
                        <br />• <em>Faltó plata:</em> La compra costó más y alguien puso de su bolsillo para completarlo.
                      </p>
                      <p>
                        El sistema calcula el gasto real automáticamente sin que tengas que hacer cálculos manuales.
                      </p>
                    </div>
                  )}
                </div>

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
                        setMontoAsignado(e.target.value ? parseFloat(e.target.value) : '')
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Atajos de montos comunes para agilizar en celular */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                      Sugeridos:
                    </span>
                    {[50, 100, 150, 200, 300].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMontoAsignado(m)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-[11px] font-bold text-slate-600 hover:text-amber-800 transition-colors shrink-0 cursor-pointer"
                      >
                        S/ {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PASO 2: ¿Cómo resultó la compra? (3 Estados Claros) */}
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 space-y-3 shadow-2xs">
                  <div>
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      ¿Cómo resultó la compra con ese dinero? *
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Selecciona una de las 3 opciones según lo que ocurrió en la tienda:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Opción 1: Exacto */}
                    <button
                      type="button"
                      onClick={() => {
                        setResultadoCompra('EXACTO')
                        setMontoSobrante('')
                        setMontoAdicional('')
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        resultadoCompra === 'EXACTO'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs">🎯 Costó Exacto</span>
                        {resultadoCompra === 'EXACTO' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Se gastó todo lo que se llevó. Ni sobró ni faltó.
                      </p>
                    </button>

                    {/* Opción 2: Sobró vuelto */}
                    <button
                      type="button"
                      onClick={() => {
                        setResultadoCompra('SOBRANTE')
                        setMontoAdicional('')
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        resultadoCompra === 'SOBRANTE'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs">💵 Sobró Dinero</span>
                        {resultadoCompra === 'SOBRANTE' && (
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Costó menos y trajiste vuelto en efectivo.
                      </p>
                    </button>

                    {/* Opción 3: Faltó y alguien completó */}
                    <button
                      type="button"
                      onClick={() => {
                        setResultadoCompra('ADICIONAL')
                        setMontoSobrante('')
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        resultadoCompra === 'ADICIONAL'
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs">💳 Faltó Dinero</span>
                        {resultadoCompra === 'ADICIONAL' && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Costó más y alguien puso de su billetera.
                      </p>
                    </button>
                  </div>

                  {/* CONTENIDO SI SOBRÓ DINERO */}
                  {resultadoCompra === 'SOBRANTE' && (
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                          ¿Cuánto dinero sobró de vuelto? (S/) *
                        </label>
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
                            onChange={(e) =>
                              setMontoSobrante(e.target.value ? parseFloat(e.target.value) : '')
                            }
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
                              Queda como saldo a favor de la máquina para la próxima compra
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
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              Repartir entre Socios
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                              Se divide según porcentajes (José Luis 40%, Marlon 30%, Jesús 30%)
                            </p>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO SI FALTÓ PLATA Y ALGUIEN COMPLETÓ */}
                  {resultadoCompra === 'ADICIONAL' && (
                    <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-indigo-950 uppercase mb-1">
                            ¿Cuánto dinero extra puso? (S/) *
                          </label>
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
                              onChange={(e) =>
                                setMontoAdicional(
                                  e.target.value ? parseFloat(e.target.value) : ''
                                )
                              }
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

                {/* TARJETA DE ENTENDIMIENTO FINANCIERO (RESUMEN EN TIEMPO REAL) */}
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

                  {/* Desglose visual */}
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

                  {/* Explicación en lenguaje humano */}
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

                {/* PASO 3: Lugares de Compra / Proveedores y Comprobantes */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                  {/* LUGARES DE COMPRA / PROVEEDORES MÚLTIPLES */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-slate-500" />
                        Lugar(es) de Compra / Proveedores (Opcional)
                      </label>
                      {proveedoresSeleccionados.length > 0 && (
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {proveedoresSeleccionados.length} seleccionado{proveedoresSeleccionados.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Puedes añadir varios lugares si compraste en distintos sitios (ej: Makro, Vega, etc.)
                    </p>

                    {/* Chips de Proveedores Seleccionados */}
                    {proveedoresSeleccionados.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {proveedoresSeleccionados.map((prov) => (
                          <span
                            key={prov}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs animate-in fade-in"
                          >
                            <Store className="w-3.5 h-3.5 text-amber-600" />
                            {prov}
                            <button
                              type="button"
                              onClick={() => eliminarProveedor(prov)}
                              className="ml-0.5 text-amber-600 hover:text-rose-600 rounded-full p-0.5 cursor-pointer"
                              title="Quitar proveedor"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Input y botón para añadir proveedor libre */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Escribe otro lugar (ej: Bodega, Mercado Central)..."
                        value={textoProveedor}
                        onChange={(e) => setTextoProveedor(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            agregarProveedor(textoProveedor)
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => agregarProveedor(textoProveedor)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        + Añadir
                      </button>
                    </div>

                    {/* Sugerencias de Proveedores Frecuentes (Toggle) */}
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                        Comunes:
                      </span>
                      {proveedoresFrecuentes.map((prov) => {
                        const estaSeleccionado = proveedoresSeleccionados.includes(prov)
                        return (
                          <button
                            key={prov}
                            type="button"
                            onClick={() => toggleProveedor(prov)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                              estaSeleccionado
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800'
                            }`}
                          >
                            {estaSeleccionado ? '✓ ' : '+'}{prov}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* SECCIÓN DE COMPROBANTES / FOTOS CON CÁMARA MÓVIL */}
                  {/* ======================================================== */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-indigo-600" />
                          Comprobantes / Boletas ({comprobantes.length})
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Toma fotos con la cámara de tu celular o sube boletas desde tu galería.
                        </p>
                      </div>
                      {comprobantes.length > 0 && (
                        <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          {comprobantes.length} foto{comprobantes.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Inputs ocultos para Cámara y Galería */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={cameraInputRef}
                      onChange={handleSeleccionarArchivos}
                      className="hidden"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={galleryInputRef}
                      onChange={handleSeleccionarArchivos}
                      className="hidden"
                    />

                    {/* Botones táctiles grandes para celular */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={cargandoFoto}
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Tomar Foto (Abrir Cámara)</span>
                      </button>

                      <button
                        type="button"
                        disabled={cargandoFoto}
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <ImageIcon className="w-4 h-4 text-slate-600" />
                        <span>Subir de Galería / Archivos</span>
                      </button>
                    </div>

                    {/* Indicador de proceso de imagen */}
                    {cargandoFoto && (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-xl border border-indigo-200">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        Optimizando imagen para celular...
                      </div>
                    )}

                    {/* Grid de Miniaturas de Comprobantes */}
                    {comprobantes.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                        {comprobantes.map((foto, index) => (
                          <div
                            key={index}
                            className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 aspect-4/3 flex flex-col justify-between shadow-2xs"
                          >
                            <img
                              src={foto}
                              alt={`Comprobante ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                              onClick={() => setFotoEnPantallaCompleta(foto)}
                            />

                            <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                              #{index + 1}
                            </span>

                            {/* Acciones Rápidas */}
                            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setFotoEnPantallaCompleta(foto)}
                                className="p-1 rounded-lg bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-colors cursor-pointer"
                                title="Ver en grande"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  descargarImagen(foto, `comprobante-${index + 1}.jpg`)
                                }
                                className="p-1 rounded-lg bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-colors cursor-pointer"
                                title="Descargar foto"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => eliminarComprobante(index)}
                                className="p-1 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                                title="Eliminar comprobante"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Acordeón para detalle de productos */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setMostrarDetalleProductos(!mostrarDetalleProductos)}
                      className="w-full flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Detalle de productos comprados ({productos.length})
                      </span>
                      {mostrarDetalleProductos ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {mostrarDetalleProductos && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            Anota qué snacks o bebidas compraste
                          </span>
                          <button
                            type="button"
                            onClick={agregarProducto}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar Fila
                          </button>
                        </div>

                        {productos.length > 0 ? (
                          <div className="space-y-2">
                            {productos.map((prod, index) => (
                              <div
                                key={prod.id}
                                className="flex items-center gap-1.5 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/80"
                              >
                                <input
                                  type="text"
                                  placeholder="Ej: Galleta Soda"
                                  value={prod.producto}
                                  onChange={(e) =>
                                    actualizarProducto(index, 'producto', e.target.value)
                                  }
                                  className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                />
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min="1"
                                  placeholder="Cant"
                                  title="Cantidad"
                                  value={prod.cantidad}
                                  onChange={(e) =>
                                    actualizarProducto(
                                      index,
                                      'cantidad',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-14 px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center text-xs"
                                />
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  min="0"
                                  placeholder="C.Unit"
                                  title="Costo Unitario S/"
                                  value={prod.costo_unitario}
                                  onChange={(e) =>
                                    actualizarProducto(
                                      index,
                                      'costo_unitario',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-right text-xs"
                                />
                                <span className="w-16 font-bold text-slate-800 text-right text-xs">
                                  {formatearMoneda(prod.subtotal)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => eliminarProducto(index)}
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Eliminar fila"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <div className="text-right text-xs font-bold text-slate-700 pt-1">
                              Suma productos: {formatearMoneda(totalProductos)}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-[11px] text-slate-400">
                              No has añadido productos aún. Pulsa en "+ Agregar Fila" si deseas registrar ítems detallados.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECCIÓN GANAR (RECAUDACIÓN) - CLARA, PASO A PASO Y MÓVIL */}
            {/* ======================================================== */}
            {tipo === 'GANAR' && (
              <div className="space-y-4">
                {/* Botón de ayuda desplegable */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3">
                  <button
                    type="button"
                    onClick={() => setMostrarGuiaGanar(!mostrarGuiaGanar)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-emerald-950 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-700" />
                      ¿Cómo funciona el registro de recaudación?
                    </span>
                    {mostrarGuiaGanar ? (
                      <ChevronUp className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-emerald-700" />
                    )}
                  </button>
                  {mostrarGuiaGanar && (
                    <div className="mt-2 text-[11px] text-emerald-950/90 space-y-1.5 border-t border-emerald-200/60 pt-2 leading-relaxed">
                      <p>
                        <strong>1. Efectivo Recaudado:</strong> Cuenta todas las monedas y billetes retirados del monedero/billetero de la máquina.
                      </p>
                      <p>
                        <strong>2. Reparto Oficial:</strong> El sistema divide el 100% de la ganancia según las reglas vigentes (José Luis 40%, Marlon 30%, Jesús 30%).
                      </p>
                      <p>
                        <strong>3. Auditoría Segura:</strong> Al guardar, se genera una copia histórica (snapshot) para que los porcentajes nunca se alteren en el futuro.
                      </p>
                    </div>
                  )}
                </div>

                {/* PASO 1: Dinero Recaudado */}
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 focus-within:border-emerald-500 transition-colors shadow-2xs">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                          1
                        </span>
                        ¿Cuánto dinero recaudaste de la máquina? *
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Total en efectivo (monedas y billetes) retirado de la máquina para repartir.
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
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={montoGanado}
                      onChange={(e) =>
                        setMontoGanado(e.target.value ? parseFloat(e.target.value) : '')
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Atajos de montos comunes para recaudación en celular */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                      Sugeridos:
                    </span>
                    {[100, 200, 300, 400, 500, 800, 1000].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMontoGanado(m)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-[11px] font-bold text-slate-600 hover:text-emerald-800 transition-colors shrink-0 cursor-pointer"
                      >
                        S/ {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PASO 2: Periodo de Recaudación (Opcional & Desplegable en Celular) */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Periodo de la Recaudación (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMostrarPeriodoGanar(!mostrarPeriodoGanar)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-0.5"
                    >
                      {mostrarPeriodoGanar ? 'Ocultar fechas' : 'Elegir fechas'}
                      {mostrarPeriodoGanar ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Botones rápidos de periodo */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setPeriodoUltimosDias(7)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 transition-colors shrink-0 cursor-pointer border border-emerald-200/60"
                    >
                      Últimos 7 días
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriodoUltimosDias(15)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 transition-colors shrink-0 cursor-pointer border border-emerald-200/60"
                    >
                      Últimos 15 días
                    </button>
                    <button
                      type="button"
                      onClick={setPeriodoMesActual}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 transition-colors shrink-0 cursor-pointer border border-emerald-200/60"
                    >
                      Este mes
                    </button>
                    {(periodoDesde || periodoHasta) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPeriodoDesde('')
                          setPeriodoHasta('')
                        }}
                        className="px-2 py-1 text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {mostrarPeriodoGanar && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Desde:
                        </span>
                        <input
                          type="date"
                          value={periodoDesde}
                          onChange={(e) => setPeriodoDesde(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Hasta:
                        </span>
                        <input
                          type="date"
                          value={periodoHasta}
                          onChange={(e) => setPeriodoHasta(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PASO 3: TARJETA DE DISTRIBUCIÓN DE GANANCIAS EN VIVO */}
                <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs uppercase font-extrabold tracking-wider text-slate-200 block">
                          Reparto de Ganancias en Vivo
                        </span>
                        <span className="text-[10px] text-emerald-300 font-medium">
                          Según porcentajes vigentes aprobados
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Total a Repartir
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-400">
                        {formatearMoneda(typeof montoGanado === 'number' ? montoGanado : 0)}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Socios y Reparto */}
                  <div className="space-y-2">
                    {configGanancia && configGanancia.detalles.length > 0 ? (
                      configGanancia.detalles.map((det) => {
                        const part = participantes.find((p) => p.id === det.participante_id)
                        const repItem = repartoCalculado.find((r) => r.participante_id === det.participante_id)
                        const montoAsignadoSocio = repItem ? repItem.monto : 0
                        const tienePorcentaje = det.porcentaje > 0

                        return (
                          <div
                            key={det.participante_id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              tienePorcentaje
                                ? 'bg-white/10 border-white/15'
                                : 'bg-white/5 border-white/5 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-black text-xs">
                                  {part?.nombre.charAt(0) || 'P'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-xs text-white">
                                      {part?.nombre}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                      {det.porcentaje}%
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">{part?.rol}</p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-black text-sm text-emerald-400">
                                  {formatearMoneda(montoAsignadoSocio)}
                                </span>
                              </div>
                            </div>

                            {/* Barra de Proporción Visual */}
                            {tienePorcentaje && (
                              <div className="mt-2 w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${det.porcentaje}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No hay porcentajes configurados para esta fecha.
                      </p>
                    )}
                  </div>

                  {/* Explicación en lenguaje humano ("En palabras sencillas") */}
                  <div className="bg-white/10 p-3 rounded-xl text-xs text-slate-200 leading-relaxed border border-white/10">
                    <p className="font-bold text-emerald-300 mb-0.5">💡 En palabras sencillas:</p>
                    {typeof montoGanado === 'number' && montoGanado > 0 ? (
                      <p>
                        De los <strong>{formatearMoneda(montoGanado)}</strong> retirados de la máquina:
                        {repartoCalculado
                          .filter((r) => r.monto > 0)
                          .map((r) => {
                            const socio = participantes.find((p) => p.id === r.participante_id)
                            return ` ${socio?.nombre} recibe ${formatearMoneda(r.monto)} (${r.porcentaje_aplicado}%)`
                          })
                          .join(', ')}
                        . Se aplicó redondeo exacto de centavos.
                      </p>
                    ) : (
                      <p className="text-slate-300">
                        Escribe el dinero recaudado o toca un botón sugerido arriba para ver la división exacta en soles que le toca a cada socio.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Descripción general con atajos rápidos */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Nota / Glosa Opcional
              </label>
              <input
                type="text"
                placeholder={
                  tipo === 'GANAR'
                    ? 'Ej: Recaudación fin de semana, monedas retiradas'
                    : 'Ej: Galletas Oreo, Coca Cola, reabastecimiento general'
                }
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
              />

              {/* Chips de notas rápidas para celular */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                  Rápidos:
                </span>
                {(tipo === 'GANAR'
                  ? ['Recaudación semanal', 'Corte fin de mes', 'Vaciado de monedero', 'Cierre quincenal']
                  : ['Reabastecimiento general', 'Bebidas y gaseosas', 'Snacks y galletas', 'Golosinas']
                ).map((glosa) => (
                  <button
                    key={glosa}
                    type="button"
                    onClick={() => setDescripcion(glosa)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600 transition-colors shrink-0 cursor-pointer"
                  >
                    +{glosa}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer con Botones Táctiles Grandes para Celular */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-movimiento"
            className={`px-6 py-2.5 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer ${
              tipo === 'COMPRAR'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            Guardar {tipo === 'COMPRAR' ? 'Compra' : 'Recaudación'}
          </button>
        </div>
      </div>

      {/* Modal Lightbox de Pantalla Completa para Visualizar y Descargar Comprobante */}
      {fotoEnPantallaCompleta && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="max-w-2xl w-full flex items-center justify-between text-white pb-3 px-1">
            <span className="font-extrabold text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              Comprobante de Compra
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => descargarImagen(fotoEnPantallaCompleta, 'comprobante.jpg')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
              <button
                type="button"
                onClick={() => setFotoEnPantallaCompleta(null)}
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all cursor-pointer"
                title="Cerrar vista previa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="max-w-2xl w-full max-h-[82vh] overflow-auto flex items-center justify-center p-2 bg-black/40 rounded-2xl border border-white/10">
            <img
              src={fotoEnPantallaCompleta}
              alt="Comprobante ampliado"
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import {
  X,
  TrendingUp,
  ShoppingBag,
  Calculator,
  Plus,
  Trash2,
} from 'lucide-react'
import type { Movimiento, Participante, ProductoDetalle } from '../types'
import { StorageService } from '../utils/storage'
import { calcularReparto, formatearMoneda } from '../utils/calculations'

interface RegistrarMovimientoModalProps {
  isOpen: boolean
  onClose: () => void
  participantes: Participante[]
  onMovimientoGuardado: (mov: Movimiento, movSobranteAsociado?: Movimiento) => void
}

export const RegistrarMovimientoModal: React.FC<RegistrarMovimientoModalProps> = ({
  isOpen,
  onClose,
  participantes,
  onMovimientoGuardado,
}) => {
  if (!isOpen) return null

  const hoyStr = new Date().toISOString().slice(0, 10)
  const [tipo, setTipo] = useState<'GANAR' | 'COMPRAR'>('GANAR')
  const [fecha, setFecha] = useState<string>(hoyStr)
  const [descripcion, setDescripcion] = useState<string>('')
  const [registradoPor, setRegistradoPor] = useState<string>(
    participantes[0]?.id || ''
  )

  // Estado para GANAR
  const [montoGanado, setMontoGanado] = useState<number | ''>('')
  const [periodoDesde, setPeriodoDesde] = useState<string>('')
  const [periodoHasta, setPeriodoHasta] = useState<string>('')

  // Estado para COMPRAR
  const [montoAsignado, setMontoAsignado] = useState<number | ''>('')
  const [montoAdicional, setMontoAdicional] = useState<number | ''>('')
  const [quienAportoAdicional, setQuienAportoAdicional] = useState<string>(
    participantes[0]?.id || ''
  )
  const [montoSobrante, setMontoSobrante] = useState<number | ''>('')
  const [destinoSobrante, setDestinoSobrante] = useState<'CAJA' | 'REPARTO'>('CAJA')
  const [proveedor, setProveedor] = useState<string>('')
  const [productos, setProductos] = useState<ProductoDetalle[]>([])

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

  // Cálculo del total comprado
  const totalGastadoReal = useMemo(() => {
    const asignado = typeof montoAsignado === 'number' ? montoAsignado : 0
    const adicional = typeof montoAdicional === 'number' ? montoAdicional : 0
    const sobrante = typeof montoSobrante === 'number' ? montoSobrante : 0
    return Math.max(0, Number((asignado + adicional - sobrante).toFixed(2)))
  }, [montoAsignado, montoAdicional, montoSobrante])

  // Validación de sobrante no mayor a asignado
  const errorSobrante = useMemo(() => {
    const asignado = typeof montoAsignado === 'number' ? montoAsignado : 0
    const sobrante = typeof montoSobrante === 'number' ? montoSobrante : 0
    if (sobrante > asignado) {
      return 'El monto sobrante no puede ser mayor al monto asignado'
    }
    return null
  }, [montoAsignado, montoSobrante])

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

  // Guardar Movimiento
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const codigoGenerado = 'MOV-' + Date.now().toString().slice(-4)
    const movId = 'mov-' + Date.now()

    if (tipo === 'GANAR') {
      const monto = typeof montoGanado === 'number' ? montoGanado : 0
      if (monto <= 0) {
        alert('Por favor ingresa un monto ganado válido')
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

      const asignado = typeof montoAsignado === 'number' ? montoAsignado : 0
      const adicional = typeof montoAdicional === 'number' ? montoAdicional : 0
      const sobrante = typeof montoSobrante === 'number' ? montoSobrante : 0

      if (asignado <= 0 && adicional <= 0) {
        alert('Debes ingresar al menos un monto asignado o un monto adicional')
        return
      }

      let movSobranteGenerado: Movimiento | undefined = undefined
      let destinoFinal = sobrante > 0 ? destinoSobrante : 'NINGUNO'
      let idMovSobrante: string | undefined = undefined

      if (sobrante > 0 && destinoSobrante === 'REPARTO') {
        idMovSobrante = 'mov-sob-' + Date.now()
        const repartoSocios = configSobrante
          ? calcularReparto(sobrante, configSobrante.detalles)
          : []

        movSobranteGenerado = {
          id: idMovSobrante,
          codigo: 'SOB-' + Date.now().toString().slice(-4),
          fecha,
          tipo: 'GANAR',
          descripcion: `Reparto de sobrante de compra ${codigoGenerado}`,
          registrado_por: registradoPor,
          estado: 'REGISTRADO',
          monto_ganado: sobrante,
          origen_ganancia: 'SOBRANTE_COMPRA',
          origen_movimiento_id: movId,
          snapshot_porcentajes: configSobrante ? [...configSobrante.detalles] : [],
          reparto: repartoSocios,
          creado_el: new Date().toISOString(),
        }
      }

      const nuevoMov: Movimiento = {
        id: movId,
        codigo: codigoGenerado,
        fecha,
        tipo: 'COMPRAR',
        descripcion: descripcion.trim() || 'Compra de mercadería para la máquina',
        registrado_por: registradoPor,
        estado: 'REGISTRADO',
        monto_asignado: asignado,
        monto_adicional: adicional,
        monto_sobrante: sobrante,
        total_gastado: totalGastadoReal,
        proveedor: proveedor.trim() || undefined,
        destino_sobrante: destinoFinal as any,
        quien_aporto_adicional: adicional > 0 ? quienAportoAdicional : undefined,
        aportes_adicionales:
          adicional > 0
            ? [{ id: 'ap-' + Date.now(), participante_id: quienAportoAdicional, monto: adicional, estado: 'PENDIENTE' }]
            : undefined,
        detalle_productos: productos.length > 0 ? productos : undefined,
        movimiento_sobrante_repartido_id: idMovSobrante,
        creado_el: new Date().toISOString(),
      }

      onMovimientoGuardado(nuevoMov, movSobranteGenerado)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Registrar Nuevo Movimiento
            </h3>
            <p className="text-xs text-slate-500">
              Registra una recaudación o compra con reparto y validación automática
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tipo */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setTipo('GANAR')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
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
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                tipo === 'COMPRAR'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Comprar (Mercadería)
            </button>
          </div>

          <form id="form-movimiento" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fecha del Movimiento
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Registrado Por
                </label>
                <select
                  value={registradoPor}
                  onChange={(e) => setRegistradoPor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {participantes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.rol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FORMULARIO ESPECÍFICO: GANAR */}
            {tipo === 'GANAR' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Monto Ganado (Recaudación Retirada S/) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      S/
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={montoGanado}
                      onChange={(e) =>
                        setMontoGanado(e.target.value ? parseFloat(e.target.value) : '')
                      }
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Periodo Desde (Opcional)
                    </label>
                    <input
                      type="date"
                      value={periodoDesde}
                      onChange={(e) => setPeriodoDesde(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Periodo Hasta (Opcional)
                    </label>
                    <input
                      type="date"
                      value={periodoHasta}
                      onChange={(e) => setPeriodoHasta(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Previsualización en Vivo del Reparto */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                      <Calculator className="w-4 h-4 text-emerald-700" />
                      Reparto Automático Según % Vigentes
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Total: {formatearMoneda(typeof montoGanado === 'number' ? montoGanado : 0)}
                    </span>
                  </div>

                  {repartoCalculado.length > 0 ? (
                    <div className="space-y-1.5 text-xs">
                      {repartoCalculado.map((rep, idx) => {
                        const part = participantes.find((p) => p.id === rep.participante_id)
                        const esUltimo = idx === repartoCalculado.length - 1
                        return (
                          <div
                            key={rep.participante_id}
                            className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white/80 border border-emerald-100"
                          >
                            <span className="font-semibold text-slate-800">
                              {part?.nombre} ({rep.porcentaje_aplicado}%)
                              {esUltimo && (
                                <span className="ml-1 text-[10px] text-emerald-600 font-normal">
                                  *ajuste centavos
                                </span>
                              )}
                            </span>
                            <span className="font-bold text-emerald-800">
                              {formatearMoneda(rep.monto)}
                            </span>
                          </div>
                        )
                      })}
                      <p className="text-[10px] text-emerald-700 italic pt-1">
                        *El sistema guarda una foto (snapshot) de estos porcentajes para que los reportes históricos no cambien.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 italic">
                      Ingresa el monto ganado para ver el cálculo del reparto en vivo.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* FORMULARIO ESPECÍFICO: COMPRAR */}
            {tipo === 'COMPRAR' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Monto Asignado (De caja/presupuesto) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={montoAsignado}
                        onChange={(e) =>
                          setMontoAsignado(e.target.value ? parseFloat(e.target.value) : '')
                        }
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Monto Extra Puesto (Adicional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={montoAdicional}
                        onChange={(e) =>
                          setMontoAdicional(e.target.value ? parseFloat(e.target.value) : '')
                        }
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Quién aportó el adicional */}
                {typeof montoAdicional === 'number' && montoAdicional > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                      ¿Quién aportó el monto adicional (S/ {montoAdicional})?
                    </label>
                    <select
                      value={quienAportoAdicional}
                      onChange={(e) => setQuienAportoAdicional(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      {participantes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.rol})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Quedará registrado como aporte pendiente por reconocer o devolver.
                    </p>
                  </div>
                )}

                {/* Monto Sobrante */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Monto Sobrante (Si sobró dinero)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={montoSobrante}
                        onChange={(e) =>
                          setMontoSobrante(e.target.value ? parseFloat(e.target.value) : '')
                        }
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                      />
                    </div>
                    {errorSobrante && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        {errorSobrante}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Proveedor (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Makro, Vega, etc."
                      value={proveedor}
                      onChange={(e) => setProveedor(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Manejo de Sobrante */}
                {typeof montoSobrante === 'number' && montoSobrante > 0 && (
                  <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2">
                    <label className="block text-xs font-black text-indigo-900 uppercase">
                      Destino del Sobrante de S/ {montoSobrante.toFixed(2)}:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setDestinoSobrante('CAJA')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          destinoSobrante === 'CAJA'
                            ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 font-bold text-indigo-900 shadow-xs'
                            : 'bg-white/60 border-slate-200 text-slate-700'
                        }`}
                      >
                        <p className="font-bold">a) Devolver a Caja</p>
                        <p className="text-[11px] text-slate-500">Queda como saldo para la próxima compra</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDestinoSobrante('REPARTO')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          destinoSobrante === 'REPARTO'
                            ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 font-bold text-indigo-900 shadow-xs'
                            : 'bg-white/60 border-slate-200 text-slate-700'
                        }`}
                      >
                        <p className="font-bold">b) Repartir entre Socios</p>
                        <p className="text-[11px] text-slate-500">Genera movimiento Ganar entre los 3 socios</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Resumen Gasto Real */}
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">
                      Total Gastado Real de la Compra
                    </p>
                    <p className="text-[11px] text-slate-300">
                      (Asignado + Adicional − Sobrante)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-400">
                      {formatearMoneda(totalGastadoReal)}
                    </span>
                  </div>
                </div>

                {/* Detalle Productos */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      Detalle de Productos Comprados (Opcional)
                    </span>
                    <button
                      type="button"
                      onClick={agregarProducto}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar Producto
                    </button>
                  </div>

                  {productos.length > 0 ? (
                    <div className="space-y-2">
                      {productos.map((prod, index) => (
                        <div key={prod.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="text"
                            placeholder="Producto (ej. Coca Cola)"
                            value={prod.producto}
                            onChange={(e) =>
                              actualizarProducto(index, 'producto', e.target.value)
                            }
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Cant"
                            value={prod.cantidad}
                            onChange={(e) =>
                              actualizarProducto(
                                index,
                                'cantidad',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="C.Unit"
                            value={prod.costo_unitario}
                            onChange={(e) =>
                              actualizarProducto(
                                index,
                                'costo_unitario',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-right"
                          />
                          <span className="w-20 font-bold text-slate-800 text-right">
                            {formatearMoneda(prod.subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => eliminarProducto(index)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="text-right text-xs font-bold text-slate-700 pt-1">
                        Suma de productos: {formatearMoneda(totalProductos)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No hay productos agregados. Puedes agregarlos para llevar control de lo comprado.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Descripción / Glosa (Opcional)
              </label>
              <input
                type="text"
                placeholder={
                  tipo === 'GANAR'
                    ? 'Ej: Recaudación fin de mes, monedas retiradas'
                    : 'Ej: Compra de gaseosas y galletas para rellenar'
                }
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-movimiento"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition-colors cursor-pointer"
          >
            Guardar Movimiento
          </button>
        </div>
      </div>
    </div>
  )
}

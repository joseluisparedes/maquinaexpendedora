import React, { useMemo, useState } from 'react'
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
  Check,
  ChevronDown,
  ChevronUp,
  Undo2,
  Bell,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { calcularBalance, formatearMoneda } from '../utils/calculations'

interface DetalleCajaModalProps {
  isOpen: boolean
  onClose: () => void
  movimientos: Movimiento[]
  participantes: Participante[]
  onVerDetalleMovimiento?: (mov: Movimiento) => void
  onCambiarEstadoAporte?: (movimientoId: string, nuevoEstado: 'DEVUELTO' | 'PENDIENTE') => Promise<void>
  onAbrirModalDevolucion?: () => void
}

interface ItemFlujoCaja {
  movimiento: Movimiento
  fecha: string
  codigo: string
  tipo: 'GANAR' | 'COMPRAR'
  descripcion: string
  responsableNombre: string
  impactoTipo: 'ENTRADA' | 'SALIDA' | 'NEUTRO'
  montoImpacto: number
  saldoPosterior: number
  notaExtra?: string
}

interface AporteDetalleItem {
  movimientoId: string
  codigo: string
  fecha: string
  socioId: string
  socioNombre: string
  monto: number
  estado: 'PENDIENTE' | 'DEVUELTO'
  fecha_devolucion?: string
  devuelto_por?: string
}

export const DetalleCajaModal: React.FC<DetalleCajaModalProps> = ({
  isOpen,
  onClose,
  movimientos,
  participantes,
  onVerDetalleMovimiento,
  onCambiarEstadoAporte,
  onAbrirModalDevolucion,
}) => {
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADAS' | 'SALIDAS'>('TODOS')
  const [mostrarHistorialDevueltos, setMostrarHistorialDevueltos] = useState(false)
  const [procesandoAporteId, setProcesandoAporteId] = useState<string | null>(null)

  const partMap = useMemo(() => {
    const map = new Map<string, Participante>()
    participantes.forEach((p) => map.set(p.id, p))
    return map
  }, [participantes])

  const balance = useMemo(() => calcularBalance(movimientos), [movimientos])

  // Desglose cronológico con saldo acumulado (Kardex de Caja) y Aportes
  const { flujoCompleto, totalEntradas, totalSalidas, aportesPendientes, aportesDevueltos } = useMemo(() => {
    const activos = movimientos
      .filter((m) => m.estado === 'REGISTRADO')
      .slice()
      .sort((a, b) => {
        const fA = a.fecha || ''
        const fB = b.fecha || ''
        if (fA !== fB) return fA.localeCompare(fB)
        const tA = a.creado_el || ''
        const tB = b.creado_el || ''
        if (tA && tB) return tA.localeCompare(tB)
        return a.codigo.localeCompare(b.codigo)
      })

    let acumulado = 0
    let entradas = 0
    let salidas = 0

    const items: ItemFlujoCaja[] = []
    const pendientesList: AporteDetalleItem[] = []
    const devueltosList: AporteDetalleItem[] = []

    for (const mov of activos) {
      const regPor = partMap.get(mov.registrado_por)?.nombre || mov.registrado_por

      if (mov.tipo === 'GANAR') {
        const monto = mov.monto_ganado || 0

        if (mov.origen_ganancia === 'SOBRANTE_COMPRA') {
          // El sobrante repartido no añade dinero fresco a la caja (ya fue descontado en la compra)
          items.push({
            movimiento: mov,
            fecha: mov.fecha,
            codigo: mov.codigo,
            tipo: 'GANAR',
            descripcion: mov.descripcion || 'Sobrante de compra repartido',
            responsableNombre: regPor,
            impactoTipo: 'NEUTRO',
            montoImpacto: 0,
            saldoPosterior: acumulado,
            notaExtra: 'Sobrante repartido directamente a socios',
          })
        } else {
          acumulado += monto
          entradas += monto
          items.push({
            movimiento: mov,
            fecha: mov.fecha,
            codigo: mov.codigo,
            tipo: 'GANAR',
            descripcion: mov.descripcion || 'Recaudación de máquina ingresada a caja',
            responsableNombre: regPor,
            impactoTipo: 'ENTRADA',
            montoImpacto: monto,
            saldoPosterior: acumulado,
          })
        }
      } else {
        // COMPRAR
        const asignado = mov.monto_asignado || 0
        const adicional = mov.monto_adicional || 0
        const sobrante = mov.monto_sobrante || 0
        const gastadoReal = mov.total_gastado ?? Math.max(0, asignado + adicional - sobrante)

        let impactoCaja = 0
        let nota: string | undefined

        if (adicional > 0) {
          // Afectación total de la compra (ej: 210 asignado + 40 extra = 250 gastado real)
          impactoCaja = gastadoReal
          const nombreAporto = partMap.get(mov.quien_aporto_adicional || '')?.nombre || 'Socio'
          
          // Verificar si ya fue devuelto
          const estaDevuelto = Boolean(
            mov.aporte_devuelto ||
            (mov.aportes_adicionales && mov.aportes_adicionales.some((a) => a.estado === 'DEVUELTO'))
          )

          nota = estaDevuelto
            ? `Faltó: +${formatearMoneda(adicional)} (Devuelto a ${nombreAporto})`
            : `Faltó dinero: +${formatearMoneda(adicional)} puesto por ${nombreAporto}`

          // Clasificar para la lista de aportes
          if (mov.aportes_adicionales && mov.aportes_adicionales.length > 0) {
            mov.aportes_adicionales.forEach((ap) => {
              const item: AporteDetalleItem = {
                movimientoId: mov.id,
                codigo: mov.codigo,
                fecha: mov.fecha,
                socioId: ap.participante_id,
                socioNombre: partMap.get(ap.participante_id)?.nombre || ap.participante_id,
                monto: ap.monto,
                estado: ap.estado,
                fecha_devolucion: ap.fecha_devolucion,
                devuelto_por: ap.devuelto_por,
              }
              if (ap.estado === 'DEVUELTO') {
                devueltosList.push(item)
              } else {
                pendientesList.push(item)
              }
            })
          } else {
            const item: AporteDetalleItem = {
              movimientoId: mov.id,
              codigo: mov.codigo,
              fecha: mov.fecha,
              socioId: mov.quien_aporto_adicional || 'Desconocido',
              socioNombre: nombreAporto,
              monto: adicional,
              estado: estaDevuelto ? 'DEVUELTO' : 'PENDIENTE',
              fecha_devolucion: mov.fecha_devolucion_aporte,
              devuelto_por: mov.devuelto_por,
            }
            if (estaDevuelto) {
              devueltosList.push(item)
            } else {
              pendientesList.push(item)
            }
          }
        } else {
          impactoCaja = asignado
          if (mov.destino_sobrante === 'CAJA' && sobrante > 0) {
            impactoCaja -= sobrante
            nota = `Sobrante devuelto a caja: ${formatearMoneda(sobrante)}`
          }
        }

        acumulado -= impactoCaja
        salidas += impactoCaja

        items.push({
          movimiento: mov,
          fecha: mov.fecha,
          codigo: mov.codigo,
          tipo: 'COMPRAR',
          descripcion: mov.descripcion || 'Compra de mercadería / insumos',
          responsableNombre: regPor,
          impactoTipo: 'SALIDA',
          montoImpacto: impactoCaja,
          saldoPosterior: acumulado,
          notaExtra: nota,
        })
      }
    }

    return {
      flujoCompleto: items.reverse(),
      totalEntradas: entradas,
      totalSalidas: salidas,
      aportesPendientes: pendientesList,
      aportesDevueltos: devueltosList,
    }
  }, [movimientos, partMap])

  const flujoFiltrado = useMemo(() => {
    if (filtroTipo === 'ENTRADAS') {
      return flujoCompleto.filter((i) => i.impactoTipo === 'ENTRADA')
    }
    if (filtroTipo === 'SALIDAS') {
      return flujoCompleto.filter((i) => i.impactoTipo === 'SALIDA')
    }
    return flujoCompleto
  }, [flujoCompleto, filtroTipo])

  const handleMarcarDevuelto = async (ap: AporteDetalleItem) => {
    if (
      window.confirm(
        `¿Confirmar que ya se le devolvió / reembolsó ${formatearMoneda(ap.monto)} al socio ${ap.socioNombre} por el movimiento ${ap.codigo}?`
      )
    ) {
      if (onCambiarEstadoAporte) {
        setProcesandoAporteId(ap.movimientoId)
        try {
          await onCambiarEstadoAporte(ap.movimientoId, 'DEVUELTO')
        } finally {
          setProcesandoAporteId(null)
        }
      }
    }
  }

  const handleRevertirDevuelto = async (ap: AporteDetalleItem) => {
    if (
      window.confirm(
        `¿Deseas revertir este reembolso de ${formatearMoneda(ap.monto)} a ${ap.socioNombre} y volver a marcarlo como PENDIENTE?`
      )
    ) {
      if (onCambiarEstadoAporte) {
        setProcesandoAporteId(ap.movimientoId)
        try {
          await onCambiarEstadoAporte(ap.movimientoId, 'PENDIENTE')
        } finally {
          setProcesandoAporteId(null)
        }
      }
    }
  }

  if (!isOpen) return null

  const esSaldoPositivo = balance.saldoCaja >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Detalle de Caja Operativa
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Arqueo y conciliación de fondos en tiempo real
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

        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs sm:text-sm">
          {/* Tarjeta Principal: Saldo Actual y Ecuación */}
          <div
            className={`p-5 rounded-3xl border ${
              esSaldoPositivo
                ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white border-emerald-700/50'
                : 'bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 text-white border-rose-700/50'
            } shadow-md`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-80 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Saldo Disponible en Caja
                </span>
                <p className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
                  {formatearMoneda(balance.saldoCaja)}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  {esSaldoPositivo
                    ? 'Efectivo disponible para compras y abastecimiento de la máquina'
                    : 'Caja con saldo negativo por compras mayores a la recaudación'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 space-y-1.5 shrink-0 min-w-[210px] text-xs">
                <div className="flex justify-between items-center text-emerald-200">
                  <span>(+) Total Entradas:</span>
                  <span className="font-extrabold">{formatearMoneda(totalEntradas)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-200">
                  <span>(−) Total Salidas:</span>
                  <span className="font-extrabold">{formatearMoneda(totalSalidas)}</span>
                </div>
                <div className="border-t border-white/20 pt-1.5 flex justify-between items-center font-black">
                  <span>(=) Saldo en Caja:</span>
                  <span>{formatearMoneda(balance.saldoCaja)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Aportes de Socios */}
          {aportesPendientes.length > 0 ? (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl space-y-3 text-amber-950 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wide text-amber-900">
                    Aportes Pendientes por Devolver a Socios ({aportesPendientes.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-black text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-xl">
                    Total: +{formatearMoneda(aportesPendientes.reduce((acc, a) => acc + a.monto, 0))}
                  </span>
                  {onAbrirModalDevolucion && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onAbrirModalDevolucion()
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                      title="Abrir formulario para devolver varios socios o adjuntar fotos"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Devolver Varios / Con Foto</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Cuando no hubo suficiente saldo en caja, los siguientes socios cubrieron el faltante con su dinero personal. Toca <strong>«Marcar Devuelto»</strong> en cuanto se le entregue su reembolso:
              </p>

              <div className="space-y-2 pt-1">
                {aportesPendientes.map((ap) => (
                  <div
                    key={`${ap.movimientoId}-${ap.socioId}`}
                    className="p-3 bg-white rounded-2xl border border-amber-200 text-xs shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{ap.socioNombre}</span>
                        <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg text-xs">
                          +{formatearMoneda(ap.monto)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Faltante en compra <strong className="font-mono text-slate-700">{ap.codigo}</strong> • {ap.fecha}
                      </p>
                    </div>

                    <button
                      onClick={() => handleMarcarDevuelto(ap)}
                      disabled={procesandoAporteId === ap.movimientoId}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                      title="Registrar que ya se le devolvió el dinero al socio"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Marcar Devuelto</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  No hay aportes pendientes por devolver. Todos los socios están al día.
                </span>
              </div>
            </div>
          )}

          {/* Historial de Aportes Ya Devueltos si existen */}
          {aportesDevueltos.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <button
                onClick={() => setMostrarHistorialDevueltos(!mostrarHistorialDevueltos)}
                className="w-full flex items-center justify-between text-slate-700 font-bold cursor-pointer hover:text-slate-900"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Historial de Aportes Devueltos / Reembolsados ({aportesDevueltos.length})
                </span>
                {mostrarHistorialDevueltos ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {mostrarHistorialDevueltos && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  {aportesDevueltos.map((ap) => (
                    <div
                      key={`dev-${ap.movimientoId}-${ap.socioId}`}
                      className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 text-xs shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{ap.socioNombre}</span>
                          <span className="text-emerald-700 font-extrabold">+{formatearMoneda(ap.monto)}</span>
                          <span className="text-slate-400 font-mono">({ap.codigo})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          ✓ Reembolsado {ap.fecha_devolucion ? `el ${ap.fecha_devolucion}` : 'satisfactoriamente'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRevertirDevuelto(ap)}
                        disabled={procesandoAporteId === ap.movimientoId}
                        className="text-slate-400 hover:text-rose-600 flex items-center gap-1 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-[11px]"
                        title="Deshacer y volver a marcar como deuda pendiente"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Deshacer</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Barra de Filtros del Kardex */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Movimientos que afectaron la Caja ({flujoFiltrado.length})
              </span>

              <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs self-start sm:self-auto">
                <button
                  onClick={() => setFiltroTipo('TODOS')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filtroTipo === 'TODOS'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFiltroTipo('ENTRADAS')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filtroTipo === 'ENTRADAS'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Entradas (+)
                </button>
                <button
                  onClick={() => setFiltroTipo('SALIDAS')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filtroTipo === 'SALIDAS'
                      ? 'bg-white text-rose-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Salidas (−)
                </button>
              </div>
            </div>

            {/* Listado Cronológico de Movimientos */}
            {flujoFiltrado.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400 italic">
                No hay movimientos para este filtro.
              </p>
            ) : (
              <div className="space-y-2">
                {flujoFiltrado.map((item) => {
                  const esEntrada = item.impactoTipo === 'ENTRADA'
                  const esSalida = item.impactoTipo === 'SALIDA'

                  return (
                    <div
                      key={item.movimiento.id}
                      onClick={() => onVerDetalleMovimiento && onVerDetalleMovimiento(item.movimiento)}
                      className="p-3 bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            esEntrada
                              ? 'bg-emerald-100 text-emerald-700'
                              : esSalida
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {esEntrada ? (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                          ) : esSalida ? (
                            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {item.codigo}
                            </span>
                            <span className="text-[10px] text-slate-400">• {item.fecha}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                item.tipo === 'GANAR'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.tipo}
                            </span>
                          </div>

                          <p className="font-medium text-slate-800 text-xs mt-0.5 max-w-sm truncate">
                            {item.descripcion}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span>Por: <strong className="text-slate-600 font-bold">{item.responsableNombre}</strong></span>
                            {item.notaExtra && (
                              <span className="text-amber-700 font-extrabold bg-amber-100/80 px-1.5 rounded-md">
                                {item.notaExtra}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Montos: Impacto en caja y Saldo resultante */}
                      <div className="text-right shrink-0 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200/50">
                        <div
                          className={`font-black text-sm ${
                            esEntrada
                              ? 'text-emerald-700'
                              : esSalida
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {esEntrada && `+${formatearMoneda(item.montoImpacto)}`}
                          {esSalida && `−${formatearMoneda(item.montoImpacto)}`}
                          {!esEntrada && !esSalida && 'S/ 0.00'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Saldo en caja: <span className="font-bold text-slate-700">{formatearMoneda(item.saldoPosterior)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Toca cualquier movimiento para ver su comprobante y desglose completo.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

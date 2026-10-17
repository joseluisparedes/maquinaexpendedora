import React, { useState } from 'react'
import {
  X,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  Ban,
  Store,
  Receipt,
  Eye,
  Download,
  AlertTriangle,
  Check,
  Undo2,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'
import { descargarImagen } from '../utils/imageHelper'
import { obtenerDeudasDeMovimiento } from '../utils/deudasHelper'

interface DetalleMovimientoModalProps {
  movimiento: Movimiento | null
  onClose: () => void
  participantes: Participante[]
  onCambiarEstadoAporte?: (movId: string, nuevoEstado: 'DEVUELTO' | 'PENDIENTE') => Promise<void>
}

export const DetalleMovimientoModal: React.FC<DetalleMovimientoModalProps> = ({
  movimiento,
  onClose,
  participantes,
  onCambiarEstadoAporte,
}) => {
  const [fotoEnPantallaCompleta, setFotoEnPantallaCompleta] = useState<string | null>(null)

  if (!movimiento) return null

  const partMap = new Map<string, Participante>()
  participantes.forEach((p) => partMap.set(p.id, p))

  const regPor = partMap.get(movimiento.registrado_por)?.nombre || movimiento.registrado_por
  const esGanar = movimiento.tipo === 'GANAR'
  const esAnulado = movimiento.estado === 'ANULADO'

  // Normalizar lista de comprobantes
  const comprobantesLista: string[] =
    movimiento.comprobantes && movimiento.comprobantes.length > 0
      ? movimiento.comprobantes
      : movimiento.comprobante_url
      ? [movimiento.comprobante_url]
      : []

  // Normalizar lista de proveedores
  const proveedoresLista: string[] =
    movimiento.proveedores && movimiento.proveedores.length > 0
      ? movimiento.proveedores
      : movimiento.proveedor
      ? movimiento.proveedor.split(',').map((p) => p.trim()).filter(Boolean)
      : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 text-base">{movimiento.codigo}</span>
            {esAnulado ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                <Ban className="w-3 h-3" /> Anulado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Registrado
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {/* Alerta de Anulado si aplica */}
          {esAnulado && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
              <p className="font-bold">Movimiento Anulado</p>
              <p className="text-xs mt-0.5">
                Motivo: {movimiento.motivo_anulacion || 'Sin motivo especificado'}
              </p>
            </div>
          )}

          {/* Datos Principales */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Tipo</p>
              <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                {esGanar ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                )}
                {movimiento.tipo}
                {movimiento.origen_ganancia === 'SOBRANTE_COMPRA' && ' (Sobrante repartido)'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Fecha</p>
              <p className="font-bold text-slate-900 mt-0.5">{movimiento.fecha}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Registrado Por</p>
              <p className="font-bold text-slate-900 mt-0.5">{regPor}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Monto Total</p>
              <p className="font-black text-slate-900 mt-0.5 text-base">
                {esGanar
                  ? formatearMoneda(movimiento.monto_ganado || 0)
                  : formatearMoneda(movimiento.total_gastado || 0)}
              </p>
            </div>
          </div>

          {/* Proveedores / Lugares de Compra */}
          {proveedoresLista.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                Lugar(es) de Compra ({proveedoresLista.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {proveedoresLista.map((prov) => (
                  <span
                    key={prov}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-950 border border-amber-200 rounded-xl text-xs font-bold"
                  >
                    <Store className="w-3 h-3 text-amber-600" />
                    {prov}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          {movimiento.descripcion && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Descripción / Glosa</p>
              <p className="text-slate-800 mt-1 font-medium">{movimiento.descripcion}</p>
            </div>
          )}

          {/* Desglose GANAR: Snapshot de Porcentajes y Reparto */}
          {esGanar && movimiento.reparto && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 uppercase">
                  Desglose del Reparto (Snapshot histórico)
                </p>
                <span className="text-[11px] text-slate-400">Centavos redondeados al último</span>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {movimiento.reparto.map((item) => {
                  const p = partMap.get(item.participante_id)
                  return (
                    <div
                      key={item.participante_id}
                      className="flex items-center justify-between px-3.5 py-2.5 text-xs bg-white"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{p?.nombre || item.participante_id}</span>
                        <span className="text-slate-400 ml-1.5">({item.porcentaje_aplicado}%)</span>
                      </div>
                      <span className="font-black text-emerald-700">
                        {formatearMoneda(item.monto)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Desglose COMPRAR */}
          {!esGanar && (
            <div className="space-y-3">
              {(movimiento.monto_adicional || 0) > 0 && (() => {
                const estaDevuelto = Boolean(
                  movimiento.aporte_devuelto ||
                  (movimiento.aportes_adicionales && movimiento.aportes_adicionales.some((a) => a.estado === 'DEVUELTO'))
                )
                const socioNombre = partMap.get(movimiento.quien_aporto_adicional || '')?.nombre || 'Socio'

                if (estaDevuelto) {
                  return (
                    <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-900">
                            ✓ Faltante de dinero devuelto (+{formatearMoneda(movimiento.monto_adicional || 0)})
                          </p>
                          <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                            El aporte personal de <strong className="text-emerald-950 font-black">{socioNombre}</strong> ya fue reembolsado
                            {movimiento.fecha_devolucion_aporte ? ` el ${movimiento.fecha_devolucion_aporte}` : ''}.
                          </p>
                        </div>
                      </div>
                      {onCambiarEstadoAporte && (
                        <button
                          onClick={() => onCambiarEstadoAporte(movimiento.id, 'PENDIENTE')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                          title="Volver a marcar como deuda pendiente"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Deshacer</span>
                        </button>
                      )}
                    </div>
                  )
                }

                return (
                  <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-amber-900">
                          ⚠️ Faltó dinero en caja (+{formatearMoneda(movimiento.monto_adicional || 0)}) — Pendiente
                        </p>
                        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                          El socio <strong className="text-amber-950 font-black">{socioNombre}</strong> cubrió este faltante de su propio bolsillo. Gasto total de la compra: <strong className="font-black text-slate-900">{formatearMoneda(movimiento.total_gastado || 0)}</strong>.
                        </p>
                      </div>
                    </div>
                    {onCambiarEstadoAporte && (
                      <button
                        onClick={() => onCambiarEstadoAporte(movimiento.id, 'DEVUELTO')}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer active:scale-95 self-start sm:self-auto"
                        title="Registrar que ya se le devolvió el dinero al socio"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Marcar Devuelto</span>
                      </button>
                    )}
                  </div>
                )
              })()}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Monto Asignado (Caja):</span>
                  <span className="font-bold text-slate-900">
                    {formatearMoneda(movimiento.monto_asignado || 0)}
                  </span>
                </div>
                {(movimiento.monto_adicional || 0) > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>
                      Monto Extra Aportado ({partMap.get(movimiento.quien_aporto_adicional || '')?.nombre || 'Socio'}):
                    </span>
                    <span className="font-bold">+{formatearMoneda(movimiento.monto_adicional || 0)}</span>
                  </div>
                )}
                {(movimiento.monto_sobrante || 0) > 0 && (
                  <div className="flex justify-between text-indigo-700">
                    <span>
                      Monto Sobrante ({movimiento.destino_sobrante === 'CAJA' ? 'Devuelto a caja' : 'Repartido a socios'}):
                    </span>
                    <span className="font-bold">−{formatearMoneda(movimiento.monto_sobrante || 0)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
                  <span>Gasto Total Real:</span>
                  <span className="text-sm font-black">{formatearMoneda(movimiento.total_gastado || 0)}</span>
                </div>
              </div>

              {(movimiento.monto_adicional || 0) > 0 && (
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-amber-900 uppercase tracking-wider">
                    <span>División de Cuotas entre Socios:</span>
                    <span className="font-bold text-amber-700">Faltante: +{formatearMoneda(movimiento.monto_adicional || 0)}</span>
                  </div>
                  <div className="divide-y divide-amber-100 text-xs">
                    {obtenerDeudasDeMovimiento(movimiento, participantes).map((d) => {
                      const deudorNombre = partMap.get(d.deudor_id)?.nombre || d.deudor_id
                      return (
                        <div key={d.id} className="py-2 flex items-center justify-between">
                          <span className="font-semibold text-slate-700">{deudorNombre}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {formatearMoneda(d.monto_pagado ?? d.monto_cuota)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                d.estado === 'SALDADO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : d.estado === 'PAGADO'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {d.estado}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {movimiento.detalle_productos && movimiento.detalle_productos.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase mb-2">
                    Productos Adquiridos ({movimiento.detalle_productos.length})
                  </p>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {movimiento.detalle_productos.map((prod) => (
                      <div key={prod.id} className="flex items-center justify-between px-3.5 py-2">
                        <div>
                          <p className="font-bold text-slate-800">{prod.producto}</p>
                          <p className="text-[10px] text-slate-400">
                            {prod.cantidad} unid. × {formatearMoneda(prod.costo_unitario)}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatearMoneda(prod.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comprobantes / Fotos de Boletas */}
          {comprobantesLista.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  Comprobantes Adjuntos ({comprobantesLista.length})
                </p>
                <span className="text-[10px] text-slate-400">Toca para ampliar o descargar</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {comprobantesLista.map((foto, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 aspect-4/3 flex flex-col justify-between shadow-2xs"
                  >
                    <img
                      src={foto}
                      alt={`Comprobante ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => setFotoEnPantallaCompleta(foto)}
                    />
                    <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                      #{idx + 1}
                    </span>
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
                          descargarImagen(foto, `comprobante-${movimiento.codigo}-${idx + 1}.jpg`)
                        }
                        className="p-1 rounded-lg bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-colors cursor-pointer"
                        title="Descargar comprobante"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comprobantes / Fotos de la Devolución si existen */}
          {movimiento.comprobantes_devolucion && movimiento.comprobantes_devolucion.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Vouchers / Fotos de Devolución ({movimiento.comprobantes_devolucion.length})
                </p>
                <span className="text-[10px] text-slate-400">Constancia de reembolso</span>
              </div>
              {movimiento.observaciones_devolucion && (
                <p className="text-xs text-slate-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 font-medium">
                  Nota: {movimiento.observaciones_devolucion}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {movimiento.comprobantes_devolucion.map((foto, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 aspect-4/3 flex flex-col justify-between shadow-2xs"
                  >
                    <img
                      src={foto}
                      alt={`Comprobante devolución ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => setFotoEnPantallaCompleta(foto)}
                    />
                    <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                      #{idx + 1}
                    </span>
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
                          descargarImagen(foto, `devolucion-${movimiento.codigo}-${idx + 1}.jpg`)
                        }
                        className="p-1 rounded-lg bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-colors cursor-pointer"
                        title="Descargar comprobante"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Lightbox para previsualización ampliada y descarga */}
      {fotoEnPantallaCompleta && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="max-w-2xl w-full flex items-center justify-between text-white pb-3 px-1">
            <span className="font-extrabold text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              Comprobante ({movimiento.codigo})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  descargarImagen(fotoEnPantallaCompleta, `comprobante-${movimiento.codigo}.jpg`)
                }
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

import React, { useState } from 'react'
import {
  X,
  Camera,
  ShoppingBag,
  TrendingUp,
  Clock,
  Eye,
  Receipt,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Coins,
  Sparkles,
} from 'lucide-react'
import type { CicloMaquina, Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface DetalleCicloModalProps {
  isOpen: boolean
  onClose: () => void
  ciclo: CicloMaquina | null
  movimientos: Movimiento[]
  participantes?: Participante[]
  onVerMovimiento?: (m: Movimiento) => void
}

export const DetalleCicloModal: React.FC<DetalleCicloModalProps> = ({
  isOpen,
  onClose,
  ciclo,
  movimientos,
  participantes = [],
  onVerMovimiento,
}) => {
  const [tabActiva, setTabActiva] = useState<'fotos' | 'finanzas' | 'timeline'>('fotos')
  const [fotoAntesIndex, setFotoAntesIndex] = useState(0)
  const [fotoDespuesIndex, setFotoDespuesIndex] = useState(0)

  // Estado para el modal de zoom con navegación entre fotos
  const [zoomData, setZoomData] = useState<{
    fotos: string[]
    indice: number
    titulo: string
  } | null>(null)

  if (!isOpen || !ciclo) return null

  const esAbastecimiento = ciclo.tipo === 'ABASTECIMIENTO'
  const cerrado = ciclo.estado === 'CERRADO'

  // Movimientos vinculados a este ciclo
  const movsVinculados = movimientos.filter(
    (m) => ciclo.movimiento_ids?.includes(m.id) || m.ciclo_id === ciclo.id
  )
  const movPrincipal = movsVinculados[0]

  // Lista de fotos antes y después seguras
  const listaFotosAntes: string[] =
    ciclo.fotos_antes_urls && ciclo.fotos_antes_urls.length > 0
      ? ciclo.fotos_antes_urls
      : ciclo.foto_antes_url
      ? [ciclo.foto_antes_url]
      : []

  const listaFotosDespues: string[] =
    ciclo.fotos_despues_urls && ciclo.fotos_despues_urls.length > 0
      ? ciclo.fotos_despues_urls
      : ciclo.foto_despues_url
      ? [ciclo.foto_despues_url]
      : []

  const fotoAntesActual = listaFotosAntes[fotoAntesIndex] || listaFotosAntes[0]
  const fotoDespuesActual = listaFotosDespues[fotoDespuesIndex] || listaFotosDespues[0]

  const getNombreParticipante = (id?: string) => {
    if (!id) return 'No especificado'
    const part = participantes.find((p) => p.id === id)
    return part ? part.nombre : id
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Ciclo con estilo ejecutivo */}
        <div
          className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between ${
            esAbastecimiento
              ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/5 to-slate-50 border-amber-100'
              : 'bg-gradient-to-r from-emerald-500/15 via-teal-500/5 to-slate-50 border-emerald-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 ${
                esAbastecimiento
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
              }`}
            >
              {esAbastecimiento ? (
                <ShoppingBag className="w-5 h-5 stroke-[2.3]" />
              ) : (
                <TrendingUp className="w-5 h-5 stroke-[2.3]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  {ciclo.codigo}
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    esAbastecimiento
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  Ruta de {esAbastecimiento ? 'Abastecimiento' : 'Ganancia'}
                </span>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    cerrado
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-emerald-600 text-white animate-pulse'
                  }`}
                >
                  {ciclo.estado}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-bold mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{ciclo.fecha_inicio} a las {ciclo.hora_inicio}</span>
                <span className="text-slate-300">•</span>
                <span>Por: <strong className="text-slate-800">{ciclo.iniciado_por_nombre || 'Operador'}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta de Resumen Rápido / KPIs del Ciclo */}
        <div className="bg-slate-50/70 border-b border-slate-100 px-5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Etapa Operativa Actual
            </span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {ciclo.etapa_actual}
            </span>
          </div>

          {movPrincipal && (
            <div className="flex items-center gap-4">
              {esAbastecimiento && movPrincipal.total_gastado !== undefined && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Gasto Total</span>
                  <span className="text-sm font-black text-amber-900">
                    {formatearMoneda(movPrincipal.total_gastado)}
                  </span>
                </div>
              )}

              {!esAbastecimiento && movPrincipal.monto_ganado !== undefined && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Recaudación Neta</span>
                  <span className="text-sm font-black text-emerald-900">
                    +{formatearMoneda(movPrincipal.monto_ganado)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pestañas de Navegación del Resumen */}
        <div className="flex border-b border-slate-200 px-5 sm:px-6 bg-white gap-2">
          <button
            type="button"
            onClick={() => setTabActiva('fotos')}
            className={`py-3 px-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              tabActiva === 'fotos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Auditoría de Fotos ({listaFotosAntes.length + listaFotosDespues.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('finanzas')}
            className={`py-3 px-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              tabActiva === 'finanzas'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Balance & Productos</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('timeline')}
            className={`py-3 px-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              tabActiva === 'timeline'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Línea de Tiempo</span>
          </button>
        </div>

        {/* Contenido con Scroll de la Pestaña Activa */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          
          {/* TAB 1: AUDITORÍA MULTIMEDIA (FOTOS ANTES VS DESPUÉS) */}
          {tabActiva === 'fotos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* BLOQUE FOTOS ANTES */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="px-3.5 py-2.5 bg-white border-b border-slate-200/80 flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Fotos ANTES ({listaFotosAntes.length})
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ciclo.hora_inicio}
                      </span>
                    </div>

                    {listaFotosAntes.length > 0 ? (
                      <div className="p-3 space-y-2.5">
                        {/* Visor de la foto seleccionada */}
                        <div
                          onClick={() =>
                            setZoomData({
                              fotos: listaFotosAntes,
                              indice: fotoAntesIndex,
                              titulo: `Fotos ANTES (${fotoAntesIndex + 1} de ${listaFotosAntes.length})`,
                            })
                          }
                          className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group cursor-pointer border border-slate-200"
                        >
                          <img
                            src={fotoAntesActual}
                            alt={`Foto Antes ${fotoAntesIndex + 1}`}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 left-2 bg-slate-950/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                            {fotoAntesIndex + 1} / {listaFotosAntes.length}
                          </div>
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 font-bold text-xs">
                            <Eye className="w-4 h-4" /> Ver ampliada
                          </div>
                        </div>

                        {/* Tira de miniaturas si hay más de 1 foto */}
                        {listaFotosAntes.length > 1 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                            {listaFotosAntes.map((fUrl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setFotoAntesIndex(idx)}
                                className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                                  idx === fotoAntesIndex
                                    ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105'
                                    : 'border-slate-200 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <img src={fUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 italic">No hay foto registrada</div>
                    )}
                  </div>

                  <div className="px-3.5 py-2.5 bg-white border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    {ciclo.observaciones_antes && (
                      <p className="italic text-slate-700 font-medium">"{ciclo.observaciones_antes}"</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Iniciado por: <strong className="text-slate-700">{ciclo.iniciado_por_nombre || 'Operador'}</strong>
                    </p>
                  </div>
                </div>

                {/* BLOQUE FOTOS DESPUÉS */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="px-3.5 py-2.5 bg-white border-b border-slate-200/80 flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            listaFotosDespues.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        Fotos DESPUÉS ({listaFotosDespues.length})
                      </span>
                      {ciclo.hora_despues && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {ciclo.hora_despues}
                        </span>
                      )}
                    </div>

                    {listaFotosDespues.length > 0 ? (
                      <div className="p-3 space-y-2.5">
                        {/* Visor de la foto seleccionada */}
                        <div
                          onClick={() =>
                            setZoomData({
                              fotos: listaFotosDespues,
                              indice: fotoDespuesIndex,
                              titulo: `Fotos DESPUÉS (${fotoDespuesIndex + 1} de ${listaFotosDespues.length})`,
                            })
                          }
                          className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group cursor-pointer border border-slate-200"
                        >
                          <img
                            src={fotoDespuesActual}
                            alt={`Foto Después ${fotoDespuesIndex + 1}`}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 left-2 bg-slate-950/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                            {fotoDespuesIndex + 1} / {listaFotosDespues.length}
                          </div>
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 font-bold text-xs">
                            <Eye className="w-4 h-4" /> Ver ampliada
                          </div>
                        </div>

                        {/* Tira de miniaturas si hay más de 1 foto */}
                        {listaFotosDespues.length > 1 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                            {listaFotosDespues.map((fUrl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setFotoDespuesIndex(idx)}
                                className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                                  idx === fotoDespuesIndex
                                    ? 'border-emerald-600 ring-2 ring-emerald-200 scale-105'
                                    : 'border-slate-200 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <img src={fUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 italic space-y-1.5">
                        <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs">
                          {esAbastecimiento
                            ? 'Pendiente de registrar foto final de vitrina abastecida'
                            : 'Cierre automático tras el registro del movimiento de ganancia'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-3.5 py-2.5 bg-white border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    {ciclo.observaciones_despues && (
                      <p className="italic text-slate-700 font-medium">"{ciclo.observaciones_despues}"</p>
                    )}
                    {ciclo.cerrado_por_nombre && (
                      <p className="text-[10px] text-slate-400">
                        Cerrado por: <strong className="text-slate-700">{ciclo.cerrado_por_nombre}</strong>
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: DETALLE ECONÓMICO, PRODUCTOS Y REPARTO */}
          {tabActiva === 'finanzas' && (
            <div className="space-y-4">
              {movsVinculados.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200 text-slate-400 italic space-y-1">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Aún no se ha vinculado ningún movimiento económico a este ciclo.</p>
                </div>
              ) : (
                movsVinculados.map((mov) => {
                  const tieneProductos = mov.detalle_productos && mov.detalle_productos.length > 0
                  const tieneReparto = mov.reparto && mov.reparto.length > 0

                  return (
                    <div
                      key={mov.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
                    >
                      {/* Cabecera del Movimiento */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {mov.codigo}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                mov.tipo === 'GANAR'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {mov.tipo}
                            </span>
                          </div>
                          <p className="text-slate-800 font-bold mt-1 text-sm">
                            {mov.descripcion || 'Sin descripción'}
                          </p>
                        </div>

                        <div className="text-left sm:text-right flex items-center justify-between sm:justify-end gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total</span>
                            <span className="text-base font-black text-slate-900">
                              {mov.tipo === 'GANAR'
                                ? `+${formatearMoneda(mov.monto_ganado || 0)}`
                                : `-${formatearMoneda(mov.total_gastado || 0)}`}
                            </span>
                          </div>

                          {onVerMovimiento && (
                            <button
                              type="button"
                              onClick={() => onVerMovimiento(mov)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Ficha</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Desglose de Fondos en Compra */}
                      {mov.tipo === 'COMPRAR' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">De Caja Máquina</span>
                            <span className="font-bold text-slate-800">
                              {formatearMoneda(mov.monto_asignado || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Aporte Adicional</span>
                            <span className="font-bold text-indigo-700">
                              {formatearMoneda(mov.monto_adicional || 0)}
                            </span>
                            {mov.quien_aporto_adicional && (
                              <span className="text-[10px] text-slate-500 block truncate">
                                Por: {getNombreParticipante(mov.quien_aporto_adicional)}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Gasto Real</span>
                            <span className="font-black text-amber-900">
                              {formatearMoneda(mov.total_gastado || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Sobrante</span>
                            <span className="font-bold text-emerald-700">
                              {formatearMoneda(mov.monto_sobrante || 0)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Destino: {mov.destino_sobrante || 'Caja'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tabla de Productos Comprados */}
                      {tieneProductos && (
                        <div className="space-y-2">
                          <span className="font-black text-slate-700 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                            <PackageCheck className="w-4 h-4 text-amber-600" />
                            Productos Comprados ({mov.detalle_productos!.length}):
                          </span>
                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100/80 text-slate-600 font-bold text-[11px] uppercase">
                                <tr>
                                  <th className="py-2 px-3">Producto</th>
                                  <th className="py-2 px-3 text-center">Cant.</th>
                                  <th className="py-2 px-3 text-right">C/U</th>
                                  <th className="py-2 px-3 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {mov.detalle_productos!.map((p, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3 font-semibold text-slate-800">{p.producto}</td>
                                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-600">
                                      {p.cantidad}
                                    </td>
                                    <td className="py-2 px-3 text-right text-slate-600 font-mono">
                                      {formatearMoneda(p.costo_unitario)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-black text-slate-900 font-mono">
                                      {formatearMoneda(p.subtotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Tabla de Reparto de Ganancias */}
                      {tieneReparto && (
                        <div className="space-y-2">
                          <span className="font-black text-slate-700 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                            <Coins className="w-4 h-4 text-emerald-600" />
                            Reparto entre Beneficiarios:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mov.reparto!.map((rep, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    {getNombreParticipante(rep.participante_id)}
                                  </span>
                                  <span className="text-[10px] text-emerald-800 font-bold">
                                    {rep.porcentaje_aplicado ?? (rep as any).porcentaje}% acordado
                                  </span>
                                </div>
                                <span className="font-black text-emerald-950 font-mono text-sm">
                                  {formatearMoneda(rep.monto)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 3: LÍNEA DE TIEMPO DEL CICLO */}
          {tabActiva === 'timeline' && (
            <div className="space-y-4">
              <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6 my-2 text-xs">
                
                {/* Paso 1: Inicio de Ciclo */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                    1
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-sm block">Apertura del Ciclo</span>
                    <p className="text-slate-500 font-medium mt-0.5">
                      {ciclo.fecha_inicio} a las {ciclo.hora_inicio} • Iniciado por {ciclo.iniciado_por_nombre || 'Operador'}
                    </p>
                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Se registraron {listaFotosAntes.length} foto(s) del estado inicial de la vitrina.</span>
                    </div>
                  </div>
                </div>

                {/* Paso 2: Acción Contable */}
                <div className="relative">
                  <div
                    className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                      movPrincipal ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-sm block">
                      {esAbastecimiento ? 'Compra de Mercadería' : 'Retiro de Recaudación'}
                    </span>
                    {movPrincipal ? (
                      <p className="text-slate-500 font-medium mt-0.5">
                        Movimiento {movPrincipal.codigo} registrado el {movPrincipal.fecha} por {getNombreParticipante(movPrincipal.registrado_por)}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic mt-0.5">Pendiente de registro contable</p>
                    )}
                  </div>
                </div>

                {/* Paso 3: Cierre */}
                <div className="relative">
                  <div
                    className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                      cerrado ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-sm block">
                      Cierre de Ciclo y Auditoría
                    </span>
                    {cerrado ? (
                      <p className="text-slate-500 font-medium mt-0.5">
                        {ciclo.fecha_despues} a las {ciclo.hora_despues || 'Cierre'} • Cerrado por {ciclo.cerrado_por_nombre || 'Operador'}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic mt-0.5">
                        {esAbastecimiento ? 'Esperando foto final de vitrina llena' : 'Esperando distribución'}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            Máquina Expendedora • Ciclo {ciclo.codigo}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Resumen
          </button>
        </div>

        {/* Modal de Zoom Avanzado con Carrusel / Navegación */}
        {zoomData && (
          <div
            onClick={() => setZoomData(null)}
            className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between text-white text-xs font-bold mb-2 px-1">
                <span>{zoomData.titulo}</span>
                <button
                  type="button"
                  onClick={() => setZoomData(null)}
                  className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="relative w-full max-h-[80vh] flex items-center justify-center">
                <img
                  src={zoomData.fotos[zoomData.indice]}
                  alt="Vista ampliada"
                  className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl"
                />

                {zoomData.fotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setZoomData((prev) =>
                          prev
                            ? {
                                ...prev,
                                indice: (prev.indice - 1 + prev.fotos.length) % prev.fotos.length,
                                titulo: `${prev.titulo.split('(')[0]}(${
                                  ((prev.indice - 1 + prev.fotos.length) % prev.fotos.length) + 1
                                } de ${prev.fotos.length})`,
                              }
                            : null
                        )
                      }
                      className="absolute left-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer backdrop-blur-xs transition-colors"
                      title="Foto anterior"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setZoomData((prev) =>
                          prev
                            ? {
                                ...prev,
                                indice: (prev.indice + 1) % prev.fotos.length,
                                titulo: `${prev.titulo.split('(')[0]}(${
                                  ((prev.indice + 1) % prev.fotos.length) + 1
                                } de ${prev.fotos.length})`,
                              }
                            : null
                        )
                      }
                      className="absolute right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer backdrop-blur-xs transition-colors"
                      title="Foto siguiente"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {zoomData.fotos.length > 1 && (
                <div className="flex items-center gap-1.5 mt-3">
                  {zoomData.fotos.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === zoomData.indice ? 'bg-white scale-125' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

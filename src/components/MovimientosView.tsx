import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  Eye,
  Ban,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
} from 'lucide-react'
import type { Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface MovimientosViewProps {
  movimientos: Movimiento[]
  participantes: Participante[]
  onNuevoMovimiento: () => void
  onVerDetalle: (mov: Movimiento) => void
  onAnular: (mov: Movimiento) => void
}

export const MovimientosView: React.FC<MovimientosViewProps> = ({
  movimientos,
  participantes,
  onNuevoMovimiento,
  onVerDetalle,
  onAnular,
}) => {
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'GANAR' | 'COMPRAR'>('TODOS')
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'REGISTRADO' | 'ANULADO'>('TODOS')
  const [filtroParticipante, setFiltroParticipante] = useState<string>('TODOS')

  const participantesMap = useMemo(() => {
    const map = new Map<string, Participante>()
    participantes.forEach((p) => map.set(p.id, p))
    return map
  }, [participantes])

  // Filtrado reactivo
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const query = busqueda.toLowerCase().trim()
      const matchBusqueda =
        !query ||
        m.codigo.toLowerCase().includes(query) ||
        m.descripcion.toLowerCase().includes(query) ||
        (m.proveedor && m.proveedor.toLowerCase().includes(query))

      const matchTipo = filtroTipo === 'TODOS' || m.tipo === filtroTipo
      const matchEstado = filtroEstado === 'TODOS' || m.estado === filtroEstado

      const matchParticipante =
        filtroParticipante === 'TODOS' ||
        m.registrado_por === filtroParticipante ||
        (m.reparto && m.reparto.some((r) => r.participante_id === filtroParticipante)) ||
        m.quien_aporto_adicional === filtroParticipante

      return matchBusqueda && matchTipo && matchEstado && matchParticipante
    })
  }, [movimientos, busqueda, filtroTipo, filtroEstado, filtroParticipante])

  // Exportar a CSV (Excel compatible)
  const exportarCSV = () => {
    const headers = [
      'Código',
      'Fecha',
      'Tipo',
      'Descripción',
      'Estado',
      'Registrado Por',
      'Monto Ganado (S/)',
      'Monto Asignado (S/)',
      'Monto Adicional (S/)',
      'Monto Sobrante (S/)',
      'Total Gastado (S/)',
      'Destino Sobrante',
      'Proveedor',
      'Motivo Anulación',
    ]

    const rows = movimientosFiltrados.map((m) => {
      const regPor = participantesMap.get(m.registrado_por)?.nombre || m.registrado_por
      return [
        `"${m.codigo}"`,
        `"${m.fecha}"`,
        `"${m.tipo}"`,
        `"${m.descripcion.replace(/"/g, '""')}"`,
        `"${m.estado}"`,
        `"${regPor}"`,
        m.monto_ganado ?? '',
        m.monto_asignado ?? '',
        m.monto_adicional ?? '',
        m.monto_sobrante ?? '',
        m.total_gastado ?? '',
        `"${m.destino_sobrante ?? ''}"`,
        `"${(m.proveedor ?? '').replace(/"/g, '""')}"`,
        `"${(m.motivo_anulacion ?? '').replace(/"/g, '""')}"`,
      ].join(';')
    })

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `movimientos_vending_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descripción, código o proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={exportarCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Descargar libro de movimientos en CSV/Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>

            <button
              onClick={onNuevoMovimiento}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Movimiento
            </button>
          </div>
        </div>

        {/* Filtros rápidos en pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filtros:
          </div>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {(['TODOS', 'GANAR', 'COMPRAR'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  filtroTipo === t
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'TODOS' ? 'Todos los tipos' : t}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {(['TODOS', 'REGISTRADO', 'ANULADO'] as const).map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  filtroEstado === e
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {e === 'TODOS' ? 'Todos estados' : e === 'REGISTRADO' ? 'Activos' : 'Anulados'}
              </button>
            ))}
          </div>

          <select
            value={filtroParticipante}
            onChange={(e) => setFiltroParticipante(e.target.value)}
            className="bg-slate-100 border-none rounded-lg px-2.5 py-1 text-slate-700 font-medium text-xs focus:ring-1 focus:ring-indigo-500"
          >
            <option value="TODOS">Todos los participantes</option>
            {participantes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.rol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista / Tabla de Movimientos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {movimientosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No se encontraron movimientos</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Prueba cambiando los filtros seleccionados o registra un nuevo movimiento para comenzar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código / Fecha</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descripción / Proveedor</th>
                  <th className="py-3 px-4">Registrado Por</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientosFiltrados.map((mov) => {
                  const regPor = participantesMap.get(mov.registrado_por)?.nombre || mov.registrado_por
                  const esAnulado = mov.estado === 'ANULADO'
                  const esGanar = mov.tipo === 'GANAR'

                  return (
                    <tr
                      key={mov.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        esAnulado ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{mov.codigo}</div>
                        <div className="text-[11px] text-slate-500">{mov.fecha}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {esGanar ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            Ganar
                            {mov.origen_ganancia === 'SOBRANTE_COMPRA' && (
                              <span className="ml-1 text-[9px] bg-emerald-200 text-emerald-800 px-1 rounded">
                                Sobrante
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <ArrowDownRight className="w-3 h-3 text-amber-600" />
                            Comprar
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-medium text-slate-800 truncate" title={mov.descripcion}>
                          {mov.descripcion || 'Sin descripción'}
                        </p>
                        {mov.proveedor && (
                          <p className="text-[11px] text-indigo-600 truncate">
                            Prov: {mov.proveedor}
                          </p>
                        )}
                        {esAnulado && mov.motivo_anulacion && (
                          <p className="text-[11px] text-rose-600 italic">
                            Motivo anulación: {mov.motivo_anulacion}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">{regPor}</td>

                      <td className="py-3.5 px-4 text-right">
                        {esGanar ? (
                          <div>
                            <span className="font-black text-sm text-emerald-700">
                              +{formatearMoneda(mov.monto_ganado || 0)}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {mov.reparto ? `${mov.reparto.length} participantes` : 'Sin reparto'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-black text-sm text-slate-900">
                              {formatearMoneda(mov.total_gastado || 0)}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              Asignado: {formatearMoneda(mov.monto_asignado || 0)}
                              {(mov.monto_adicional || 0) > 0 && ` + S/ ${mov.monto_adicional} extra`}
                              {(mov.monto_sobrante || 0) > 0 && ` − S/ ${mov.monto_sobrante} sobró`}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {mov.estado === 'REGISTRADO' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Registrado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            Anulado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onVerDetalle(mov)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver desglose completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {mov.estado === 'REGISTRADO' && (
                            <button
                              onClick={() => onAnular(mov)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Anular movimiento con motivo de auditoría"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

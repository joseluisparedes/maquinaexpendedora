import React, { useState, useMemo } from 'react'
import {
  ShoppingBag,
  TrendingUp,
  Filter,
  CheckCircle2,
  Clock,
  Camera,
  ArrowRight,
  Plus,
} from 'lucide-react'
import type { CicloMaquina, Movimiento, Participante } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface CiclosViewProps {
  ciclos: CicloMaquina[]
  movimientos?: Movimiento[]
  participantes?: Participante[]
  usuarioActual?: Participante
  onAbrirIniciarCiclo: () => void
  onVerDetalleCiclo: (ciclo: CicloMaquina) => void
  onAbrirCerrarAbastecimiento?: (ciclo: CicloMaquina) => void
}

export const CiclosView: React.FC<CiclosViewProps> = ({
  ciclos,
  movimientos = [],
  usuarioActual,
  onAbrirIniciarCiclo,
  onVerDetalleCiclo,
  onAbrirCerrarAbastecimiento,
}) => {
  const puedeIniciarCiclo = Boolean(
    usuarioActual &&
      (usuarioActual.rol === 'Operador de Máquina' ||
        usuarioActual.rol_id === 'operador' ||
        usuarioActual.rol === 'Administrador' ||
        usuarioActual.rol_id === 'admin')
  )
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ABASTECIMIENTO' | 'GANANCIA' | 'activos' | 'cerrados'>('todos')
  const cicloActivo = useMemo(() => ciclos.find((c) => c.estado !== 'CERRADO') || null, [ciclos])

  // Filtrado de ciclos
  const ciclosFiltrados = useMemo(() => {
    return ciclos.filter((c) => {
      if (filtroTipo === 'ABASTECIMIENTO') return c.tipo === 'ABASTECIMIENTO'
      if (filtroTipo === 'GANANCIA') return c.tipo === 'GANANCIA'
      if (filtroTipo === 'activos') return c.estado !== 'CERRADO'
      if (filtroTipo === 'cerrados') return c.estado === 'CERRADO'
      return true
    })
  }, [ciclos, filtroTipo])

  // Métricas rápidas
  const totalAbastecimientos = useMemo(
    () => ciclos.filter((c) => c.tipo === 'ABASTECIMIENTO' && c.estado === 'CERRADO').length,
    [ciclos]
  )
  const totalGanancias = useMemo(
    () => ciclos.filter((c) => c.tipo === 'GANANCIA' && c.estado === 'CERRADO').length,
    [ciclos]
  )

  return (
    <div className="space-y-6">
      {/* Cabecera Principal de la Vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Ciclos de Operación (Journeys)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
              {ciclos.length} totales
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditoría fotográfica de principio a fin de cada abastecimiento y recaudación en máquina
          </p>
        </div>

        {!cicloActivo && puedeIniciarCiclo && (
          <button
            type="button"
            onClick={onAbrirIniciarCiclo}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs rounded-2xl shadow-sm transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Iniciar Nuevo Ciclo</span>
          </button>
        )}
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Estado de la Máquina
            </span>
            <span
              className={`text-sm font-black mt-1 block ${
                cicloActivo ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {cicloActivo ? `En Ciclo (${cicloActivo.codigo})` : 'Operando Normal (Libre)'}
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              cicloActivo ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {cicloActivo ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Abastecimientos Cerrados
            </span>
            <span className="text-lg font-black text-amber-700 mt-0.5 block">
              {totalAbastecimientos} ciclos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Recaudaciones Cerradas
            </span>
            <span className="text-lg font-black text-emerald-700 mt-0.5 block">
              {totalGanancias} ciclos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-bold">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Filtrar por:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'activos', label: 'En Proceso' },
            { id: 'ABASTECIMIENTO', label: 'Abastecimiento' },
            { id: 'GANANCIA', label: 'Ganancia' },
            { id: 'cerrados', label: 'Cerrados' },
          ].map((op) => (
            <button
              key={op.id}
              onClick={() => setFiltroTipo(op.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filtroTipo === op.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Tarjetas de Ciclo */}
      {ciclosFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
          <Camera className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No hay ciclos para este filtro</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Cada vez que la operadora toma la foto previa en la máquina se creará un nuevo ciclo aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ciclosFiltrados.map((c) => {
            const esAbast = c.tipo === 'ABASTECIMIENTO'
            const cerrado = c.estado === 'CERRADO'
            const cantFotosAntes = c.fotos_antes_urls?.length || (c.foto_antes_url ? 1 : 0)
            const cantFotosDespues = c.fotos_despues_urls?.length || (c.foto_despues_url ? 1 : 0)
            const movVinculado = movimientos.find(
              (m) => c.movimiento_ids?.includes(m.id) || m.ciclo_id === c.id
            )

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                        esAbast
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                          : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                      }`}
                    >
                      {esAbast ? <ShoppingBag className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {c.codigo}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            esAbast ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          Ruta de {esAbast ? 'Abastecimiento' : 'Ganancia'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cerrado
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-600 text-white animate-pulse'
                          }`}
                        >
                          {c.estado}
                        </span>

                        {movVinculado && (
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                              esAbast
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {esAbast
                              ? `-${formatearMoneda(movVinculado.total_gastado || 0)}`
                              : `+${formatearMoneda(movVinculado.monto_ganado || 0)}`}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Iniciado por <strong className="text-slate-700">{c.iniciado_por_nombre || 'Operador'}</strong> el {c.fecha_inicio} a las {c.hora_inicio}
                        {c.fecha_despues ? ` • Cerrado el ${c.fecha_despues}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {!cerrado && esAbast && c.movimiento_ids && c.movimiento_ids.length > 0 && onAbrirCerrarAbastecimiento && (
                      <button
                        type="button"
                        onClick={() => onAbrirCerrarAbastecimiento(c)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Subir Foto Final
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onVerDetalleCiclo(c)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Ver Detalle
                    </button>
                  </div>
                </div>

                {/* Vista previa de Fotos y Etapa */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    {/* Miniatura Foto Antes */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                        <img src={c.foto_antes_url} alt="Antes" className="w-full h-full object-cover" />
                        {cantFotosAntes > 1 && (
                          <span className="absolute bottom-0 right-0 bg-slate-950/80 text-white text-[8px] font-black px-1 rounded-tl">
                            +{cantFotosAntes - 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          Foto Antes {cantFotosAntes > 1 && <span className="text-indigo-600 font-extrabold">({cantFotosAntes})</span>}
                        </span>
                        <span className="text-[11px] text-slate-700 font-semibold">{c.hora_inicio}</span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-300" />

                    {/* Miniatura Foto Después */}
                    {c.foto_despues_url ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                          <img src={c.foto_despues_url} alt="Después" className="w-full h-full object-cover" />
                          {cantFotosDespues > 1 && (
                            <span className="absolute bottom-0 right-0 bg-slate-950/80 text-white text-[8px] font-black px-1 rounded-tl">
                              +{cantFotosDespues - 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            Foto Después {cantFotosDespues > 1 && <span className="text-emerald-600 font-extrabold">({cantFotosDespues})</span>}
                          </span>
                          <span className="text-[11px] text-slate-700 font-semibold">{c.hora_despues || 'Cierre'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-[11px] text-slate-400">
                        {esAbast ? 'Pendiente foto final' : 'Cierre automático'}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                      Etapa actual
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {c.etapa_actual}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

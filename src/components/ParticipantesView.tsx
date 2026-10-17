import React, { useState } from 'react'
import { Users, CheckCircle2, Edit2, Save, X } from 'lucide-react'
import type { Participante } from '../types'

interface ParticipantesViewProps {
  participantes: Participante[]
  onActualizarParticipante: (p: Participante) => void
}

export const ParticipantesView: React.FC<ParticipantesViewProps> = ({
  participantes,
  onActualizarParticipante,
}) => {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombreEdit, setNombreEdit] = useState('')
  const [rolEdit, setRolEdit] = useState('')
  const [activoEdit, setActivoEdit] = useState(true)

  const iniciarEdicion = (p: Participante) => {
    setEditandoId(p.id)
    setNombreEdit(p.nombre)
    setRolEdit(p.rol)
    setActivoEdit(p.activo)
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
  }

  const guardarEdicion = (original: Participante) => {
    onActualizarParticipante({
      ...original,
      nombre: nombreEdit.trim() || original.nombre,
      rol: rolEdit.trim() || original.rol,
      activo: activoEdit,
    })
    setEditandoId(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Participantes del Negocio ({participantes.length})
          </h3>
          <p className="text-xs text-slate-500">
            Socios inversionistas, operadora y espacio de la institución educativa
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
          <Users className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participantes.map((part) => {
          const estaEditando = editandoId === part.id

          return (
            <div
              key={part.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-xs ${
                part.es_socio ? 'border-indigo-200/80 bg-indigo-50/20' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      part.es_socio
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {part.nombre.charAt(0)}
                  </div>
                  <div>
                    {estaEditando ? (
                      <input
                        type="text"
                        value={nombreEdit}
                        onChange={(e) => setNombreEdit(e.target.value)}
                        className="text-sm font-bold border border-slate-300 rounded px-2 py-0.5"
                      />
                    ) : (
                      <h4 className="font-bold text-slate-900 text-sm">{part.nombre}</h4>
                    )}

                    {estaEditando ? (
                      <input
                        type="text"
                        value={rolEdit}
                        onChange={(e) => setRolEdit(e.target.value)}
                        className="text-xs border border-slate-300 rounded px-2 py-0.5 mt-1"
                      />
                    ) : (
                      <p className="text-xs text-slate-500">{part.rol}</p>
                    )}
                  </div>
                </div>

                {!estaEditando && (
                  <button
                    onClick={() => iniciarEdicion(part)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Editar información"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      part.es_socio
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {part.es_socio ? 'Socio Inversionista' : 'Colaborador/a'}
                  </span>
                  {part.es_socio && (
                    <span
                      className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold"
                      title="Participa en reparto de sobrantes de compras"
                    >
                      Aplica Sobrantes
                    </span>
                  )}
                </div>

                {estaEditando ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => guardarEdicion(part)}
                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Activo
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

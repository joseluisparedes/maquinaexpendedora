import React, { useState } from 'react'
import {
  Camera,
  X,
  Calendar,
  User,
  Download,
  Eye,
} from 'lucide-react'
import type { FotoMaquina, Participante } from '../types'

interface GaleriaFotosModalProps {
  isOpen: boolean
  onClose: () => void
  fotos: FotoMaquina[]
  participantes: Participante[]
  onAbrirNuevaFoto?: () => void
}

export const GaleriaFotosModal: React.FC<GaleriaFotosModalProps> = ({
  isOpen,
  onClose,
  fotos,
  participantes,
  onAbrirNuevaFoto,
}) => {
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ANTES' | 'DESPUES'>('TODOS')
  const [fotoEnGrande, setFotoEnGrande] = useState<FotoMaquina | null>(null)

  if (!isOpen) return null

  const fotosFiltradas = fotos.filter((f) => {
    if (filtroTipo === 'TODOS') return true
    return f.tipo === filtroTipo
  })

  const getNombreParticipante = (id: string) => {
    return participantes.find((p) => p.id === id)?.nombre || 'Usuario'
  }

  const handleDescargar = (foto: FotoMaquina) => {
    const link = document.createElement('a')
    link.href = foto.foto_url
    link.download = `maquina_${foto.tipo.toLowerCase()}_${foto.fecha}_${foto.hora.replace(':', '')}.jpg`
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="px-5 py-4 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Historial de Fotos de la Máquina
              </h2>
              <p className="text-xs text-teal-100 font-medium">
                {fotos.length} {fotos.length === 1 ? 'registro' : 'registros'} de abasto y estado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros y Acción Rápida */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filtroTipo === 'TODOS'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({fotos.length})
            </button>
            <button
              onClick={() => setFiltroTipo('ANTES')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filtroTipo === 'ANTES'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              📦 Antes ({fotos.filter((f) => f.tipo === 'ANTES').length})
            </button>
            <button
              onClick={() => setFiltroTipo('DESPUES')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filtroTipo === 'DESPUES'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              ✨ Después ({fotos.filter((f) => f.tipo === 'DESPUES').length})
            </button>
          </div>

          {onAbrirNuevaFoto && (
            <button
              onClick={() => {
                onClose()
                onAbrirNuevaFoto()
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              Tomar Nueva Foto
            </button>
          )}
        </div>

        {/* Contenido / Cuadrícula de Fotos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {fotosFiltradas.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Camera className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No hay fotos registradas aún</p>
              <p className="text-xs text-slate-400 mt-1">
                Toma una foto con tu celular al llegar o al terminar de reabastecer
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fotosFiltradas.map((foto) => (
                <div
                  key={foto.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div
                    onClick={() => setFotoEnGrande(foto)}
                    className="relative h-48 bg-slate-900 cursor-pointer overflow-hidden group"
                  >
                    <img
                      src={foto.foto_url}
                      alt="Foto de la máquina"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                      <Eye className="w-4 h-4" />
                      Toca para ver en grande
                    </div>
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg text-white shadow-xs ${
                          foto.tipo === 'ANTES' ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                      >
                        {foto.tipo === 'ANTES' ? '📦 Antes del abasto' : '✨ Después del abasto'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="w-3 h-3 text-cyan-600" />
                        {foto.fecha} • {foto.hora}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {getNombreParticipante(foto.registrado_por)}
                      </span>
                    </div>

                    {foto.observaciones ? (
                      <p className="text-slate-700 bg-slate-50 p-2 rounded-xl text-[11px] italic">
                        "{foto.observaciones}"
                      </p>
                    ) : (
                      <p className="text-slate-400 text-[11px] italic">Sin observaciones</p>
                    )}

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleDescargar(foto)}
                        className="text-[11px] text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Download className="w-3 h-3" />
                        Descargar imagen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer hover:bg-slate-900 transition-colors"
          >
            Cerrar Galería
          </button>
        </div>
      </div>

      {/* Modal / Lightbox de Foto en Grande */}
      {fotoEnGrande && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setFotoEnGrande(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center">
            <button
              onClick={() => setFotoEnGrande(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 text-sm font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
              Cerrar
            </button>
            <img
              src={fotoEnGrande.foto_url}
              alt="Foto ampliada"
              className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="mt-3 text-center text-white text-xs bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs flex items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-bold">
                {fotoEnGrande.tipo === 'ANTES' ? '📦 Antes del abasto' : '✨ Después del abasto'}
              </span>
              <span>•</span>
              <span>{fotoEnGrande.fecha} a las {fotoEnGrande.hora}</span>
              <span>•</span>
              <button
                onClick={() => handleDescargar(fotoEnGrande)}
                className="text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar original
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

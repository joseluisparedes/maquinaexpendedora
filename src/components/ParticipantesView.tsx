import React, { useState } from 'react'
import {
  Users,
  CheckCircle2,
  Edit2,
  Save,
  X,
  UserPlus,
  Shield,
  KeyRound,
  Plus,
} from 'lucide-react'
import type { Participante, RolDefinicion } from '../types'

interface ParticipantesViewProps {
  participantes: Participante[]
  roles: RolDefinicion[]
  onActualizarParticipante: (p: Participante) => void
  onCrearParticipante: (p: Participante) => void
  onGuardarRoles: (roles: RolDefinicion[]) => void
}

export const ParticipantesView: React.FC<ParticipantesViewProps> = ({
  participantes,
  roles,
  onActualizarParticipante,
  onCrearParticipante,
  onGuardarRoles,
}) => {
  const [seccionActiva, setSeccionActiva] = useState<'usuarios' | 'roles'>('usuarios')

  // Estado edición de participante
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombreEdit, setNombreEdit] = useState('')
  const [rolEdit, setRolEdit] = useState('')
  const [rolIdEdit, setRolIdEdit] = useState('')
  const [pinEdit, setPinEdit] = useState('')
  const [esSocioEdit, setEsSocioEdit] = useState(false)
  const [activoEdit, setActivoEdit] = useState(true)

  // Estado nuevo usuario
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoRolId, setNuevoRolId] = useState(roles[1]?.id || 'socio')
  const [nuevoPin, setNuevoPin] = useState('1234')
  const [nuevoEsSocio, setNuevoEsSocio] = useState(false)

  // Estado nuevo rol
  const [modalNuevoRol, setModalNuevoRol] = useState(false)
  const [nombreNuevoRol, setNombreNuevoRol] = useState('')
  const [descNuevoRol, setDescNuevoRol] = useState('')
  const [permisosNuevoRol, setPermisosNuevoRol] = useState({
    puede_ganar: false,
    puede_comprar: false,
    puede_foto_maquina: true,
    puede_ver_movimientos: true,
    puede_ver_cierre: false,
    puede_ver_dashboard: false,
    puede_config_reparto: false,
    puede_gestionar_usuarios: false,
  })

  const iniciarEdicion = (p: Participante) => {
    setEditandoId(p.id)
    setNombreEdit(p.nombre)
    setRolEdit(p.rol)
    setRolIdEdit(p.rol_id || '')
    setPinEdit(p.pin || '1234')
    setEsSocioEdit(p.es_socio)
    setActivoEdit(p.activo)
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
  }

  const guardarEdicion = (original: Participante) => {
    const rolSeleccionado = roles.find((r) => r.id === rolIdEdit)

    onActualizarParticipante({
      ...original,
      nombre: nombreEdit.trim() || original.nombre,
      rol: rolSeleccionado ? rolSeleccionado.nombre : rolEdit.trim() || original.rol,
      rol_id: rolIdEdit || original.rol_id,
      pin: pinEdit.trim() || original.pin || '1234',
      es_socio: esSocioEdit,
      activo: activoEdit,
    })
    setEditandoId(null)
  }

  const handleCrearUsuario = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoNombre.trim()) return

    const rolObj = roles.find((r) => r.id === nuevoRolId)
    const nuevo: Participante = {
      id: 'part-' + Date.now(),
      nombre: nuevoNombre.trim(),
      rol: rolObj ? rolObj.nombre : 'Usuario',
      rol_id: nuevoRolId,
      es_socio: nuevoEsSocio,
      activo: true,
      pin: nuevoPin.trim() || '1234',
    }

    onCrearParticipante(nuevo)
    setNuevoNombre('')
    setNuevoPin('1234')
    setNuevoEsSocio(false)
    setModalNuevoUsuario(false)
  }

  const handleCrearRol = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreNuevoRol.trim()) return

    const nuevoRol: RolDefinicion = {
      id: 'rol-' + Date.now(),
      nombre: nombreNuevoRol.trim(),
      descripcion: descNuevoRol.trim() || 'Rol personalizado',
      es_sistema: false,
      permisos: permisosNuevoRol,
    }

    onGuardarRoles([...roles, nuevoRol])
    setNombreNuevoRol('')
    setDescNuevoRol('')
    setModalNuevoRol(false)
  }

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Gestión de Personas y Roles (Panel Administrador)
            </h3>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Solo José Luis (Admin)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea usuarios, define contraseñas PIN de 4 dígitos y asigna permisos específicos por rol.
          </p>
        </div>

        {/* Pestañas de Navegación entre Usuarios y Roles */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSeccionActiva('usuarios')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              seccionActiva === 'usuarios'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Personas ({participantes.length})
          </button>
          <button
            onClick={() => setSeccionActiva('roles')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              seccionActiva === 'roles'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Roles y Permisos ({roles.length})
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: PERSONAS / USUARIOS */}
      {seccionActiva === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Lista de Usuarios con Acceso al Sistema
            </h4>
            <button
              onClick={() => setModalNuevoUsuario(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              + Nueva Persona
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participantes.map((part) => {
              const estaEditando = editandoId === part.id

              return (
                <div
                  key={part.id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                    part.rol_id === 'admin'
                      ? 'border-indigo-300 bg-indigo-50/30'
                      : part.es_socio
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                          part.rol_id === 'admin'
                            ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white'
                            : part.es_socio
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white'
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
                            className="text-sm font-bold border border-slate-300 rounded px-2 py-0.5 bg-white"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 text-sm">{part.nombre}</h4>
                            {part.rol_id === 'admin' && (
                              <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded">
                                ADMIN
                              </span>
                            )}
                          </div>
                        )}

                        {estaEditando ? (
                          <select
                            value={rolIdEdit}
                            onChange={(e) => {
                              setRolIdEdit(e.target.value)
                              const r = roles.find((rol) => rol.id === e.target.value)
                              if (r) setRolEdit(r.nombre)
                            }}
                            className="text-xs border border-slate-300 rounded px-2 py-0.5 mt-1 bg-white"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs text-indigo-700 font-semibold">{part.rol}</p>
                        )}
                      </div>
                    </div>

                    {!estaEditando && (
                      <button
                        onClick={() => iniciarEdicion(part)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Editar persona y PIN"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Configuración de PIN y Tipo de Socio */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-slate-400" />
                        PIN de acceso:
                      </span>
                      {estaEditando ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={pinEdit}
                          onChange={(e) => setPinEdit(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-16 px-2 py-0.5 border border-slate-300 rounded font-bold text-center text-xs bg-white"
                        />
                      ) : (
                        <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {part.pin || '1234'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Es Socio Inversionista:</span>
                      {estaEditando ? (
                        <input
                          type="checkbox"
                          checked={esSocioEdit}
                          onChange={(e) => setEsSocioEdit(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                      ) : (
                        <span className={`font-bold ${part.es_socio ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {part.es_socio ? 'Sí' : 'No'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones de edición */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Activo
                    </span>

                    {estaEditando && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => guardarEdicion(part)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer font-bold text-xs flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Guardar
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 cursor-pointer font-bold text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: ROLES Y PERMISOS */}
      {seccionActiva === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Roles Configurados y Matriz de Permisos
            </h4>
            <button
              onClick={() => setModalNuevoRol(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Nuevo Rol
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((rol) => (
              <div
                key={rol.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{rol.nombre}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">{rol.descripcion}</p>
                  </div>
                  {rol.es_sistema && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      Sistema
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                    Permisos de este rol:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className={`flex items-center gap-1.5 ${rol.permisos.puede_ganar ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {rol.permisos.puede_ganar ? '✓' : '✕'} Registrar Ganar
                    </span>
                    <span className={`flex items-center gap-1.5 ${rol.permisos.puede_comprar ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {rol.permisos.puede_comprar ? '✓' : '✕'} Registrar Comprar
                    </span>
                    <span className={`flex items-center gap-1.5 ${rol.permisos.puede_foto_maquina ? 'text-cyan-700 font-bold' : 'text-slate-400'}`}>
                      {rol.permisos.puede_foto_maquina ? '✓' : '✕'} Foto Máquina
                    </span>
                    <span className={`flex items-center gap-1.5 ${rol.permisos.puede_ver_movimientos ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>
                      {rol.permisos.puede_ver_movimientos ? '✓' : '✕'} Ver Movimientos
                    </span>
                    <span className={`flex items-center gap-1.5 ${rol.permisos.puede_ver_cierre ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>
                      {rol.permisos.puede_ver_cierre ? '✓' : '✕'} Cierre & WhatsApp
                    </span>
                    <span className={`flex items-center gap-1.5 ${rol.permisos.puede_ver_dashboard ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>
                      {rol.permisos.puede_ver_dashboard ? '✓' : '✕'} Dashboard
                    </span>
                    <span className={`flex items-center gap-1.5 ${rol.permisos.puede_config_reparto ? 'text-purple-700 font-bold' : 'text-slate-400'}`}>
                      {rol.permisos.puede_config_reparto ? '✓' : '✕'} Config. Reparto
                    </span>
                    <span className={`flex items-center gap-1.5 ${rol.permisos.puede_gestionar_usuarios ? 'text-purple-700 font-bold' : 'text-slate-400'}`}>
                      {rol.permisos.puede_gestionar_usuarios ? '✓' : '✕'} Crear Usuarios/Roles
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREAR NUEVA PERSONA */}
      {modalNuevoUsuario && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Registrar Nueva Persona
              </h3>
              <button
                onClick={() => setModalNuevoUsuario(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Daniel Paredes"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol a asignar:</label>
                <select
                  value={nuevoRolId}
                  onChange={(e) => {
                    setNuevoRolId(e.target.value)
                    if (e.target.value === 'socio' || e.target.value === 'admin') {
                      setNuevoEsSocio(true)
                    } else {
                      setNuevoEsSocio(false)
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-xl font-medium bg-slate-50"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} ({r.descripcion})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN numérico de 4 dígitos:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="1234"
                  value={nuevoPin}
                  onChange={(e) => setNuevoPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-center bg-slate-50 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkEsSocio"
                  checked={nuevoEsSocio}
                  onChange={(e) => setNuevoEsSocio(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="chkEsSocio" className="font-bold text-slate-700 cursor-pointer">
                  ¿Es Socio Inversionista? (Participa en compras y sobrantes)
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoUsuario(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Guardar Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR NUEVO ROL */}
      {modalNuevoRol && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Crear Nuevo Rol Personalizado
              </h3>
              <button
                onClick={() => setModalNuevoRol(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearRol} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del rol:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Supervisor Técnico"
                  value={nombreNuevoRol}
                  onChange={(e) => setNombreNuevoRol(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción:</label>
                <input
                  type="text"
                  placeholder="Ej: Verifica máquina y movimientos"
                  value={descNuevoRol}
                  onChange={(e) => setDescNuevoRol(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium bg-slate-50"
                />
              </div>

              <div>
                <span className="block font-bold text-slate-700 mb-2">
                  Selecciona los permisos que tendrá este rol:
                </span>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border">
                  {[
                    { key: 'puede_ganar', label: 'Registrar Ganancias (Recaudación)' },
                    { key: 'puede_comprar', label: 'Registrar Compras (Mercadería)' },
                    { key: 'puede_foto_maquina', label: 'Tomar Foto de la Máquina' },
                    { key: 'puede_ver_movimientos', label: 'Ver Historial de Movimientos' },
                    { key: 'puede_ver_cierre', label: 'Ver Cierre Mensual & WhatsApp' },
                    { key: 'puede_ver_dashboard', label: 'Ver Dashboard Financiero' },
                  ].map((p) => (
                    <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(permisosNuevoRol as any)[p.key]}
                        onChange={(e) =>
                          setPermisosNuevoRol({
                            ...permisosNuevoRol,
                            [p.key]: e.target.checked,
                          })
                        }
                        className="rounded text-indigo-600"
                      />
                      <span className="font-medium text-slate-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoRol(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Navbar } from './components/Navbar'
import { PantallaInicioMovil } from './components/PantallaInicioMovil'
import { DashboardView } from './components/DashboardView'
import { MovimientosView } from './components/MovimientosView'
import { CierrePeriodoView } from './components/CierrePeriodoView'
import { ParticipantesView } from './components/ParticipantesView'
import { ConfiguracionView } from './components/ConfiguracionView'
import { RegistrarMovimientoModal } from './components/RegistrarMovimientoModal'
import { DetalleMovimientoModal } from './components/DetalleMovimientoModal'
import { AnularMovimientoModal } from './components/AnularMovimientoModal'
import { LoginView } from './components/LoginView'
import { RegistrarFotoModal } from './components/RegistrarFotoModal'
import { GaleriaFotosModal } from './components/GaleriaFotosModal'
import type { ConfigReparto, FotoMaquina, Movimiento, Participante, RolDefinicion } from './types'
import { StorageService } from './utils/storage'
import { DataService } from './utils/dataService'
import { calcularBalance } from './utils/calculations'

export function App() {
  // Sesión de Usuario Activa
  const [usuarioActual, setUsuarioActual] = useState<Participante | null>(() =>
    StorageService.getSesionUsuario()
  )

  // Roles y Permisos del Sistema
  const [roles, setRoles] = useState<RolDefinicion[]>(() =>
    StorageService.getRoles()
  )

  // Pantalla inicial: true = panel completo, false = pantalla táctil rápida
  const [modoAdmin, setModoAdmin] = useState(false)

  const [vistaActual, setVistaActual] = useState<
    'dashboard' | 'movimientos' | 'cierre' | 'participantes' | 'config'
  >('dashboard')

  // Estados de datos
  const [participantes, setParticipantes] = useState<Participante[]>(() =>
    StorageService.getParticipantes()
  )
  const [configs, setConfigs] = useState<ConfigReparto[]>(() =>
    StorageService.getConfigRepartos()
  )
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [fotosMaquina, setFotosMaquina] = useState<FotoMaquina[]>(() =>
    StorageService.getFotosMaquina()
  )

  // Estado conexión Supabase
  const [conectadoSupabase, setConectadoSupabase] = useState(false)
  const [mensajeSupabase, setMensajeSupabase] = useState('Verificando conexión...')

  // Modales
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false)
  const [tipoModalInicial, setTipoModalInicial] = useState<'GANAR' | 'COMPRAR'>('GANAR')
  const [detalleMov, setDetalleMov] = useState<Movimiento | null>(null)
  const [movAAnular, setMovAAnular] = useState<Movimiento | null>(null)
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false)
  const [modalGaleriaAbierto, setModalGaleriaAbierto] = useState(false)

  // Permisos dinámicos del usuario activo
  const permisos = useMemo(() => {
    return StorageService.getPermisos(usuarioActual)
  }, [usuarioActual, roles])

  // Balance general para Saldo en Caja en navbar
  const balanceGeneral = useMemo(() => calcularBalance(movimientos), [movimientos])

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    const estado = await DataService.verificarConexionSupabase()
    setConectadoSupabase(estado.conectado)
    setMensajeSupabase(estado.mensaje)

    const [parts, cfgs, movs, rls, fts] = await Promise.all([
      DataService.getParticipantes(),
      DataService.getConfigRepartos(),
      DataService.getMovimientos(),
      DataService.getRoles(),
      DataService.getFotosMaquina(),
    ])

    setParticipantes(parts)
    setConfigs(cfgs)
    setMovimientos(movs)
    setRoles(rls)
    setFotosMaquina(fts)
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Manejo de Inicio y Cierre de Sesión
  const handleLoginExitoso = (usuario: Participante) => {
    StorageService.saveSesionUsuario(usuario)
    setUsuarioActual(usuario)

    const userPerms = StorageService.getPermisos(usuario)

    // Si es Dueño del local (Elsa), llevar directo a la vista de Movimientos
    if (!userPerms.puede_ganar && !userPerms.puede_comprar && userPerms.puede_ver_movimientos) {
      setModoAdmin(true)
      setVistaActual('movimientos')
    } else {
      setModoAdmin(false)
      setVistaActual('dashboard')
    }
  }

  const handleCerrarSesion = () => {
    StorageService.clearSesionUsuario()
    setUsuarioActual(null)
    setModoAdmin(false)
  }

  // Triggers para abrir Ganar o Comprar
  const abrirRegistroGanar = () => {
    if (!permisos.puede_ganar) {
      alert('Tu rol no tiene permisos para registrar ganancias.')
      return
    }
    setTipoModalInicial('GANAR')
    setModalRegistroAbierto(true)
  }

  const abrirRegistroComprar = () => {
    if (!permisos.puede_comprar) {
      alert('Tu rol no tiene permisos para registrar compras.')
      return
    }
    setTipoModalInicial('COMPRAR')
    setModalRegistroAbierto(true)
  }

  const abrirRegistroFotoMaquina = () => {
    if (!permisos.puede_foto_maquina) {
      alert('Tu rol no tiene permisos para registrar fotos de la máquina.')
      return
    }
    setModalFotoAbierto(true)
  }

  // Guardar un nuevo movimiento (y su sobrante vinculado si aplica)
  const handleMovimientoGuardado = async (
    nuevo: Movimiento,
    movSobranteAsociado?: Movimiento
  ) => {
    await DataService.saveMovimiento(nuevo)
    if (movSobranteAsociado) {
      await DataService.saveMovimiento(movSobranteAsociado)
    }

    let nuevosMovimientos = [nuevo, ...movimientos]
    if (movSobranteAsociado) {
      nuevosMovimientos = [movSobranteAsociado, ...nuevosMovimientos]
    }
    setMovimientos(nuevosMovimientos)
  }

  // Guardar nueva foto de la máquina
  const handleFotoGuardada = async (foto: FotoMaquina) => {
    await DataService.saveFotoMaquina(foto)
    setFotosMaquina([foto, ...fotosMaquina])
  }

  // Anular un movimiento con motivo obligatorio
  const handleConfirmarAnulacion = async (id: string, motivo: string) => {
    await DataService.anularMovimiento(id, motivo)

    const nuevosMovimientos = movimientos.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          estado: 'ANULADO' as const,
          motivo_anulacion: motivo,
        }
      }
      if (m.origen_movimiento_id === id) {
        return {
          ...m,
          estado: 'ANULADO' as const,
          motivo_anulacion: `Anulación automática por anulación de compra origen (${motivo})`,
        }
      }
      return m
    })

    setMovimientos(nuevosMovimientos)
  }

  // Guardar nueva vigencia de reparto (Solo Admin)
  const handleGuardarConfig = async (nueva: ConfigReparto) => {
    if (!permisos.puede_config_reparto) return
    await DataService.saveConfigReparto(nueva)
    setConfigs([nueva, ...configs])
  }

  // Actualizar datos de participante
  const handleActualizarParticipante = async (part: Participante) => {
    await DataService.saveParticipante(part)
    setParticipantes(participantes.map((p) => (p.id === part.id ? part : p)))
    if (usuarioActual && usuarioActual.id === part.id) {
      setUsuarioActual(part)
      StorageService.saveSesionUsuario(part)
    }
  }

  // Crear nuevo participante (Solo Admin)
  const handleCrearParticipante = async (nuevo: Participante) => {
    await DataService.saveParticipante(nuevo)
    setParticipantes([...participantes, nuevo])
  }

  // Guardar roles (Solo Admin)
  const handleGuardarRoles = async (nuevosRoles: RolDefinicion[]) => {
    await DataService.saveRoles(nuevosRoles)
    setRoles(nuevosRoles)
  }

  // Vaciar todos los movimientos (Solo Admin)
  const handleVaciarMovimientos = async () => {
    if (!permisos.puede_gestionar_usuarios) return
    if (
      window.confirm(
        '¿Estás seguro de que deseas eliminar TODOS los movimientos registrados? Esta acción reiniciará los saldos a S/ 0.00 tanto en Supabase como en tu navegador.'
      )
    ) {
      await DataService.clearAllMovimientos()
      setMovimientos([])
    }
  }

  // Si no hay sesión iniciada, mostrar Pantalla de Login con PIN de 4 dígitos
  if (!usuarioActual) {
    return (
      <LoginView
        participantes={participantes}
        onLoginExitoso={handleLoginExitoso}
      />
    )
  }

  return (
    <>
      {/* VISTA 1: PANTALLA INICIAL MÓVIL */}
      {!modoAdmin ? (
        <PantallaInicioMovil
          saldoCaja={balanceGeneral.saldoCaja}
          conectadoSupabase={conectadoSupabase}
          movimientos={movimientos}
          fotosMaquina={fotosMaquina}
          usuarioActual={usuarioActual}
          permisos={permisos}
          onAbrirGanar={abrirRegistroGanar}
          onAbrirComprar={abrirRegistroComprar}
          onAbrirFotoMaquina={abrirRegistroFotoMaquina}
          onAbrirGaleriaFotos={() => setModalGaleriaAbierto(true)}
          onIngresarSistema={() => {
            if (permisos.puede_ver_movimientos && !permisos.puede_ver_dashboard) {
              setVistaActual('movimientos')
            }
            setModoAdmin(true)
          }}
          onCerrarSesion={handleCerrarSesion}
          onIrACierre={() => {
            setModoAdmin(true)
            setVistaActual('cierre')
          }}
          onVerDetalle={(m) => setDetalleMov(m)}
        />
      ) : (
        /* VISTA 2: PANEL COMPLETO CON ACCESO CONTROLADO POR ROLES */
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar
            vistaActual={vistaActual}
            setVistaActual={setVistaActual}
            saldoCaja={balanceGeneral.saldoCaja}
            conectadoSupabase={conectadoSupabase}
            usuarioActual={usuarioActual}
            permisos={permisos}
            onNuevoMovimiento={() => {
              setTipoModalInicial('GANAR')
              setModalRegistroAbierto(true)
            }}
            onAbrirFotoMaquina={abrirRegistroFotoMaquina}
            onReset={handleVaciarMovimientos}
            onVolverInicio={() => setModoAdmin(false)}
            onCerrarSesion={handleCerrarSesion}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Dashboard: solo si tiene permiso */}
            {vistaActual === 'dashboard' && permisos.puede_ver_dashboard && (
              <DashboardView
                movimientos={movimientos}
                participantes={participantes}
                onNuevoMovimiento={() => {
                  setTipoModalInicial('GANAR')
                  setModalRegistroAbierto(true)
                }}
                onVerMovimientos={() => setVistaActual('movimientos')}
              />
            )}

            {/* Movimientos: para roles con permiso de ver movimientos */}
            {vistaActual === 'movimientos' && permisos.puede_ver_movimientos && (
              <MovimientosView
                movimientos={movimientos}
                participantes={participantes}
                onNuevoMovimiento={() => {
                  if (permisos.puede_ganar || permisos.puede_comprar) {
                    setTipoModalInicial('GANAR')
                    setModalRegistroAbierto(true)
                  }
                }}
                onVerDetalle={(m) => setDetalleMov(m)}
                onAnular={(m) => {
                  if (permisos.puede_gestionar_usuarios || permisos.puede_ganar) {
                    setMovAAnular(m)
                  } else {
                    alert('No tienes permisos para anular movimientos.')
                  }
                }}
              />
            )}

            {/* Cierre & Reportes WhatsApp */}
            {vistaActual === 'cierre' && permisos.puede_ver_cierre && (
              <CierrePeriodoView
                movimientos={movimientos}
                participantes={participantes}
              />
            )}

            {/* Participantes y Roles: Solo Administrador (José Luis) */}
            {vistaActual === 'participantes' && permisos.puede_gestionar_usuarios && (
              <ParticipantesView
                participantes={participantes}
                roles={roles}
                onActualizarParticipante={handleActualizarParticipante}
                onCrearParticipante={handleCrearParticipante}
                onGuardarRoles={handleGuardarRoles}
              />
            )}

            {/* Config. Reparto: Solo Administrador (José Luis) */}
            {vistaActual === 'config' && permisos.puede_config_reparto && (
              <ConfiguracionView
                configs={configs}
                participantes={participantes}
                conectadoSupabase={conectadoSupabase}
                mensajeSupabase={mensajeSupabase}
                onGuardarConfig={handleGuardarConfig}
                onRecargarTodo={cargarDatos}
                onVerificarConexion={cargarDatos}
                onVaciarMovimientos={handleVaciarMovimientos}
              />
            )}
          </main>

          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 print:hidden">
            <p>
              Sistema de Finanzas — Máquina Expendedora • Conectado como {usuarioActual.nombre} ({usuarioActual.rol})
            </p>
          </footer>
        </div>
      )}

      {/* Modales Compartidos */}
      <RegistrarMovimientoModal
        isOpen={modalRegistroAbierto}
        tipoInicial={tipoModalInicial}
        onClose={() => setModalRegistroAbierto(false)}
        participantes={participantes}
        onMovimientoGuardado={handleMovimientoGuardado}
      />

      <DetalleMovimientoModal
        movimiento={detalleMov}
        onClose={() => setDetalleMov(null)}
        participantes={participantes}
      />

      <AnularMovimientoModal
        movimiento={movAAnular}
        onClose={() => setMovAAnular(null)}
        onConfirmarAnulacion={handleConfirmarAnulacion}
      />

      {/* Modal Registrar Foto de la Máquina */}
      <RegistrarFotoModal
        isOpen={modalFotoAbierto}
        onClose={() => setModalFotoAbierto(false)}
        usuarioActual={usuarioActual}
        onFotoGuardada={handleFotoGuardada}
      />

      {/* Modal Galería de Fotos de la Máquina */}
      <GaleriaFotosModal
        isOpen={modalGaleriaAbierto}
        onClose={() => setModalGaleriaAbierto(false)}
        fotos={fotosMaquina}
        participantes={participantes}
        onAbrirNuevaFoto={abrirRegistroFotoMaquina}
      />
    </>
  )
}

export default App

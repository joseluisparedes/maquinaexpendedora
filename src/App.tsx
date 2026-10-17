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
import { EditarMovimientoModal } from './components/EditarMovimientoModal'
import { DetalleCajaModal } from './components/DetalleCajaModal'
import { ModalDevolucionAportes } from './components/ModalDevolucionAportes'
import type { ConfigReparto, FotoMaquina, Movimiento, Participante, RolDefinicion, DeudaSocioCompra } from './types'
import { StorageService } from './utils/storage'
import { DataService } from './utils/dataService'
import { calcularBalance } from './utils/calculations'
import { actualizarDeudaEnMovimiento, obtenerMetricasDeudasUsuario } from './utils/deudasHelper'

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
  const [movAEditar, setMovAEditar] = useState<Movimiento | null>(null)
  const [modalCajaAbierto, setModalCajaAbierto] = useState(false)
  const [modalDevolucionAbierto, setModalDevolucionAbierto] = useState(false)

  // Permisos dinámicos del usuario activo
  const permisos = useMemo(() => {
    return StorageService.getPermisos(usuarioActual)
  }, [usuarioActual, roles])

  // Métricas reactivas de deudas y aportes para la campanita de notificación
  const metricasDeudas = useMemo(() => {
    if (!usuarioActual) {
      return { badgeNotificaciones: 0, totalQueDebo: 0, totalQueMeDeben: 0 }
    }
    return obtenerMetricasDeudasUsuario(movimientos, participantes, usuarioActual)
  }, [movimientos, participantes, usuarioActual])

  const cantidadAportesPendientes = metricasDeudas.badgeNotificaciones
  const montoAportesPendientes = metricasDeudas.totalQueDebo + metricasDeudas.totalQueMeDeben

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

    // Sincronizar sesión activa si el rol o PIN fue actualizado en la nube
    setUsuarioActual((prev) => {
      if (!prev) return null
      const updated = parts.find((p) => p.id === prev.id)
      if (updated) {
        StorageService.saveSesionUsuario(updated)
        return updated
      }
      return prev
    })
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

  // Actualizar movimiento editado
  const handleMovimientoActualizado = async (actualizado: Movimiento) => {
    await DataService.updateMovimiento(actualizado)
    setMovimientos((prev) =>
      prev.map((m) => (m.id === actualizado.id ? actualizado : m))
    )
  }

  // Cambiar estado de aporte adicional (DEVUELTO o PENDIENTE)
  const handleCambiarEstadoAporte = async (
    movimientoId: string,
    nuevoEstado: 'DEVUELTO' | 'PENDIENTE'
  ) => {
    const mov = movimientos.find((m) => m.id === movimientoId)
    if (!mov) return

    const hoy = new Date().toISOString().split('T')[0]
    let nuevosAportes = mov.aportes_adicionales ? [...mov.aportes_adicionales] : []

    if (nuevosAportes.length === 0 && (mov.monto_adicional || 0) > 0) {
      nuevosAportes = [
        {
          id: `ap-${mov.id}`,
          participante_id: mov.quien_aporto_adicional || usuarioActual?.id || '',
          monto: mov.monto_adicional || 0,
          estado: nuevoEstado,
          fecha_devolucion: nuevoEstado === 'DEVUELTO' ? hoy : undefined,
          devuelto_por: nuevoEstado === 'DEVUELTO' ? usuarioActual?.nombre : undefined,
        },
      ]
    } else {
      nuevosAportes = nuevosAportes.map((ap) => ({
        ...ap,
        estado: nuevoEstado,
        fecha_devolucion: nuevoEstado === 'DEVUELTO' ? hoy : undefined,
        devuelto_por: nuevoEstado === 'DEVUELTO' ? usuarioActual?.nombre : undefined,
      }))
    }

    const actualizado: Movimiento = {
      ...mov,
      aportes_adicionales: nuevosAportes,
      aporte_devuelto: nuevoEstado === 'DEVUELTO',
      fecha_devolucion_aporte: nuevoEstado === 'DEVUELTO' ? hoy : undefined,
      devuelto_por: nuevoEstado === 'DEVUELTO' ? usuarioActual?.nombre : undefined,
    }

    await DataService.updateMovimiento(actualizado)
    setMovimientos((prev) =>
      prev.map((m) => (m.id === actualizado.id ? actualizado : m))
    )
    if (detalleMov && detalleMov.id === movimientoId) {
      setDetalleMov(actualizado)
    }
  }

  // Guardar devolución masiva de aportes con comprobantes opcionales
  const handleGuardarDevolucion = async (
    devoluciones: Array<{ movimientoId: string; monto: number; socioId: string }>,
    datos: {
      fecha: string
      observaciones: string
      comprobantes: string[]
      devueltoPorNombre: string
    }
  ) => {
    let nuevosMovimientos = [...movimientos]

    for (const dev of devoluciones) {
      const idx = nuevosMovimientos.findIndex((m) => m.id === dev.movimientoId)
      if (idx >= 0) {
        const mov = nuevosMovimientos[idx]
        let aportes = mov.aportes_adicionales ? [...mov.aportes_adicionales] : []

        if (aportes.length === 0 && (mov.monto_adicional || 0) > 0) {
          aportes = [
            {
              id: `ap-${mov.id}`,
              participante_id: dev.socioId,
              monto: dev.monto,
              estado: 'DEVUELTO',
              fecha_devolucion: datos.fecha,
              devuelto_por: datos.devueltoPorNombre,
              comprobantes_devolucion: datos.comprobantes,
              observaciones_devolucion: datos.observaciones,
            },
          ]
        } else {
          aportes = aportes.map((ap) => {
            if (ap.participante_id === dev.socioId || aportes.length === 1) {
              return {
                ...ap,
                estado: 'DEVUELTO' as const,
                fecha_devolucion: datos.fecha,
                devuelto_por: datos.devueltoPorNombre,
                comprobantes_devolucion: datos.comprobantes,
                observaciones_devolucion: datos.observaciones,
              }
            }
            return ap
          })
        }

        const actualizado: Movimiento = {
          ...mov,
          aportes_adicionales: aportes,
          aporte_devuelto: true,
          fecha_devolucion_aporte: datos.fecha,
          devuelto_por: datos.devueltoPorNombre,
          comprobantes_devolucion: datos.comprobantes,
          observaciones_devolucion: datos.observaciones,
        }

        nuevosMovimientos[idx] = actualizado
        await DataService.updateMovimiento(actualizado)
      }
    }

    setMovimientos(nuevosMovimientos)
  }

  // Actualizar una deuda específica entre socios
  const handleActualizarDeuda = async (
    movimientoId: string,
    deudaActualizada: DeudaSocioCompra
  ) => {
    const mov = movimientos.find((m) => m.id === movimientoId)
    if (!mov) return

    const actualizado = actualizarDeudaEnMovimiento(mov, deudaActualizada, participantes)
    await DataService.updateMovimiento(actualizado)
    setMovimientos((prev) =>
      prev.map((m) => (m.id === actualizado.id ? actualizado : m))
    )
    if (detalleMov && detalleMov.id === movimientoId) {
      setDetalleMov(actualizado)
    }
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
          onIrAConfiguracion={() => {
            setModoAdmin(true)
            setVistaActual('config')
          }}
          onIrACierre={() => {
            setModoAdmin(true)
            setVistaActual('cierre')
          }}
          onCerrarSesion={handleCerrarSesion}
          onVerDetalle={(m) => setDetalleMov(m)}
          onAbrirDetalleCaja={() => setModalCajaAbierto(true)}
          cantidadAportesPendientes={cantidadAportesPendientes}
          montoAportesPendientes={montoAportesPendientes}
          onAbrirDevolucionAportes={() => setModalDevolucionAbierto(true)}
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
            onAbrirDetalleCaja={() => setModalCajaAbierto(true)}
            cantidadAportesPendientes={cantidadAportesPendientes}
            montoAportesPendientes={montoAportesPendientes}
            onAbrirDevolucionAportes={() => setModalDevolucionAbierto(true)}
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
                onAbrirDetalleCaja={() => setModalCajaAbierto(true)}
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
                onEditar={(m) => {
                  if (permisos.puede_gestionar_usuarios || permisos.puede_ganar || permisos.puede_comprar) {
                    setMovAEditar(m)
                  } else {
                    alert('No tienes permisos para editar movimientos.')
                  }
                }}
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
        onCambiarEstadoAporte={handleCambiarEstadoAporte}
      />

      <AnularMovimientoModal
        movimiento={movAAnular}
        onClose={() => setMovAAnular(null)}
        onConfirmarAnulacion={handleConfirmarAnulacion}
      />

      <EditarMovimientoModal
        isOpen={Boolean(movAEditar)}
        movimiento={movAEditar}
        onClose={() => setMovAEditar(null)}
        participantes={participantes}
        onGuardarEdicion={handleMovimientoActualizado}
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

      {/* Modal Detalle y Arqueo de Caja */}
      <DetalleCajaModal
        isOpen={modalCajaAbierto}
        onClose={() => setModalCajaAbierto(false)}
        movimientos={movimientos}
        participantes={participantes}
        onCambiarEstadoAporte={handleCambiarEstadoAporte}
        onAbrirModalDevolucion={() => setModalDevolucionAbierto(true)}
        onVerDetalleMovimiento={(m) => {
          setModalCajaAbierto(false)
          setDetalleMov(m)
        }}
      />

      {/* Modal Devolución de Aportes a Socios (Múltiples socios y fotos opcionales) */}
      <ModalDevolucionAportes
        isOpen={modalDevolucionAbierto}
        onClose={() => setModalDevolucionAbierto(false)}
        movimientos={movimientos}
        participantes={participantes}
        usuarioActual={usuarioActual}
        onGuardarDevolucion={handleGuardarDevolucion}
        onActualizarDeuda={handleActualizarDeuda}
      />
    </>
  )
}

export default App

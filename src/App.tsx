import { useState, useMemo, useEffect, useCallback } from 'react'
import { Navbar } from './components/Navbar'
import { DashboardView } from './components/DashboardView'
import { MovimientosView } from './components/MovimientosView'
import { CierrePeriodoView } from './components/CierrePeriodoView'
import { ParticipantesView } from './components/ParticipantesView'
import { ConfiguracionView } from './components/ConfiguracionView'
import { RegistrarMovimientoModal } from './components/RegistrarMovimientoModal'
import { DetalleMovimientoModal } from './components/DetalleMovimientoModal'
import { AnularMovimientoModal } from './components/AnularMovimientoModal'
import type { ConfigReparto, Movimiento, Participante } from './types'
import { StorageService } from './utils/storage'
import { DataService } from './utils/dataService'
import { calcularBalance } from './utils/calculations'

export function App() {
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
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() =>
    StorageService.getMovimientos()
  )

  // Estado conexión Supabase
  const [conectadoSupabase, setConectadoSupabase] = useState(false)
  const [mensajeSupabase, setMensajeSupabase] = useState('Verificando conexión...')

  // Modales
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false)
  const [detalleMov, setDetalleMov] = useState<Movimiento | null>(null)
  const [movAAnular, setMovAAnular] = useState<Movimiento | null>(null)

  // Balance general para Saldo en Caja en navbar
  const balanceGeneral = useMemo(() => calcularBalance(movimientos), [movimientos])

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    const estado = await DataService.verificarConexionSupabase()
    setConectadoSupabase(estado.conectado)
    setMensajeSupabase(estado.mensaje)

    const [parts, cfgs, movs] = await Promise.all([
      DataService.getParticipantes(),
      DataService.getConfigRepartos(),
      DataService.getMovimientos(),
    ])

    setParticipantes(parts)
    setConfigs(cfgs)
    setMovimientos(movs)
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

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

  // Guardar nueva vigencia de reparto
  const handleGuardarConfig = async (nueva: ConfigReparto) => {
    await DataService.saveConfigReparto(nueva)
    setConfigs([nueva, ...configs])
  }

  // Actualizar datos de participante
  const handleActualizarParticipante = async (part: Participante) => {
    await DataService.saveParticipante(part)
    setParticipantes(participantes.map((p) => (p.id === part.id ? part : p)))
  }

  // Restaurar datos de ejemplo
  const handleVaciarMovimientos = async () => {
    if (
      window.confirm(
        '¿Estás seguro de que deseas eliminar TODOS los movimientos registrados? Esta acción reiniciará los saldos a S/ 0.00 tanto en Supabase como en tu navegador.'
      )
    ) {
      await DataService.clearAllMovimientos()
      setMovimientos([])
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Barra de navegación superior */}
      <Navbar
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        saldoCaja={balanceGeneral.saldoCaja}
        conectadoSupabase={conectadoSupabase}
        onNuevoMovimiento={() => setModalRegistroAbierto(true)}
        onReset={handleVaciarMovimientos}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {vistaActual === 'dashboard' && (
          <DashboardView
            movimientos={movimientos}
            participantes={participantes}
            onNuevoMovimiento={() => setModalRegistroAbierto(true)}
            onVerMovimientos={() => setVistaActual('movimientos')}
          />
        )}

        {vistaActual === 'movimientos' && (
          <MovimientosView
            movimientos={movimientos}
            participantes={participantes}
            onNuevoMovimiento={() => setModalRegistroAbierto(true)}
            onVerDetalle={(m) => setDetalleMov(m)}
            onAnular={(m) => setMovAAnular(m)}
          />
        )}

        {vistaActual === 'cierre' && (
          <CierrePeriodoView
            movimientos={movimientos}
            participantes={participantes}
          />
        )}

        {vistaActual === 'participantes' && (
          <ParticipantesView
            participantes={participantes}
            onActualizarParticipante={handleActualizarParticipante}
          />
        )}

        {vistaActual === 'config' && (
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

      {/* Pie de página */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 print:hidden">
        <p>
          Sistema de Finanzas — Máquina Expendedora • Conectado a Supabase ({conectadoSupabase ? 'En línea' : 'Modo local'})
        </p>
      </footer>

      {/* Modales */}
      <RegistrarMovimientoModal
        isOpen={modalRegistroAbierto}
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
    </div>
  )
}

export default App

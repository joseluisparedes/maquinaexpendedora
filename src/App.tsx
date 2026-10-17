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
import type { ConfigReparto, Movimiento, Participante } from './types'
import { StorageService } from './utils/storage'
import { DataService } from './utils/dataService'
import { calcularBalance } from './utils/calculations'

export function App() {
  // Pantalla inicial: true = panel completo, false = 2 botones rápidos (Ganar / Comprar)
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

  // Estado conexión Supabase
  const [conectadoSupabase, setConectadoSupabase] = useState(false)
  const [mensajeSupabase, setMensajeSupabase] = useState('Verificando conexión...')

  // Modales
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false)
  const [tipoModalInicial, setTipoModalInicial] = useState<'GANAR' | 'COMPRAR'>('GANAR')
  const [detalleMov, setDetalleMov] = useState<Movimiento | null>(null)
  const [movAAnular, setMovAAnular] = useState<Movimiento | null>(null)

  // Balance general para Saldo en Caja en navbar
  const balanceGeneral = useMemo(() => calcularBalance(movimientos), [movimientos])

  // Cargar datos
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

  // Triggers para abrir Ganar o Comprar directo desde la pantalla inicial
  const abrirRegistroGanar = () => {
    setTipoModalInicial('GANAR')
    setModalRegistroAbierto(true)
  }

  const abrirRegistroComprar = () => {
    setTipoModalInicial('COMPRAR')
    setModalRegistroAbierto(true)
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

  // Vaciar todos los movimientos
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
    <>
      {/* VISTA 1: PANTALLA INICIAL MÓVIL (2 BOTONES: GANAR / COMPRAR) */}
      {!modoAdmin ? (
        <PantallaInicioMovil
          saldoCaja={balanceGeneral.saldoCaja}
          conectadoSupabase={conectadoSupabase}
          movimientos={movimientos}
          onAbrirGanar={abrirRegistroGanar}
          onAbrirComprar={abrirRegistroComprar}
          onIngresarSistema={() => setModoAdmin(true)}
          onIrACierre={() => {
            setModoAdmin(true)
            setVistaActual('cierre')
          }}
          onVerDetalle={(m) => setDetalleMov(m)}
        />
      ) : (
        /* VISTA 2: PANEL COMPLETO CON ACCESO A TODAS LAS FUNCIONALIDADES */
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar
            vistaActual={vistaActual}
            setVistaActual={setVistaActual}
            saldoCaja={balanceGeneral.saldoCaja}
            conectadoSupabase={conectadoSupabase}
            onNuevoMovimiento={() => {
              setTipoModalInicial('GANAR')
              setModalRegistroAbierto(true)
            }}
            onReset={handleVaciarMovimientos}
            onVolverInicio={() => setModoAdmin(false)}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {vistaActual === 'dashboard' && (
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

            {vistaActual === 'movimientos' && (
              <MovimientosView
                movimientos={movimientos}
                participantes={participantes}
                onNuevoMovimiento={() => {
                  setTipoModalInicial('GANAR')
                  setModalRegistroAbierto(true)
                }}
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

          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 print:hidden">
            <p>
              Sistema de Finanzas — Máquina Expendedora • Conectado a Supabase ({conectadoSupabase ? 'En línea' : 'Modo local'})
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
    </>
  )
}

export default App

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Clock,
  Camera,
  Trash2,
  Plus,
  Save,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Receipt,
  Sparkles,
  Loader2,
} from 'lucide-react'
import type { CicloMaquina, ConfigReparto, Movimiento, Participante } from '../types'
import { formatearMoneda, calcularReparto } from '../utils/calculations'
import { comprimirImagen } from '../utils/imageHelper'

interface EditarCicloModalProps {
  isOpen: boolean
  onClose: () => void
  ciclo: CicloMaquina | null
  movimientos: Movimiento[]
  participantes: Participante[]
  configs: ConfigReparto[]
  onGuardarEdicion: (
    cicloActualizado: CicloMaquina,
    movimientosModificados?: Movimiento[]
  ) => Promise<void>
}

export const EditarCicloModal: React.FC<EditarCicloModalProps> = ({
  isOpen,
  onClose,
  ciclo,
  movimientos,
  participantes,
  configs,
  onGuardarEdicion,
}) => {
  // Datos del Ciclo
  const [codigo, setCodigo] = useState('')
  const [tipo, setTipo] = useState<'ABASTECIMIENTO' | 'GANANCIA'>('ABASTECIMIENTO')
  const [estado, setEstado] = useState<'INICIADO' | 'EN_PROCESO' | 'CERRADO'>('INICIADO')
  const [etapaActual, setEtapaActual] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [iniciadoPor, setIniciadoPor] = useState('')
  const [observacionesAntes, setObservacionesAntes] = useState('')
  const [fotosAntes, setFotosAntes] = useState<string[]>([])

  const [fechaDespues, setFechaDespues] = useState('')
  const [horaDespues, setHoraDespues] = useState('')
  const [cerradoPor, setCerradoPor] = useState('')
  const [observacionesDespues, setObservacionesDespues] = useState('')
  const [fotosDespues, setFotosDespues] = useState<string[]>([])

  // Datos del Movimiento Vinculado
  const [movVinculado, setMovVinculado] = useState<Movimiento | null>(null)
  const [movFecha, setMovFecha] = useState('')
  const [movDescripcion, setMovDescripcion] = useState('')
  const [movMontoGanado, setMovMontoGanado] = useState<number | ''>('')
  
  // Para movimiento de compra
  const [movProveedor, setMovProveedor] = useState('')
  const [movMontoAsignado, setMovMontoAsignado] = useState<number | ''>('')
  const [movMontoAdicional, setMovMontoAdicional] = useState<number | ''>('')
  const [movQuienAporto, setMovQuienAporto] = useState('')
  const [movMontoSobrante, setMovMontoSobrante] = useState<number | ''>('')

  const [procesandoFoto, setProcesandoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const cameraInputAntesRef = useRef<HTMLInputElement>(null)
  const galleryInputAntesRef = useRef<HTMLInputElement>(null)
  const cameraInputDespuesRef = useRef<HTMLInputElement>(null)
  const galleryInputDespuesRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ciclo && isOpen) {
      setCodigo(ciclo.codigo || '')
      setTipo(ciclo.tipo)
      setEstado(ciclo.estado)
      setEtapaActual(ciclo.etapa_actual || '')
      setFechaInicio(ciclo.fecha_inicio || '')
      setHoraInicio(ciclo.hora_inicio || '')
      setIniciadoPor(ciclo.iniciado_por || '')
      setObservacionesAntes(ciclo.observaciones_antes || '')

      const fAntes =
        ciclo.fotos_antes_urls && ciclo.fotos_antes_urls.length > 0
          ? [...ciclo.fotos_antes_urls]
          : ciclo.foto_antes_url
          ? [ciclo.foto_antes_url]
          : []
      setFotosAntes(fAntes)

      setFechaDespues(ciclo.fecha_despues || '')
      setHoraDespues(ciclo.hora_despues || '')
      setCerradoPor(ciclo.cerrado_por || '')
      setObservacionesDespues(ciclo.observaciones_despues || '')

      const fDesp =
        ciclo.fotos_despues_urls && ciclo.fotos_despues_urls.length > 0
          ? [...ciclo.fotos_despues_urls]
          : ciclo.foto_despues_url
          ? [ciclo.foto_despues_url]
          : []
      setFotosDespues(fDesp)

      // Buscar movimiento vinculado
      const vinculado = movimientos.find(
        (m) => ciclo.movimiento_ids?.includes(m.id) || m.ciclo_id === ciclo.id
      )
      setMovVinculado(vinculado || null)

      if (vinculado) {
        setMovFecha(vinculado.fecha || ciclo.fecha_inicio)
        setMovDescripcion(vinculado.descripcion || '')
        if (vinculado.tipo === 'GANAR') {
          setMovMontoGanado(vinculado.monto_ganado ?? '')
        } else {
          setMovProveedor(vinculado.proveedor || '')
          setMovMontoAsignado(vinculado.monto_asignado ?? 0)
          setMovMontoAdicional(vinculado.monto_adicional ?? 0)
          setMovQuienAporto(vinculado.quien_aporto_adicional || '')
          setMovMontoSobrante(vinculado.monto_sobrante ?? 0)
        }
      } else {
        setMovFecha('')
        setMovDescripcion('')
        setMovMontoGanado('')
        setMovProveedor('')
        setMovMontoAsignado('')
        setMovMontoAdicional('')
        setMovQuienAporto('')
        setMovMontoSobrante('')
      }

      setErrorMsg(null)
    }
  }, [ciclo, isOpen, movimientos])

  if (!isOpen || !ciclo) return null

  const esGanancia = tipo === 'GANANCIA'
  const socios = participantes.filter((p) => p.es_socio)

  // Manejo de Fotos Antes
  const handleAgregarFotoAntes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setProcesandoFoto(true)
    setErrorMsg(null)
    try {
      const nuevas: string[] = []
      for (let i = 0; i < files.length; i++) {
        const compressed = await comprimirImagen(files[i])
        nuevas.push(compressed)
      }
      setFotosAntes((prev) => [...prev, ...nuevas])
    } catch {
      setErrorMsg('Error al procesar la foto.')
    } finally {
      setProcesandoFoto(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleEliminarFotoAntes = (idx: number) => {
    setFotosAntes((prev) => prev.filter((_, i) => i !== idx))
  }

  // Manejo de Fotos Después
  const handleAgregarFotoDespues = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setProcesandoFoto(true)
    setErrorMsg(null)
    try {
      const nuevas: string[] = []
      for (let i = 0; i < files.length; i++) {
        const compressed = await comprimirImagen(files[i])
        nuevas.push(compressed)
      }
      setFotosDespues((prev) => [...prev, ...nuevas])
    } catch {
      setErrorMsg('Error al procesar la foto.')
    } finally {
      setProcesandoFoto(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleEliminarFotoDespues = (idx: number) => {
    setFotosDespues((prev) => prev.filter((_, i) => i !== idx))
  }

  // Recálculo en tiempo real de reparto para GANANCIA
  const porcentajesAplicables =
    movVinculado?.snapshot_porcentajes && movVinculado.snapshot_porcentajes.length > 0
      ? movVinculado.snapshot_porcentajes
      : configs.find((c) => c.tipo === 'ganancia')?.detalles || []

  const montoGanadoNum = typeof movMontoGanado === 'number' ? movMontoGanado : 0
  const repartoRecalculado =
    montoGanadoNum > 0 ? calcularReparto(montoGanadoNum, porcentajesAplicables) : []

  // Recálculo de total gastado para COMPRA
  const asignadoNum = typeof movMontoAsignado === 'number' ? movMontoAsignado : 0
  const adicionalNum = typeof movMontoAdicional === 'number' ? movMontoAdicional : 0
  const sobranteNum = typeof movMontoSobrante === 'number' ? movMontoSobrante : 0
  const totalGastadoCalculado = Math.max(
    0,
    Number((asignadoNum + adicionalNum - sobranteNum).toFixed(2))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!codigo.trim()) {
      setErrorMsg('El código del ciclo es obligatorio.')
      return
    }

    if (!fechaInicio) {
      setErrorMsg('La fecha de inicio es obligatoria.')
      return
    }

    setGuardando(true)
    try {
      const iniciadoPart = participantes.find((p) => p.id === iniciadoPor)
      const cerradoPart = cerradoPor ? participantes.find((p) => p.id === cerradoPor) : null

      const movimientosModificados: Movimiento[] = []

      let montoInvolucradoActualizado = ciclo.monto_involucrado

      if (movVinculado) {
        if (movVinculado.tipo === 'GANAR') {
          const nuevoMonto = typeof movMontoGanado === 'number' ? movMontoGanado : 0
          const nuevoReparto = calcularReparto(nuevoMonto, porcentajesAplicables)
          montoInvolucradoActualizado = nuevoMonto

          const movMod: Movimiento = {
            ...movVinculado,
            fecha: movFecha || fechaInicio,
            descripcion: movDescripcion.trim() || movVinculado.descripcion,
            monto_ganado: nuevoMonto,
            reparto: nuevoReparto,
            snapshot_porcentajes: porcentajesAplicables,
            registrado_por: iniciadoPor || movVinculado.registrado_por,
          }
          movimientosModificados.push(movMod)
        } else if (movVinculado.tipo === 'COMPRAR') {
          montoInvolucradoActualizado = totalGastadoCalculado

          let nuevosAportes = movVinculado.aportes_adicionales
          if (adicionalNum > 0 && movQuienAporto) {
            nuevosAportes = [
              {
                id: `ap-${movVinculado.id}`,
                participante_id: movQuienAporto,
                monto: adicionalNum,
                estado: movVinculado.aportes_adicionales?.[0]?.estado || 'PENDIENTE',
              },
            ]
          } else if (adicionalNum === 0) {
            nuevosAportes = []
          }

          const movMod: Movimiento = {
            ...movVinculado,
            fecha: movFecha || fechaInicio,
            descripcion: movDescripcion.trim() || movVinculado.descripcion,
            proveedor: movProveedor.trim() || movVinculado.proveedor,
            monto_asignado: asignadoNum,
            monto_adicional: adicionalNum,
            quien_aporto_adicional: adicionalNum > 0 ? movQuienAporto : undefined,
            monto_sobrante: sobranteNum,
            total_gastado: totalGastadoCalculado,
            aportes_adicionales: nuevosAportes,
            registrado_por: iniciadoPor || movVinculado.registrado_por,
          }
          movimientosModificados.push(movMod)
        }
      }

      const cicloActualizado: CicloMaquina = {
        ...ciclo,
        codigo: codigo.trim().toUpperCase(),
        tipo,
        estado,
        etapa_actual: etapaActual.trim() || ciclo.etapa_actual,
        fecha_inicio: fechaInicio,
        hora_inicio: horaInicio,
        iniciado_por: iniciadoPor,
        iniciado_por_nombre: iniciadoPart ? iniciadoPart.nombre : ciclo.iniciado_por_nombre,
        foto_antes_url: fotosAntes[0] || ciclo.foto_antes_url,
        fotos_antes_urls: fotosAntes,
        observaciones_antes: observacionesAntes.trim() || undefined,
        fecha_despues: fechaDespues || undefined,
        hora_despues: horaDespues || undefined,
        cerrado_por: cerradoPor || undefined,
        cerrado_por_nombre: cerradoPart ? cerradoPart.nombre : ciclo.cerrado_por_nombre,
        foto_despues_url: fotosDespues[0] || ciclo.foto_despues_url,
        fotos_despues_urls: fotosDespues.length > 0 ? fotosDespues : undefined,
        observaciones_despues: observacionesDespues.trim() || undefined,
        monto_involucrado: montoInvolucradoActualizado,
        actualizado_el: new Date().toISOString(),
      }

      await onGuardarEdicion(cicloActualizado, movimientosModificados)
      onClose()
    } catch (err: any) {
      console.error(err)
      setErrorMsg('Error al guardar los cambios: ' + (err?.message || 'Error desconocido'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                esGanancia
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                  : 'bg-gradient-to-tr from-amber-500 to-orange-500'
              }`}
            >
              {esGanancia ? <TrendingUp className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Editar Ciclo de Operación
                </h3>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {ciclo.codigo}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Modifica los datos del ciclo y sus movimientos financieros vinculados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECCIÓN 1: Identificación y Estado */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              1. Identificación y Estado del Ciclo
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Código de Ciclo
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tipo de Ruta
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="ABASTECIMIENTO">Abastecimiento</option>
                  <option value="GANANCIA">Ganancia</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="INICIADO">INICIADO</option>
                  <option value="EN_PROCESO">EN PROCESO</option>
                  <option value="CERRADO">CERRADO</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Descripción de la Etapa Actual
              </label>
              <input
                type="text"
                value={etapaActual}
                onChange={(e) => setEtapaActual(e.target.value)}
                placeholder="Ej: Ciclo cerrado - Recaudación distribuida"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* SECCIÓN 2: Apertura / Datos Previos (Fotos Antes) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              2. Apertura del Ciclo (Foto ANTES)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hora de Inicio
                </label>
                <input
                  type="text"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  placeholder="14:30"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Iniciado Por
                </label>
                <select
                  value={iniciadoPor}
                  onChange={(e) => setIniciadoPor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">Selecciona usuario...</option>
                  {participantes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.rol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Observaciones de Apertura
              </label>
              <input
                type="text"
                value={observacionesAntes}
                onChange={(e) => setObservacionesAntes(e.target.value)}
                placeholder="Observaciones iniciales del estado de la máquina..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Galería de fotos antes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600">
                  Fotos Previas ({fotosAntes.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={cameraInputAntesRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleAgregarFotoAntes}
                  />
                  <input
                    type="file"
                    ref={galleryInputAntesRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAgregarFotoAntes}
                  />
                  <button
                    type="button"
                    onClick={() => cameraInputAntesRef.current?.click()}
                    disabled={procesandoFoto}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    Cámara
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputAntesRef.current?.click()}
                    disabled={procesandoFoto}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Galería
                  </button>
                </div>
              </div>

              {fotosAntes.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                  Sin fotos previas registradas
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {fotosAntes.map((foto, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-2xs"
                    >
                      <img src={foto} alt={`Foto antes ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleEliminarFotoAntes(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-xs opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: Cierre del Ciclo (Foto DESPUÉS) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              3. Cierre del Ciclo (Foto DESPUÉS)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Fecha de Cierre
                </label>
                <input
                  type="date"
                  value={fechaDespues}
                  onChange={(e) => setFechaDespues(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hora de Cierre
                </label>
                <input
                  type="text"
                  value={horaDespues}
                  onChange={(e) => setHoraDespues(e.target.value)}
                  placeholder="15:45"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cerrado Por
                </label>
                <select
                  value={cerradoPor}
                  onChange={(e) => setCerradoPor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">Selecciona usuario...</option>
                  {participantes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.rol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Observaciones de Cierre
              </label>
              <input
                type="text"
                value={observacionesDespues}
                onChange={(e) => setObservacionesDespues(e.target.value)}
                placeholder="Observaciones finales al cerrar la máquina..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Galería de fotos después */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600">
                  Fotos Posteriores ({fotosDespues.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={cameraInputDespuesRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleAgregarFotoDespues}
                  />
                  <input
                    type="file"
                    ref={galleryInputDespuesRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAgregarFotoDespues}
                  />
                  <button
                    type="button"
                    onClick={() => cameraInputDespuesRef.current?.click()}
                    disabled={procesandoFoto}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    Cámara
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputDespuesRef.current?.click()}
                    disabled={procesandoFoto}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Galería
                  </button>
                </div>
              </div>

              {fotosDespues.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                  Sin fotos posteriores registradas
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {fotosDespues.map((foto, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-2xs"
                    >
                      <img src={foto} alt={`Foto después ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleEliminarFotoDespues(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-xs opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 4: Movimiento Contable Vinculado */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              4. Registro Contable Vinculado
            </h4>

            {movVinculado ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      {movVinculado.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        movVinculado.tipo === 'GANAR'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {movVinculado.tipo}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Afecta saldo de caja y distribución de socios
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Fecha del Movimiento
                    </label>
                    <input
                      type="date"
                      value={movFecha}
                      onChange={(e) => setMovFecha(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Descripción / Glosa
                    </label>
                    <input
                      type="text"
                      value={movDescripcion}
                      onChange={(e) => setMovDescripcion(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Si es GANAR */}
                {movVinculado.tipo === 'GANAR' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Monto Recaudado en Máquina (S/)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 font-bold text-slate-400">S/</span>
                        <input
                          type="number"
                          step="0.10"
                          min="0"
                          value={movMontoGanado}
                          onChange={(e) =>
                            setMovMontoGanado(e.target.value === '' ? '' : parseFloat(e.target.value))
                          }
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Previsualización en vivo del reparto a socios */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>Recálculo automático de reparto</span>
                        <span className="text-emerald-700 font-extrabold">
                          Total: {formatearMoneda(montoGanadoNum)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {repartoRecalculado.map((rep) => {
                          const part = participantes.find((p) => p.id === rep.participante_id)
                          return (
                            <div
                              key={rep.participante_id}
                              className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-slate-800 block text-[11px]">
                                  {part?.nombre || rep.participante_id}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {rep.porcentaje_aplicado}%
                                </span>
                              </div>
                              <span className="font-mono font-black text-emerald-700">
                                {formatearMoneda(rep.monto)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Si es COMPRAR */}
                {movVinculado.tipo === 'COMPRAR' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Proveedor / Establecimiento
                        </label>
                        <input
                          type="text"
                          value={movProveedor}
                          onChange={(e) => setMovProveedor(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Monto Asignado de Caja (S/)
                        </label>
                        <input
                          type="number"
                          step="0.10"
                          min="0"
                          value={movMontoAsignado}
                          onChange={(e) =>
                            setMovMontoAsignado(
                              e.target.value === '' ? '' : parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Aporte Adicional (S/)
                        </label>
                        <input
                          type="number"
                          step="0.10"
                          min="0"
                          value={movMontoAdicional}
                          onChange={(e) =>
                            setMovMontoAdicional(
                              e.target.value === '' ? '' : parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Quién Aportó Extra
                        </label>
                        <select
                          value={movQuienAporto}
                          onChange={(e) => setMovQuienAporto(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        >
                          <option value="">Ninguno</option>
                          {socios.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Vuelto / Sobrante (S/)
                        </label>
                        <input
                          type="number"
                          step="0.10"
                          min="0"
                          value={movMontoSobrante}
                          onChange={(e) =>
                            setMovMontoSobrante(
                              e.target.value === '' ? '' : parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Total Gastado Real Calculado:</span>
                      <span className="font-mono text-sm font-black text-amber-700">
                        {formatearMoneda(totalGastadoCalculado)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                Este ciclo no tiene movimientos contables asociados todavía.
              </div>
            )}
          </div>

          {/* Pie / Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || procesandoFoto}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

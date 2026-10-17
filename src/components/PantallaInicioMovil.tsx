import React from 'react'
import {
  Coins,
  TrendingUp,
  ShoppingBag,
  ArrowRight,
  Wallet,
  Cloud,
  CloudOff,
  FileSpreadsheet,
  Clock,
  Camera,
  LogOut,
  User,
  ReceiptText,
  Images,
} from 'lucide-react'
import type { FotoMaquina, Movimiento, Participante, PermisosRol } from '../types'
import { formatearMoneda } from '../utils/calculations'

interface PantallaInicioMovilProps {
  saldoCaja: number
  conectadoSupabase: boolean
  movimientos: Movimiento[]
  fotosMaquina: FotoMaquina[]
  usuarioActual: Participante
  permisos: PermisosRol
  onAbrirGanar: () => void
  onAbrirComprar: () => void
  onAbrirFotoMaquina: () => void
  onAbrirGaleriaFotos: () => void
  onIngresarSistema: () => void
  onCerrarSesion: () => void
  onIrACierre: () => void
  onVerDetalle: (m: Movimiento) => void
}

export const PantallaInicioMovil: React.FC<PantallaInicioMovilProps> = ({
  saldoCaja,
  conectadoSupabase,
  movimientos,
  fotosMaquina,
  usuarioActual,
  permisos,
  onAbrirGanar,
  onAbrirComprar,
  onAbrirFotoMaquina,
  onAbrirGaleriaFotos,
  onIngresarSistema,
  onCerrarSesion,
  onIrACierre,
  onVerDetalle,
}) => {
  const ultimosMovimientos = movimientos.slice(0, 3)
  const esOperador = !permisos.puede_ganar && !permisos.puede_comprar && permisos.puede_foto_maquina
  const esDuenoLocal = !permisos.puede_ganar && !permisos.puede_comprar && !permisos.puede_foto_maquina && permisos.puede_ver_movimientos

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Barra Superior con Identidad de Usuario y Enlace al Sistema */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-xs tracking-tight">
                  Finanzas Vending
                </span>
                {conectadoSupabase ? (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded-full border border-emerald-200">
                    <Cloud className="w-2 h-2 text-emerald-600" />
                    Nube
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded-full">
                    <CloudOff className="w-2 h-2 text-slate-400" />
                    Local
                  </span>
                )}
              </div>
              {/* Usuario conectado y su rol */}
              <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <User className="w-2.5 h-2.5 text-indigo-500" />
                <span className="font-bold text-slate-700">{usuarioActual.nombre}</span>
                <span className="text-slate-400">({usuarioActual.rol})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Si tiene acceso a dashboard/movimientos/cierre, mostrar Ingresar al Sistema */}
            {(permisos.puede_ver_dashboard || permisos.puede_ver_movimientos || permisos.puede_gestionar_usuarios) && (
              <button
                onClick={onIngresarSistema}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200/80 transition-all cursor-pointer shadow-2xs"
                title="Acceder a más opciones del sistema"
              >
                <span>{esDuenoLocal ? 'Ver Movimientos' : 'Sistema'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
              </button>
            )}

            {/* Botón Cerrar Sesión */}
            <button
              onClick={onCerrarSesion}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Central Adaptado al Celular */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-between space-y-4">
        {/* CASO 1: OPERADOR DE MÁQUINA (SOLO TIENE ACCESO A FOTO DE LA MÁQUINA) */}
        {esOperador ? (
          <div className="space-y-4 my-auto">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-center space-y-2">
              <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200 uppercase tracking-wider">
                Rol: Operador de Máquina
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-2">
                Registro de Estado de la Máquina
              </h2>
              <p className="text-xs text-slate-500">
                Toma una foto con tu teléfono para dejar constancia de cómo se encuentra la máquina antes o después del abasto.
              </p>
            </div>

            {/* BOTÓN GIGANTE: FOTO DE LA MÁQUINA */}
            <button
              onClick={onAbrirFotoMaquina}
              className="w-full bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-teal-200/50 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-teal-400/30"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                  <Camera className="w-9 h-9 stroke-[2.3]" />
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight block">
                    FOTO MÁQUINA
                  </span>
                  <span className="text-xs text-teal-100 font-medium">
                    📸 Tomar foto (Antes / Después)
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>

            {/* Botón Ver Galería de Fotos */}
            <button
              onClick={onAbrirGaleriaFotos}
              className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Images className="w-4 h-4 text-cyan-600" />
                Ver Fotos Registradas ({fotosMaquina.length})
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        ) : esDuenoLocal ? (
          /* CASO 2: DUEÑO DEL LOCAL (ELSA) - SOLO TIENE ACCESO A LOS MOVIMIENTOS */
          <div className="space-y-4 my-auto">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-center space-y-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 uppercase tracking-wider">
                Rol: Dueño del local
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-2">
                Historial de Movimientos
              </h2>
              <p className="text-xs text-slate-500">
                Consulta el registro de compras de mercadería y recaudaciones del punto de venta.
              </p>
            </div>

            {/* Botón Gigante: Ver Todos los Movimientos */}
            <button
              onClick={onIngresarSistema}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white p-6 rounded-3xl shadow-lg shadow-indigo-200/50 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-indigo-400/30"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                  <ReceiptText className="w-9 h-9 stroke-[2.3]" />
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight block">
                    MOVIMIENTOS
                  </span>
                  <span className="text-xs text-indigo-100 font-medium">
                    Ver detalle completo ({movimientos.length})
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>

            {/* Listado de Últimos Movimientos para el Dueño del Local */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                <Clock className="w-3 h-3 text-slate-400" />
                Últimos Registros
              </span>

              {ultimosMovimientos.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-3">
                  No hay movimientos registrados actualmente.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {ultimosMovimientos.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => onVerDetalle(m)}
                      className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-1 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-800 truncate max-w-[200px]">
                          {m.descripcion || m.codigo}
                        </p>
                        <p className="text-[10px] text-slate-400">{m.fecha} • {m.tipo}</p>
                      </div>
                      <span
                        className={`font-black ${
                          m.tipo === 'GANAR' ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {m.tipo === 'GANAR'
                          ? `+${formatearMoneda(m.monto_ganado || 0)}`
                          : formatearMoneda(m.total_gastado || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CASO 3: SOCIOS INVERSIONISTAS Y ADMINISTRADOR */
          <>
            {/* Tarjeta de Saldo en Caja */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                    Saldo Disponible en Caja
                  </span>
                  <p className="text-3xl font-black tracking-tight text-white mt-0.5">
                    {formatearMoneda(saldoCaja)}
                  </p>
                  <p className="text-[11px] text-indigo-200/80 mt-1">
                    Fondo disponible para próximas compras
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Sección de BOTONES DE ACCIÓN RÁPIDA */}
            <div className="space-y-2.5 my-auto">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                ¿Qué deseas registrar ahora?
              </p>

              {/* BOTÓN 1: GANAR (RECAUDACIÓN) */}
              {permisos.puede_ganar && (
                <button
                  onClick={onAbrirGanar}
                  className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-4 sm:p-5 rounded-3xl shadow-md shadow-emerald-200/50 hover:shadow-lg hover:shadow-emerald-300/50 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-emerald-400/30"
                >
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                      <TrendingUp className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xl sm:text-2xl font-black tracking-tight block">
                        GANAR
                      </span>
                      <span className="text-xs text-emerald-100 font-medium">
                        Registrar recaudación retirada
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* BOTÓN 2: COMPRAR (MERCADERÍA) */}
              {permisos.puede_comprar && (
                <button
                  onClick={onAbrirComprar}
                  className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white p-4 sm:p-5 rounded-3xl shadow-md shadow-amber-200/50 hover:shadow-lg hover:shadow-amber-300/50 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-amber-400/30"
                >
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                      <ShoppingBag className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xl sm:text-2xl font-black tracking-tight block">
                        COMPRAR
                      </span>
                      <span className="text-xs text-amber-100 font-medium">
                        Registrar compra de productos
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* BOTÓN 3: FOTO DE LA MÁQUINA */}
              {permisos.puede_foto_maquina && (
                <button
                  onClick={onAbrirFotoMaquina}
                  className="w-full bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white p-4 sm:p-5 rounded-3xl shadow-md shadow-cyan-200/50 hover:shadow-lg hover:shadow-cyan-300/50 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-cyan-400/30"
                >
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                      <Camera className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xl sm:text-2xl font-black tracking-tight block">
                        FOTO DE LA MÁQUINA
                      </span>
                      <span className="text-xs text-cyan-100 font-medium">
                        Antes o después del abasto
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}
            </div>

            {/* Accesos Rápidos: Galería y Cierre */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onAbrirGaleriaFotos}
                  className="py-2.5 px-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Images className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    Fotos ({fotosMaquina.length})
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {permisos.puede_ver_cierre && (
                  <button
                    onClick={onIrACierre}
                    className="py-2.5 px-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      Cierre WhatsApp
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                )}
              </div>

              {/* Movimientos Recientes */}
              {permisos.puede_ver_movimientos && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Movimientos Recientes
                    </span>
                    <button
                      onClick={onIngresarSistema}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Ver todos ({movimientos.length})
                    </button>
                  </div>

                  {ultimosMovimientos.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      No hay movimientos registrados. Toca GANAR o COMPRAR para registrar el primero.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {ultimosMovimientos.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => onVerDetalle(m)}
                          className="py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-1 transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-800 truncate max-w-[190px]">
                              {m.descripcion || m.codigo}
                            </p>
                            <p className="text-[10px] text-slate-400">{m.fecha} • {m.tipo}</p>
                          </div>
                          <span
                            className={`font-black ${
                              m.tipo === 'GANAR' ? 'text-emerald-700' : 'text-slate-900'
                            }`}
                          >
                            {m.tipo === 'GANAR'
                              ? `+${formatearMoneda(m.monto_ganado || 0)}`
                              : formatearMoneda(m.total_gastado || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer minimalista */}
      <footer className="text-center py-2.5 text-[10px] text-slate-400 border-t border-slate-200/60 bg-white">
        Máquina Expendedora • Colegio • Sesión activa: {usuarioActual.nombre}
      </footer>
    </div>
  )
}

import React, { useState } from 'react'
import {
  Coins,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Delete,
} from 'lucide-react'
import type { Participante } from '../types'

interface LoginViewProps {
  participantes: Participante[]
  onLoginExitoso: (usuario: Participante) => void
}

export const LoginView: React.FC<LoginViewProps> = ({
  participantes,
  onLoginExitoso,
}) => {
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Participante | null>(null)
  const [pin, setPin] = useState('')
  const [errorPin, setErrorPin] = useState(false)

  const handleSeleccionarUsuario = (p: Participante) => {
    setUsuarioSeleccionado(p)
    setPin('')
    setErrorPin(false)
  }

  const handleDigito = (digito: string) => {
    if (pin.length < 4) {
      const nuevoPin = pin + digito
      setPin(nuevoPin)
      setErrorPin(false)

      // Auto-submit si llega a 4 dígitos
      if (nuevoPin.length === 4 && usuarioSeleccionado) {
        verificarPin(nuevoPin, usuarioSeleccionado)
      }
    }
  }

  const handleBorrar = () => {
    setPin((prev) => prev.slice(0, -1))
    setErrorPin(false)
  }

  const verificarPin = (pinIngresado: string, usuario: Participante) => {
    const pinCorrecto = usuario.pin || '1234'
    if (pinIngresado === pinCorrecto) {
      onLoginExitoso(usuario)
    } else {
      setErrorPin(true)
      setPin('')
    }
  }

  const handleIngresarDirecto = (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuarioSeleccionado) return
    verificarPin(pin, usuarioSeleccionado)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-between p-4 sm:p-6 text-white font-sans">
      {/* Header / Logo */}
      <div className="max-w-md w-full mx-auto text-center pt-6 sm:pt-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 mb-3">
          <Coins className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Finanzas Vending
        </h1>
        <p className="text-xs sm:text-sm text-indigo-200/80 mt-1">
          Control de Recaudación y Abastecimiento • Colegio
        </p>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        {!usuarioSeleccionado ? (
          /* PASO 1: SELECCIONAR USUARIO */
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/15 shadow-2xl">
            <div className="text-center mb-5">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Bienvenido al Sistema
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                ¿Quién está ingresando?
              </h2>
            </div>

            <div className="space-y-2.5">
              {participantes
                .filter((p) => p.activo)
                .map((part) => (
                  <button
                    key={part.id}
                    onClick={() => handleSeleccionarUsuario(part)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-indigo-400/50 transition-all text-left group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                        {part.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm group-hover:text-indigo-200 transition-colors">
                          {part.nombre}
                        </p>
                        <span className="inline-block text-[11px] font-medium text-indigo-200/80">
                          {part.rol}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-white/20 flex items-center justify-center text-indigo-300 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
            </div>

            <p className="text-center text-[11px] text-indigo-200/60 mt-5 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Acceso protegido por PIN individual de 4 dígitos
            </p>
          </div>
        ) : (
          /* PASO 2: DIGITAR PIN DE 4 DÍGITOS */
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/15 shadow-2xl space-y-5">
            {/* Cabecera del usuario seleccionado */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
                  {usuarioSeleccionado.nombre.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {usuarioSeleccionado.nombre}
                  </h3>
                  <span className="text-xs text-indigo-300 font-medium">
                    {usuarioSeleccionado.rol}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUsuarioSeleccionado(null)}
                className="text-xs text-indigo-300 hover:text-white underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Indicador visual de los 4 dígitos */}
            <div className="text-center py-2">
              <p className="text-xs text-indigo-200 font-medium mb-3 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-300" />
                Ingresa tu PIN de 4 dígitos
              </p>

              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => {
                  const tieneValor = pin.length > idx
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all ${
                        errorPin
                          ? 'border-2 border-rose-500 bg-rose-500/20 text-rose-300'
                          : tieneValor
                          ? 'border-2 border-indigo-400 bg-indigo-600/40 text-white shadow-sm'
                          : 'border border-white/20 bg-white/5 text-transparent'
                      }`}
                    >
                      {tieneValor ? '●' : ''}
                    </div>
                  )
                })}
              </div>

              {errorPin && (
                <p className="text-xs text-rose-400 font-bold mt-3 flex items-center justify-center gap-1 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  PIN incorrecto. Intenta de nuevo.
                </p>
              )}
            </div>

            {/* Teclado Numérico Touch Grande para Celular */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigito(num)}
                  className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-indigo-600 text-xl font-bold text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs border border-white/5"
                >
                  {num}
                </button>
              ))}
              <div className="h-14 flex items-center justify-center text-[10px] text-indigo-200/50 font-bold">
                PIN: 1234
              </div>
              <button
                type="button"
                onClick={() => handleDigito('0')}
                className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-indigo-600 text-xl font-bold text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs border border-white/5"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBorrar}
                className="h-14 rounded-2xl bg-white/10 hover:bg-rose-500/30 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-white/5"
                title="Borrar dígito"
              >
                <Delete className="w-5 h-5 text-indigo-200" />
              </button>
            </div>

            {/* Input nativo oculto / opcional para teclados físicos */}
            <form onSubmit={handleIngresarDirecto} className="pt-1">
              <button
                type="submit"
                disabled={pin.length !== 4}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                Ingresar al Sistema
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-indigo-300/60 pb-4">
        Colegio • Máquina Expendedora • Antigravity Security
      </footer>
    </div>
  )
}

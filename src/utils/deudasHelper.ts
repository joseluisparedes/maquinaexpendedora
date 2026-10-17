import type { DeudaSocioCompra, Movimiento, Participante } from '../types'

/**
 * Genera o normaliza las deudas entre socios cuando en una compra faltó dinero
 * y un socio puso de su bolsillo.
 *
 * Ejemplo: Si faltó S/ 90 y hay 3 socios (José Luis, Marlon, Jesús),
 * y Jesús puso los 90 soles:
 * - Jesús cubre su parte (S/ 30).
 * - José Luis le debe a Jesús S/ 30.
 * - Marlon le debe a Jesús S/ 30.
 */
export function obtenerDeudasDeMovimiento(
  mov: Movimiento,
  todosSocios: Participante[]
): DeudaSocioCompra[] {
  if (mov.tipo !== 'COMPRAR' || (mov.monto_adicional || 0) <= 0 || !mov.quien_aporto_adicional) {
    return []
  }

  // 1. Si ya tiene deudas registradas/actualizadas directamente en el objeto
  if (mov.deudas_socios && mov.deudas_socios.length > 0) {
    return mov.deudas_socios
  }

  // 2. También verificar si están guardadas dentro del jsonb aportes_adicionales
  if (
    mov.aportes_adicionales &&
    mov.aportes_adicionales.length > 0 &&
    (mov.aportes_adicionales[0] as any).deudas_socios &&
    (mov.aportes_adicionales[0] as any).deudas_socios.length > 0
  ) {
    return (mov.aportes_adicionales[0] as any).deudas_socios
  }

  // 3. Generar división equitativa por defecto entre los socios inversores activos
  const sociosInversionistas = todosSocios.filter((p) => p.es_socio && p.activo)
  const totalSocios = sociosInversionistas.length || 1
  const montoAdicional = mov.monto_adicional || 0
  const acreedorId = mov.quien_aporto_adicional

  // Cuota equitativa por socio
  const cuotaBase = Number((montoAdicional / totalSocios).toFixed(2))

  const deudasGeneradas: DeudaSocioCompra[] = []

  // Los demás socios le deben al socio que puso el dinero
  sociosInversionistas.forEach((socio) => {
    if (socio.id !== acreedorId) {
      deudasGeneradas.push({
        id: `deuda-${mov.id}-${socio.id}`,
        movimiento_id: mov.id,
        deudor_id: socio.id,
        acreedor_id: acreedorId,
        monto_cuota: cuotaBase,
        monto_pagado: cuotaBase,
        estado: mov.aporte_devuelto ? 'SALDADO' : 'PENDIENTE',
        fecha_pago: mov.fecha_devolucion_aporte,
        confirmado_por: mov.devuelto_por,
      })
    }
  })

  return deudasGeneradas
}

export interface ResumenDeudaEntreSocios {
  deuda: DeudaSocioCompra
  movimiento: Movimiento
  deudor: Participante
  acreedor: Participante
}

/**
 * Obtiene todas las deudas activas registradas en todos los movimientos
 */
export function obtenerTodasLasDeudas(
  movimientos: Movimiento[],
  participantes: Participante[]
): ResumenDeudaEntreSocios[] {
  const activos = movimientos.filter((m) => m.estado === 'REGISTRADO')
  const partMap = new Map<string, Participante>()
  participantes.forEach((p) => partMap.set(p.id, p))

  const resultado: ResumenDeudaEntreSocios[] = []

  for (const mov of activos) {
    if (mov.tipo === 'COMPRAR' && (mov.monto_adicional || 0) > 0) {
      const deudas = obtenerDeudasDeMovimiento(mov, participantes)
      for (const d of deudas) {
        const deudor = partMap.get(d.deudor_id) || {
          id: d.deudor_id,
          nombre: 'Socio',
          rol: 'Socio Inversionista',
          es_socio: true,
          activo: true,
        }
        const acreedor = partMap.get(d.acreedor_id) || {
          id: d.acreedor_id,
          nombre: 'Socio Acreedor',
          rol: 'Socio Inversionista',
          es_socio: true,
          activo: true,
        }

        resultado.push({
          deuda: d,
          movimiento: mov,
          deudor,
          acreedor,
        })
      }
    }
  }

  return resultado
}

/**
 * Actualiza una deuda específica dentro de un movimiento y sincroniza
 * deudas_socios y aportes_adicionales para persistencia transparente en Supabase.
 */
export function actualizarDeudaEnMovimiento(
  mov: Movimiento,
  deudaActualizada: DeudaSocioCompra,
  todosSocios: Participante[]
): Movimiento {
  const deudas = obtenerDeudasDeMovimiento(mov, todosSocios)
  const existe = deudas.some((d) => d.id === deudaActualizada.id)

  const nuevasDeudas = existe
    ? deudas.map((d) => (d.id === deudaActualizada.id ? deudaActualizada : d))
    : [...deudas, deudaActualizada]

  const todasSaldadas = nuevasDeudas.every((d) => d.estado === 'SALDADO')
  const hoy = new Date().toISOString().split('T')[0]

  const comprobantesTotales = nuevasDeudas.flatMap((d) => d.comprobantes_pago || [])

  const primerAporte = (mov.aportes_adicionales && mov.aportes_adicionales[0]) || {
    id: `ap-${mov.id}`,
    participante_id: mov.quien_aporto_adicional || '',
    monto: mov.monto_adicional || 0,
    estado: todasSaldadas ? 'DEVUELTO' : 'PENDIENTE',
  }

  const nuevosAportes: any[] = [
    {
      ...primerAporte,
      estado: todasSaldadas ? 'DEVUELTO' : 'PENDIENTE',
      fecha_devolucion: todasSaldadas ? hoy : undefined,
      devuelto_por: todasSaldadas ? deudaActualizada.confirmado_por || 'Saldado' : undefined,
      comprobantes_devolucion: comprobantesTotales,
      deudas_socios: nuevasDeudas,
    },
  ]

  return {
    ...mov,
    deudas_socios: nuevasDeudas,
    aportes_adicionales: nuevosAportes,
    aporte_devuelto: todasSaldadas,
    fecha_devolucion_aporte: todasSaldadas ? hoy : undefined,
    devuelto_por: todasSaldadas ? deudaActualizada.confirmado_por || 'Saldado' : undefined,
    comprobantes_devolucion: comprobantesTotales,
  }
}

/**
 * Obtiene métricas y listas filtradas de deudas según el usuario que tiene la sesión iniciada
 */
export function obtenerMetricasDeudasUsuario(
  movimientos: Movimiento[],
  participantes: Participante[],
  usuarioActual: Participante
) {
  const todas = obtenerTodasLasDeudas(movimientos, participantes)

  // Mis deudas como deudor (lo que yo debo pagar a otros)
  const misDeudasComoDeudor = todas.filter((r) => r.deuda.deudor_id === usuarioActual.id)
  const deudasPorPagarPendientes = misDeudasComoDeudor.filter((r) => r.deuda.estado === 'PENDIENTE')
  const deudasPorPagarPagadas = misDeudasComoDeudor.filter((r) => r.deuda.estado === 'PAGADO')

  // Mis deudas como acreedor (lo que otros me deben a mí porque puse plata)
  const misDeudasComoAcreedor = todas.filter((r) => r.deuda.acreedor_id === usuarioActual.id)
  const cobrosPendientes = misDeudasComoAcreedor.filter((r) => r.deuda.estado === 'PENDIENTE')
  const pagosPorConfirmar = misDeudasComoAcreedor.filter((r) => r.deuda.estado === 'PAGADO')

  // Deudas saldadas
  const deudasSaldadas = todas.filter((r) => r.deuda.estado === 'SALDADO')

  // Totales en soles
  const totalQueDebo = deudasPorPagarPendientes.reduce(
    (sum, r) => sum + (r.deuda.monto_pagado ?? r.deuda.monto_cuota),
    0
  )
  const totalQueMeDeben = misDeudasComoAcreedor
    .filter((r) => r.deuda.estado !== 'SALDADO')
    .reduce((sum, r) => sum + (r.deuda.monto_pagado ?? r.deuda.monto_cuota), 0)

  // Conteo para la campanita de notificación
  const esAdmin = usuarioActual.rol === 'Administrador'

  // Notificaciones críticas:
  // - Si me deben y ya me pagaron (tengo que confirmar)
  // - Si debo y aún no he pagado
  // - Si soy Admin, todas las no saldadas
  let badgeNotificaciones = 0
  if (esAdmin) {
    badgeNotificaciones = todas.filter((r) => r.deuda.estado !== 'SALDADO').length
  } else {
    badgeNotificaciones =
      deudasPorPagarPendientes.length +
      pagosPorConfirmar.length +
      cobrosPendientes.length
  }

  return {
    todas,
    misDeudasComoDeudor,
    deudasPorPagarPendientes,
    deudasPorPagarPagadas,
    misDeudasComoAcreedor,
    cobrosPendientes,
    pagosPorConfirmar,
    deudasSaldadas,
    totalQueDebo,
    totalQueMeDeben,
    badgeNotificaciones,
  }
}

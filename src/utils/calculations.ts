import type { Movimiento, PorcentajeDetalle, RepartoItem } from '../types'

/**
 * Calcula el reparto de un monto según los porcentajes configurados.
 * Aplica la regla: el último participante absorbe la diferencia de centavos por redondeo.
 */
export function calcularReparto(monto: number, porcentajes: PorcentajeDetalle[]): RepartoItem[] {
  if (monto <= 0 || porcentajes.length === 0) return []

  const resultados: RepartoItem[] = []
  let acumulado = 0

  for (let i = 0; i < porcentajes.length; i++) {
    const item = porcentajes[i]
    if (i === porcentajes.length - 1) {
      // El último se lleva la diferencia exacta
      const montoFinal = Number((monto - acumulado).toFixed(2))
      resultados.push({
        participante_id: item.participante_id,
        porcentaje_aplicado: item.porcentaje,
        monto: montoFinal,
      })
    } else {
      const montoCalculado = Number(((monto * item.porcentaje) / 100).toFixed(2))
      acumulado = Number((acumulado + montoCalculado).toFixed(2))
      resultados.push({
        participante_id: item.participante_id,
        porcentaje_aplicado: item.porcentaje,
        monto: montoCalculado,
      })
    }
  }

  return resultados
}

export interface BalanceMetricas {
  totalGanado: number
  totalGastado: number
  resultadoNeto: number
  saldoCaja: number
  totalAdicionalAportado: number
  totalSobrantesCaja: number
  totalSobrantesRepartidos: number
  totalAportesPendientes: number
}

/**
 * Calcula los totales y saldo según la especificación funcional:
 * Saldo de caja = Ganancias no repartidas - Compras pagadas con caja + Sobrantes devueltos a caja
 * Gasto total = Sum(total_gastado de Comprar)
 * Ganancia bruta = Sum(monto_ganado de Ganar)
 * Resultado neto = Ganancia bruta - Gasto total
 */
export function calcularBalance(movimientos: Movimiento[]): BalanceMetricas {
  let totalGanado = 0
  let totalGastado = 0
  let totalAdicionalAportado = 0
  let totalSobrantesCaja = 0
  let totalSobrantesRepartidos = 0
  let totalAportesPendientes = 0
  let saldoCaja = 0

  // Solo considerar movimientos no anulados
  const activos = movimientos.filter((m) => m.estado === 'REGISTRADO')

  for (const mov of activos) {
    if (mov.tipo === 'GANAR') {
      const ganado = mov.monto_ganado || 0
      totalGanado += ganado

      if (mov.origen_ganancia === 'SOBRANTE_COMPRA') {
        totalSobrantesRepartidos += ganado
      } else {
        // Toda la recaudación ingresa a la caja como fondo operativo para compras
        saldoCaja += ganado
      }
    } else if (mov.tipo === 'COMPRAR') {
      const asignado = mov.monto_asignado || 0
      const adicional = mov.monto_adicional || 0
      const sobrante = mov.monto_sobrante || 0
      const gastadoReal = mov.total_gastado ?? Math.max(0, asignado + adicional - sobrante)

      totalGastado += gastadoReal
      totalAdicionalAportado += adicional

      // El monto total cuando falta dinero afecta la caja (ej. 210 asignado + 40 extra = 250)
      if (adicional > 0) {
        saldoCaja -= gastadoReal
      } else {
        saldoCaja -= asignado
        if (mov.destino_sobrante === 'CAJA') {
          saldoCaja += sobrante
        }
      }

      if (mov.destino_sobrante === 'CAJA') {
        totalSobrantesCaja += sobrante
      }

      if (mov.aportes_adicionales && mov.aportes_adicionales.length > 0) {
        for (const ap of mov.aportes_adicionales) {
          if (ap.estado === 'PENDIENTE') {
            totalAportesPendientes += ap.monto
          }
        }
      } else if (adicional > 0 && !mov.aporte_devuelto) {
        totalAportesPendientes += adicional
      }
    }
  }

  return {
    totalGanado: Number(totalGanado.toFixed(2)),
    totalGastado: Number(totalGastado.toFixed(2)),
    resultadoNeto: Number((totalGanado - totalGastado).toFixed(2)),
    saldoCaja: Number(saldoCaja.toFixed(2)),
    totalAdicionalAportado: Number(totalAdicionalAportado.toFixed(2)),
    totalSobrantesCaja: Number(totalSobrantesCaja.toFixed(2)),
    totalSobrantesRepartidos: Number(totalSobrantesRepartidos.toFixed(2)),
    totalAportesPendientes: Number(totalAportesPendientes.toFixed(2)),
  }
}

export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(monto)
    .replace('PEN', 'S/')
}

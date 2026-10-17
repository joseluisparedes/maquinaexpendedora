export interface Participante {
  id: string
  nombre: string
  rol: string
  es_socio: boolean
  activo: boolean
}

export interface PorcentajeDetalle {
  participante_id: string
  porcentaje: number
}

export interface ConfigReparto {
  id: string
  vigente_desde: string
  tipo: 'ganancia' | 'sobrante'
  detalles: PorcentajeDetalle[]
}

export interface ProductoDetalle {
  id: string
  producto: string
  cantidad: number
  costo_unitario: number
  subtotal: number
}

export interface AporteAdicional {
  id: string
  participante_id: string
  monto: number
  estado: 'PENDIENTE' | 'DEVUELTO'
}

export interface RepartoItem {
  participante_id: string
  porcentaje_aplicado: number
  monto: number
}

export interface Movimiento {
  id: string
  codigo: string // Ej: MOV-001
  fecha: string // YYYY-MM-DD
  tipo: 'GANAR' | 'COMPRAR'
  descripcion: string
  registrado_por: string // participante id
  estado: 'REGISTRADO' | 'ANULADO'
  motivo_anulacion?: string
  comprobante_url?: string
  origen_movimiento_id?: string // Si es sobrante de compra vinculada

  // Para movimientos GANAR
  monto_ganado?: number
  periodo_desde?: string
  periodo_hasta?: string
  origen_ganancia?: 'RECAUDACION' | 'SOBRANTE_COMPRA'
  reparto?: RepartoItem[]
  snapshot_porcentajes?: PorcentajeDetalle[]

  // Para movimientos COMPRAR
  monto_asignado?: number
  monto_adicional?: number
  monto_sobrante?: number
  total_gastado?: number // Calculado: monto_asignado + monto_adicional - monto_sobrante
  proveedor?: string
  destino_sobrante?: 'CAJA' | 'REPARTO' | 'NINGUNO'
  quien_aporto_adicional?: string // participante_id
  aportes_adicionales?: AporteAdicional[]
  detalle_productos?: ProductoDetalle[]
  movimiento_sobrante_repartido_id?: string // Id del movimiento GANAR que se generó si destino_sobrante === 'REPARTO'

  creado_el: string
}

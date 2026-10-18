export interface PermisosRol {
  puede_ganar: boolean
  puede_comprar: boolean
  puede_foto_maquina: boolean
  puede_ver_movimientos: boolean
  puede_ver_cierre: boolean
  puede_ver_dashboard: boolean
  puede_config_reparto: boolean
  puede_gestionar_usuarios: boolean
}

export interface RolDefinicion {
  id: string
  nombre: string
  descripcion: string
  es_sistema?: boolean
  permisos: PermisosRol
}

export interface Participante {
  id: string
  nombre: string
  rol: string // Nombre del rol
  rol_id?: string // Identificador del rol ('admin' | 'socio' | 'dueno_local' | 'operador' | custom)
  es_socio: boolean
  activo: boolean
  pin?: string // PIN numérico de 4 dígitos
}

export interface FotoMaquina {
  id: string
  fecha: string // YYYY-MM-DD
  hora: string // HH:mm
  tipo: 'ANTES' | 'DESPUES' // Antes del abasto | Después del abasto
  foto_url: string
  observaciones?: string
  registrado_por: string // participante id
  creado_el: string
  ciclo_id?: string
}

export type TipoCiclo = 'ABASTECIMIENTO' | 'GANANCIA'
export type EstadoCiclo = 'INICIADO' | 'EN_PROCESO' | 'CERRADO'

export interface CicloMaquina {
  id: string
  codigo: string // Ej: CICLO-001
  tipo: TipoCiclo
  estado: EstadoCiclo
  etapa_actual: string // Descripción legible de en qué etapa vamos
  fecha_inicio: string // YYYY-MM-DD
  hora_inicio: string // HH:mm
  iniciado_por: string // participante_id
  iniciado_por_nombre?: string

  // Foto ANTES (Obligatoria para iniciar - soporta múltiples multimedia)
  foto_antes_url: string
  fotos_antes_urls?: string[]
  observaciones_antes?: string

  // Foto DESPUÉS (Obligatoria para cerrar abastecimiento - soporta múltiples multimedia)
  foto_despues_url?: string
  fotos_despues_urls?: string[]
  observaciones_despues?: string
  fecha_despues?: string
  hora_despues?: string
  cerrado_por?: string // participante_id
  cerrado_por_nombre?: string

  // Movimiento(s) vinculado(s)
  movimiento_ids?: string[]
  monto_involucrado?: number // Gasto en compra o recaudación en ganancia

  creado_el: string
  actualizado_el?: string
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

export interface DeudaSocioCompra {
  id: string
  movimiento_id: string
  deudor_id: string // socio que debe cubrir su parte (ej: José Luis, Marlon)
  acreedor_id: string // socio que puso el dinero extra (ej: Jesús)
  monto_cuota: number // cuota equitativa sugerida (ej: 30)
  monto_pagado?: number // monto real transferido/acordado (ej: 10 o 30)
  estado: 'PENDIENTE' | 'PAGADO' | 'SALDADO'
  fecha_pago?: string
  observaciones_pago?: string
  comprobantes_pago?: string[] // vouchers de Yape/transferencia
  fecha_confirmacion?: string
  confirmado_por?: string // acreedor o admin que dio el visto bueno
}

export interface AporteAdicional {
  id: string
  participante_id: string
  monto: number
  estado: 'PENDIENTE' | 'DEVUELTO'
  fecha_devolucion?: string
  devuelto_por?: string
  comprobantes_devolucion?: string[]
  observaciones_devolucion?: string
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
  comprobantes?: string[] // Múltiples fotos o comprobantes
  origen_movimiento_id?: string // Si es sobrante de compra vinculada
  ciclo_id?: string // ID del ciclo de máquina vinculado

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
  proveedores?: string[] // Múltiples proveedores o lugares de compra
  destino_sobrante?: 'CAJA' | 'REPARTO' | 'NINGUNO'
  quien_aporto_adicional?: string // participante_id
  aportes_adicionales?: AporteAdicional[]
  deudas_socios?: DeudaSocioCompra[]
  aporte_devuelto?: boolean
  fecha_devolucion_aporte?: string
  devuelto_por?: string
  comprobantes_devolucion?: string[]
  observaciones_devolucion?: string
  detalle_productos?: ProductoDetalle[]
  movimiento_sobrante_repartido_id?: string // Id del movimiento GANAR que se generó si destino_sobrante === 'REPARTO'

  creado_el: string
}

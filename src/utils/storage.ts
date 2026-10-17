import type { ConfigReparto, Movimiento, Participante } from '../types'

const STORAGE_KEYS = {
  PARTICIPANTES: 'vending_finanzas_participantes_v1',
  CONFIG_REPARTO: 'vending_finanzas_config_reparto_v1',
  MOVIMIENTOS: 'vending_finanzas_movimientos_v3',
  PROVEEDORES_FRECUENTES: 'vending_finanzas_proveedores_frecuentes_v1',
  GLOSAS_COMPRA: 'vending_finanzas_glosas_compra_v1',
  GLOSAS_GANAR: 'vending_finanzas_glosas_ganar_v1',
}

export const PROVEEDORES_DEFAULT = ['Makro', 'Vega', 'Metro', 'Mass', 'Mayorista']

export const GLOSAS_COMPRA_DEFAULT = [
  'Reabastecimiento general',
  'Bebidas y gaseosas',
  'Snacks y galletas',
  'Golosinas',
]

export const GLOSAS_GANAR_DEFAULT = [
  'Recaudación semanal',
  'Corte fin de mes',
  'Vaciado de monedero',
  'Cierre quincenal',
]

// Limpiar versiones antiguas de caché para que no queden datos de prueba
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('vending_finanzas_movimientos_v1')
    localStorage.removeItem('vending_finanzas_movimientos_v2')
  } catch {
    // ignore
  }
}

export const PARTICIPANTES_INICIALES: Participante[] = [
  { id: 'part-1', nombre: 'José Luis', rol: 'Socio Inversionista', es_socio: true, activo: true },
  { id: 'part-2', nombre: 'Marlon', rol: 'Socio Inversionista', es_socio: true, activo: true },
  { id: 'part-3', nombre: 'Jesús', rol: 'Socio Inversionista', es_socio: true, activo: true },
  { id: 'part-4', nombre: 'Rosita', rol: 'Operador de Máquina', es_socio: false, activo: true },
  { id: 'part-5', nombre: 'Elsa', rol: 'Directora del Colegio', es_socio: false, activo: true },
]

export const CONFIG_INICIAL: ConfigReparto[] = [
  {
    id: 'cfg-gan-1',
    vigente_desde: '2026-01-01',
    tipo: 'ganancia',
    detalles: [
      { participante_id: 'part-1', porcentaje: 25 },
      { participante_id: 'part-2', porcentaje: 25 },
      { participante_id: 'part-3', porcentaje: 25 },
      { participante_id: 'part-4', porcentaje: 15 },
      { participante_id: 'part-5', porcentaje: 10 },
    ],
  },
  {
    id: 'cfg-sob-1',
    vigente_desde: '2026-01-01',
    tipo: 'sobrante',
    detalles: [
      { participante_id: 'part-1', porcentaje: 33.34 },
      { participante_id: 'part-2', porcentaje: 33.33 },
      { participante_id: 'part-3', porcentaje: 33.33 },
    ],
  },
]

export const MOVIMIENTOS_INICIALES: Movimiento[] = []

export const StorageService = {
  getParticipantes(): Participante[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTICIPANTES)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTES, JSON.stringify(PARTICIPANTES_INICIALES))
      return PARTICIPANTES_INICIALES
    }
    try {
      return JSON.parse(raw)
    } catch {
      return PARTICIPANTES_INICIALES
    }
  },

  saveParticipantes(participantes: Participante[]): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTES, JSON.stringify(participantes))
  },

  getConfigRepartos(): ConfigReparto[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG_REPARTO)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONFIG_REPARTO, JSON.stringify(CONFIG_INICIAL))
      return CONFIG_INICIAL
    }
    try {
      return JSON.parse(raw)
    } catch {
      return CONFIG_INICIAL
    }
  },

  saveConfigRepartos(configs: ConfigReparto[]): void {
    localStorage.setItem(STORAGE_KEYS.CONFIG_REPARTO, JSON.stringify(configs))
  },

  getConfiguracionVigente(tipo: 'ganancia' | 'sobrante', fecha: string = new Date().toISOString().slice(0, 10)): ConfigReparto | undefined {
    const configs = this.getConfigRepartos().filter((c) => c.tipo === tipo)
    const ordenados = configs
      .filter((c) => c.vigente_desde <= fecha)
      .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))
    
    return ordenados[0] || configs[0]
  },

  getMovimientos(): Movimiento[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify([]))
      return []
    }
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  },

  saveMovimientos(movimientos: Movimiento[]): void {
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(movimientos))
  },

  // Métodos para Proveedores Frecuentes Configurables
  getProveedoresFrecuentes(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROVEEDORES_FRECUENTES)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROVEEDORES_FRECUENTES, JSON.stringify(PROVEEDORES_DEFAULT))
      return PROVEEDORES_DEFAULT
    }
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : PROVEEDORES_DEFAULT
    } catch {
      return PROVEEDORES_DEFAULT
    }
  },

  saveProveedoresFrecuentes(lista: string[]): void {
    localStorage.setItem(STORAGE_KEYS.PROVEEDORES_FRECUENTES, JSON.stringify(lista))
  },

  // Métodos para Glosas de Compra Configurables
  getGlosasCompraFrecuentes(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GLOSAS_COMPRA)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GLOSAS_COMPRA, JSON.stringify(GLOSAS_COMPRA_DEFAULT))
      return GLOSAS_COMPRA_DEFAULT
    }
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : GLOSAS_COMPRA_DEFAULT
    } catch {
      return GLOSAS_COMPRA_DEFAULT
    }
  },

  saveGlosasCompraFrecuentes(lista: string[]): void {
    localStorage.setItem(STORAGE_KEYS.GLOSAS_COMPRA, JSON.stringify(lista))
  },

  // Métodos para Glosas de Ganancia/Recaudación Configurables
  getGlosasGanarFrecuentes(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GLOSAS_GANAR)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GLOSAS_GANAR, JSON.stringify(GLOSAS_GANAR_DEFAULT))
      return GLOSAS_GANAR_DEFAULT
    }
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : GLOSAS_GANAR_DEFAULT
    } catch {
      return GLOSAS_GANAR_DEFAULT
    }
  },

  saveGlosasGanarFrecuentes(lista: string[]): void {
    localStorage.setItem(STORAGE_KEYS.GLOSAS_GANAR, JSON.stringify(lista))
  },

  resetData(): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTES, JSON.stringify(PARTICIPANTES_INICIALES))
    localStorage.setItem(STORAGE_KEYS.CONFIG_REPARTO, JSON.stringify(CONFIG_INICIAL))
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify([]))
    localStorage.setItem(STORAGE_KEYS.PROVEEDORES_FRECUENTES, JSON.stringify(PROVEEDORES_DEFAULT))
    localStorage.setItem(STORAGE_KEYS.GLOSAS_COMPRA, JSON.stringify(GLOSAS_COMPRA_DEFAULT))
    localStorage.setItem(STORAGE_KEYS.GLOSAS_GANAR, JSON.stringify(GLOSAS_GANAR_DEFAULT))
  },

  exportarBackup(): string {
    const data = {
      participantes: this.getParticipantes(),
      configs: this.getConfigRepartos(),
      movimientos: this.getMovimientos(),
      proveedoresFrecuentes: this.getProveedoresFrecuentes(),
      glosasCompra: this.getGlosasCompraFrecuentes(),
      glosasGanar: this.getGlosasGanarFrecuentes(),
      version: '1.1',
      fecha_exportacion: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  },

  importarBackup(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr)
      if (Array.isArray(data.participantes)) this.saveParticipantes(data.participantes)
      if (Array.isArray(data.configs)) this.saveConfigRepartos(data.configs)
      if (Array.isArray(data.movimientos)) this.saveMovimientos(data.movimientos)
      if (Array.isArray(data.proveedoresFrecuentes)) this.saveProveedoresFrecuentes(data.proveedoresFrecuentes)
      if (Array.isArray(data.glosasCompra)) this.saveGlosasCompraFrecuentes(data.glosasCompra)
      if (Array.isArray(data.glosasGanar)) this.saveGlosasGanarFrecuentes(data.glosasGanar)
      return true
    } catch (e) {
      console.error('Error importando backup', e)
      return false
    }
  },
}

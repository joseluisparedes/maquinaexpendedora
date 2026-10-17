import type { ConfigReparto, Movimiento, Participante } from '../types'

const STORAGE_KEYS = {
  PARTICIPANTES: 'vending_finanzas_participantes_v1',
  CONFIG_REPARTO: 'vending_finanzas_config_reparto_v1',
  MOVIMIENTOS: 'vending_finanzas_movimientos_v1',
}

export const PARTICIPANTES_INICIALES: Participante[] = [
  { id: 'part-1', nombre: 'Socio 1', rol: 'Socio Inversionista', es_socio: true, activo: true },
  { id: 'part-2', nombre: 'Socio 2', rol: 'Socio Inversionista', es_socio: true, activo: true },
  { id: 'part-3', nombre: 'Socio 3', rol: 'Socio Inversionista', es_socio: true, activo: true },
  { id: 'part-4', nombre: 'Operador/a', rol: 'Operador de Máquina', es_socio: false, activo: true },
  { id: 'part-5', nombre: 'Directora', rol: 'Directora del Colegio', es_socio: false, activo: true },
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
      localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(MOVIMIENTOS_INICIALES))
      return MOVIMIENTOS_INICIALES
    }
    try {
      return JSON.parse(raw)
    } catch {
      return MOVIMIENTOS_INICIALES
    }
  },

  saveMovimientos(movimientos: Movimiento[]): void {
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(movimientos))
  },

  resetData(): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTES, JSON.stringify(PARTICIPANTES_INICIALES))
    localStorage.setItem(STORAGE_KEYS.CONFIG_REPARTO, JSON.stringify(CONFIG_INICIAL))
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(MOVIMIENTOS_INICIALES))
  },

  exportarBackup(): string {
    const data = {
      participantes: this.getParticipantes(),
      configs: this.getConfigRepartos(),
      movimientos: this.getMovimientos(),
      version: '1.0',
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
      return true
    } catch (e) {
      console.error('Error importando backup', e)
      return false
    }
  },
}

import type {
  CicloMaquina,
  ConfigReparto,
  FotoMaquina,
  Movimiento,
  Participante,
  PermisosRol,
  RolDefinicion,
} from '../types'

const STORAGE_KEYS = {
  PARTICIPANTES: 'vending_finanzas_participantes_v1',
  CONFIG_REPARTO: 'vending_finanzas_config_reparto_v1',
  MOVIMIENTOS: 'vending_finanzas_movimientos_v3',
  PROVEEDORES_FRECUENTES: 'vending_finanzas_proveedores_frecuentes_v1',
  GLOSAS_COMPRA: 'vending_finanzas_glosas_compra_v1',
  GLOSAS_GANAR: 'vending_finanzas_glosas_ganar_v1',
  ROLES: 'vending_finanzas_roles_v1',
  SESION_USUARIO: 'vending_finanzas_sesion_v1',
  FOTOS_MAQUINA: 'vending_finanzas_fotos_maquina_v1',
  CICLOS: 'vending_finanzas_ciclos_v1',
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

export const ROLES_INICIALES: RolDefinicion[] = [
  {
    id: 'admin',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema, creación de usuarios, roles y configuración de repartos.',
    es_sistema: true,
    permisos: {
      puede_ganar: true,
      puede_comprar: true,
      puede_foto_maquina: true,
      puede_ver_movimientos: true,
      puede_ver_cierre: true,
      puede_ver_dashboard: true,
      puede_config_reparto: true,
      puede_gestionar_usuarios: true,
    },
  },
  {
    id: 'socio',
    nombre: 'Socio Inversionista',
    descripcion: 'Acceso a registrar ganancias, compras, fotos de máquina y reportes financieros.',
    es_sistema: true,
    permisos: {
      puede_ganar: true,
      puede_comprar: true,
      puede_foto_maquina: true,
      puede_ver_movimientos: true,
      puede_ver_cierre: true,
      puede_ver_dashboard: true,
      puede_config_reparto: false,
      puede_gestionar_usuarios: false,
    },
  },
  {
    id: 'operador',
    nombre: 'Operador de Máquina',
    descripcion: 'Acceso exclusivo para registrar y visualizar fotos del estado de la máquina.',
    es_sistema: true,
    permisos: {
      puede_ganar: false,
      puede_comprar: false,
      puede_foto_maquina: true,
      puede_ver_movimientos: false,
      puede_ver_cierre: false,
      puede_ver_dashboard: false,
      puede_config_reparto: false,
      puede_gestionar_usuarios: false,
    },
  },
  {
    id: 'dueno_local',
    nombre: 'Dueño del local',
    descripcion: 'Acceso exclusivo para visualizar el historial de movimientos de la máquina.',
    es_sistema: true,
    permisos: {
      puede_ganar: false,
      puede_comprar: false,
      puede_foto_maquina: false,
      puede_ver_movimientos: true,
      puede_ver_cierre: false,
      puede_ver_dashboard: false,
      puede_config_reparto: false,
      puede_gestionar_usuarios: false,
    },
  },
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
  { id: 'part-1', nombre: 'José Luis', rol: 'Administrador', rol_id: 'admin', es_socio: true, activo: true, pin: '1234' },
  { id: 'part-2', nombre: 'Marlon', rol: 'Socio Inversionista', rol_id: 'socio', es_socio: true, activo: true, pin: '1234' },
  { id: 'part-3', nombre: 'Jesús', rol: 'Socio Inversionista', rol_id: 'socio', es_socio: true, activo: true, pin: '1234' },
  { id: 'part-4', nombre: 'Rosita', rol: 'Operador de Máquina', rol_id: 'operador', es_socio: false, activo: true, pin: '1234' },
  { id: 'part-5', nombre: 'Elsa', rol: 'Dueño del local', rol_id: 'dueno_local', es_socio: false, activo: true, pin: '1234' },
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
  // Métodos de Roles
  getRoles(): RolDefinicion[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ROLES)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(ROLES_INICIALES))
      return ROLES_INICIALES
    }
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ROLES_INICIALES
    } catch {
      return ROLES_INICIALES
    }
  },

  saveRoles(roles: RolDefinicion[]): void {
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles))
  },

  getPermisos(participante?: Participante | null): PermisosRol {
    const rolVacio: PermisosRol = {
      puede_ganar: false,
      puede_comprar: false,
      puede_foto_maquina: false,
      puede_ver_movimientos: false,
      puede_ver_cierre: false,
      puede_ver_dashboard: false,
      puede_config_reparto: false,
      puede_gestionar_usuarios: false,
    }

    if (!participante) return rolVacio

    // José Luis SIEMPRE tiene acceso de Administrador completo
    if (
      participante.id === 'part-1' ||
      participante.nombre.toLowerCase().includes('josé luis') ||
      participante.rol_id === 'admin' ||
      participante.rol.toLowerCase().includes('admin')
    ) {
      return ROLES_INICIALES[0].permisos
    }

    const roles = this.getRoles()
    // Buscar por rol_id primero, luego por nombre
    const rolDef = roles.find(
      (r) => r.id === participante.rol_id || r.nombre.toLowerCase() === participante.rol.toLowerCase()
    )

    if (rolDef) {
      return rolDef.permisos
    }

    // Reglas de fallback si no encuentra el rol exacto
    if (participante.rol_id === 'admin' || participante.rol.toLowerCase().includes('admin')) {
      return ROLES_INICIALES[0].permisos
    }
    if (participante.es_socio) {
      return ROLES_INICIALES[1].permisos
    }
    if (participante.rol.toLowerCase().includes('operador')) {
      return ROLES_INICIALES[2].permisos
    }
    if (participante.rol.toLowerCase().includes('dueño') || participante.rol.toLowerCase().includes('local')) {
      return ROLES_INICIALES[3].permisos
    }

    return rolVacio
  },

  getParticipantes(): Participante[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTICIPANTES)
    let lista: Participante[]
    if (!raw) {
      lista = PARTICIPANTES_INICIALES
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTES, JSON.stringify(lista))
    } else {
      try {
        lista = JSON.parse(raw)
      } catch {
        lista = PARTICIPANTES_INICIALES
      }
    }

    // Migración automática para asegurar PIN, rol_id y actualización de roles solicitados
    let modificado = false
    const migrados = lista.map((p) => {
      let item = { ...p }
      if (!item.pin) {
        item.pin = '1234'
        modificado = true
      }
      // José Luis es Admin
      if (item.id === 'part-1' || item.nombre.toLowerCase().includes('josé luis')) {
        if (item.rol !== 'Administrador' || item.rol_id !== 'admin') {
          item.rol = 'Administrador'
          item.rol_id = 'admin'
          item.es_socio = true
          modificado = true
        }
      }
      // Elsa es Dueño del local
      else if (item.id === 'part-5' || item.nombre.toLowerCase().includes('elsa')) {
        if (item.rol !== 'Dueño del local' || item.rol_id !== 'dueno_local') {
          item.rol = 'Dueño del local'
          item.rol_id = 'dueno_local'
          modificado = true
        }
      }
      // Rosita es Operador de Máquina
      else if (item.id === 'part-4' || item.nombre.toLowerCase().includes('rosita')) {
        if (item.rol !== 'Operador de Máquina' || item.rol_id !== 'operador') {
          item.rol = 'Operador de Máquina'
          item.rol_id = 'operador'
          modificado = true
        }
      }
      // Otros socios
      else if (item.es_socio && !item.rol_id) {
        item.rol_id = 'socio'
        modificado = true
      }

      return item
    })

    if (modificado) {
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTES, JSON.stringify(migrados))
      return migrados
    }

    return lista
  },

  saveParticipantes(participantes: Participante[]): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTES, JSON.stringify(participantes))
  },

  // Gestión de Sesión Activa
  getSesionUsuario(): Participante | null {
    const raw = localStorage.getItem(STORAGE_KEYS.SESION_USUARIO)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  saveSesionUsuario(usuario: Participante | null): void {
    if (!usuario) {
      localStorage.removeItem(STORAGE_KEYS.SESION_USUARIO)
    } else {
      localStorage.setItem(STORAGE_KEYS.SESION_USUARIO, JSON.stringify(usuario))
    }
  },

  clearSesionUsuario(): void {
    localStorage.removeItem(STORAGE_KEYS.SESION_USUARIO)
  },

  // Gestión de Fotos de la Máquina
  getFotosMaquina(): FotoMaquina[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FOTOS_MAQUINA)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  saveFotosMaquina(fotos: FotoMaquina[]): void {
    localStorage.setItem(STORAGE_KEYS.FOTOS_MAQUINA, JSON.stringify(fotos))
  },

  addFotoMaquina(foto: FotoMaquina): void {
    const fotos = this.getFotosMaquina()
    fotos.unshift(foto)
    this.saveFotosMaquina(fotos)
  },

  // Gestión de Ciclos / Journeys de Operación
  getCiclos(): CicloMaquina[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CICLOS)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  saveCiclos(ciclos: CicloMaquina[]): void {
    localStorage.setItem(STORAGE_KEYS.CICLOS, JSON.stringify(ciclos))
  },

  addCiclo(ciclo: CicloMaquina): void {
    const ciclos = this.getCiclos()
    ciclos.unshift(ciclo)
    this.saveCiclos(ciclos)
  },

  updateCiclo(actualizado: CicloMaquina): void {
    const ciclos = this.getCiclos()
    const index = ciclos.findIndex((c) => c.id === actualizado.id)
    if (index >= 0) {
      ciclos[index] = actualizado
    } else {
      ciclos.unshift(actualizado)
    }
    this.saveCiclos(ciclos)
  },

  getCicloActivo(): CicloMaquina | null {
    const ciclos = this.getCiclos()
    return ciclos.find((c) => c.estado !== 'CERRADO') || null
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
      roles: this.getRoles(),
      configs: this.getConfigRepartos(),
      movimientos: this.getMovimientos(),
      fotosMaquina: this.getFotosMaquina(),
      proveedoresFrecuentes: this.getProveedoresFrecuentes(),
      glosasCompra: this.getGlosasCompraFrecuentes(),
      glosasGanar: this.getGlosasGanarFrecuentes(),
      version: '2.0',
      fecha_exportacion: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  },

  importarBackup(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr)
      if (Array.isArray(data.participantes)) this.saveParticipantes(data.participantes)
      if (Array.isArray(data.roles)) this.saveRoles(data.roles)
      if (Array.isArray(data.configs)) this.saveConfigRepartos(data.configs)
      if (Array.isArray(data.movimientos)) this.saveMovimientos(data.movimientos)
      if (Array.isArray(data.fotosMaquina)) this.saveFotosMaquina(data.fotosMaquina)
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

import { supabase, isSupabaseConfigured } from './supabaseClient'
import { StorageService } from './storage'
import type { CicloMaquina, ConfigReparto, FotoMaquina, Movimiento, Participante, RolDefinicion } from '../types'


export const DataService = {
  async getParticipantes(): Promise<Participante[]> {
    if (!supabase || !isSupabaseConfigured) {
      return StorageService.getParticipantes()
    }

    try {
      const { data, error } = await supabase
        .from('vending_participantes')
        .select('*')
        .order('id', { ascending: true })

      if (error || !data || data.length === 0) {
        // Fallback local
        return StorageService.getParticipantes()
      }

      const normalizados = (data as any[]).map((p) => {
        const item = { ...p }
        if (!item.pin) item.pin = '1234'
        if (item.id === 'part-1' || item.nombre.toLowerCase().includes('josé luis')) {
          item.rol = 'Administrador'
          item.rol_id = 'admin'
          item.es_socio = true
        } else if (item.id === 'part-5' || item.nombre.toLowerCase().includes('elsa')) {
          item.rol = 'Dueño del local'
          item.rol_id = 'dueno_local'
        }
        return item
      }) as Participante[]

      StorageService.saveParticipantes(normalizados)
      return normalizados
    } catch {
      return StorageService.getParticipantes()
    }
  },

  async saveParticipante(part: Participante): Promise<void> {
    // Siempre guardar local
    const locales = StorageService.getParticipantes()
    const index = locales.findIndex((p) => p.id === part.id)
    if (index >= 0) {
      locales[index] = part
    } else {
      locales.push(part)
    }
    StorageService.saveParticipantes(locales)

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('vending_participantes').upsert({
          id: part.id,
          nombre: part.nombre,
          rol: part.rol,
          rol_id: part.rol_id,
          es_socio: part.es_socio,
          activo: part.activo,
          pin: part.pin || '1234',
        })
      } catch (err) {
        console.warn('No se pudo sincronizar participante en Supabase', err)
      }
    }
  },

  async getConfigRepartos(): Promise<ConfigReparto[]> {
    if (!supabase || !isSupabaseConfigured) {
      return StorageService.getConfigRepartos()
    }

    try {
      const { data, error } = await supabase
        .from('vending_config_reparto')
        .select('*')
        .order('vigente_desde', { ascending: false })

      if (error || !data || data.length === 0) {
        return StorageService.getConfigRepartos()
      }

      return data.map((d: any) => ({
        id: d.id,
        vigente_desde: d.vigente_desde,
        tipo: d.tipo,
        detalles: d.detalles,
      })) as ConfigReparto[]
    } catch {
      return StorageService.getConfigRepartos()
    }
  },

  async saveConfigReparto(config: ConfigReparto): Promise<void> {
    const configs = StorageService.getConfigRepartos()
    configs.unshift(config)
    StorageService.saveConfigRepartos(configs)

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('vending_config_reparto').insert({
          id: config.id,
          vigente_desde: config.vigente_desde,
          tipo: config.tipo,
          detalles: config.detalles,
        })
      } catch (err) {
        console.warn('No se pudo guardar config en Supabase', err)
      }
    }
  },

  async getMovimientos(): Promise<Movimiento[]> {
    if (!supabase || !isSupabaseConfigured) {
      return StorageService.getMovimientos()
    }

    try {
      const { data, error } = await supabase
        .from('vending_movimientos')
        .select('*')
        .order('creado_el', { ascending: false })

      if (error) {
        return StorageService.getMovimientos()
      }

      if (data && data.length === 0) {
        StorageService.saveMovimientos([])
        return []
      }

      return data.map((row: any) => {
        let comprobantesArray: string[] | undefined = undefined
        if (row.comprobante_url) {
          try {
            const parsed = JSON.parse(row.comprobante_url)
            if (Array.isArray(parsed)) {
              comprobantesArray = parsed
            } else if (typeof parsed === 'string') {
              comprobantesArray = [parsed]
            }
          } catch {
            comprobantesArray = [row.comprobante_url]
          }
        }

        let proveedoresArray: string[] | undefined = undefined
        if (row.proveedor) {
          proveedoresArray = row.proveedor
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean)
        }

        return {
          id: row.id,
          codigo: row.codigo,
          fecha: row.fecha,
          tipo: row.tipo,
          descripcion: row.descripcion,
          registrado_por: row.registrado_por,
          estado: row.estado,
          motivo_anulacion: row.motivo_anulacion,
          origen_movimiento_id: row.origen_movimiento_id,
          comprobante_url: row.comprobante_url,
          comprobantes: comprobantesArray,
          monto_ganado: row.monto_ganado ? Number(row.monto_ganado) : undefined,
          periodo_desde: row.periodo_desde,
          periodo_hasta: row.periodo_hasta,
          origen_ganancia: row.origen_ganancia,
          snapshot_porcentajes: row.snapshot_porcentajes,
          reparto: row.reparto,
          monto_asignado: row.monto_asignado ? Number(row.monto_asignado) : undefined,
          monto_adicional: row.monto_adicional ? Number(row.monto_adicional) : undefined,
          monto_sobrante: row.monto_sobrante ? Number(row.monto_sobrante) : undefined,
          total_gastado: row.total_gastado ? Number(row.total_gastado) : undefined,
          proveedor: row.proveedor,
          proveedores: proveedoresArray,
          destino_sobrante: row.destino_sobrante,
          quien_aporto_adicional: row.quien_aporto_adicional,
          aportes_adicionales: row.aportes_adicionales,
          deudas_socios:
            Array.isArray(row.aportes_adicionales) && (row.aportes_adicionales[0] as any)?.deudas_socios
              ? (row.aportes_adicionales[0] as any).deudas_socios
              : undefined,
          aporte_devuelto: Boolean(
            (Array.isArray(row.aportes_adicionales) &&
              (row.aportes_adicionales[0] as any)?.deudas_socios?.length > 0 &&
              (row.aportes_adicionales[0] as any).deudas_socios.every((d: any) => d.estado === 'SALDADO')) ||
            (Array.isArray(row.aportes_adicionales) &&
              row.aportes_adicionales.some((a: any) => a.estado === 'DEVUELTO'))
          ),
          fecha_devolucion_aporte: Array.isArray(row.aportes_adicionales)
            ? row.aportes_adicionales.find((a: any) => a.estado === 'DEVUELTO')?.fecha_devolucion
            : undefined,
          devuelto_por: Array.isArray(row.aportes_adicionales)
            ? row.aportes_adicionales.find((a: any) => a.estado === 'DEVUELTO')?.devuelto_por
            : undefined,
          comprobantes_devolucion: Array.isArray(row.aportes_adicionales)
            ? row.aportes_adicionales.find((a: any) => a.comprobantes_devolucion?.length > 0)?.comprobantes_devolucion
            : undefined,
          observaciones_devolucion: Array.isArray(row.aportes_adicionales)
            ? row.aportes_adicionales.find((a: any) => a.observaciones_devolucion)?.observaciones_devolucion
            : undefined,
          detalle_productos: row.detalle_productos,
          movimiento_sobrante_repartido_id: row.movimiento_sobrante_repartido_id,
          creado_el: row.creado_el,
        }
      }) as Movimiento[]
    } catch {
      return StorageService.getMovimientos()
    }
  },

  async saveMovimiento(mov: Movimiento): Promise<void> {
    const lista = StorageService.getMovimientos()
    lista.unshift(mov)
    StorageService.saveMovimientos(lista)

    if (supabase && isSupabaseConfigured) {
      try {
        const serializedComprobantes =
          mov.comprobantes && mov.comprobantes.length > 0
            ? JSON.stringify(mov.comprobantes)
            : mov.comprobante_url || null

        const serializedProveedor =
          mov.proveedores && mov.proveedores.length > 0
            ? mov.proveedores.join(', ')
            : mov.proveedor || null

        await supabase.from('vending_movimientos').insert({
          id: mov.id,
          codigo: mov.codigo,
          fecha: mov.fecha,
          tipo: mov.tipo,
          descripcion: mov.descripcion,
          registrado_por: mov.registrado_por,
          estado: mov.estado,
          motivo_anulacion: mov.motivo_anulacion,
          origen_movimiento_id: mov.origen_movimiento_id,
          comprobante_url: serializedComprobantes,
          monto_ganado: mov.monto_ganado,
          periodo_desde: mov.periodo_desde,
          periodo_hasta: mov.periodo_hasta,
          origen_ganancia: mov.origen_ganancia,
          snapshot_porcentajes: mov.snapshot_porcentajes,
          reparto: mov.reparto,
          monto_asignado: mov.monto_asignado,
          monto_adicional: mov.monto_adicional,
          monto_sobrante: mov.monto_sobrante,
          total_gastado: mov.total_gastado,
          proveedor: serializedProveedor,
          destino_sobrante: mov.destino_sobrante,
          quien_aporto_adicional: mov.quien_aporto_adicional,
          aportes_adicionales: mov.aportes_adicionales,
          detalle_productos: mov.detalle_productos,
          movimiento_sobrante_repartido_id: mov.movimiento_sobrante_repartido_id,
          creado_el: mov.creado_el,
        })
      } catch (err) {
        console.warn('No se pudo guardar movimiento en Supabase', err)
      }
    }
  },

  async anularMovimiento(id: string, motivo: string): Promise<void> {
    const lista = StorageService.getMovimientos()
    const actualizados = lista.map((m) => {
      if (m.id === id) {
        return { ...m, estado: 'ANULADO' as const, motivo_anulacion: motivo }
      }
      if (m.origen_movimiento_id === id) {
        return {
          ...m,
          estado: 'ANULADO' as const,
          motivo_anulacion: `Anulación automática por anulación de compra origen (${motivo})`,
        }
      }
      return m
    })
    StorageService.saveMovimientos(actualizados)

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('vending_movimientos')
          .update({ estado: 'ANULADO', motivo_anulacion: motivo })
          .eq('id', id)

        await supabase
          .from('vending_movimientos')
          .update({
            estado: 'ANULADO',
            motivo_anulacion: `Anulación automática por anulación de compra origen (${motivo})`,
          })
          .eq('origen_movimiento_id', id)
      } catch (err) {
        console.warn('No se pudo anular en Supabase', err)
      }
    }
  },

  async verificarConexionSupabase(): Promise<{ conectado: boolean; mensaje: string }> {
    if (!supabase || !isSupabaseConfigured) {
      return { conectado: false, mensaje: 'Credenciales de Supabase no configuradas' }
    }
    try {
      const { error } = await supabase.from('vending_participantes').select('id').limit(1)
      if (error) {
        if (error.code === '42P01') {
          return {
            conectado: false,
            mensaje: 'Conectado a Supabase, pero falta ejecutar el script de creación de tablas.',
          }
        }
        return { conectado: false, mensaje: error.message }
      }
      return { conectado: true, mensaje: 'Conectado y sincronizado con Supabase' }
    } catch (e: any) {
      return { conectado: false, mensaje: e?.message || 'Error de red con Supabase' }
    }
  },

  async restaurarDeFabrica(): Promise<void> {
    StorageService.saveMovimientos([])
    StorageService.saveFotosMaquina([])
    StorageService.saveCiclos([])
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('vending_movimientos')
          .delete()
          .gte('fecha', '1970-01-01')
      } catch (err) {
        console.warn('Error borrando movimientos en Supabase', err)
      }
      try {
        await supabase
          .from('vending_ciclos')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
      } catch (err) {
        console.warn('Error borrando ciclos en Supabase', err)
      }
    }
  },

  async clearAllMovimientos(): Promise<void> {
    await this.restaurarDeFabrica()
  },

  async getRoles(): Promise<RolDefinicion[]> {
    return StorageService.getRoles()
  },

  async saveRoles(roles: RolDefinicion[]): Promise<void> {
    StorageService.saveRoles(roles)
  },

  async getFotosMaquina(): Promise<FotoMaquina[]> {
    return StorageService.getFotosMaquina()
  },

  async saveFotoMaquina(foto: FotoMaquina): Promise<void> {
    StorageService.addFotoMaquina(foto)
  },

  // Métodos para Ciclos de Máquina (Journeys)
  async getCiclos(): Promise<CicloMaquina[]> {
    if (!supabase || !isSupabaseConfigured) {
      return StorageService.getCiclos()
    }
    try {
      const { data, error } = await supabase
        .from('vending_ciclos')
        .select('*')
        .order('creado_el', { ascending: false })

      if (error || !data || data.length === 0) {
        return StorageService.getCiclos()
      }
      return data as CicloMaquina[]
    } catch {
      return StorageService.getCiclos()
    }
  },

  async saveCiclo(ciclo: CicloMaquina): Promise<void> {
    StorageService.addCiclo(ciclo)
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('vending_ciclos').insert(ciclo)
      } catch (err) {
        console.warn('No se pudo guardar ciclo en Supabase (usando local)', err)
      }
    }
  },

  async updateCiclo(actualizado: CicloMaquina): Promise<void> {
    StorageService.updateCiclo(actualizado)
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('vending_ciclos')
          .update(actualizado)
          .eq('id', actualizado.id)
      } catch (err) {
        console.warn('No se pudo actualizar ciclo en Supabase (usando local)', err)
      }
    }
  },

  async updateMovimiento(actualizado: Movimiento): Promise<void> {
    const locales = StorageService.getMovimientos()
    const index = locales.findIndex((m) => m.id === actualizado.id)
    if (index >= 0) {
      locales[index] = actualizado
    }
    StorageService.saveMovimientos(locales)

    if (supabase && isSupabaseConfigured) {
      try {
        const serializedComprobantes =
          actualizado.comprobantes && actualizado.comprobantes.length > 0
            ? JSON.stringify(actualizado.comprobantes)
            : actualizado.comprobante_url || null

        const serializedProveedor =
          actualizado.proveedores && actualizado.proveedores.length > 0
            ? actualizado.proveedores.join(', ')
            : actualizado.proveedor || null

        await supabase
          .from('vending_movimientos')
          .update({
            fecha: actualizado.fecha,
            descripcion: actualizado.descripcion,
            monto_ganado: actualizado.monto_ganado,
            monto_asignado: actualizado.monto_asignado,
            monto_adicional: actualizado.monto_adicional,
            monto_sobrante: actualizado.monto_sobrante,
            total_gastado: actualizado.total_gastado,
            proveedor: serializedProveedor,
            destino_sobrante: actualizado.destino_sobrante,
            quien_aporto_adicional: actualizado.quien_aporto_adicional,
            aportes_adicionales: actualizado.aportes_adicionales,
            registrado_por: actualizado.registrado_por,
            comprobante_url: serializedComprobantes,
          })
          .eq('id', actualizado.id)
      } catch (err) {
        console.warn('Error actualizando movimiento en Supabase', err)
      }
    }
  },
}

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
          ciclo_id: row.ciclo_id || undefined,
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
          ciclo_id: mov.ciclo_id || null,
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
    const locales = StorageService.getFotosMaquina()
    if (!supabase || !isSupabaseConfigured) {
      return locales
    }
    try {
      const { data, error } = await supabase
        .from('vending_fotos_maquina')
        .select('*')
        .order('creado_el', { ascending: false })

      if (error || !data) {
        return locales
      }

      const mapa = new Map<string, FotoMaquina>()
      data.forEach((f: any) => mapa.set(f.id, f as FotoMaquina))
      for (const loc of locales) {
        if (!mapa.has(loc.id)) {
          mapa.set(loc.id, loc)
          supabase.from('vending_fotos_maquina').insert(loc).then(() => {})
        }
      }

      const merged = Array.from(mapa.values()).sort(
        (a, b) => (b.creado_el || '').localeCompare(a.creado_el || '')
      )
      StorageService.saveFotosMaquina(merged)
      return merged
    } catch {
      return locales
    }
  },

  async saveFotoMaquina(foto: FotoMaquina): Promise<void> {
    StorageService.addFotoMaquina(foto)
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('vending_fotos_maquina').insert(foto)
      } catch (err) {
        console.warn('No se pudo guardar foto de maquina en Supabase (usando local)', err)
      }
    }
  },

  async deleteFotoMaquina(fotoId: string): Promise<void> {
    StorageService.deleteFotoMaquina(fotoId)
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('vending_fotos_maquina')
          .delete()
          .eq('id', fotoId)
        if (error) {
          console.warn('Error eliminando foto en Supabase:', error)
        }
      } catch (err) {
        console.warn('No se pudo eliminar foto en Supabase', err)
      }
    }
  },

  // Métodos para Ciclos de Máquina (Journeys)
  async getCiclos(): Promise<CicloMaquina[]> {
    const locales = StorageService.getCiclos()
    if (!supabase || !isSupabaseConfigured) {
      return locales
    }
    try {
      const { data, error } = await supabase
        .from('vending_ciclos')
        .select('*')
        .order('creado_el', { ascending: false })

      if (error || !data) {
        return locales
      }

      const remotas = data.map((row: any) => {
        let fotosAntes: string[] = []
        if (Array.isArray(row.fotos_antes_urls)) {
          fotosAntes = row.fotos_antes_urls
        } else if (typeof row.fotos_antes_urls === 'string') {
          try {
            const p = JSON.parse(row.fotos_antes_urls)
            if (Array.isArray(p)) fotosAntes = p
          } catch {
            if (row.fotos_antes_urls) fotosAntes = [row.fotos_antes_urls]
          }
        }
        if (fotosAntes.length === 0 && row.foto_antes_url) {
          try {
            const p = JSON.parse(row.foto_antes_url)
            if (Array.isArray(p)) fotosAntes = p
            else fotosAntes = [row.foto_antes_url]
          } catch {
            fotosAntes = [row.foto_antes_url]
          }
        }

        let fotosDespues: string[] = []
        if (Array.isArray(row.fotos_despues_urls)) {
          fotosDespues = row.fotos_despues_urls
        } else if (typeof row.fotos_despues_urls === 'string') {
          try {
            const p = JSON.parse(row.fotos_despues_urls)
            if (Array.isArray(p)) fotosDespues = p
          } catch {
            if (row.fotos_despues_urls) fotosDespues = [row.fotos_despues_urls]
          }
        }
        if (fotosDespues.length === 0 && row.foto_despues_url) {
          try {
            const p = JSON.parse(row.foto_despues_url)
            if (Array.isArray(p)) fotosDespues = p
            else fotosDespues = [row.foto_despues_url]
          } catch {
            fotosDespues = [row.foto_despues_url]
          }
        }

        let movIds: string[] = []
        if (Array.isArray(row.movimiento_ids)) {
          movIds = row.movimiento_ids
        } else if (typeof row.movimiento_ids === 'string') {
          try {
            const p = JSON.parse(row.movimiento_ids)
            if (Array.isArray(p)) movIds = p
          } catch {
            if (row.movimiento_ids) movIds = [row.movimiento_ids]
          }
        }

        return {
          ...row,
          foto_antes_url: fotosAntes[0] || row.foto_antes_url || '',
          fotos_antes_urls:
            fotosAntes.length > 0 ? fotosAntes : row.foto_antes_url ? [row.foto_antes_url] : [],
          foto_despues_url: fotosDespues[0] || row.foto_despues_url,
          fotos_despues_urls:
            fotosDespues.length > 0
              ? fotosDespues
              : row.foto_despues_url
              ? [row.foto_despues_url]
              : undefined,
          movimiento_ids: movIds,
          monto_involucrado: row.monto_involucrado ? Number(row.monto_involucrado) : undefined,
        } as CicloMaquina
      })

      // Fusionar ciclos remotos y locales para evitar pérdida de datos
      const mapa = new Map<string, CicloMaquina>()
      remotas.forEach((c) => mapa.set(c.id, c))
      for (const loc of locales) {
        if (!mapa.has(loc.id)) {
          mapa.set(loc.id, loc)
          supabase.from('vending_ciclos').insert(loc).then(() => {})
        }
      }

      const merged = Array.from(mapa.values()).sort(
        (a, b) => (b.creado_el || '').localeCompare(a.creado_el || '')
      )
      StorageService.saveCiclos(merged)
      return merged
    } catch {
      return locales
    }
  },

  async saveCiclo(ciclo: CicloMaquina): Promise<void> {
    StorageService.addCiclo(ciclo)
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('vending_ciclos').insert(ciclo)
        if (error) {
          console.warn('Error guardando ciclo en Supabase (usando local):', error)
        }
      } catch (err) {
        console.warn('No se pudo guardar ciclo en Supabase (usando local)', err)
      }
    }
  },

  async updateCiclo(actualizado: CicloMaquina): Promise<void> {
    StorageService.updateCiclo(actualizado)
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('vending_ciclos')
          .update(actualizado)
          .eq('id', actualizado.id)
        if (error) {
          console.warn('Error actualizando ciclo en Supabase (usando local):', error)
        }
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
            reparto: actualizado.reparto,
            snapshot_porcentajes: actualizado.snapshot_porcentajes,
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
            ciclo_id: actualizado.ciclo_id || null,
          })
          .eq('id', actualizado.id)
      } catch (err) {
        console.warn('Error actualizando movimiento en Supabase', err)
      }
    }
  },

  async deleteCiclo(cicloId: string): Promise<{ deletedMovimientoIds: string[] }> {
    const todosCiclos = StorageService.getCiclos()
    const ciclo = todosCiclos.find((c) => c.id === cicloId)
    const todosMovs = StorageService.getMovimientos()

    // 1. Encontrar todos los movimientos directos e indirectos vinculados al ciclo
    const directMovIds = new Set<string>()
    if (ciclo?.movimiento_ids && Array.isArray(ciclo.movimiento_ids)) {
      ciclo.movimiento_ids.forEach((id) => directMovIds.add(id))
    }
    todosMovs.forEach((m) => {
      if (m.ciclo_id === cicloId) {
        directMovIds.add(m.id)
      }
    })

    // Movimientos secundarios (reparto de sobrante o hijos derivados)
    const allMovIdsToDelete = new Set<string>(directMovIds)
    todosMovs.forEach((m) => {
      if (m.origen_movimiento_id && directMovIds.has(m.origen_movimiento_id)) {
        allMovIdsToDelete.add(m.id)
      }
      if (m.movimiento_sobrante_repartido_id && directMovIds.has(m.movimiento_sobrante_repartido_id)) {
        allMovIdsToDelete.add(m.id)
      }
      if (m.movimiento_sobrante_repartido_id && directMovIds.has(m.id)) {
        allMovIdsToDelete.add(m.movimiento_sobrante_repartido_id)
      }
    })

    const deletedMovimientoIds = Array.from(allMovIdsToDelete)

    // 2. Eliminar de almacenamiento local
    StorageService.deleteCiclo(cicloId)
    if (deletedMovimientoIds.length > 0) {
      StorageService.deleteMovimientos(deletedMovimientoIds)
    }
    StorageService.deleteFotosPorCiclo(cicloId)

    // 3. Eliminar de Supabase en cascada
    if (supabase && isSupabaseConfigured) {
      try {
        if (deletedMovimientoIds.length > 0) {
          const { error: movErr } = await supabase
            .from('vending_movimientos')
            .delete()
            .in('id', deletedMovimientoIds)
          if (movErr) console.warn('Error eliminando movimientos del ciclo en Supabase:', movErr)
        }

        const { error: cicloErr } = await supabase
          .from('vending_ciclos')
          .delete()
          .eq('id', cicloId)
        if (cicloErr) console.warn('Error eliminando ciclo en Supabase:', cicloErr)

        const { error: fotoErr } = await supabase
          .from('vending_fotos_maquina')
          .delete()
          .eq('ciclo_id', cicloId)
        if (fotoErr) console.warn('Error eliminando fotos del ciclo en Supabase:', fotoErr)
      } catch (err) {
        console.warn('Error en borrado en cascada en Supabase', err)
      }
    }

    return { deletedMovimientoIds }
  },

  async updateCicloCompleto(
    ciclo: CicloMaquina,
    movimientosModificados?: Movimiento[]
  ): Promise<void> {
    await this.updateCiclo(ciclo)
    if (movimientosModificados && movimientosModificados.length > 0) {
      for (const mov of movimientosModificados) {
        await this.updateMovimiento(mov)
      }
    }
  },
}

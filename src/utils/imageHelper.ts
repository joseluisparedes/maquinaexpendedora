import { supabase, isSupabaseConfigured } from './supabaseClient'

export const STORAGE_BUCKET = 'vending-media'

/**
 * Convierte un Data URL (Base64) a Uint8Array y su contentType
 */
const dataUrlToBytes = (dataUrl: string): { bytes: Uint8Array; contentType: string } | null => {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
  if (!matches) return null
  const contentType = matches[1]
  const base64 = matches[2]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return { bytes, contentType }
}

/**
 * Sube una imagen en Base64 al bucket público `vending-media` de Supabase Storage
 * y devuelve la URL pública ligera. Si ya es una URL http(s) o no hay conexión, devuelve el valor original.
 */
export const subirImagenASupabase = async (
  dataUrlOrUrl: string,
  carpeta = 'capturas'
): Promise<string> => {
  if (!dataUrlOrUrl || !dataUrlOrUrl.startsWith('data:image/')) {
    return dataUrlOrUrl
  }
  if (!supabase || !isSupabaseConfigured) {
    return dataUrlOrUrl
  }

  try {
    const parsed = dataUrlToBytes(dataUrlOrUrl)
    if (!parsed) return dataUrlOrUrl

    const ext = parsed.contentType.includes('png') ? 'png' : 'jpg'
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const filePath = `${carpeta}/${uniqueId}.${ext}`

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, parsed.bytes, {
      contentType: parsed.contentType,
      upsert: true,
    })

    if (error) {
      console.warn('No se pudo subir imagen a Supabase Storage, usando respaldo:', error)
      return dataUrlOrUrl
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
    return data.publicUrl || dataUrlOrUrl
  } catch (err) {
    console.warn('Error subiendo imagen a Supabase Storage:', err)
    return dataUrlOrUrl
  }
}

/**
 * Extrae el path interno del bucket a partir de una URL pública de Supabase Storage
 */
export const extraerStoragePath = (publicUrl?: string): string | null => {
  if (!publicUrl || typeof publicUrl !== 'string') return null
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(publicUrl.slice(idx + marker.length))
}

/**
 * Utilidades para manejo, compresión, subida a Supabase Storage y descarga de comprobantes en el cliente.
 * Optimizado para celular (reduce fotos de 10MB a ~150KB y las sube a Supabase Storage devolviendo la URL).
 */
export const comprimirImagen = (
  file: File,
  maxDimension = 1280,
  calidad = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.onload = async () => {
        let { width, height } = img

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          const fallback = event.target?.result as string
          const url = await subirImagenASupabase(fallback, 'capturas')
          resolve(url)
          return
        }

        // Fondo blanco para imágenes transparentes/PNG
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)

        ctx.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', calidad)
        const publicUrl = await subirImagenASupabase(compressedDataUrl, 'capturas')
        resolve(publicUrl)
      }

      img.onerror = () => {
        reject(new Error('No se pudo procesar la imagen seleccionada'))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'))
    }

    reader.readAsDataURL(file)
  })
}

export const descargarImagen = async (
  dataUrlOrUrl: string,
  nombreArchivo = 'comprobante.jpg'
): Promise<void> => {
  try {
    if (dataUrlOrUrl.startsWith('http://') || dataUrlOrUrl.startsWith('https://')) {
      const response = await fetch(dataUrlOrUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = nombreArchivo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000)
      return
    }
  } catch {
    // Fallback al comportamiento directo
  }

  const link = document.createElement('a')
  link.href = dataUrlOrUrl
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Utilidades para manejo, compresión y descarga de comprobantes en el cliente.
 * Optimizado para celular (reduce fotos de 10MB a ~150KB sin perder legibilidad).
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
      img.onload = () => {
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
          resolve(event.target?.result as string)
          return
        }

        // Fondo blanco para imágenes transparentes/PNG
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)

        ctx.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', calidad)
        resolve(compressedDataUrl)
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

export const descargarImagen = (dataUrl: string, nombreArchivo = 'comprobante.jpg'): void => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

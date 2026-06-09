// Prepares an image for the link-preview (og:image) so WhatsApp actually
// shows it. WhatsApp drops previews when the image is too heavy (>~500 KB
// on cellular) or in WebP, while Facebook is more forgiving — that's why
// "works in FB but not WhatsApp" reports trace back here.
//
// Pipeline: source File → 1200×630 cover-cropped canvas → JPEG with
// iteratively lowered quality until ≤ TARGET_BYTES. Always returns a
// JPEG data URI (or throws on a totally unreadable source).

const TARGET_W = 1200
const TARGET_H = 630
const TARGET_BYTES = 300 * 1024 // 300 KB — WhatsApp's comfort zone
const MIN_QUALITY = 0.45 // below this the JPEG looks visibly muddy

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    img.src = src
  })
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsDataURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falló la compresión.'))),
      type,
      quality,
    )
  })
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo serializar la imagen.'))
    reader.readAsDataURL(blob)
  })
}

export async function processShareImage(file: File): Promise<string> {
  const src = await fileToDataUri(file)
  const img = await loadImage(src)

  // Cover-crop: scale so the image fills 1200×630 without distortion,
  // then center-crop the overflow.
  const scale = Math.max(TARGET_W / img.width, TARGET_H / img.height)
  const drawW = img.width * scale
  const drawH = img.height * scale
  const dx = (TARGET_W - drawW) / 2
  const dy = (TARGET_H - drawH) / 2

  const canvas = document.createElement('canvas')
  canvas.width = TARGET_W
  canvas.height = TARGET_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible en este navegador.')
  // White matte so JPEGs of PNGs with transparency don't show black.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, TARGET_W, TARGET_H)
  ctx.drawImage(img, dx, dy, drawW, drawH)

  let quality = 0.82
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.1)
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  }

  return blobToDataUri(blob)
}

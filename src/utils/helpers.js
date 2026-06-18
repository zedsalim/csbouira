export function debounce(fn, delay = 300) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function getFileIconClass(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase()
  const icons = {
    pdf: 'fas fa-file-pdf text-red-500',
    doc: 'fas fa-file-word text-blue-600',
    docx: 'fas fa-file-word text-blue-600',
    ppt: 'fas fa-file-powerpoint text-orange-500',
    pptx: 'fas fa-file-powerpoint text-orange-500',
    xls: 'fas fa-file-excel text-green-500',
    xlsx: 'fas fa-file-excel text-green-500',
    zip: 'fas fa-file-archive text-purple-500',
    rar: 'fas fa-file-archive text-purple-500',
    '7z': 'fas fa-file-archive text-purple-500',
    tar: 'fas fa-file-archive text-purple-500',
    gz: 'fas fa-file-archive text-purple-500',
    png: 'fas fa-file-image text-yellow-500',
    jpg: 'fas fa-file-image text-yellow-500',
    jpeg: 'fas fa-file-image text-yellow-500',
    webp: 'fas fa-file-image text-pink-500',
    gif: 'fas fa-file-image text-pink-400',
    svg: 'fas fa-file-image text-indigo-500',
    bmp: 'fas fa-file-image text-yellow-600',
    ico: 'fas fa-file-image text-gray-500',
    avif: 'fas fa-file-image text-fuchsia-500',
    mp4: 'fas fa-file-video text-red-400',
    mov: 'fas fa-file-video text-red-400',
    avi: 'fas fa-file-video text-red-400',
    mkv: 'fas fa-file-video text-red-400',
    webm: 'fas fa-file-video text-red-400',
    mp3: 'fas fa-file-audio text-green-500',
    wav: 'fas fa-file-audio text-green-500',
    ogg: 'fas fa-file-audio text-green-500',
    flac: 'fas fa-file-audio text-green-500',
    txt: 'fas fa-file-alt text-gray-500',
    md: 'fab fa-markdown text-gray-500',
    csv: 'fas fa-file-csv text-green-500',
    json: 'fas fa-file-code text-yellow-500',
    xml: 'fas fa-file-code text-orange-400',
    py: 'fab fa-python text-blue-500',
    js: 'fab fa-js-square text-yellow-400',
    ts: 'fas fa-file-code text-blue-500',
    jsx: 'fab fa-react text-cyan-400',
    tsx: 'fab fa-react text-cyan-400',
    html: 'fab fa-html5 text-orange-500',
    css: 'fab fa-css3-alt text-blue-500',
    java: 'fab fa-java text-red-500',
    php: 'fab fa-php text-indigo-500',
    c: 'fas fa-file-code text-blue-400',
    cpp: 'fas fa-file-code text-blue-400',
  }

  return icons[ext] || 'fas fa-file text-gray-500'
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result.split(',')[1])
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

let _bodyScrollLocked = false
export function lockBodyScroll() {
  if (_bodyScrollLocked) return
  _bodyScrollLocked = true
  document.body.classList.add('overflow-hidden', 'touch-none')
}
export function unlockBodyScroll() {
  _bodyScrollLocked = false
  document.body.classList.remove('overflow-hidden', 'touch-none')
}

export function canvasToFile(canvas, filename = 'scan.pdf', mimeType = 'application/pdf') {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], filename, { type: mimeType }))
    }, mimeType === 'application/pdf' ? 'image/png' : mimeType, 0.92)
  })
}

export function perspectiveTransform(srcCanvas, srcPoints, dstW, dstH) {
  const dst = document.createElement('canvas')
  dst.width = dstW
  dst.height = dstH
  const ctx = dst.getContext('2d')
  const srcCtx = srcCanvas.getContext('2d')
  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height)
  const dstData = ctx.createImageData(dstW, dstH)

  const [tl, tr, br, bl] = srcPoints

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const u = x / dstW
      const v = y / dstH

      const srcX =
        (1 - v) * ((1 - u) * tl.x + u * tr.x) +
        v * ((1 - u) * bl.x + u * br.x)
      const srcY =
        (1 - v) * ((1 - u) * tl.y + u * tr.y) +
        v * ((1 - u) * bl.y + u * br.y)

      const sx = Math.round(srcX)
      const sy = Math.round(srcY)

      if (sx >= 0 && sx < srcCanvas.width && sy >= 0 && sy < srcCanvas.height) {
        const srcIdx = (sy * srcCanvas.width + sx) * 4
        const dstIdx = (y * dstW + x) * 4
        dstData.data[dstIdx] = srcData.data[srcIdx]
        dstData.data[dstIdx + 1] = srcData.data[srcIdx + 1]
        dstData.data[dstIdx + 2] = srcData.data[srcIdx + 2]
        dstData.data[dstIdx + 3] = srcData.data[srcIdx + 3]
      }
    }
  }

  ctx.putImageData(dstData, 0, 0)
  return dst
}

export function applyColorAdjustments(canvas, { brightness = 100, contrast = 100, saturation = 100, grayscale = 0 }) {
  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const bFactor = brightness / 100
  const cFactor = (contrast / 100 + 0.5) / 0.5
  const sFactor = saturation / 100

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    r *= bFactor
    g *= bFactor
    b *= bFactor

    r = (r - 128) * cFactor + 128
    g = (g - 128) * cFactor + 128
    b = (b - 128) * cFactor + 128

    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
    r = r * (1 - grayscale / 100) + gray * (grayscale / 100)
    g = g * (1 - grayscale / 100) + gray * (grayscale / 100)
    b = b * (1 - grayscale / 100) + gray * (grayscale / 100)

    const avg = (r + g + b) / 3
    r = r + (r - avg) * (sFactor - 1)
    g = g + (g - avg) * (sFactor - 1)
    b = b + (b - avg) * (sFactor - 1)

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  ctx.putImageData(imageData, 0, 0)
}

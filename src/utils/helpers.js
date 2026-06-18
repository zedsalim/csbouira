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

export function applyColorAdjustments(canvas, { brightness = 100, contrast = 100, saturation = 100, grayscale = 0, sharpness = 0, clarity = 0, highlights = 0 }) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const w = canvas.width, h = canvas.height
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const len = d.length
  const n = w * h

  const bF = brightness / 100
  const cF = contrast < 100 ? contrast / 100 : (contrast / 100 + 1) / 2
  const sF = saturation / 100
  const gF = grayscale / 100
  const hF = highlights / 100
  const cLr = clarity / 100
  const sStr = sharpness / 100

  if (clarity !== 0 || highlights !== 0) {
    const lum = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const idx = i << 2
      lum[i] = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2]
    }
    if (clarity !== 0) {
      const tmp = new Float32Array(n)
      const radius = 2
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0, cnt = 0
          for (let dy = -radius; dy <= radius; dy++) {
            const ny = y + dy
            if (ny < 0 || ny >= h) continue
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx
              if (nx < 0 || nx >= w) continue
              sum += lum[ny * w + nx]
              cnt++
            }
          }
          tmp[y * w + x] = sum / cnt
        }
      }
      const cF2 = cLr * 2
      for (let i = 0; i < n; i++) {
        const diff = (lum[i] - tmp[i]) * cF2
        const idx = i << 2
        d[idx] += diff
        d[idx + 1] += diff
        d[idx + 2] += diff
      }
    }
    if (highlights !== 0) {
      for (let i = 0; i < n; i++) {
        const l = lum[i] / 255
        const factor = ((1 - l) ** 2) * hF * 80
        const idx = i << 2
        d[idx] += factor
        d[idx + 1] += factor
        d[idx + 2] += factor
      }
    }
  }

  for (let i = 0; i < len; i += 4) {
    let r = d[i] * bF
    let g = d[i + 1] * bF
    let b = d[i + 2] * bF
    r = (r - 128) * cF + 128
    g = (g - 128) * cF + 128
    b = (b - 128) * cF + 128
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = r * (1 - gF) + gray * gF
    g = g * (1 - gF) + gray * gF
    b = b * (1 - gF) + gray * gF
    const avg = (r + g + b) / 3
    r += (r - avg) * (sF - 1)
    g += (g - avg) * (sF - 1)
    b += (b - avg) * (sF - 1)
    d[i] = Math.max(0, Math.min(255, r))
    d[i + 1] = Math.max(0, Math.min(255, g))
    d[i + 2] = Math.max(0, Math.min(255, b))
  }

  if (sharpness !== 0) {
    const orig = new Uint8ClampedArray(d)
    const amount = sStr * 2
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4
        for (let c = 0; c < 3; c++) {
          const sum = orig[((y - 1) * w + x) * 4 + c] * -1 +
            orig[((y + 1) * w + x) * 4 + c] * -1 +
            orig[(y * w + x - 1) * 4 + c] * -1 +
            orig[(y * w + x + 1) * 4 + c] * -1 +
            orig[(y * w + x) * 4 + c] * 5
          d[idx + c] = Math.max(0, Math.min(255, orig[idx + c] + sum * amount))
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

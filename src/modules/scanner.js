import { perspectiveTransform, applyColorAdjustments } from '../utils/helpers.js'
import { jsPDF } from 'jspdf'

let cameraStream = null
let baseCanvas = null
let torchOn = false
let editorCanvas = null
let editorCtx = null
let activeTab = 'crop'

let cropState = { x: 0, y: 0, w: 0, h: 0, dragging: false, handle: null }
let perspectiveState = {
  points: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  dragging: -1,
}
let colorState = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sharpness: 0, clarity: 0, highlights: 0 }

let onFileReady = null
let colorDirty = false
let previewCanvas = null
let previewCtx = null

export function initScanner() {
  window.openScannerModal = openScannerModal
  window.closeScannerModal = closeScannerModal
  window.scannerCapture = scannerCapture
  window.scannerGallery = scannerGallery
  window.closeEditorModal = closeEditorModal
  window.switchEditorTab = switchEditorTab
  window.saveScannerPdf = saveScannerPdf
  window.resetColorSliders = resetColorSliders
  window.applyCrop = applyCrop
  window.applyPerspective = applyPerspective
  window.applyColors = applyColors
  window.toggleTorch = toggleTorch

  const galleryInput = document.getElementById('scannerGalleryInput')
  if (galleryInput) {
    galleryInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadFromGallery(e.target.files[0])
      }
    })
  }

  const editorCanvasEl = document.getElementById('editorCanvas')
  if (editorCanvasEl) {
    editorCanvas = editorCanvasEl
    editorCtx = editorCanvas.getContext('2d')
    setupEditorEvents()
  }

  const colorSliders = ['brightness', 'contrast', 'saturation', 'grayscale', 'sharpness', 'clarity', 'highlights']
  colorSliders.forEach((id) => {
    const el = document.getElementById(id + 'Slider')
    if (el) {
      el.addEventListener('input', (e) => {
        colorState[id] = Number(e.target.value)
        const valEl = document.getElementById(id + 'Val')
        if (valEl) valEl.textContent = e.target.value + '%'
        scheduleColorRender()
      })
    }
  })
}

export function setScannerCallback(cb) {
  onFileReady = cb
}

function openScannerModal() {
  document.getElementById('scannerModal')?.showModal()
  startCamera()
}

function closeScannerModal() {
  stopCamera()
  document.getElementById('scannerModal')?.close()
  const galleryInput = document.getElementById('scannerGalleryInput')
  if (galleryInput) galleryInput.value = ''
}

async function startCamera() {
  const video = document.getElementById('scannerVideo')
  const torchBtn = document.getElementById('torchBtn')
  if (!video) return
  torchOn = false
  updateTorchUI()

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const rearCameras = devices.filter(
      (d) => d.kind === 'videoinput' && d.label.toLowerCase().includes('back')
    )

    if (rearCameras.length > 0) {
      const mainCamera = rearCameras.find((c) =>
        c.getCapabilities?.().torch ?? false
      ) || rearCameras[rearCameras.length - 1]

      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: mainCamera.deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
    } else {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
    }

    video.srcObject = cameraStream
    await video.play()
    document.getElementById('scannerPlaceholder')?.classList.add('hidden')
    video.classList.remove('hidden')

    const track = cameraStream.getVideoTracks()[0]
    const caps = track.getCapabilities?.() || {}
    if (torchBtn) {
      if (caps.torch) torchBtn.classList.remove('hidden')
      else torchBtn.classList.add('hidden')
    }
  } catch {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      video.srcObject = cameraStream
      await video.play()
      document.getElementById('scannerPlaceholder')?.classList.add('hidden')
      video.classList.remove('hidden')
      if (torchBtn) torchBtn.classList.add('hidden')
    } catch {
      document.getElementById('scannerPlaceholder')?.classList.remove('hidden')
      document.getElementById('scannerPlaceholderText').textContent =
        'Camera not available. Use Gallery to pick an image.'
      if (torchBtn) torchBtn.classList.add('hidden')
    }
  }
}

async function toggleTorch() {
  const track = cameraStream?.getVideoTracks()[0]
  if (!track) return
  const caps = track.getCapabilities?.() || {}
  if (!caps.torch) return

  torchOn = !torchOn
  await track.applyConstraints({ advanced: [{ torch: torchOn }] })
  updateTorchUI()
}

function updateTorchUI() {
  const icon = document.getElementById('torchIcon')
  if (!icon) return
  icon.className = torchOn ? 'fas fa-bolt text-yellow-400' : 'fas fa-bolt text-base-content/60'
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop())
    cameraStream = null
  }
  const video = document.getElementById('scannerVideo')
  if (video) {
    video.srcObject = null
    video.classList.add('hidden')
  }
  document.getElementById('scannerPlaceholder')?.classList.add('hidden')
}

function scannerCapture() {
  const video = document.getElementById('scannerVideo')
  if (!video || !cameraStream) return

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = video.videoWidth
  tempCanvas.height = video.videoHeight
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.drawImage(video, 0, 0)

  stopCamera()
  closeScannerModal()

  loadImageToEditor(tempCanvas.toDataURL('image/png'))
}

function scannerGallery() {
  document.getElementById('scannerGalleryInput')?.click()
}

function loadFromGallery(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    closeScannerModal()
    loadImageToEditor(e.target.result)
  }
  reader.readAsDataURL(file)
}

function loadImageToEditor(src) {
  const img = new Image()
  img.onload = () => {
    baseCanvas = document.createElement('canvas')
    baseCanvas.width = img.width
    baseCanvas.height = img.height
    baseCanvas.getContext('2d').drawImage(img, 0, 0)
    openEditor()
  }
  img.src = src
}

function openEditor() {
  if (!baseCanvas || !editorCanvas) return

  const maxW = Math.min(800, window.innerWidth - 64)
  const maxH = Math.min(500, window.innerHeight - 260)
  const scale = Math.min(maxW / baseCanvas.width, maxH / baseCanvas.height, 1)

  editorCanvas.width = Math.round(baseCanvas.width * scale)
  editorCanvas.height = Math.round(baseCanvas.height * scale)

  resetCropState()
  resetPerspectiveState()
  colorState = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sharpness: 0, clarity: 0, highlights: 0 }
  previewCanvas = null
  previewCtx = null
  resetColorSliderUI()

  activeTab = 'crop'
  switchEditorTab('crop')
  renderEditor()
  document.getElementById('editorModal')?.showModal()
}

function closeEditorModal() {
  document.getElementById('editorModal')?.close()
  baseCanvas = null
}

function switchEditorTab(tab) {
  activeTab = tab
  document.querySelectorAll('.editor-tab-btn').forEach((btn) => {
    btn.classList.toggle('btn-active', btn.dataset.tab === tab)
  })
  document.querySelectorAll('.editor-tab-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.panel !== tab)
  })
  if (tab === 'crop') resetCropState()
  if (tab === 'perspective') resetPerspectiveState()
  if (tab === 'colors') {
    colorState = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sharpness: 0, clarity: 0, highlights: 0 }
    previewCanvas = null
    previewCtx = null
    resetColorSliderUI()
  }
  renderEditor()
}

function resetCropState() {
  const margin = 20
  cropState = {
    x: margin, y: margin,
    w: editorCanvas.width - margin * 2,
    h: editorCanvas.height - margin * 2,
    dragging: false, handle: null,
  }
}

function resetPerspectiveState() {
  const m = 30
  perspectiveState.points = [
    { x: m, y: m },
    { x: editorCanvas.width - m, y: m },
    { x: editorCanvas.width - m, y: editorCanvas.height - m },
    { x: m, y: editorCanvas.height - m },
  ]
  perspectiveState.dragging = -1
}

function renderEditor() {
  if (!editorCanvas || !editorCtx || !baseCanvas) return

  editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height)
  editorCtx.drawImage(baseCanvas, 0, 0, editorCanvas.width, editorCanvas.height)

  if (activeTab === 'crop') drawCropOverlay()
  else if (activeTab === 'perspective') drawPerspectiveOverlay()
  else if (activeTab === 'colors') applyColorPreview()
}

function scheduleColorRender() {
  if (colorDirty) return
  colorDirty = true
  requestAnimationFrame(() => {
    colorDirty = false
    applyColorPreview()
  })
}

function ensurePreviewCanvas() {
  if (previewCanvas) return
  const maxPreview = 400
  const scale = Math.min(maxPreview / baseCanvas.width, maxPreview / baseCanvas.height, 1)
  previewCanvas = document.createElement('canvas')
  previewCanvas.width = Math.round(baseCanvas.width * scale)
  previewCanvas.height = Math.round(baseCanvas.height * scale)
  previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true })
}

function applyColorPreview() {
  if (!editorCanvas || !editorCtx || !baseCanvas) return
  ensurePreviewCanvas()

  const { brightness, contrast, saturation, grayscale, sharpness, clarity, highlights } = colorState
  const isDefault = brightness === 100 && contrast === 100 && saturation === 100 &&
    grayscale === 0 && sharpness === 0 && clarity === 0 && highlights === 0

  if (isDefault) {
    editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height)
    editorCtx.drawImage(baseCanvas, 0, 0, editorCanvas.width, editorCanvas.height)
    return
  }

  previewCtx.drawImage(baseCanvas, 0, 0, previewCanvas.width, previewCanvas.height)
  const imageData = previewCtx.getImageData(0, 0, previewCanvas.width, previewCanvas.height)
  const d = imageData.data
  const len = d.length

  const bF = brightness / 100
  const cF = (contrast / 100 + 0.5) / 0.5
  const sF = saturation / 100
  const gF = grayscale / 100
  const hF = highlights / 100
  const cStrength = clarity / 100

  if (clarity !== 0 || highlights !== 0) {
    const lum = new Float32Array(len / 4)
    for (let i = 0; i < len; i += 4) {
      lum[i >> 2] = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
    }
    if (clarity !== 0) {
      const w = previewCanvas.width
      for (let i = 0; i < len; i += 4) {
        const idx = i >> 2
        const x = idx % w
        const y = (idx / w) | 0
        let sum = 0, cnt = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy
            if (nx >= 0 && nx < w && ny >= 0 && ny < (previewCanvas.height)) {
              sum += lum[ny * w + nx]
              cnt++
            }
          }
        }
        const local = lum[idx]
        const avg = sum / cnt
        const diff = (local - avg) * cStrength
        d[i] += diff
        d[i + 1] += diff
        d[i + 2] += diff
      }
    }
    if (highlights !== 0) {
      for (let i = 0; i < len; i += 4) {
        const l = lum[i >> 2]
        const factor = hF * (1 - l / 255)
        d[i] += factor * 40
        d[i + 1] += factor * 40
        d[i + 2] += factor * 40
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
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
    r = r * (1 - gF) + gray * gF
    g = g * (1 - gF) + gray * gF
    b = b * (1 - gF) + gray * gF
    const avg = (r + g + b) / 3
    r += (r - avg) * (sF - 1)
    g += (g - avg) * (sF - 1)
    b += (b - avg) * (sF - 1)
    d[i] = r < 0 ? 0 : r > 255 ? 255 : r
    d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g
    d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b
  }

  if (sharpness !== 0) {
    const w = previewCanvas.width
    const h = previewCanvas.height
    const orig = new Uint8ClampedArray(d)
    const amount = sharpness / 100 * 2
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4
        for (let c = 0; c < 3; c++) {
          const center = orig[idx + c] * 5
          const neighbors =
            orig[((y - 1) * w + x) * 4 + c] +
            orig[((y + 1) * w + x) * 4 + c] +
            orig[(y * w + x - 1) * 4 + c] +
            orig[(y * w + x + 1) * 4 + c]
          const laplacian = center - neighbors
          d[idx + c] = Math.max(0, Math.min(255, orig[idx + c] + laplacian * amount))
        }
      }
    }
  }

  previewCtx.putImageData(imageData, 0, 0)
  editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height)
  editorCtx.drawImage(previewCanvas, 0, 0, editorCanvas.width, editorCanvas.height)
}

function drawCropOverlay() {
  const { x, y, w, h } = cropState
  editorCtx.save()
  editorCtx.fillStyle = 'rgba(0,0,0,0.5)'
  editorCtx.fillRect(0, 0, editorCanvas.width, y)
  editorCtx.fillRect(0, y, x, h)
  editorCtx.fillRect(x + w, y, editorCanvas.width - x - w, h)
  editorCtx.fillRect(0, y + h, editorCanvas.width, editorCanvas.height - y - h)

  editorCtx.strokeStyle = '#ffffff'
  editorCtx.lineWidth = 2
  editorCtx.setLineDash([6, 3])
  editorCtx.strokeRect(x, y, w, h)

  editorCtx.setLineDash([])
  const thirdW = w / 3
  const thirdH = h / 3
  editorCtx.strokeStyle = 'rgba(255,255,255,0.3)'
  editorCtx.lineWidth = 1
  for (let i = 1; i < 3; i++) {
    editorCtx.beginPath()
    editorCtx.moveTo(x + thirdW * i, y)
    editorCtx.lineTo(x + thirdW * i, y + h)
    editorCtx.stroke()
    editorCtx.beginPath()
    editorCtx.moveTo(x, y + thirdH * i)
    editorCtx.lineTo(x + w, y + thirdH * i)
    editorCtx.stroke()
  }

  const handleSize = 12
  editorCtx.fillStyle = '#ffffff'
  editorCtx.shadowColor = 'rgba(0,0,0,0.5)'
  editorCtx.shadowBlur = 4
  const handles = getCropHandles()
  Object.values(handles).forEach((pos) => {
    editorCtx.beginPath()
    editorCtx.arc(pos.x, pos.y, handleSize / 2, 0, Math.PI * 2)
    editorCtx.fill()
  })
  editorCtx.restore()
}

function getCropHandles() {
  const { x, y, w, h } = cropState
  return {
    tl: { x, y }, tr: { x: x + w, y },
    bl: { x, y: y + h }, br: { x: x + w, y: y + h },
    tm: { x: x + w / 2, y }, bm: { x: x + w / 2, y: y + h },
    ml: { x, y: y + h / 2 }, mr: { x: x + w, y: y + h / 2 },
  }
}

function drawPerspectiveOverlay() {
  const { points } = perspectiveState
  editorCtx.save()

  editorCtx.fillStyle = 'rgba(0,0,0,0.5)'
  editorCtx.beginPath()
  editorCtx.moveTo(0, 0)
  editorCtx.lineTo(editorCanvas.width, 0)
  editorCtx.lineTo(editorCanvas.width, editorCanvas.height)
  editorCtx.lineTo(0, editorCanvas.height)
  editorCtx.closePath()
  editorCtx.moveTo(points[0].x, points[0].y)
  editorCtx.lineTo(points[1].x, points[1].y)
  editorCtx.lineTo(points[2].x, points[2].y)
  editorCtx.lineTo(points[3].x, points[3].y)
  editorCtx.closePath()
  editorCtx.fill('evenodd')

  editorCtx.strokeStyle = '#00ff88'
  editorCtx.lineWidth = 2
  editorCtx.setLineDash([])
  editorCtx.beginPath()
  editorCtx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i <= 4; i++) {
    editorCtx.lineTo(points[i % 4].x, points[i % 4].y)
  }
  editorCtx.stroke()

  const handleR = 10
  editorCtx.fillStyle = '#00ff88'
  editorCtx.shadowColor = 'rgba(0,0,0,0.5)'
  editorCtx.shadowBlur = 4
  points.forEach((p) => {
    editorCtx.beginPath()
    editorCtx.arc(p.x, p.y, handleR, 0, Math.PI * 2)
    editorCtx.fill()
  })
  editorCtx.restore()
}

function setupEditorEvents() {
  const getPos = (e) => {
    const rect = editorCanvas.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return {
      x: ((touch.clientX - rect.left) / rect.width) * editorCanvas.width,
      y: ((touch.clientY - rect.top) / rect.height) * editorCanvas.height,
    }
  }

  const onPointerDown = (e) => {
    const pos = getPos(e)

    if (activeTab === 'crop') {
      const handles = getCropHandles()
      for (const [key, h] of Object.entries(handles)) {
        if (Math.hypot(pos.x - h.x, pos.y - h.y) < 22) {
          cropState.handle = key
          cropState.dragging = true
          e.preventDefault()
          return
        }
      }
      if (pos.x > cropState.x && pos.x < cropState.x + cropState.w && pos.y > cropState.y && pos.y < cropState.y + cropState.h) {
        cropState.handle = 'move'
        cropState.dragging = true
        cropState._startX = pos.x
        cropState._startY = pos.y
        cropState._origX = cropState.x
        cropState._origY = cropState.y
        e.preventDefault()
      }
    } else if (activeTab === 'perspective') {
      for (let i = 0; i < 4; i++) {
        if (Math.hypot(pos.x - perspectiveState.points[i].x, pos.y - perspectiveState.points[i].y) < 24) {
          perspectiveState.dragging = i
          e.preventDefault()
          return
        }
      }
    }
  }

  const onPointerMove = (e) => {
    const pos = getPos(e)

    if (activeTab === 'crop' && cropState.dragging) {
      e.preventDefault()
      if (cropState.handle === 'move') {
        const dx = pos.x - cropState._startX
        const dy = pos.y - cropState._startY
        cropState.x = Math.max(0, Math.min(editorCanvas.width - cropState.w, cropState._origX + dx))
        cropState.y = Math.max(0, Math.min(editorCanvas.height - cropState.h, cropState._origY + dy))
      } else {
        updateCropFromHandle(pos)
      }
      renderEditor()
    } else if (activeTab === 'perspective' && perspectiveState.dragging >= 0) {
      e.preventDefault()
      const i = perspectiveState.dragging
      perspectiveState.points[i].x = Math.max(0, Math.min(editorCanvas.width, pos.x))
      perspectiveState.points[i].y = Math.max(0, Math.min(editorCanvas.height, pos.y))
      renderEditor()
    }
  }

  const onPointerUp = () => {
    cropState.dragging = false
    cropState.handle = null
    perspectiveState.dragging = -1
  }

  editorCanvas.addEventListener('mousedown', onPointerDown)
  editorCanvas.addEventListener('mousemove', onPointerMove)
  editorCanvas.addEventListener('mouseup', onPointerUp)
  editorCanvas.addEventListener('mouseleave', onPointerUp)
  editorCanvas.addEventListener('touchstart', onPointerDown, { passive: false })
  editorCanvas.addEventListener('touchmove', onPointerMove, { passive: false })
  editorCanvas.addEventListener('touchend', onPointerUp)
}

function updateCropFromHandle(pos) {
  const h = cropState.handle
  const old = { x: cropState.x, y: cropState.y, w: cropState.w, h: cropState.h }

  if (h.includes('l')) {
    cropState.w = old.x + old.w - pos.x
    cropState.x = pos.x
  }
  if (h.includes('r') || h === 'mr') {
    cropState.w = pos.x - old.x
  }
  if (h.includes('t') || h === 'tm') {
    cropState.h = old.y + old.h - pos.y
    cropState.y = pos.y
  }
  if (h.includes('b') || h === 'bm') {
    cropState.h = pos.y - old.y
  }

  if (cropState.w < 20) { cropState.w = 20; cropState.x = old.x }
  if (cropState.h < 20) { cropState.h = 20; cropState.y = old.y }
}

function applyCrop() {
  if (!baseCanvas || !editorCanvas) return
  const { x, y, w, h } = cropState

  const isFullImage =
    x <= 1 && y <= 1 &&
    w >= editorCanvas.width - 2 && h >= editorCanvas.height - 2
  if (isFullImage) {
    showToast('Nothing to crop')
    return
  }

  const sx = (x / editorCanvas.width) * baseCanvas.width
  const sy = (y / editorCanvas.height) * baseCanvas.height
  const sw = (w / editorCanvas.width) * baseCanvas.width
  const sh = (h / editorCanvas.height) * baseCanvas.height

  const cropped = document.createElement('canvas')
  cropped.width = Math.round(sw)
  cropped.height = Math.round(sh)
  cropped.getContext('2d').drawImage(baseCanvas, sx, sy, sw, sh, 0, 0, sw, sh)

  baseCanvas = cropped

  editorCanvas.width = cropped.width
  editorCanvas.height = cropped.height

  cropState = {
    x: 0, y: 0,
    w: editorCanvas.width,
    h: editorCanvas.height,
    dragging: false, handle: null,
  }
  renderEditor()
  showToast('Crop applied')
}

function applyPerspective() {
  if (!baseCanvas || !editorCanvas) return

  const m = 30
  const isDefault =
    Math.abs(perspectiveState.points[0].x - m) < 5 &&
    Math.abs(perspectiveState.points[0].y - m) < 5 &&
    Math.abs(perspectiveState.points[1].x - (editorCanvas.width - m)) < 5 &&
    Math.abs(perspectiveState.points[1].y - m) < 5 &&
    Math.abs(perspectiveState.points[2].x - (editorCanvas.width - m)) < 5 &&
    Math.abs(perspectiveState.points[2].y - (editorCanvas.height - m)) < 5 &&
    Math.abs(perspectiveState.points[3].x - m) < 5 &&
    Math.abs(perspectiveState.points[3].y - (editorCanvas.height - m)) < 5
  if (isDefault) {
    showToast('No perspective change')
    return
  }

  const scaleInvW = baseCanvas.width / editorCanvas.width
  const scaleInvH = baseCanvas.height / editorCanvas.height
  const srcPts = perspectiveState.points.map((p) => ({ x: p.x * scaleInvW, y: p.y * scaleInvH }))

  const dstW = Math.round(Math.max(
    Math.hypot(srcPts[1].x - srcPts[0].x, srcPts[1].y - srcPts[0].y),
    Math.hypot(srcPts[2].x - srcPts[3].x, srcPts[2].y - srcPts[3].y)
  ))
  const dstH = Math.round(Math.max(
    Math.hypot(srcPts[3].x - srcPts[0].x, srcPts[3].y - srcPts[0].y),
    Math.hypot(srcPts[2].x - srcPts[1].x, srcPts[2].y - srcPts[1].y)
  ))

  const warped = perspectiveTransform(baseCanvas, srcPts, dstW, dstH)
  baseCanvas = warped

  editorCanvas.width = warped.width
  editorCanvas.height = warped.height

  resetPerspectiveState()
  renderEditor()
  showToast('Perspective applied')
}

function applyColors() {
  if (!baseCanvas || !editorCanvas) return

  const isDefault =
    colorState.brightness === 100 && colorState.contrast === 100 &&
    colorState.saturation === 100 && colorState.grayscale === 0 &&
    colorState.sharpness === 0 && colorState.clarity === 0 && colorState.highlights === 0
  if (isDefault) {
    showToast('No color changes')
    return
  }

  const tmp = document.createElement('canvas')
  tmp.width = baseCanvas.width
  tmp.height = baseCanvas.height
  tmp.getContext('2d').drawImage(baseCanvas, 0, 0)
  applyColorAdjustments(tmp, colorState)
  baseCanvas = tmp

  editorCanvas.width = tmp.width
  editorCanvas.height = tmp.height

  colorState = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sharpness: 0, clarity: 0, highlights: 0 }
  previewCanvas = null
  previewCtx = null
  resetColorSliderUI()
  renderEditor()
  showToast('Colors applied')
}

function showToast(msg) {
  const toast = document.createElement('div')
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-base-content text-base-100 px-4 py-2 rounded-lg text-sm font-medium z-[9999] shadow-lg transition-opacity'
  toast.textContent = msg
  document.body.appendChild(toast)
  setTimeout(() => { toast.style.opacity = '0' }, 1200)
  setTimeout(() => toast.remove(), 1500)
}

async function saveScannerPdf() {
  if (!baseCanvas) return

  let src = baseCanvas
  const maxDim = 2000
  if (src.width > maxDim || src.height > maxDim) {
    const scale = maxDim / Math.max(src.width, src.height)
    const resized = document.createElement('canvas')
    resized.width = Math.round(src.width * scale)
    resized.height = Math.round(src.height * scale)
    resized.getContext('2d').drawImage(src, 0, 0, resized.width, resized.height)
    src = resized
  }

  const imgData = src.toDataURL('image/jpeg', 0.82)
  const pxW = src.width
  const pxH = src.height

  const pdf = new jsPDF({
    orientation: pxW > pxH ? 'landscape' : 'portrait',
    unit: 'px',
    format: [pxW, pxH],
  })

  pdf.addImage(imgData, 'JPEG', 0, 0, pxW, pxH)
  const pdfBlob = pdf.output('blob')
  const pdfFile = new File([pdfBlob], `scan_${Date.now()}.pdf`, { type: 'application/pdf' })

  closeEditorModal()
  if (onFileReady) onFileReady(pdfFile)
}

function resetColorSliders() {
  colorState = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sharpness: 0, clarity: 0, highlights: 0 }
  previewCanvas = null
  previewCtx = null
  resetColorSliderUI()
  renderEditor()
}

function resetColorSliderUI() {
  const map = { brightnessSlider: 100, contrastSlider: 100, saturationSlider: 100, grayscaleSlider: 0, sharpnessSlider: 0, claritySlider: 0, highlightsSlider: 0 }
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id)
    if (el) el.value = val
  })
  Object.entries(map).forEach(([id, val]) => {
    const label = id.replace('Slider', 'Val')
    const el = document.getElementById(label)
    if (el) el.textContent = val + '%'
  })
}

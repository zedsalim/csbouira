import { perspectiveTransform, applyColorAdjustments } from '../utils/helpers.js'
import { jsPDF } from 'jspdf'

let cameraStream = null
let originalImage = null
let editorCanvas = null
let editorCtx = null
let committedCanvas = null
let activeTab = 'crop'
let appliedTabs = { crop: false, perspective: false, colors: false }

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
let colorState = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 }

let onFileReady = null

export function initScanner() {
  window.openScannerModal = openScannerModal
  window.closeScannerModal = closeScannerModal
  window.scannerCapture = scannerCapture
  window.scannerGallery = scannerGallery
  window.closeEditorModal = closeEditorModal
  window.switchEditorTab = switchEditorTab
  window.applyEditorTab = applyEditorTab
  window.saveScannerPdf = saveScannerPdf
  window.resetColorSliders = resetColorSliders

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

  const colorSliders = ['brightness', 'contrast', 'saturation', 'grayscale']
  colorSliders.forEach((id) => {
    const el = document.getElementById(id + 'Slider')
    if (el) {
      el.addEventListener('input', (e) => {
        colorState[id] = Number(e.target.value)
        const valEl = document.getElementById(id + 'Val')
        if (valEl) valEl.textContent = e.target.value + '%'
        renderEditorPreview()
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
  if (!video) return
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
    })
    video.srcObject = cameraStream
    await video.play()
    document.getElementById('scannerPlaceholder')?.classList.add('hidden')
    video.classList.remove('hidden')
  } catch {
    document.getElementById('scannerPlaceholder')?.classList.remove('hidden')
    document.getElementById('scannerPlaceholderText').textContent =
      'Camera not available. Use Gallery to pick an image.'
  }
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

  const img = new Image()
  img.onload = () => {
    originalImage = img
    openEditor()
  }
  img.src = tempCanvas.toDataURL('image/png')
}

function scannerGallery() {
  document.getElementById('scannerGalleryInput')?.click()
}

function loadFromGallery(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalImage = img
      closeScannerModal()
      openEditor()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

function openEditor() {
  if (!originalImage || !editorCanvas) return

  const maxW = Math.min(800, window.innerWidth - 64)
  const maxH = Math.min(500, window.innerHeight - 260)
  const scale = Math.min(maxW / originalImage.width, maxH / originalImage.height, 1)

  editorCanvas.width = Math.round(originalImage.width * scale)
  editorCanvas.height = Math.round(originalImage.height * scale)

  committedCanvas = document.createElement('canvas')
  committedCanvas.width = editorCanvas.width
  committedCanvas.height = editorCanvas.height
  committedCanvas.getContext('2d').drawImage(editorCanvas, 0, 0)

  resetCropState()
  resetPerspectiveState()
  colorState = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 }
  resetColorSliderUI()
  appliedTabs = { crop: false, perspective: false, colors: false }
  updateApplyIndicators()

  activeTab = 'crop'
  switchEditorTab('crop')
  renderEditorPreview()
  document.getElementById('editorModal')?.showModal()
}

function resetCropState() {
  const margin = 20
  cropState = {
    x: margin,
    y: margin,
    w: editorCanvas.width - margin * 2,
    h: editorCanvas.height - margin * 2,
    dragging: false,
    handle: null,
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

function closeEditorModal() {
  document.getElementById('editorModal')?.close()
  originalImage = null
  committedCanvas = null
}

function switchEditorTab(tab) {
  activeTab = tab
  document.querySelectorAll('.editor-tab-btn').forEach((btn) => {
    btn.classList.toggle('btn-active', btn.dataset.tab === tab)
  })
  document.querySelectorAll('.editor-tab-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.panel !== tab)
  })
  renderEditorPreview()
}

function renderEditorPreview() {
  if (!editorCanvas || !editorCtx || !committedCanvas) return

  editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height)
  editorCtx.drawImage(committedCanvas, 0, 0)

  if (activeTab === 'crop') drawCropOverlay()
  else if (activeTab === 'perspective') drawPerspectiveOverlay()

  if (activeTab === 'colors') {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = editorCanvas.width
    tempCanvas.height = editorCanvas.height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.drawImage(committedCanvas, 0, 0)
    applyColorAdjustments(tempCanvas, colorState)
    editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height)
    editorCtx.drawImage(tempCanvas, 0, 0)
  }
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
    tl: { x, y },
    tr: { x: x + w, y },
    bl: { x, y: y + h },
    br: { x: x + w, y: y + h },
    tm: { x: x + w / 2, y },
    bm: { x: x + w / 2, y: y + h },
    ml: { x, y: y + h / 2 },
    mr: { x: x + w, y: y + h / 2 },
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
        if (Math.hypot(pos.x - h.x, pos.y - h.y) < 18) {
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
        if (Math.hypot(pos.x - perspectiveState.points[i].x, pos.y - perspectiveState.points[i].y) < 20) {
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
      renderEditorPreview()
    } else if (activeTab === 'perspective' && perspectiveState.dragging >= 0) {
      e.preventDefault()
      const i = perspectiveState.dragging
      perspectiveState.points[i].x = Math.max(0, Math.min(editorCanvas.width, pos.x))
      perspectiveState.points[i].y = Math.max(0, Math.min(editorCanvas.height, pos.y))
      renderEditorPreview()
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

function applyEditorTab() {
  if (!committedCanvas || !editorCanvas) return

  const ctx = committedCanvas.getContext('2d')

  if (activeTab === 'crop') {
    const { x, y, w, h } = cropState
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = Math.round(w)
    cropCanvas.height = Math.round(h)
    const cropCtx = cropCanvas.getContext('2d')
    cropCtx.drawImage(
      committedCanvas,
      x, y, w, h,
      0, 0, w, h
    )
    committedCanvas.width = cropCanvas.width
    committedCanvas.height = cropCanvas.height
    ctx.drawImage(cropCanvas, 0, 0)
    resetCropState()
    appliedTabs.crop = true
  } else if (activeTab === 'perspective') {
    const srcPts = perspectiveState.points.map((p) => ({ ...p }))
    const dstW = Math.round(Math.max(
      Math.hypot(srcPts[1].x - srcPts[0].x, srcPts[1].y - srcPts[0].y),
      Math.hypot(srcPts[2].x - srcPts[3].x, srcPts[2].y - srcPts[3].y)
    ))
    const dstH = Math.round(Math.max(
      Math.hypot(srcPts[3].x - srcPts[0].x, srcPts[3].y - srcPts[0].y),
      Math.hypot(srcPts[2].x - srcPts[1].x, srcPts[2].y - srcPts[1].y)
    ))
    const warped = perspectiveTransform(committedCanvas, srcPts, dstW, dstH)
    committedCanvas.width = warped.width
    committedCanvas.height = warped.height
    ctx.drawImage(warped, 0, 0)
    resetPerspectiveState()
    appliedTabs.perspective = true
  } else if (activeTab === 'colors') {
    applyColorAdjustments(committedCanvas, colorState)
    colorState = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 }
    resetColorSliderUI()
    appliedTabs.colors = true
  }

  editorCanvas.width = committedCanvas.width
  editorCanvas.height = committedCanvas.height
  updateApplyIndicators()
  renderEditorPreview()
}

function updateApplyIndicators() {
  document.querySelectorAll('.editor-tab-btn').forEach((btn) => {
    const tab = btn.dataset.tab
    const dot = btn.querySelector('.apply-dot')
    if (dot) dot.classList.toggle('hidden', !appliedTabs[tab])
  })
}

function getFinalCanvas() {
  return committedCanvas
}

async function saveScannerPdf() {
  const finalCanvas = getFinalCanvas()
  if (!finalCanvas) return

  const imgData = finalCanvas.toDataURL('image/png')
  const pxW = finalCanvas.width
  const pxH = finalCanvas.height

  const pdf = new jsPDF({
    orientation: pxW > pxH ? 'landscape' : 'portrait',
    unit: 'px',
    format: [pxW, pxH],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, pxW, pxH)
  const pdfBlob = pdf.output('blob')
  const pdfFile = new File([pdfBlob], `scan_${Date.now()}.pdf`, { type: 'application/pdf' })

  closeEditorModal()

  if (onFileReady) onFileReady(pdfFile)
}

function resetColorSliders() {
  colorState = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 }
  resetColorSliderUI()
  renderEditorPreview()
}

function resetColorSliderUI() {
  const map = { brightnessSlider: 100, contrastSlider: 100, saturationSlider: 100, grayscaleSlider: 0 }
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id)
    if (el) el.value = val
  })
  const labels = { brightness: '100%', contrast: '100%', saturation: '100%', grayscale: '0%' }
  Object.entries(labels).forEach(([id, val]) => {
    const el = document.getElementById(id + 'Val')
    if (el) el.textContent = val
  })
}

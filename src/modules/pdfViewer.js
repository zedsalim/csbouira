import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

let currentPdf = null
let currentPage = 1
let totalPages = 0
let currentScale = 1.0

export function initPdfViewer() {
  window.closePdfViewer = closePdfViewer
  window.pdfViewerPrev = pdfViewerPrev
  window.pdfViewerNext = pdfViewerNext
  window.pdfViewerZoomIn = pdfViewerZoomIn
  window.pdfViewerZoomOut = pdfViewerZoomOut
}

export function openPdfViewer(file) {
  if (!file || file.type !== 'application/pdf') {
    previewGenericFile(file)
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const typedarray = new Uint8Array(e.target.result)
      currentPdf = await pdfjsLib.getDocument({ data: typedarray }).promise
      totalPages = currentPdf.numPages
      currentPage = 1
      currentScale = 1.0

      document.getElementById('pdfViewerTitle').innerHTML =
        `<i class="fas fa-file-pdf text-error mr-1"></i> ${escapeHtml(file.name)}`
      document.getElementById('pdfViewerFallback')?.classList.add('hidden')
      document.getElementById('pdfViewerContainer')?.classList.remove('hidden')

      updatePageInfo()
      await renderPage(currentPage)

      document.getElementById('pdfViewerModal')?.showModal()
    } catch {
      previewGenericFile(file)
    }
  }
  reader.readAsArrayBuffer(file)
}

function previewGenericFile(file) {
  const container = document.getElementById('pdfViewerContainer')
  const fallback = document.getElementById('pdfViewerFallback')
  const canvas = document.getElementById('pdfViewerCanvas')

  container?.classList.add('hidden')
  fallback?.classList.remove('hidden')
  if (canvas) canvas.style.display = 'none'

  document.getElementById('pdfViewerTitle').innerHTML =
    `<i class="fas fa-file text-base-content/60 mr-1"></i> ${escapeHtml(file.name)}`
  document.getElementById('pdfViewerModal')?.showModal()
}

async function renderPage(num) {
  if (!currentPdf) return
  const page = await currentPdf.getPage(num)
  const viewport = page.getViewport({ scale: currentScale * (window.devicePixelRatio || 1) })

  const canvas = document.getElementById('pdfViewerCanvas')
  if (!canvas) return
  canvas.style.display = 'block'

  const container = document.getElementById('pdfViewerContainer')
  const maxW = container.clientWidth - 16
  const baseViewport = page.getViewport({ scale: 1.0 })
  const fitScale = Math.min(maxW / baseViewport.width, 2.0)
  const finalScale = currentScale * fitScale * (window.devicePixelRatio || 1)
  const finalViewport = page.getViewport({ scale: finalScale })

  canvas.width = finalViewport.width
  canvas.height = finalViewport.height
  canvas.style.width = finalViewport.width / (window.devicePixelRatio || 1) + 'px'
  canvas.style.height = finalViewport.height / (window.devicePixelRatio || 1) + 'px'

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  await page.render({ canvasContext: ctx, viewport: finalViewport }).promise
}

function updatePageInfo() {
  const info = document.getElementById('pdfPageInfo')
  if (info) info.textContent = `${currentPage} / ${totalPages}`

  const prev = document.getElementById('pdfPrevBtn')
  const next = document.getElementById('pdfNextBtn')
  if (prev) prev.disabled = currentPage <= 1
  if (next) next.disabled = currentPage >= totalPages

  const zoom = document.getElementById('pdfZoomLevel')
  if (zoom) zoom.textContent = Math.round(currentScale * 100) + '%'
}

function pdfViewerPrev() {
  if (currentPage > 1) {
    currentPage--
    updatePageInfo()
    renderPage(currentPage)
  }
}

function pdfViewerNext() {
  if (currentPage < totalPages) {
    currentPage++
    updatePageInfo()
    renderPage(currentPage)
  }
}

function pdfViewerZoomIn() {
  currentScale = Math.min(currentScale + 0.25, 4.0)
  updatePageInfo()
  renderPage(currentPage)
}

function pdfViewerZoomOut() {
  currentScale = Math.max(currentScale - 0.25, 0.25)
  updatePageInfo()
  renderPage(currentPage)
}

function closePdfViewer() {
  document.getElementById('pdfViewerModal')?.close()
  currentPdf = null
  currentPage = 1
  totalPages = 0
  currentScale = 1.0
  const canvas = document.getElementById('pdfViewerCanvas')
  if (canvas) {
    canvas.style.display = 'block'
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

let currentPdf = null
let currentPage = 1
let totalPages = 0
let currentScale = 1.0
let isLoading = false
let touchStartX = 0
let touchStartY = 0

export function initPdfViewer() {
  window.closePdfViewer = closePdfViewer
  window.pdfViewerPrev = pdfViewerPrev
  window.pdfViewerNext = pdfViewerNext
  window.pdfViewerZoomIn = pdfViewerZoomIn
  window.pdfViewerZoomOut = pdfViewerZoomOut

  const container = document.getElementById('pdfViewerContainer')
  if (container) {
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }, { passive: true })

    container.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX
      const dy = e.changedTouches[0].clientY - touchStartY
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) pdfViewerNext()
        else pdfViewerPrev()
      }
    }, { passive: true })
  }
}

export function openPdfViewer(file) {
  if (!file || file.type !== 'application/pdf') {
    previewGenericFile(file)
    return
  }

  const spinner = document.getElementById('pdfViewerSpinner')
  const canvas = document.getElementById('pdfViewerCanvas')
  const container = document.getElementById('pdfViewerContainer')
  const fallback = document.getElementById('pdfViewerFallback')

  if (spinner) spinner.classList.remove('hidden')
  if (canvas) canvas.classList.add('hidden')
  container?.classList.remove('hidden')
  fallback?.classList.add('hidden')

  document.getElementById('pdfViewerTitle').innerHTML =
    `<i class="fas fa-file-pdf text-error mr-1"></i> ${escapeHtml(file.name)}`

  document.getElementById('pdfViewerModal')?.showModal()

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const typedarray = new Uint8Array(e.target.result)
      currentPdf = await pdfjsLib.getDocument({ data: typedarray }).promise
      totalPages = currentPdf.numPages
      currentPage = 1
      currentScale = 1.0

      updatePageInfo()
      await renderPage(currentPage)

      if (spinner) spinner.classList.add('hidden')
      if (canvas) canvas.classList.remove('hidden')
    } catch {
      if (spinner) spinner.classList.add('hidden')
      previewGenericFile(file)
    }
  }
  reader.readAsArrayBuffer(file)
}

function previewGenericFile(file) {
  const container = document.getElementById('pdfViewerContainer')
  const fallback = document.getElementById('pdfViewerFallback')
  const canvas = document.getElementById('pdfViewerCanvas')
  const spinner = document.getElementById('pdfViewerSpinner')

  spinner?.classList.add('hidden')
  container?.classList.add('hidden')
  fallback?.classList.remove('hidden')
  if (canvas) canvas.classList.add('hidden')

  document.getElementById('pdfViewerTitle').innerHTML =
    `<i class="fas fa-file text-base-content/60 mr-1"></i> ${escapeHtml(file.name)}`

  if (!document.getElementById('pdfViewerModal')?.open) {
    document.getElementById('pdfViewerModal')?.showModal()
  }
}

async function renderPage(num) {
  if (!currentPdf) return
  const page = await currentPdf.getPage(num)

  const container = document.getElementById('pdfViewerContainer')
  const canvas = document.getElementById('pdfViewerCanvas')
  if (!canvas || !container) return

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
  const spinner = document.getElementById('pdfViewerSpinner')
  if (canvas) {
    canvas.classList.add('hidden')
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }
  spinner?.classList.remove('hidden')
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

import { CONFIG } from '../config.js'
import { formatFileSize, readFileAsBase64 } from '../utils/helpers.js'

let selectedFiles = []
let isUploading = false

export function initUpload() {
  // Expose modal open/close globally (called from inline HTML onclick)
  window.openUploadModal = openUploadModal
  window.closeUploadModal = closeUploadModal

  const modal = document.getElementById('uploadModal')
  if (!modal) return

  const form = document.getElementById('uploadForm')
  const filesInput = document.getElementById('files')
  if (!form || !filesInput) return

  filesInput.addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files)
    renderFilesList()
  })

  // Expose removeFile globally (called from rendered list)
  window.removeFile = (index) => {
    selectedFiles.splice(index, 1)
    renderFilesList()
    const dt = new DataTransfer()
    selectedFiles.forEach((f) => dt.items.add(f))
    filesInput.files = dt.files
  }

  // Clear button
  document.getElementById('uploadClearBtn')?.addEventListener('click', () => {
    form.reset()
    selectedFiles = []
    renderFilesList()
    const prog = document.getElementById('uploadProgress')
    if (prog) { prog.innerHTML = ''; prog.classList.add('hidden') }
  })

  form.addEventListener('submit', handleUploadSubmit)
}

function openUploadModal() {
  document.getElementById('uploadModal')?.showModal()
}

function closeUploadModal() {
  const modal = document.getElementById('uploadModal')
  modal?.close()
  document.getElementById('uploadForm')?.reset()
  selectedFiles = []
  renderFilesList()
  const prog = document.getElementById('uploadProgress')
  if (prog) { prog.innerHTML = ''; prog.classList.add('hidden') }
}

function renderFilesList() {
  const container = document.getElementById('filesList')
  if (!container) return

  if (selectedFiles.length === 0) {
    container.classList.add('hidden')
    container.innerHTML = ''
    return
  }

  container.classList.remove('hidden')
  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'bg-base-200 rounded-lg p-3 space-y-2'

  const title = document.createElement('div')
  title.className = 'font-semibold text-sm mb-2'
  title.textContent = `Selected Files (${selectedFiles.length}):`
  wrapper.appendChild(title)

  selectedFiles.forEach((file, index) => {
    const row = document.createElement('div')
    row.className = 'flex items-center justify-between bg-base-100 rounded p-2 text-sm gap-2'
    row.innerHTML = `
      <span class="flex-1 truncate" title="${file.name}">${file.name}</span>
      <span class="text-xs text-base-content/60 mx-1">${formatFileSize(file.size)}</span>
    `
    const removeBtn = document.createElement('button')
    removeBtn.type = 'button'
    removeBtn.className = 'btn btn-xs btn-ghost text-error'
    removeBtn.textContent = '✕'
    removeBtn.addEventListener('click', () => window.removeFile(index))
    row.appendChild(removeBtn)
    wrapper.appendChild(row)
  })

  container.appendChild(wrapper)
}

async function handleUploadSubmit(e) {
  e.preventDefault()
  if (isUploading) return

  const fullName = document.getElementById('fullName').value.trim()
  const email = document.getElementById('uploadEmail').value.trim()
  const fileType = document.getElementById('fileType').value
  const moduleName = document.getElementById('moduleName').value.trim()
  const grade = document.getElementById('grade').value
  const semester = document.getElementById('semester').value

  const responseMsg = document.getElementById('uploadResponseMessage')
  const submitBtn = document.getElementById('uploadSubmitBtn')

  if (!fullName || !email || !fileType || !moduleName || !grade || !semester || selectedFiles.length === 0) {
    showUploadMessage('Please fill in all fields and select at least one file', 'error')
    return
  }

  const oversized = selectedFiles.filter((f) => f.size > 25 * 1024 * 1024)
  if (oversized.length > 0) {
    showUploadMessage(`Files exceed 25MB limit: ${oversized.map((f) => f.name).join(', ')}`, 'error')
    return
  }

  isUploading = true
  submitBtn.disabled = true
  const origText = submitBtn.innerHTML
  submitBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Uploading...'
  responseMsg?.classList.add('hidden')

  // Build progress tracker
  const progressContainer = document.getElementById('uploadProgress')
  progressContainer.innerHTML = ''
  progressContainer.classList.remove('hidden')

  const progressTitle = document.createElement('h4')
  progressTitle.className = 'font-semibold mb-3 text-sm'
  progressTitle.textContent = 'Upload Progress:'
  progressContainer.appendChild(progressTitle)

  selectedFiles.forEach((file, i) => {
    const item = document.createElement('div')
    item.id = `progress-${i}`
    item.className = 'mb-3 p-3 rounded-md bg-base-200'
    item.innerHTML = `
      <div class="text-sm font-medium mb-2 truncate" title="${file.name}">${file.name}</div>
      <progress id="progress-bar-${i}" class="progress progress-primary w-full" value="0" max="100"></progress>
      <div class="text-xs mt-1 text-base-content/60" id="status-${i}">Waiting...</div>
    `
    progressContainer.appendChild(item)
  })

  setTimeout(() => progressContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)

  let successCount = 0
  let failCount = 0
  const uploadedFiles = []

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i]
    updateProgress(i, 10, 'Reading file...')

    try {
      const base64Data = await readFileAsBase64(file)
      updateProgress(i, 30, 'Preparing upload...')

      const payload = { fullName, email, fileType, moduleName, grade, semester, fileName: file.name, fileData: base64Data, mimeType: file.type, sendEmail: false }
      updateProgress(i, 50, 'Uploading to server...')

      const response = await fetch(CONFIG.api.upload, { method: 'POST', body: JSON.stringify(payload) })
      updateProgress(i, 80, 'Processing response...')

      const result = await response.json()

      if (result.status === 'success') {
        updateProgress(i, 100, '✓ Upload successful', true)
        successCount++
        uploadedFiles.push({ name: result.fileName || file.name, url: result.fileUrl || '' })
      } else {
        updateProgress(i, 100, '✗ ' + result.message, false)
        failCount++
      }
    } catch {
      updateProgress(i, 100, '✗ Upload failed', false)
      failCount++
    }

    if (i < selectedFiles.length - 1) await new Promise((r) => setTimeout(r, 500))
  }

  if (successCount > 0) {
    try {
      await fetch(CONFIG.api.upload, {
        method: 'POST',
        body: JSON.stringify({ fullName, email, fileType, moduleName, grade, semester, fileName: `${uploadedFiles.length} file(s) uploaded`, fileData: 'summary-email-trigger', mimeType: 'text/plain', sendEmail: true, uploadedFiles }),
      })
    } catch { /* silent */ }
  }

  isUploading = false
  submitBtn.disabled = false
  submitBtn.innerHTML = origText

  if (successCount === selectedFiles.length) {
    showUploadMessage(`✓ All ${successCount} file(s) uploaded successfully!`, 'success')
    document.getElementById('uploadForm').reset()
    selectedFiles = []
    renderFilesList()
    setTimeout(() => progressContainer.classList.add('hidden'), 5000)
  } else if (successCount > 0) {
    showUploadMessage(`⚠ ${successCount} file(s) uploaded, ${failCount} failed`, 'error')
  } else {
    showUploadMessage('✗ All uploads failed. Please try again.', 'error')
  }
}

function updateProgress(index, value, status, isSuccess = null) {
  const bar = document.getElementById(`progress-bar-${index}`)
  const statusEl = document.getElementById(`status-${index}`)
  if (bar) bar.value = value
  if (statusEl) {
    statusEl.textContent = status
    if (isSuccess === true) statusEl.className = 'text-xs mt-1 text-success'
    else if (isSuccess === false) statusEl.className = 'text-xs mt-1 text-error'
    else statusEl.className = 'text-xs mt-1 text-base-content/60'
  }
}

function showUploadMessage(text, type) {
  const el = document.getElementById('uploadResponseMessage')
  if (!el) return
  el.textContent = text
  el.className = `alert mt-3 ${type === 'success' ? 'alert-success' : 'alert-error'}`
  el.classList.remove('hidden')
  if (type === 'success') setTimeout(() => el.classList.add('hidden'), 5000)
}

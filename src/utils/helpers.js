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

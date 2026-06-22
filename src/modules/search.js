import { CONFIG } from '../config.js'
import { debounce, getFileIconClass } from '../utils/helpers.js'

let searchIndex = []
let searchDataCache = null
let isSearchIndexing = false
let allModules = []

// ── Fetch & index ──────────────────────────────────────────────────────────

async function fetchSearchData() {
  if (searchDataCache) return searchDataCache
  const response = await fetch(CONFIG.api.search)
  searchDataCache = await response.json()
  return searchDataCache
}

function buildSearchIndex(data) {
  const index = []
  const walk = (node, year, pathParts) => {
    if (node.subfolders && typeof node.subfolders === 'object') {
      for (const [folderName, folderData] of Object.entries(node.subfolders)) {
        if (folderName.includes('(empty)')) continue
        const newPath = [...pathParts, folderName]
        const meta = extractMeta(newPath)
        index.push({ type: 'folder', name: folderName, year, ...meta, path: newPath, apiPath: [year, ...newPath].join('>subfolders>'), link: folderData.link || '' })
        walk(folderData, year, newPath)
      }
    }
    if (node.files && Array.isArray(node.files)) {
      for (const file of node.files) {
        const meta = extractMeta(pathParts)
        index.push({ type: 'file', name: file.name, year, ...meta, path: pathParts, apiPath: [year, ...pathParts].join('>subfolders>'), link: file.link || '', previewLink: file.previewLink || '', downloadLink: file.downloadLink || '' })
      }
    }
  }
  for (const [yearName, yearData] of Object.entries(data)) {
    if (yearName.startsWith('_')) continue
    if (typeof yearData !== 'object' || yearData === null) continue
    walk(yearData, yearName, [])
  }
  return index
}

function extractMeta(pathParts) {
  return { semester: pathParts[0] || '', module: pathParts[1] || '', resourceType: pathParts[2] || '' }
}

const RESOURCE_TYPE_NAMES = new Set(['cours', 'exams', 'exam', 'tests', 'test', 'tds', 'tps', 'tds & tps', 'td', 'tp', 'résumé', 'resume', 'résumés', 'books & exercices', 'books', 'exercices'])

function extractModulesFromData(data) {
  const moduleMap = new Map()
  for (const [yearName, yearData] of Object.entries(data)) {
    if (yearName.startsWith('_')) continue
    if (typeof yearData !== 'object' || yearData === null) continue
    if (!yearData.subfolders) continue
    for (const [semName, semData] of Object.entries(yearData.subfolders)) {
      if (!/^S\d/i.test(semName)) continue
      if (!semData.subfolders) continue
      for (const moduleName of Object.keys(semData.subfolders)) {
        if (moduleName.includes('(empty)')) continue
        const lower = moduleName.trim().toLowerCase()
        if (RESOURCE_TYPE_NAMES.has(lower)) continue
        if (moduleName.trim().length < 3) continue
        if (!moduleMap.has(lower)) moduleMap.set(lower, { name: moduleName.trim(), year: yearName, semester: semName })
      }
    }
  }
  return Array.from(moduleMap.values())
}

// ── Fuzzy search ───────────────────────────────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length
  if (!m) return n; if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array(n + 1)
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

function fuzzyMatch(text, token, maxDist = 2) {
  const textLower = text.toLowerCase()
  const tokenLower = token.toLowerCase()
  if (textLower.includes(tokenLower)) return true
  if (tokenLower.length <= 2) return false
  const wSize = tokenLower.length
  for (let i = 0; i <= textLower.length - wSize + maxDist; i++) {
    const substr = textLower.slice(i, Math.min(i + wSize + maxDist, textLower.length))
    if (levenshtein(substr, tokenLower) <= maxDist) return true
  }
  for (const word of textLower.split(/[\s\-_.,()]+/)) {
    if (word.length > 0 && levenshtein(word, tokenLower) <= maxDist) return true
  }
  return false
}

function tokenizeQuery(query) {
  return query.toLowerCase().split(/\s+/).filter((t) => t.length > 0)
}

function scoreItem(item, tokens) {
  let score = 0
  const nameLower = item.name.toLowerCase()
  const moduleLower = (item.module || '').toLowerCase()
  const yearLower = (item.year || '').toLowerCase()
  const resourceLower = (item.resourceType || '').toLowerCase()
  const pathStr = item.path.join(' ').toLowerCase()

  for (const token of tokens) {
    const t = token.toLowerCase()
    let matched = false
    if (nameLower === t) { score += 15; matched = true }
    else if (nameLower.startsWith(t)) { score += 10; matched = true }
    else if (nameLower.includes(t)) { score += 5; matched = true }
    if (moduleLower.includes(t)) { score += 4; matched = true }
    if (yearLower.includes(t)) { score += 2; matched = true }
    if (resourceLower.includes(t)) { score += 2; matched = true }
    if (!matched && pathStr.includes(t)) { score += 1; matched = true }
    if (!matched) {
      for (const field of [nameLower, moduleLower, yearLower, resourceLower, pathStr]) {
        if (fuzzyMatch(field, t)) { score += 1; break }
      }
    }
  }
  return score
}

function performSearch(query, filters) {
  const tokens = tokenizeQuery(query)
  let results = searchIndex.filter((item) => {
    if (filters.year && item.year !== filters.year) return false
    if (filters.semester) {
      const semNum = parseInt((item.semester || '').replace(/\D/g, ''), 10)
      if (filters.semester === 'S1' && semNum % 2 !== 1) return false
      if (filters.semester === 'S2' && semNum % 2 !== 0) return false
    }
    if (filters.resourceType && !(item.resourceType || '').toLowerCase().includes(filters.resourceType.toLowerCase())) return false
    if (filters.module && item.module !== filters.module) return false
    if (tokens.length === 0) return true
    const score = scoreItem(item, tokens)
    if (score > 0) { item._score = score; return true }
    return false
  })
  if (tokens.length > 0) results.sort((a, b) => (b._score || 0) - (a._score || 0))
  return results
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function populateModuleFilter(filters = {}) {
  const select = document.getElementById('searchFilterModule')
  if (!select) return
  const currentValue = select.value
  let filtered = allModules
  if (filters.year) filtered = filtered.filter((m) => m.year === filters.year)
  if (filters.semester) {
    filtered = filtered.filter((m) => {
      const n = parseInt(m.semester.replace(/\D/g, ''), 10)
      if (isNaN(n)) return false
      if (filters.semester === 'S1') return n % 2 === 1
      if (filters.semester === 'S2') return n % 2 === 0
      return false
    })
  }
  select.innerHTML = '<option value="">All Modules</option>'
  for (const mod of filtered) {
    const option = document.createElement('option')
    option.value = mod.name
    option.textContent = mod.name
    select.appendChild(option)
  }
  if ([...select.options].some((o) => o.value === currentValue)) select.value = currentValue
}

function getSearchFilters() {
  return {
    year: document.getElementById('searchFilterYear')?.value || '',
    semester: document.getElementById('searchFilterSemester')?.value || '',
    resourceType: document.getElementById('searchFilterType')?.value || '',
    module: document.getElementById('searchFilterModule')?.value || '',
  }
}

function highlightMatch(text, query) {
  if (!query?.trim()) return text
  const tokens = tokenizeQuery(query)
  let result = text
  for (const token of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-primary/20 text-primary rounded px-0.5 font-semibold">$1</mark>')
  }
  return result
}

function triggerSearch() {
  const query = document.getElementById('searchInput')?.value || ''
  const filters = getSearchFilters()
  const resultsEl = document.getElementById('searchResults')
  const countEl = document.getElementById('searchResultCount')

  if (!query.trim() && !filters.year && !filters.semester && !filters.resourceType && !filters.module) {
    resultsEl.innerHTML = `
      <div class="text-center py-12 text-base-content/50">
        <i class="fas fa-search text-6xl mb-4 block"></i>
        <p class="text-xl">Search across all resources</p>
        <p class="mt-2 text-sm">Multi-word search supported — e.g. "algo exam" finds results matching both words</p>
      </div>`
    if (countEl) countEl.textContent = ''
    return
  }

  const results = performSearch(query, filters)

  if (results.length === 0) {
    const hasFuzzyHint = tokenizeQuery(query).some((t) => t.length > 3)
    resultsEl.innerHTML = `
      <div class="text-center py-12 text-base-content/50">
        <i class="fas fa-search text-6xl mb-4 block"></i>
        <p class="text-xl">No results found</p>
        <p class="mt-2 text-sm">${hasFuzzyHint ? 'Fuzzy matching was applied but no matches were found. ' : ''}Try different keywords or adjust your filters</p>
      </div>`
    if (countEl) countEl.textContent = '0 results'
    return
  }

  const capped = results.slice(0, 100)
  if (countEl) countEl.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}${results.length > 100 ? ' (showing first 100)' : ''}`

  resultsEl.innerHTML = ''
  const list = document.createElement('div')
  list.className = 'space-y-2'

  const tplFile = document.getElementById('tpl-search-file')
  const tplFolder = document.getElementById('tpl-search-folder')

  for (const item of capped) {
    const icon = item.type === 'folder' ? 'fas fa-folder text-yellow-500' : getFileIconClass(item.name)
    const highlightedName = highlightMatch(item.name, query)
    const breadcrumb = [item.year, ...item.path].join(' › ')
    const moduleBadge = item.module
      ? `<span class="badge badge-sm bg-primary/10 text-primary border-0 mt-1">${item.module}</span>`
      : ''

    if (item.type === 'file' && tplFile) {
      const clone = tplFile.content.cloneNode(true)
      const row = clone.querySelector('[data-field="row"]')
      clone.querySelector('[data-field="icon"]').className = icon + ' flex-shrink-0'
      clone.querySelector('[data-field="name"]').innerHTML = highlightedName
      clone.querySelector('[data-field="breadcrumb"]').textContent = breadcrumb
      clone.querySelector('[data-field="badge"]').innerHTML = moduleBadge

      row.querySelector('[data-action="view"]').addEventListener('click', () => {
        window._openSearchFile && window._openSearchFile({ name: item.name, link: item.link, previewLink: item.previewLink, downloadLink: item.downloadLink })
      })

      const dlBtn = row.querySelector('[data-action="download"]')
      if (item.downloadLink) {
        dlBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          window._downloadFile && window._downloadFile(item.downloadLink, item.name)
        })
      } else {
        dlBtn.classList.add('hidden')
      }
      list.appendChild(clone)
    } else if (item.type === 'folder' && tplFolder) {
      const clone = tplFolder.content.cloneNode(true)
      clone.querySelector('[data-field="icon"]').className = icon + ' flex-shrink-0'
      clone.querySelector('[data-field="name"]').innerHTML = highlightedName
      clone.querySelector('[data-field="breadcrumb"]').textContent = breadcrumb
      clone.querySelector('[data-field="badge"]').innerHTML = moduleBadge
      clone.querySelector('[data-field="row"]').addEventListener('click', () => {
        window._openSearchFolder && window._openSearchFolder({ year: item.year, path: item.path, apiPath: item.apiPath })
      })
      list.appendChild(clone)
    }
  }

  resultsEl.appendChild(list)
}

async function ensureSearchIndex() {
  if (searchIndex.length > 0 || isSearchIndexing) return
  isSearchIndexing = true
  const resultsEl = document.getElementById('searchResults')
  if (resultsEl) {
    resultsEl.innerHTML = `
      <div class="flex flex-col items-center gap-3 py-12 text-base-content/50">
        <span class="loading loading-spinner loading-lg"></span>
        <p>Building search index...</p>
      </div>`
  }
  try {
    const data = await fetchSearchData()
    searchIndex = buildSearchIndex(data)
    allModules = extractModulesFromData(data)
    populateModuleFilter()
    triggerSearch()
  } catch (error) {
    if (resultsEl) resultsEl.innerHTML = `
      <div class="text-center py-12 text-error">
        <i class="fas fa-exclamation-circle text-6xl mb-4 block"></i>
        <p class="text-xl">Error loading search index</p>
        <p class="mt-2 text-sm">${error.message}</p>
      </div>`
  } finally {
    isSearchIndexing = false
  }
}

export function openSearchModal() {
  const modal = document.getElementById('searchModal')
  modal?.showModal()
  document.getElementById('searchInput')?.focus()
  ensureSearchIndex()
}

export function closeSearchModal() {
  document.getElementById('searchModal')?.close()
}

export function initSearch() {
  window.openSearchModal = openSearchModal
  window.closeSearchModal = closeSearchModal

  const searchInput = document.getElementById('searchInput')
  if (searchInput) {
    const debouncedSearch = debounce(triggerSearch, 300)
    searchInput.addEventListener('input', debouncedSearch)
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { debouncedSearch.cancel(); triggerSearch() }
    })
  }

  ;['searchFilterYear', 'searchFilterSemester'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      populateModuleFilter(getSearchFilters())
      triggerSearch()
    })
  })

  ;['searchFilterType', 'searchFilterModule'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', triggerSearch)
  })
}

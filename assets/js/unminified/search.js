// ===============================
// SEARCH SYSTEM
// ===============================
const SEARCH_API = 'https://api.csbouira.xyz/api/drive';
let searchIndex = [];
let searchDataCache = null;
let searchDebounceTimer = null;
let isSearchIndexing = false;
let allModules = [];

const fetchSearchData = async () => {
  if (searchDataCache) return searchDataCache;
  const response = await fetch(SEARCH_API);
  searchDataCache = await response.json();
  return searchDataCache;
};

const buildSearchIndex = (data) => {
  const index = [];

  const walk = (node, year, pathParts) => {
    if (node.subfolders && typeof node.subfolders === 'object') {
      for (const [folderName, folderData] of Object.entries(node.subfolders)) {
        if (folderName.includes('(empty)')) continue;
        const newPath = [...pathParts, folderName];
        const meta = extractMeta(newPath);

        index.push({
          type: 'folder',
          name: folderName,
          year: year,
          semester: meta.semester,
          module: meta.module,
          resourceType: meta.resourceType,
          path: newPath,
          apiPath: [year, ...newPath].join('>subfolders>'),
          link: folderData.link || '',
        });

        walk(folderData, year, newPath);
      }
    }

    if (node.files && Array.isArray(node.files)) {
      for (const file of node.files) {
        const meta = extractMeta(pathParts);
        index.push({
          type: 'file',
          name: file.name,
          year: year,
          semester: meta.semester,
          module: meta.module,
          resourceType: meta.resourceType,
          path: pathParts,
          apiPath: [year, ...pathParts].join('>subfolders>'),
          link: file.link || '',
          previewLink: file.previewLink || '',
          downloadLink: file.downloadLink || '',
        });
      }
    }
  };

  for (const [yearName, yearData] of Object.entries(data)) {
    if (yearName.startsWith('_')) continue;
    if (typeof yearData !== 'object' || yearData === null) continue;
    walk(yearData, yearName, []);
  }

  return index;
};

const extractMeta = (pathParts) => {
  const semester = pathParts.length >= 1 ? pathParts[0] : '';
  const module = pathParts.length >= 2 ? pathParts[1] : '';
  const resourceType = pathParts.length >= 3 ? pathParts[2] : '';
  return { semester, module, resourceType };
};

// Module Filter — extracts only from semester subfolders (S01, S02...)
const RESOURCE_TYPE_NAMES = new Set([
  'cours', 'exams', 'exam', 'tests', 'test', 'tds', 'tps',
  'tds & tps', 'td', 'tp', 'résumé', 'resume', 'résumés',
  'books & exercices', 'books', 'exercices',
]);

const extractModulesFromData = (data) => {
  const moduleMap = new Map();

  for (const [yearName, yearData] of Object.entries(data)) {
    if (yearName.startsWith('_')) continue;
    if (typeof yearData !== 'object' || yearData === null) continue;
    if (!yearData.subfolders) continue;

    for (const [semName, semData] of Object.entries(yearData.subfolders)) {
      if (!/^S\d/i.test(semName)) continue;
      if (!semData.subfolders) continue;

      for (const moduleName of Object.keys(semData.subfolders)) {
        if (moduleName.includes('(empty)')) continue;
        const lower = moduleName.trim().toLowerCase();
        if (RESOURCE_TYPE_NAMES.has(lower)) continue;
        if (moduleName.trim().length < 3) continue;
        if (!moduleMap.has(lower)) {
          moduleMap.set(lower, moduleName.trim());
        }
      }
    }
  }

  return Array.from(moduleMap.values()).sort((a, b) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' }),
  );
};

const populateModuleFilter = () => {
  if (!searchDataCache) return;
  allModules = extractModulesFromData(searchDataCache);

  const select = document.getElementById('searchFilterModule');
  if (!select) return;

  select.innerHTML = '<option value="">All Modules</option>';

  for (const mod of allModules) {
    const option = document.createElement('option');
    option.value = mod;
    option.textContent = mod;
    select.appendChild(option);
  }
};

// Fuzzy Matching 
const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
};

const fuzzyMatch = (text, token, maxDist = 2) => {
  const textLower = text.toLowerCase();
  const tokenLower = token.toLowerCase();

  if (textLower.includes(tokenLower)) return true;
  if (tokenLower.length <= 2) return false;

  const windowSize = tokenLower.length;
  for (let i = 0; i <= textLower.length - windowSize + maxDist; i++) {
    const end = Math.min(i + windowSize + maxDist, textLower.length);
    const substr = textLower.slice(i, end);
    if (levenshtein(substr, tokenLower) <= maxDist) return true;
  }

  const words = textLower.split(/[\s\-_.,()]+/);
  for (const word of words) {
    if (word.length > 0 && levenshtein(word, tokenLower) <= maxDist) return true;
  }

  return false;
};

// Relevance Scoring
const scoreItem = (item, tokens) => {
  let score = 0;
  const nameLower = item.name.toLowerCase();
  const moduleLower = (item.module || '').toLowerCase();
  const yearLower = (item.year || '').toLowerCase();
  const resourceLower = (item.resourceType || '').toLowerCase();
  const pathStr = item.path.join(' ').toLowerCase();

  for (const token of tokens) {
    const t = token.toLowerCase();
    let tokenMatched = false;

    if (nameLower === t) { score += 15; tokenMatched = true; }
    else if (nameLower.startsWith(t)) { score += 10; tokenMatched = true; }
    else if (nameLower.includes(t)) { score += 5; tokenMatched = true; }

    if (moduleLower.includes(t)) { score += 4; tokenMatched = true; }
    if (yearLower.includes(t)) { score += 2; tokenMatched = true; }
    if (resourceLower.includes(t)) { score += 2; tokenMatched = true; }

    if (!tokenMatched && pathStr.includes(t)) { score += 1; tokenMatched = true; }

    if (!tokenMatched) {
      const fields = [nameLower, moduleLower, yearLower, resourceLower, pathStr];
      for (const field of fields) {
        if (field && fuzzyMatch(field, t)) { score += 0.5; break; }
      }
    }
  }

  if (item.type === 'file') score += 0.1;
  return score;
};

// Search Logic — multi-term AND + fuzzy
const tokenizeQuery = (query) => {
  if (!query || !query.trim()) return [];
  return query.trim().split(/\s+/).filter((t) => t.length > 0);
};

const itemMatchesTokens = (item, tokens) => {
  const nameLower = item.name.toLowerCase();
  const moduleLower = (item.module || '').toLowerCase();
  const yearLower = (item.year || '').toLowerCase();
  const resourceLower = (item.resourceType || '').toLowerCase();
  const pathStr = item.path.join(' ').toLowerCase();

  for (const token of tokens) {
    const t = token.toLowerCase();
    const directMatch =
      nameLower.includes(t) || moduleLower.includes(t) ||
      yearLower.includes(t) || resourceLower.includes(t) || pathStr.includes(t);

    if (directMatch) continue;

    const fields = [nameLower, moduleLower, yearLower, resourceLower, pathStr];
    let fuzzy = false;
    for (const field of fields) {
      if (field && fuzzyMatch(field, t)) { fuzzy = true; break; }
    }
    if (!fuzzy) return false;
  }
  return true;
};

const performSearch = (query, filters) => {
  let results = [...searchIndex];

  if (filters.year) {
    results = results.filter((item) => item.year === filters.year);
  }

  if (filters.semester) {
    results = results.filter((item) => {
      const semNum = parseInt(item.semester.replace(/\D/g, ''), 10);
      if (isNaN(semNum)) return false;
      if (filters.semester === 'S1') return semNum % 2 === 1;
      if (filters.semester === 'S2') return semNum % 2 === 0;
      return false;
    });
  }

  if (filters.module) {
    results = results.filter(
      (item) => item.module && item.module === filters.module,
    );
  }

  if (filters.resourceType) {
    results = results.filter((item) => {
      const rt = item.resourceType.toLowerCase();
      const ft = filters.resourceType.toLowerCase();
      return (
        rt.includes(ft) ||
        (item.type === 'folder' && item.name.toLowerCase().includes(ft))
      );
    });
  }

  const tokens = tokenizeQuery(query);
  if (tokens.length > 0) {
    results = results.filter((item) => itemMatchesTokens(item, tokens));

    results = results
      .map((item) => ({ ...item, _score: scoreItem(item, tokens) }))
      .sort((a, b) => b._score - a._score);
  }

  return results;
};

const openSearchModal = async () => {
  const modal = document.getElementById('searchModal');
  modal.classList.add('active');
  updateBodyScrollLock();

  setTimeout(() => {
    document.getElementById('searchInput').focus();
  }, 100);

  if (searchIndex.length === 0 && !isSearchIndexing) {
    isSearchIndexing = true;
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `
      <div class="text-center py-8">
        <div class="loading mx-auto"></div>
        <p class="mt-4">Loading resources index...</p>
      </div>
    `;

    try {
      const data = await fetchSearchData();
      searchIndex = buildSearchIndex(data);
      populateModuleFilter();
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search text-6xl mb-4" style="color: var(--text-secondary-light);"></i>
          <p class="text-xl">Search across all resources</p>
          <p class="mt-2 text-sm" style="color: var(--text-secondary-light);">
            Multi-word search supported — e.g. "algo exam" finds results matching both words
          </p>
        </div>
      `;
    } catch (error) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
          <p class="text-xl">Error loading search index</p>
          <p class="mt-2">${error.message}</p>
        </div>
      `;
    } finally {
      isSearchIndexing = false;
    }
  }
};

const closeSearchModal = () => {
  document.getElementById('searchModal').classList.remove('active');
  updateBodyScrollLock();
};

const getSearchFilters = () => {
  return {
    year: document.getElementById('searchFilterYear').value,
    semester: document.getElementById('searchFilterSemester').value,
    resourceType: document.getElementById('searchFilterType').value,
    module: document.getElementById('searchFilterModule')
      ? document.getElementById('searchFilterModule').value
      : '',
  };
};

const triggerSearch = () => {
  const query = document.getElementById('searchInput').value;
  const filters = getSearchFilters();

  if (
    !query.trim() &&
    !filters.year &&
    !filters.semester &&
    !filters.resourceType &&
    !filters.module
  ) {
    document.getElementById('searchResults').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search text-6xl mb-4" style="color: var(--text-secondary-light);"></i>
        <p class="text-xl">Search across all resources</p>
        <p class="mt-2 text-sm" style="color: var(--text-secondary-light);">
          Multi-word search supported — e.g. "algo exam" finds results matching both words
        </p>
      </div>
    `;
    document.getElementById('searchResultCount').textContent = '';
    return;
  }

  const results = performSearch(query, filters);
  renderSearchResults(results, query);
};

const renderSearchResults = (results, query) => {
  const container = document.getElementById('searchResults');
  const countEl = document.getElementById('searchResultCount');

  if (results.length === 0) {
    const tokens = tokenizeQuery(query);
    const hasFuzzyHint = tokens.some((t) => t.length > 3);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search text-6xl mb-4" style="color: var(--text-secondary-light);"></i>
        <p class="text-xl">No results found</p>
        <p class="mt-2 text-sm" style="color: var(--text-secondary-light);">
          ${hasFuzzyHint ? 'Fuzzy matching was applied but no matches were found. ' : ''}Try different keywords or adjust your filters
        </p>
      </div>
    `;
    countEl.textContent = '0 results';
    return;
  }

  const capped = results.slice(0, 100);
  countEl.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}${results.length > 100 ? ' (showing first 100)' : ''}`;

  let html = '<div class="space-y-2">';

  for (const item of capped) {
    const icon =
      item.type === 'folder'
        ? 'fas fa-folder text-yellow-500'
        : getSearchFileIcon(item.name);

    const highlightedName = highlightMatch(item.name, query);
    const breadcrumb = [item.year, ...item.path].join(' › ');

    const moduleBadge = item.module
      ? `<span class="search-module-badge">${item.module}</span>`
      : '';

    if (item.type === 'file') {
      const escapedFile = JSON.stringify({
        name: item.name,
        link: item.link,
        previewLink: item.previewLink,
        downloadLink: item.downloadLink,
      }).replace(/'/g, '&apos;');

      html += `
        <div class="file-item search-result-item group">
          <div class="flex items-center gap-3 flex-1 min-w-0" onclick='openSearchFile(${escapedFile})'>
            <i class="${icon} flex-shrink-0"></i>
            <div class="flex-1 min-w-0">
              <span class="block truncate">${highlightedName}</span>
              <span class="block text-xs mt-0.5 truncate" style="color: var(--text-secondary-light);">${breadcrumb}</span>
              ${moduleBadge}
            </div>
            <i class="action-btn fas fa-eye flex-shrink-0"></i>
          </div>
          ${item.downloadLink
          ? `
            <button 
              onclick='event.stopPropagation(); downloadFile("${item.downloadLink}", "${item.name.replace(/'/g, '&apos;')}")' 
              class="action-btn ml-2 flex-shrink-0"
              title="Download file">
              <i class="fas fa-download"></i>
            </button>
          `
          : ''
        }
        </div>
      `;
    } else {
      const escapedFolder = JSON.stringify({
        year: item.year,
        path: item.path,
        apiPath: item.apiPath,
      }).replace(/'/g, '&apos;');

      html += `
        <div class="folder-item search-result-item" onclick='openSearchFolder(${escapedFolder})'>
          <i class="${icon} flex-shrink-0"></i>
          <div class="flex-1 min-w-0">
            <span class="block truncate">${highlightedName}</span>
            <span class="block text-xs mt-0.5 truncate" style="color: var(--text-secondary-light);">${breadcrumb}</span>
            ${moduleBadge}
          </div>
          <i class="fas fa-chevron-right flex-shrink-0"></i>
        </div>
      `;
    }
  }

  html += '</div>';
  container.innerHTML = html;
};

const openSearchFile = (fileData) => {
  if (fileData.previewLink) {
    document.getElementById('modalTitle').textContent = fileData.name;
    document.getElementById('fileViewer').src = fileData.previewLink;
    document.getElementById('fileModal').classList.add('active');
    updateBodyScrollLock();
  } else if (fileData.link) {
    window.open(fileData.link, '_blank');
  }
};

const openSearchFolder = async (folderData) => {
  currentYear = folderData.year;
  currentPath = [folderData.year, ...folderData.path];

  const modalTitle = document.getElementById('yearModalTitle');
  modalTitle.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-xl font-semibold">${folderData.year}</span>
      <a 
        href="#" 
        id="driveLink" 
        title="Open in Google Drive"
        class="hidden sm:inline-flex items-center gap-1.5 
               px-2.5 py-1 text-xs 
               sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm
               rounded-md bg-blue-500
               text-white font-medium shadow-md
               hover:shadow-lg hover:opacity-90 transition-all duration-200"
      >
        <i class="fab fa-google-drive text-base sm:text-lg"></i>
        <span class="hidden xs:inline sm:inline">Open in Drive</span>
      </a>
    </div>
  `;

  document.getElementById('yearModal').classList.add('active');
  updateBodyScrollLock();
  await loadContent(currentYear, folderData.apiPath);
};

const highlightMatch = (text, query) => {
  if (!query || !query.trim()) return text;
  const tokens = tokenizeQuery(query);
  let result = text;
  for (const token of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  return result;
};

const getSearchFileIcon = (filename) => {
  const ext = (filename || '').split('.').pop().toLowerCase();
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
    png: 'fas fa-file-image text-yellow-500',
    jpg: 'fas fa-file-image text-yellow-500',
    jpeg: 'fas fa-file-image text-yellow-500',
    txt: 'fas fa-file-alt text-gray-500',
    py: 'fab fa-python text-blue-500',
    js: 'fab fa-js-square text-yellow-400',
    c: 'fas fa-file-code text-blue-400',
    cpp: 'fas fa-file-code text-blue-400',
  };
  return icons[ext] || 'fas fa-file text-gray-500';
};

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(triggerSearch, 300);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(searchDebounceTimer);
        triggerSearch();
      }
    });
  }

  [
    'searchFilterYear',
    'searchFilterSemester',
    'searchFilterType',
    'searchFilterModule',
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', triggerSearch);
  });
});

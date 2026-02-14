// ===============================
// SEARCH SYSTEM
// ===============================
const SEARCH_API = 'https://api.csbouira.xyz/api/drive';
let searchIndex = [];
let searchDataCache = null;
let searchDebounceTimer = null;
let isSearchIndexing = false;

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

// Path pattern: 
const extractMeta = (pathParts) => {
    const semester = pathParts.length >= 1 ? pathParts[0] : '';
    const module = pathParts.length >= 2 ? pathParts[1] : '';
    const resourceType = pathParts.length >= 3 ? pathParts[2] : '';
    return { semester, module, resourceType };
};

// ===============================
// Search Logic
// ===============================
const performSearch = (query, filters) => {
    let results = [...searchIndex];

    // Text filter 
    if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        results = results.filter((item) => {
            return (
                item.name.toLowerCase().includes(q) ||
                (item.module && item.module.toLowerCase().includes(q)) ||
                (item.year && item.year.toLowerCase().includes(q))
            );
        });
    }

    // Year filter
    if (filters.year) {
        results = results.filter((item) => item.year === filters.year);
    }

    // Semester filter — maps "S1" to first semester of any year (S01, S03, S05, S07, S09)
    //                     and "S2" to second semester (S02, S04, S06, S08, S10)
    if (filters.semester) {
        results = results.filter((item) => {
            const semNum = parseInt(item.semester.replace(/\D/g, ''), 10);
            if (isNaN(semNum)) return false;
            if (filters.semester === 'S1') return semNum % 2 === 1; // odd = first semester
            if (filters.semester === 'S2') return semNum % 2 === 0; // even = second semester
            return false;
        });
    }

    // Resource type filter
    if (filters.resourceType) {
        results = results.filter((item) => {
            const rt = item.resourceType.toLowerCase();
            const ft = filters.resourceType.toLowerCase();
            return rt.includes(ft) || (item.type === 'folder' && item.name.toLowerCase().includes(ft));
        });
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
            resultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search text-6xl mb-4" style="color: var(--text-secondary-light);"></i>
          <p class="text-xl">Search across all resources</p>
          <p class="mt-2 text-sm" style="color: var(--text-secondary-light);">
            Type a filename, module, or keyword to find resources
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
    };
};

const triggerSearch = () => {
    const query = document.getElementById('searchInput').value;
    const filters = getSearchFilters();

    if (!query.trim() && !filters.year && !filters.semester && !filters.resourceType) {
        document.getElementById('searchResults').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search text-6xl mb-4" style="color: var(--text-secondary-light);"></i>
        <p class="text-xl">Search across all resources</p>
        <p class="mt-2 text-sm" style="color: var(--text-secondary-light);">
          Type a filename, module, or keyword to find resources
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
        container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search text-6xl mb-4" style="color: var(--text-secondary-light);"></i>
        <p class="text-xl">No results found</p>
        <p class="mt-2 text-sm" style="color: var(--text-secondary-light);">Try different keywords or adjust your filters</p>
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

        if (item.type === 'file') {
            const escapedFile = JSON.stringify({
                name: item.name,
                link: item.link,
                previewLink: item.previewLink,
                downloadLink: item.downloadLink,
            }).replace(/'/g, "&apos;");

            html += `
        <div class="file-item search-result-item group">
          <div class="flex items-center gap-3 flex-1 min-w-0" onclick='openSearchFile(${escapedFile})'>
            <i class="${icon} flex-shrink-0"></i>
            <div class="flex-1 min-w-0">
              <span class="block truncate">${highlightedName}</span>
              <span class="block text-xs mt-0.5 truncate" style="color: var(--text-secondary-light);">${breadcrumb}</span>
            </div>
            <i class="action-btn fas fa-eye flex-shrink-0"></i>
          </div>
          ${item.downloadLink ? `
            <button 
              onclick='event.stopPropagation(); downloadFile("${item.downloadLink}", "${item.name.replace(/'/g, "&apos;")}")' 
              class="action-btn ml-2 flex-shrink-0"
              title="Download file">
              <i class="fas fa-download"></i>
            </button>
          ` : ''}
        </div>
      `;
        } else {
            const escapedFolder = JSON.stringify({
                year: item.year,
                path: item.path,
                apiPath: item.apiPath,
            }).replace(/'/g, "&apos;");

            html += `
        <div class="folder-item search-result-item" onclick='openSearchFolder(${escapedFolder})'>
          <i class="${icon} flex-shrink-0"></i>
          <div class="flex-1 min-w-0">
            <span class="block truncate">${highlightedName}</span>
            <span class="block text-xs mt-0.5 truncate" style="color: var(--text-secondary-light);">${breadcrumb}</span>
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
    closeSearchModal();
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
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
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

    ['searchFilterYear', 'searchFilterSemester', 'searchFilterType'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', triggerSearch);
    });

    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) closeSearchModal();
        });
    }
});

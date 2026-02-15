// ===============================
// FAVORITES / BOOKMARKS SYSTEM
// ===============================
const FAVORITES_KEY = 'csbouira_favorites';

const getFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || {};
  } catch {
    return {};
  }
};

const saveFavorites = (favorites) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

// Generate a unique key for a favorite item (file/folder).
const getFavoriteKey = (item) => {
  return item.path || `${item.year}>${item.name}`;
};

const isFavorite = (path) => {
  const favorites = getFavorites();
  return !!favorites[path];
};

const toggleFavorite = (item) => {
  const favorites = getFavorites();
  const key = getFavoriteKey(item);

  if (favorites[key]) {
    delete favorites[key];
  } else {
    favorites[key] = {
      type: item.type, // 'file' or 'folder'
      name: item.name,
      path: key,
      year: item.year,
      folderPath: item.folderPath || [],
      link: item.link || '',
      previewLink: item.previewLink || '',
      downloadLink: item.downloadLink || '',
      addedAt: Date.now(),
    };
  }

  saveFavorites(favorites);
  renderFavoritesSection();
  return !!favorites[key];
};

const removeFavorite = (path) => {
  const favorites = getFavorites();
  delete favorites[path];
  saveFavorites(favorites);
  renderFavoritesSection();
};

const clearAllFavorites = () => {
  localStorage.removeItem(FAVORITES_KEY);
  renderFavoritesSection();
};

// ---- UI  ----

const renderFavoritesSection = () => {
  const container = document.getElementById('favorites-container');
  if (!container) return;

  const favorites = getFavorites();
  const entries = Object.values(favorites);

  // Hide section if empty
  const section = document.getElementById('favorites');
  if (entries.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  // Group by year
  const grouped = {};
  entries
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    .forEach((fav) => {
      const year = fav.year || 'Other';
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(fav);
    });

  let html = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <h2 class="text-3xl font-bold flex items-center justify-center sm:justify-start gap-3 text-center sm:text-left">
        <i class="fas fa-star text-yellow-500"></i>
        My Favorites
      </h2>
      <button
        onclick="clearAllFavorites()"
        class="text-sm px-3 py-1.5 rounded-md transition self-center sm:self-auto"
        style="background: var(--bg-secondary-light); border: 1px solid var(--border-light); color: var(--text-secondary-light);"
        onmouseover="this.style.borderColor='#ef4444'; this.style.color='#ef4444';"
        onmouseout="this.style.borderColor='var(--border-light)'; this.style.color='var(--text-secondary-light)';"
      >
        <i class="fas fa-trash-alt mr-1"></i> Clear All
      </button>
    </div>
  `;

  for (const [year, items] of Object.entries(grouped)) {
    html += `
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-3 text-blue-500 flex items-center gap-2">
          <i class="fas fa-graduation-cap"></i> ${year}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    `;

    for (const fav of items) {
      const icon =
        fav.type === 'folder'
          ? 'fas fa-folder text-yellow-500'
          : getFavFileIcon(fav.name);
      const escapedPath = fav.path.replace(/'/g, "\\'").replace(/"/g, '&quot;');

      html += `
        <div class="favorite-card card p-4 cursor-pointer group relative" style="transform: none;">
          <div class="flex items-start gap-3">
            <i class="${icon} text-xl mt-0.5 flex-shrink-0"></i>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate" title="${fav.name}">${fav.name}</p>
              <p class="text-xs mt-1" style="color: var(--text-secondary-light);">
                ${fav.type === 'folder' ? 'Folder' : 'File'}
                ${fav.folderPath && fav.folderPath.length > 1 ? ' · ' + fav.folderPath.slice(1).join(' / ') : ''}
              </p>
            </div>
            <button
              onclick="event.stopPropagation(); removeFavorite('${escapedPath}');"
              class="favorite-remove-btn opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
              title="Remove from favorites"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="favorite-card-actions mt-3 pt-3 flex gap-2" style="border-top: 1px solid var(--border-light);">
            ${fav.type === 'file'
          ? `
              <button onclick="event.stopPropagation(); openFavoriteFile(${JSON.stringify(fav).replace(/"/g, '&quot;')});"
                class="flex-1 text-xs py-1.5 rounded-md transition font-medium"
                style="background: var(--primary); color: white;">
                <i class="fas fa-eye mr-1"></i> View
              </button>
              ${fav.downloadLink
            ? `
              <button onclick="event.stopPropagation(); downloadFile('${fav.downloadLink}', '${fav.name.replace(/'/g, "\\'")}');"
                class="text-xs py-1.5 px-3 rounded-md transition font-medium"
                style="background: var(--bg-light); border: 1px solid var(--border-light);">
                <i class="fas fa-download"></i>
              </button>`
            : ''
          }
            `
          : `
              <button onclick="event.stopPropagation(); openFavoriteFolder(${JSON.stringify(fav).replace(/"/g, '&quot;')});"
                class="flex-1 text-xs py-1.5 rounded-md transition font-medium"
                style="background: var(--primary); color: white;">
                <i class="fas fa-folder-open mr-1"></i> Open
              </button>
            `
        }
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
};

// get file icon (mirrors main.js getFileIcon)
const getFavFileIcon = (filename) => {
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
  };
  return icons[ext] || 'fas fa-file text-gray-500';
};

const openFavoriteFile = (fav) => {
  if (fav.previewLink) {
    // Open directly in the file viewer modal
    document.getElementById('modalTitle').textContent = fav.name;
    document.getElementById('fileViewer').src = fav.previewLink;
    document.getElementById('fileModal').classList.add('active');
    updateBodyScrollLock();
  } else if (fav.link) {
    window.open(fav.link, '_blank');
  }
};

const openFavoriteFolder = async (fav) => {
  if (fav.year) {
    currentYear = fav.year;
    currentPath = fav.folderPath ? [...fav.folderPath] : [fav.year];

    const modalTitle = document.getElementById('yearModalTitle');
    modalTitle.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xl font-semibold">${fav.year}</span>
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

    const path = currentPath.join('>subfolders>');
    await loadContent(currentYear, path);
  }
};

// ---- Star button helpers called from main.js renderContent

const createStarButton = (itemData) => {
  const key = getFavoriteKey(itemData);
  const starred = isFavorite(key);
  return `
    <button
      onclick="event.stopPropagation(); handleStarClick(this, ${JSON.stringify(itemData).replace(/"/g, '&quot;')});"
      class="star-btn ${starred ? 'starred' : ''}"
      title="${starred ? 'Remove from favorites' : 'Add to favorites'}"
    >
      <i class="fa${starred ? 's' : 'r'} fa-star"></i>
    </button>
  `;
};

const handleStarClick = (btn, itemData) => {
  const isNowFav = toggleFavorite(itemData);

  // Update button visuals
  btn.classList.toggle('starred', isNowFav);
  btn.title = isNowFav ? 'Remove from favorites' : 'Add to favorites';
  const icon = btn.querySelector('i');
  icon.className = isNowFav ? 'fas fa-star' : 'far fa-star';

  // Quick pulse animation
  btn.classList.add('star-pulse');
  setTimeout(() => btn.classList.remove('star-pulse'), 300);
};

document.addEventListener('DOMContentLoaded', () => {
  renderFavoritesSection();
});

import { CONFIG } from '../config.js';
import { getFileIconClass } from '../utils/helpers.js';

const STORAGE_KEY = CONFIG.favorites.storageKey;

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

function getFavoriteKey(item) {
  return item.path || `${item.year}>${item.name}`;
}

export function isFavorite(key) {
  return !!getFavorites()[key];
}

export function toggleFavorite(item) {
  const favorites = getFavorites();
  const key = getFavoriteKey(item);

  if (favorites[key]) {
    delete favorites[key];
  } else {
    favorites[key] = {
      type: item.type,
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
}

export function removeFavorite(path) {
  const favorites = getFavorites();
  delete favorites[path];
  saveFavorites(favorites);
  renderFavoritesSection();
}

export function clearAllFavorites() {
  localStorage.removeItem(STORAGE_KEY);
  renderFavoritesSection();
}

export function renderFavoritesSection() {
  const container = document.getElementById('favorites-container');
  const section = document.getElementById('favorites');
  if (!container || !section) return;

  const favorites = getFavorites();
  const entries = Object.values(favorites);

  if (entries.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  // Group by year
  const grouped = {};
  entries
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    .forEach((fav) => {
      const year = fav.year || 'Other';
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(fav);
    });

  // Build header
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className =
    'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6';
  header.innerHTML = `
    <h2 class="text-3xl font-bold flex items-center justify-center sm:justify-start gap-3 text-center sm:text-left">
      <i class="fas fa-star text-yellow-500"></i>
      My Favorites
    </h2>
  `;

  const clearBtn = document.createElement('button');
  clearBtn.className =
    'btn btn-sm btn-ghost btn-error btn-rounded rounded-xl self-center sm:self-auto';
  clearBtn.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> Clear All';
  clearBtn.addEventListener('click', clearAllFavorites);
  header.appendChild(clearBtn);
  container.appendChild(header);

  for (const [year, items] of Object.entries(grouped)) {
    const yearSection = document.createElement('div');
    yearSection.className = 'mb-6';

    const yearTitle = document.createElement('h3');
    yearTitle.className =
      'text-lg font-semibold mb-3 text-primary flex items-center gap-2';
    yearTitle.innerHTML = `<i class="fas fa-graduation-cap"></i> ${year}`;
    yearSection.appendChild(yearTitle);

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';

    for (const fav of items) {
      const icon =
        fav.type === 'folder'
          ? 'fas fa-folder text-yellow-500'
          : getFileIconClass(fav.name);
      const card = document.createElement('div');
      card.className =
        'card bg-base-200 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer group rounded-2xl';

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';

      const topRow = document.createElement('div');
      topRow.className = 'flex items-start gap-3';
      topRow.innerHTML = `
        <i class="${icon} text-xl mt-0.5 flex-shrink-0"></i>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate" title="${fav.name}">${fav.name}</p>
          <p class="text-xs mt-1 text-base-content/60">
            ${fav.type === 'folder' ? 'Folder' : 'File'}
            ${fav.folderPath && fav.folderPath.length > 1 ? ' · ' + fav.folderPath.slice(1).join(' / ') : ''}
          </p>
        </div>
      `;

      const removeBtn = document.createElement('button');
      removeBtn.className =
        'btn btn-xs btn-ghost border-none btn-rounded rounded-full text-base-content/40 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity';
      removeBtn.title = 'Remove from favorites';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFavorite(fav.path);
      });
      topRow.appendChild(removeBtn);
      cardBody.appendChild(topRow);

      const actions = document.createElement('div');
      actions.className =
        'card-actions justify-end mt-2 pt-2 border-t border-base-300';

      if (fav.type === 'file') {
        const viewBtn = document.createElement('button');
        viewBtn.className =
          'btn btn-primary btn-xs btn-rounded rounded border-none flex-1';
        viewBtn.innerHTML = '<i class="fas fa-eye mr-1"></i> View';
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window._openFavoriteFile && window._openFavoriteFile(fav);
        });
        actions.appendChild(viewBtn);

        if (fav.downloadLink) {
          const dlBtn = document.createElement('button');
          dlBtn.className =
            'btn btn-ghost border-none btn-rounded rounded-full btn-xs';
          dlBtn.innerHTML = '<i class="fas fa-download"></i>';
          dlBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window._downloadFile &&
              window._downloadFile(fav.downloadLink, fav.name);
          });
          actions.appendChild(dlBtn);
        }
      } else {
        const openBtn = document.createElement('button');
        openBtn.className =
          'btn btn-primary btn-xs btn-rounded rounded border-none flex-1';
        openBtn.innerHTML = '<i class="fas fa-folder-open mr-1"></i> Open';
        openBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window._openFavoriteFolder && window._openFavoriteFolder(fav);
        });
        actions.appendChild(openBtn);
      }

      cardBody.appendChild(actions);
      card.appendChild(cardBody);
      grid.appendChild(card);
    }

    yearSection.appendChild(grid);
    container.appendChild(yearSection);
  }
}

export function initFavorites() {
  renderFavoritesSection();
}

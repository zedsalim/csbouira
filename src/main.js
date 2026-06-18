import './style.css';
import { initSearch, openSearchModal } from './modules/search.js';
import { initUpload } from './modules/upload.js';
import { initScanner } from './modules/scanner.js';
import { initPdfViewer } from './modules/pdfViewer.js';
import {
  initFavorites,
  toggleFavorite,
  isFavorite,
  renderFavoritesSection,
} from './modules/favorites.js';
import { initLoader } from './modules/loader.js';
import { initContact } from './modules/contact.js';
import { initDhikr } from './modules/dhikr.js';
import { initTheme } from './modules/theme.js';
import { CONFIG } from './config.js';
import { getFileIconClass } from './utils/helpers.js';

// ── State ──────────────────────────────────────────────────────────────────
let currentPath = [];
let currentYear = '';
let currentFiles = [];
let currentFileIndex = -1;
let onlineResources = {};
const yearList = [
  ...CONFIG.years.licence,
  ...CONFIG.years.master1,
  ...CONFIG.years.master2,
];

// ── Body scroll lock ───────────────────────────────────────────────────────
function lockBody() {
  document.body.classList.add('overflow-hidden');
}
function unlockBody() {
  document.body.classList.remove('overflow-hidden');
}

// ── Year cards ─────────────────────────────────────────────────────────────
function renderYearCards(years, containerId, icon) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const tpl = document.getElementById('tpl-year-card');
  if (!tpl) return;
  container.innerHTML = '';
  for (const year of years) {
    const clone = tpl.content.cloneNode(true);
    const badgeId = `badge-${year.replace(/\s+/g, '-').toLowerCase()}`;
    clone.querySelector('[data-field="icon"]').className =
      icon + ' text-white text-xl';
    clone.querySelector('[data-field="title"]').textContent = year;
    const badge = clone.querySelector('[data-field="badge"]');
    badge.id = badgeId;
    badge.innerHTML =
      '<span class="loading loading-spinner loading-xs"></span>';
    clone
      .querySelector('[data-field="card"]')
      .addEventListener('click', () => openYear(year));
    container.appendChild(clone);
  }
}

function showBadge(year, count) {
  const badge = document.getElementById(
    `badge-${year.replace(/\s+/g, '-').toLowerCase()}`,
  );
  if (!badge) return;
  badge.innerHTML =
    count === null || count === undefined
      ? '<i class="fa-solid fa-file"></i> –'
      : `<i class="fa-solid fa-file"></i> ${count}`;
}

async function loadAllFileCounts() {
  try {
    const response = await fetch(`${CONFIG.api.base}?path=_fileCounts`);
    const data = await response.json();
    if (!data || typeof data !== 'object') {
      yearList.forEach((y) => showBadge(y, null));
      return;
    }
    yearList.forEach((y) =>
      showBadge(y, data[y] !== undefined ? data[y] : null),
    );
  } catch {
    yearList.forEach((y) => showBadge(y, null));
  }
}

async function loadOnlineResources() {
  try {
    const response = await fetch(`${CONFIG.api.base}?path=_onlineResources`);
    onlineResources = await response.json();
  } catch {
    onlineResources = {};
  }
}

async function loadYears() {
  renderYearCards(CONFIG.years.licence, 'licence-cards', 'fas fa-book-open');
  renderYearCards(
    CONFIG.years.master1,
    'master1-cards',
    'fas fa-graduation-cap',
  );
  renderYearCards(
    CONFIG.years.master2,
    'master2-cards',
    'fas fa-user-graduate',
  );
  await loadAllFileCounts();
  await loadOnlineResources();
}

// ── Year modal ─────────────────────────────────────────────────────────────
function openYear(year) {
  currentYear = year;
  currentPath = [year];
  setYearModalTitle(year);
  document.getElementById('yearModal')?.showModal();
  lockBody();
  loadContent(year);
}

function setYearModalTitle(year, driveLink = '') {
  const titleEl = document.getElementById('yearModalTitle');
  if (!titleEl) return;
  titleEl.innerHTML = '';
  const span = document.createElement('span');
  span.className = 'text-xl font-semibold';
  span.textContent = year;
  titleEl.appendChild(span);

  if (driveLink) {
    const a = document.createElement('a');
    a.href = driveLink;
    a.target = '_blank';
    a.id = 'driveLink';
    a.title = 'Open in Google Drive';
    a.className =
      'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm rounded-md bg-primary text-primary-content font-medium shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200';
    a.innerHTML =
      '<i class="fab fa-google-drive text-base sm:text-lg"></i><span class="hidden xs:inline sm:inline">Open in Drive</span>';
    titleEl.appendChild(a);
  }
}

async function loadContent(year, path = '') {
  const content = document.getElementById('yearContent');
  if (!content) return;
  content.innerHTML = `
    <div class="flex flex-col items-center gap-3 py-8 text-base-content/50">
      <span class="loading loading-spinner loading-lg"></span>
      <p>Loading...</p>
    </div>`;

  try {
    let url = `${CONFIG.api.base}?year=${encodeURIComponent(year)}`;
    if (path)
      url = `${CONFIG.api.base}?path=${path.split('>subfolders>').map(encodeURIComponent).join('>subfolders>')}`;
    const response = await fetch(url);
    const data = await response.json();

    // Update drive link in title
    const existingDrive = document.getElementById('driveLink');
    if (data.link) {
      if (existingDrive) {
        existingDrive.href = data.link;
        existingDrive.classList.remove('hidden');
      } else {
        setYearModalTitle(currentYear, data.link);
      }
    } else {
      if (existingDrive) existingDrive.classList.add('hidden');
    }

    updateBreadcrumb();
    renderContent(data);

    if (currentPath.length === 1) insertOnlineResources(year);
  } catch (error) {
    content.innerHTML = `
      <div class="text-center py-12 text-error">
        <i class="fas fa-exclamation-circle text-6xl mb-4 block"></i>
        <p class="text-xl">Error loading content</p>
        <p class="mt-2 text-sm">${error.message}</p>
      </div>`;
  }
}

function updateBreadcrumb() {
  const breadcrumb = document.getElementById('breadcrumb');
  if (!breadcrumb) return;
  breadcrumb.innerHTML = '';
  currentPath.forEach((item, index) => {
    const span = document.createElement('span');
    span.className = `breadcrumb-item cursor-pointer hover:text-primary transition-colors ${index === currentPath.length - 1 ? 'font-semibold text-base-content' : 'text-base-content/60'}`;
    span.textContent = item;
    span.addEventListener('click', () => navigateToBreadcrumb(index));
    breadcrumb.appendChild(span);
    if (index < currentPath.length - 1) {
      const sep = document.createElement('i');
      sep.className = 'fas fa-chevron-right mx-2 text-xs text-base-content/40';
      breadcrumb.appendChild(sep);
    }
  });
}

function navigateToBreadcrumb(index) {
  currentPath = currentPath.slice(0, index + 1);
  loadContent(currentYear, currentPath.join('>subfolders>'));
}

function renderContent(data) {
  const content = document.getElementById('yearContent');
  if (!content) return;

  const hasFolders = data.subfolders && Object.keys(data.subfolders).length > 0;
  const hasFiles = data.files && data.files.length > 0;

  if (!hasFolders && !hasFiles) {
    content.innerHTML = `
      <div class="text-center py-12 text-base-content/50">
        <i class="fas fa-folder-open text-6xl mb-4 block"></i>
        <p class="text-xl">No content available</p>
      </div>`;
    return;
  }

  content.innerHTML = '';

  if (hasFolders) {
    const section = document.createElement('div');
    section.className = 'mb-6';
    section.innerHTML =
      '<h3 class="text-xl font-semibold mb-4 flex items-center gap-2"><i class="fas fa-folder text-yellow-500"></i>Folders</h3>';
    const list = document.createElement('div');
    list.className = 'space-y-2';

    for (const [name, folderData] of Object.entries(data.subfolders)) {
      const isEmpty = name.includes('(empty)');
      const folderFavData = {
        type: 'folder',
        name,
        year: currentYear,
        folderPath: [...currentPath, name],
        link: folderData.link || '',
      };
      const key = `${currentYear}>${name}`;
      const starred =
        isFavorite(key) || isFavorite(folderFavData.folderPath.join('>'));

      const item = document.createElement('div');
      item.className = `flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all ${isEmpty ? 'opacity-50 cursor-not-allowed bg-base-200' : 'bg-base-200 hover:bg-primary hover:text-primary-content group'}`;

      if (!isEmpty) {
        item.addEventListener('click', () => {
          currentPath = [...currentPath, name];
          const path = [currentYear, ...currentPath.slice(1)].join(
            '>subfolders>',
          );
          loadContent(currentYear, path);
        });
      }

      item.innerHTML = `
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <i class="fas fa-folder text-yellow-500 flex-shrink-0 group-hover:text-white transition-colors"></i>
          <span class="truncate">${name}</span>
          ${isEmpty ? '<span class="badge badge-sm badge-ghost">empty</span>' : ''}
        </div>
      `;

      if (!isEmpty) {
        const starBtn = document.createElement('button');
        starBtn.className = `btn btn-xs btn-ghost ${starred ? 'text-yellow-400' : 'text-base-content/30'} hover:text-yellow-400`;
        starBtn.title = starred ? 'Remove from favorites' : 'Add to favorites';
        starBtn.innerHTML = `<i class="${starred ? 'fas' : 'far'} fa-star"></i>`;
        starBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isNow = toggleFavorite(folderFavData);
          starBtn.className = `btn btn-xs btn-ghost ${isNow ? 'text-yellow-400' : 'text-base-content/30'} hover:text-yellow-400`;
          starBtn.innerHTML = `<i class="${isNow ? 'fas' : 'far'} fa-star"></i>`;
        });
        item.appendChild(starBtn);
      }

      list.appendChild(item);
    }

    section.appendChild(list);
    content.appendChild(section);
  }

  if (hasFiles) {
    const section = document.createElement('div');
    section.className = 'mb-6';
    section.innerHTML =
      '<h3 class="text-xl font-semibold mb-4 flex items-center gap-2"><i class="fas fa-file text-primary"></i>Files</h3>';
    const list = document.createElement('div');
    list.className = 'space-y-2';
    currentFiles = data.files;

    data.files.forEach((file, index) => {
      const icon = getFileIconClass(file.name);
      const fileFavData = {
        type: 'file',
        name: file.name,
        year: currentYear,
        folderPath: [...currentPath],
        link: file.link || '',
        previewLink: file.previewLink || '',
        downloadLink: file.downloadLink || '',
        path: `${currentPath.join('>')}>${file.name}`,
      };
      const favKey = fileFavData.path;
      const starred = isFavorite(favKey);

      const item = document.createElement('div');
      item.className =
        'flex items-center justify-between gap-3 p-3 rounded-lg bg-base-200 hover:bg-primary hover:text-primary-content group cursor-pointer transition-all';

      const left = document.createElement('div');
      left.className = 'flex items-center gap-3 flex-1 min-w-0';
      left.innerHTML = `<i class="${icon} flex-shrink-0 group-hover:text-white transition-colors"></i><span class="truncate">${file.name}</span>`;
      left.addEventListener('click', () => openFile(file, index));
      item.appendChild(left);

      const actions = document.createElement('div');
      actions.className = 'flex items-center gap-1 flex-shrink-0';

      const eyeBtn = document.createElement('button');
      eyeBtn.className = 'btn btn-xs btn-ghost';
      eyeBtn.innerHTML = '<i class="fas fa-eye"></i>';
      eyeBtn.title = 'View';
      eyeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openFile(file, index);
      });
      actions.appendChild(eyeBtn);

      if (file.downloadLink) {
        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn btn-xs btn-ghost';
        dlBtn.innerHTML = '<i class="fas fa-download"></i>';
        dlBtn.title = 'Download';
        dlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadFile(file.downloadLink, file.name);
        });
        actions.appendChild(dlBtn);
      }

      const starBtn = document.createElement('button');
      starBtn.className = `btn btn-xs btn-ghost ${starred ? 'text-yellow-400' : 'text-base-content/30'} hover:text-yellow-400`;
      starBtn.innerHTML = `<i class="${starred ? 'fas' : 'far'} fa-star"></i>`;
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isNow = toggleFavorite(fileFavData);
        starBtn.className = `btn btn-xs btn-ghost ${isNow ? 'text-yellow-400' : 'text-base-content/30'} hover:text-yellow-400`;
        starBtn.innerHTML = `<i class="${isNow ? 'fas' : 'far'} fa-star"></i>`;
      });
      actions.appendChild(starBtn);

      item.appendChild(actions);
      list.appendChild(item);
    });

    section.appendChild(list);
    content.appendChild(section);
  }
}

function insertOnlineResources(year) {
  const resources = onlineResources[year];
  if (!resources || Object.keys(resources).length === 0) return;
  const content = document.getElementById('yearContent');
  if (!content) return;

  const section = document.createElement('div');
  section.className = 'mb-6 mt-6';
  section.innerHTML =
    '<h3 class="text-xl font-semibold mb-4 flex items-center gap-2"><i class="fas fa-globe text-blue-500"></i> Online Resources</h3>';

  const accordion = document.createElement('div');
  accordion.className = 'space-y-2';

  // resources = { "Algorithm": [{name, url, type, language}, ...], "Probabilites": [...], ... }
  for (const [subject, items] of Object.entries(resources)) {
    const itemsArr = Array.isArray(items) ? items : [items];

    const item = document.createElement('div');
    item.className =
      'collapse collapse-arrow bg-base-200 rounded-lg border border-base-300';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    item.appendChild(checkbox);

    const title = document.createElement('div');
    title.className = 'collapse-title font-semibold flex items-center gap-2';
    title.innerHTML = `
      <i class="fas fa-book-open text-primary flex-shrink-0"></i>
      <span class="flex-1">${subject}</span>
    `;
    item.appendChild(title);

    const body = document.createElement('div');
    body.className = 'collapse-content';

    const list = document.createElement('div');
    list.className = 'space-y-2 pt-1';

    for (const res of itemsArr) {
      const typeIconMap = {
        'Youtube Playlist': 'fab fa-youtube text-red-500',
        'Youtube Video': 'fab fa-youtube text-red-500',
        Website: 'fas fa-globe text-blue-500',
        PDF: 'fas fa-file-pdf text-red-400',
        GitHub: 'fab fa-github text-base-content',
      };
      const langColorMap = {
        AR: 'badge-warning',
        FR: 'badge-info',
        ENG: 'badge-success',
      };
      const icon = typeIconMap[res.type] || 'fas fa-link text-primary';
      const langBadge = res.language
        ? `<span class="badge badge-sm ${langColorMap[res.language] || 'badge-ghost'}">${res.language}</span>`
        : '';
      const typeBadge = res.type
        ? `<span class="badge badge-sm badge-ghost">${res.type}</span>`
        : '';

      const row = document.createElement('a');
      row.href = res.url || '#';
      row.target = '_blank';
      row.rel = 'noopener noreferrer';
      row.className =
        'flex items-center gap-3 p-3 rounded-lg bg-base-100 hover:bg-primary hover:text-primary-content transition-all group';
      row.innerHTML = `
        <i class="${icon} flex-shrink-0 text-lg group-hover:text-white"></i>
        <span class="flex-1 font-medium text-sm truncate">${res.name}</span>
        <div class="flex items-center gap-1 flex-shrink-0">${typeBadge}${langBadge}</div>
        <i class="fas fa-external-link-alt flex-shrink-0 text-xs opacity-50 group-hover:opacity-100"></i>
      `;
      list.appendChild(row);
    }

    body.appendChild(list);
    item.appendChild(body);
    accordion.appendChild(item);
  }

  section.appendChild(accordion);
  content.appendChild(section);
}

// ── File viewer ────────────────────────────────────────────────────────────
function openFile(file, index) {
  currentFileIndex = index;
  if (file.previewLink) {
    const titleEl = document.getElementById('modalTitle');
    titleEl.textContent = file.name;
    titleEl.title = file.name;
    document.getElementById('fileViewer').src = file.previewLink;
    document.getElementById('fileModal')?.showModal();
    lockBody();
    updateNavButtons();
  } else if (file.link) {
    window.open(file.link, '_blank');
  }
}

function updateNavButtons() {
  const prev = document.getElementById('prevFileBtn');
  const next = document.getElementById('nextFileBtn');
  if (prev) prev.classList.toggle('hidden', currentFileIndex <= 0);
  if (next)
    next.classList.toggle(
      'hidden',
      currentFileIndex >= currentFiles.length - 1,
    );
}

function showPrevFile() {
  if (currentFileIndex > 0) {
    currentFileIndex--;
    openFile(currentFiles[currentFileIndex], currentFileIndex);
  }
}

function showNextFile() {
  if (currentFileIndex < currentFiles.length - 1) {
    currentFileIndex++;
    openFile(currentFiles[currentFileIndex], currentFileIndex);
  }
}

function downloadFile(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function toggleFullScreen() {
  const dialog = document.getElementById('fileModal');
  dialog?.classList.toggle('fullscreen');
  const btn = document.getElementById('fullscreenBtn');
  if (btn)
    btn.innerHTML = dialog?.classList.contains('fullscreen')
      ? '<i class="fas fa-compress"></i>'
      : '<i class="fas fa-expand"></i>';
}

// ── Contributor tabs ────────────────────────────────────────────────────────
function switchContributorTab(tab) {
  document
    .querySelectorAll('.contributor-tab')
    .forEach((btn) => btn.classList.remove('tab-active'));
  document.getElementById(tab + 'Tab')?.classList.add('tab-active');
  document
    .querySelectorAll('.contributor-panel')
    .forEach((el) => el.classList.add('hidden'));
  document.getElementById(tab + 'Content')?.classList.remove('hidden');
}

// ── Navbar ──────────────────────────────────────────────────────────────────
function initNavbar() {
  // Desktop years dropdown
  const yearsDropdownBtn = document.getElementById('yearsDropdownBtn');
  const yearsDropdown = document.getElementById('yearsDropdown');
  yearsDropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    yearsDropdown?.classList.toggle('hidden');
  });
  document.addEventListener('click', (e) => {
    if (
      !yearsDropdown?.contains(e.target) &&
      !yearsDropdownBtn?.contains(e.target)
    ) {
      yearsDropdown?.classList.add('hidden');
    }
  });

  // Mobile menu
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  mobileBtn?.addEventListener('click', () => {
    const isOpen = mobileMenu?.classList.contains('opacity-100');
    if (isOpen) {
      mobileMenu.classList.remove(
        'opacity-100',
        'scale-y-100',
        'translate-y-0',
      );
      mobileMenu.classList.add('opacity-0', 'scale-y-95', '-translate-y-2');
      setTimeout(() => mobileMenu.classList.add('hidden'), 180);
    } else {
      mobileMenu?.classList.remove('hidden');
      setTimeout(() => {
        mobileMenu?.classList.remove(
          'opacity-0',
          'scale-y-95',
          '-translate-y-2',
        );
        mobileMenu?.classList.add(
          'opacity-100',
          'scale-y-100',
          'translate-y-0',
        );
      }, 10);
    }
  });

  // Mobile years dropdown
  const mobileYearsBtn = document.getElementById('mobileYearsBtn');
  const mobileYearsDropdown = document.getElementById('mobileYearsDropdown');
  mobileYearsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileYearsDropdown?.classList.toggle('hidden');
  });
  document.addEventListener('click', (e) => {
    if (
      !mobileYearsDropdown?.contains(e.target) &&
      !mobileYearsBtn?.contains(e.target)
    ) {
      mobileYearsDropdown?.classList.add('hidden');
    }
  });
}

// ── Back to top ─────────────────────────────────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('opacity-0', window.scrollY <= 300);
    btn.classList.toggle('pointer-events-none', window.scrollY <= 300);
    btn.classList.toggle('opacity-100', window.scrollY > 300);
  });
  btn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' }),
  );
}

// ── Expose globals ──────────────────────────────────────────────────────────
window.openYear = openYear;
window.openSearchModal = openSearchModal;
window.closeYearModal = () => {
  document.getElementById('yearModal')?.close();
  unlockBody();
};
window.closeModal = () => {
  document.getElementById('fileModal')?.close();
  unlockBody();
};
window.toggleFullScreen = toggleFullScreen;
window.showPrevFile = showPrevFile;
window.showNextFile = showNextFile;
window.downloadFile = downloadFile;
window.openContributorsModal = () => {
  document.getElementById('contributorsModal')?.showModal();
  lockBody();
};
window.closeContributorsModal = () => {
  document.getElementById('contributorsModal')?.close();
  unlockBody();
};
window.switchContributorTab = switchContributorTab;

// Favorites bridge for search & favorites modules
window._openSearchFile = (fileData) => {
  if (fileData.previewLink) {
    const titleEl = document.getElementById('modalTitle');
    titleEl.textContent = fileData.name;
    titleEl.title = fileData.name;
    document.getElementById('fileViewer').src = fileData.previewLink;
    document.getElementById('fileModal')?.showModal();
    lockBody();
  } else if (fileData.link) {
    window.open(fileData.link, '_blank');
  }
};
window._openSearchFolder = async (folderData) => {
  currentYear = folderData.year;
  currentPath = [folderData.year, ...folderData.path];
  setYearModalTitle(folderData.year);
  document.getElementById('yearModal')?.showModal();
  lockBody();
  await loadContent(currentYear, folderData.apiPath);
};
window._openFavoriteFile = window._openSearchFile;
window._openFavoriteFolder = async (fav) => {
  if (!fav.year) return;
  currentYear = fav.year;
  currentPath = fav.folderPath ? [...fav.folderPath] : [fav.year];
  setYearModalTitle(fav.year);
  document.getElementById('yearModal')?.showModal();
  lockBody();
  await loadContent(currentYear, currentPath.join('>subfolders>'));
};
window._downloadFile = downloadFile;

// Close modals via native dialog backdrop click
document.addEventListener('click', (e) => {
  if (e.target === document.getElementById('yearModal'))
    window.closeYearModal();
  if (e.target === document.getElementById('fileModal')) window.closeModal();
  if (e.target === document.getElementById('uploadModal'))
    window.closeUploadModal?.();
  if (e.target === document.getElementById('searchModal'))
    window.closeSearchModal();
  if (e.target === document.getElementById('contributorsModal'))
    window.closeContributorsModal();
});

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initSearch();
  initUpload();
  initScanner();
  initPdfViewer();
  initFavorites();
  initContact();
  initDhikr();
  initTheme();
  initNavbar();
  initBackToTop();
  loadYears();

  // Footer year
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = `© ${new Date().getFullYear()}`;

  // Theme persistence: sync all toggle checkboxes to saved theme & save on change
  const savedTheme = localStorage.getItem('theme');
  const htmlEl = document.documentElement;
  if (savedTheme) htmlEl.setAttribute('data-theme', savedTheme);

  function syncThemeToggles() {
    const isDark = htmlEl.getAttribute('data-theme') === CONFIG.theme.dark;
    document.querySelectorAll('[data-theme="toggle"]').forEach((cb) => {
      cb.checked = isDark;
    });
  }
  syncThemeToggles();

  document.querySelectorAll('[data-theme="toggle"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const newTheme = cb.checked ? CONFIG.theme.dark : CONFIG.theme.light;
      htmlEl.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      // keep all toggles in sync
      document.querySelectorAll('[data-theme="toggle"]').forEach((other) => {
        if (other !== cb) other.checked = cb.checked;
      });
    });
  });
});

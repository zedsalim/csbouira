// ===============================
// Dark Mode
// ===============================
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');

  document.querySelectorAll('.dark-mode-icon').forEach((icon) => {
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
  });

  localStorage.setItem(
    'darkMode',
    document.documentElement.classList.contains('dark'),
  );
};

if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('dark');
  document.querySelectorAll('.dark-mode-icon').forEach((icon) => {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  });
}

// ===============================
// Drive API & Navigation
// ===============================
const API_BASE = 'https://api.csbouira.xyz/api/drive';
const YEARS = {
  licence: ['Licence 1', 'Licence 2', 'Licence 3 SI'],
  master1: ['Master 1 GSI', 'Master 1 ISIL', 'Master 1 IA'],
  master2: ['Master 2 GSI', 'Master 2 ISIL', 'Master 2 IA'],
};

const yearList = [...YEARS.licence, ...YEARS.master1, ...YEARS.master2];

let currentPath = [];
let currentYear = '';

const loadYears = async () => {
  try {
    const response = await fetch(API_BASE);
    await response.json();

    renderYearCards(YEARS.licence, 'licence-cards', 'fas fa-book-open');
    renderYearCards(YEARS.master1, 'master1-cards', 'fas fa-graduation-cap');
    renderYearCards(YEARS.master2, 'master2-cards', 'fas fa-user-graduate');
    await loadAllFileCounts();
  } catch (error) {
    console.error('Error loading years:', error);
  }
};

const renderYearCards = (years, containerId, icon) => {
  const container = document.getElementById(containerId);
  container.innerHTML = years
    .map(
      (year) => `
        <div class="card p-6 cursor-pointer relative group" onclick="openYear('${year}')">
          <span id="badge-${year.replace(/\s+/g, '-').toLowerCase()}" 
                class="absolute top-3 right-3 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
            <div class="loading-small"></div>
          </span>
          
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i class="${icon} text-white text-xl"></i>
            </div>
            <h3 class="text-xl font-semibold">${year}</h3>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Click to explore semesters and modules
          </p>
          <div class="mt-4 flex items-center text-blue-500 font-semibold">
            View Resources <i class="fas fa-arrow-right ml-2"></i>
          </div>
        </div>
      `,
    )
    .join('');
};

const loadAllFileCounts = async () => {
  try {
    const response = await fetch(`${API_BASE}?path=_fileCounts`);
    const data = await response.json();

    if (!data || typeof data !== 'object') {
      console.warn('No valid _fileCounts data received');
      yearList.forEach((year) => showBadge(year, null));
      return;
    }

    yearList.forEach((year) => {
      const count = data[year];
      showBadge(year, count !== undefined ? count : null);
    });
  } catch (error) {
    console.error('Error loading file counts:', error);
    yearList.forEach((year) => showBadge(year, null));
  }
};

const showBadge = (year, count) => {
  const badge = document.getElementById(
    `badge-${year.replace(/\s+/g, '-').toLowerCase()}`,
  );

  if (!badge) return;

  if (count === null || count === undefined) {
    badge.innerHTML = `<i class="fa-solid fa-file"></i> –`;
  } else {
    badge.innerHTML = `<i class="fa-solid fa-file"></i> ${count}`;
  }
};

const openYear = async (year, e) => {
  if (e) e.preventDefault();
  currentYear = year;
  currentPath = [year];
  document.getElementById('yearModalTitle').textContent = year;
  document.getElementById('yearModal').classList.add('active');
  await loadContent(year);
};

const loadContent = async (year, path = '') => {
  const content = document.getElementById('yearContent');
  content.innerHTML = `
    <div class="text-center py-8">
      <div class="loading mx-auto"></div>
      <p class="mt-4">Loading...</p>
    </div>
  `;

  try {
    let url = `${API_BASE}?year=${encodeURIComponent(year)}`;
    if (path) url = `${API_BASE}?path=${encodeURIComponent(path)}`;

    const response = await fetch(url);
    const data = await response.json();

    updateBreadcrumb();
    renderContent(data);
  } catch (error) {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
        <p class="text-xl">Error loading content</p>
        <p class="mt-2">${error.message}</p>
      </div>
    `;
  }
};

const updateBreadcrumb = () => {
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.innerHTML = currentPath
    .map(
      (item, index) => `
        <span class="breadcrumb-item ${
          index === currentPath.length - 1 ? 'active' : ''
        }" onclick="navigateToBreadcrumb(${index})">
          ${item}
          ${
            index < currentPath.length - 1
              ? '<i class="fas fa-chevron-right mx-2"></i>'
              : ''
          }
        </span>
      `,
    )
    .join('');
};

const navigateToBreadcrumb = (index) => {
  currentPath = currentPath.slice(0, index + 1);
  const path = currentPath.join('>subfolders>');
  loadContent(currentYear, path);
};

const renderContent = (data) => {
  const content = document.getElementById('yearContent');

  if (
    (!data.subfolders || Object.keys(data.subfolders).length === 0) &&
    (!data.files || data.files.length === 0)
  ) {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-folder-open text-6xl mb-4" style="color: var(--text-secondary-light);"></i>
        <p class="text-xl">No content available</p>
      </div>
    `;
    return;
  }

  let html = '';

  if (data.subfolders && Object.keys(data.subfolders).length > 0) {
    html += `
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <i class="fas fa-folder text-yellow-500"></i>Folders
        </h3>
        <div class="space-y-2">
    `;

    const driveFolders = Object.entries(data.subfolders);
    for (const [name] of driveFolders) {
      const isEmpty = name.includes('(empty)');
      const escapedName = name.replace(/'/g, "\\'").replace(/"/g, '\\"');
      html += `
        <div class="folder-item ${isEmpty ? 'opacity-50' : ''}" ${
          isEmpty ? '' : `onclick="openFolder('${escapedName}')"`
        }>
          <i class="fas fa-folder text-yellow-500"></i>
          <span class="flex-1">${name}</span>
          ${
            !isEmpty
              ? '<i class="fas fa-chevron-right"></i>'
              : '<span class="text-sm">(empty)</span>'
          }
        </div>
      `;
    }
    html += '</div></div>';
  }

  if (data.files && data.files.length > 0) {
    html += `
      <div>
        <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <i class="fas fa-file text-blue-500"></i>Files
        </h3>
        <div class="space-y-2">
    `;
    data.files.forEach((file) => {
      const icon = getFileIcon(file.name);
      html += `
        <div class="file-item" onclick='openFile(${JSON.stringify(file)})'>
          <i class="${icon}"></i>
          <span class="flex-1">${file.name}</span>
          <i class="fas fa-external-link-alt"></i>
        </div>
      `;
    });
    html += '</div></div>';
  }

  content.innerHTML = html;
};

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    pdf: 'fas fa-file-pdf text-red-500',
    doc: 'fas fa-file-word text-blue-600',
    docx: 'fas fa-file-word text-blue-600',
    ppt: 'fas fa-file-powerpoint text-orange-500',
    pptx: 'fas fa-file-powerpoint text-orange-500',
    xls: 'fas fa-file-excel text-green-500',
    xlsx: 'fas fa-file-excel text-green-500',
    txt: 'fas fa-file-alt text-gray-500',
    png: 'fas fa-file-image text-yellow-500',
    jpg: 'fas fa-file-image text-yellow-500',
    jpeg: 'fas fa-file-image text-yellow-500',
    gif: 'fas fa-file-image text-yellow-500',
    webp: 'fas fa-file-image text-yellow-500',
    bmp: 'fas fa-file-image text-yellow-500',
    mp4: 'fas fa-file-video text-indigo-500',
    mov: 'fas fa-file-video text-indigo-500',
    avi: 'fas fa-file-video text-indigo-500',
    mkv: 'fas fa-file-video text-indigo-500',
    wmv: 'fas fa-file-video text-indigo-500',
    flv: 'fas fa-file-video text-indigo-500',
    webm: 'fas fa-file-video text-indigo-500',
    zip: 'fas fa-file-archive text-purple-500',
    rar: 'fas fa-file-archive text-purple-500',
    '7z': 'fas fa-file-archive text-purple-500',
    tar: 'fas fa-file-archive text-purple-500',
    gz: 'fas fa-file-archive text-purple-500',
    exe: 'fas fa-cogs text-red-600',
    bat: 'fas fa-terminal text-red-600',
    sh: 'fas fa-terminal text-red-600',
    c: 'fas fa-file-code text-blue-400',
    cpp: 'fas fa-file-code text-blue-400',
    h: 'fas fa-file-code text-blue-400',
    php: 'fab fa-php text-purple-600',
    py: 'fab fa-python text-blue-500',
    js: 'fab fa-js-square text-yellow-400',
    ts: 'fab fa-js-square text-blue-600',
    html: 'fab fa-html5 text-orange-500',
    css: 'fab fa-css3-alt text-blue-500',
    java: 'fab fa-java text-red-500',
    rb: 'fas fa-gem text-red-400',
    go: 'fas fa-golang text-blue-400',
    rs: 'fas fa-cogs text-orange-500',
    md: 'fas fa-file-alt text-gray-700',
    json: 'fas fa-file-code text-yellow-600',
    xml: 'fas fa-file-code text-purple-400',
    csv: 'fas fa-file-csv text-green-500',
  };

  return icons[ext] || 'fas fa-file text-gray-500';
};

const openFolder = (folderName) => {
  currentPath.push(folderName);
  const path = currentPath.join('>subfolders>');
  loadContent(currentYear, path);
};

const openFile = (file) => {
  const fileId = extractFileId(file.link);
  if (fileId) {
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    document.getElementById('modalTitle').textContent = file.name;
    document.getElementById('fileViewer').src = previewUrl;
    document.getElementById('fileModal').classList.add('active');
  } else {
    window.open(file.link, '_blank');
  }
};

const extractFileId = (link) => {
  const match = link.match(/\/d\/([^/]+)/);
  return match ? match[1] : null;
};

const closeModal = () => {
  document.getElementById('fileModal').classList.remove('active');
  document.getElementById('fileViewer').src = '';
};

const closeYearModal = () => {
  document.getElementById('yearModal').classList.remove('active');
  currentPath = [];
  currentYear = '';
};

// Initialize years on page load
loadYears();

// ===============================
// Dropdowns & Mobile Menu
// ===============================
// Desktop Years Dropdown
const yearsDropdownBtn = document.getElementById('yearsDropdownBtn');
const yearsDropdown = document.getElementById('yearsDropdown');

yearsDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  yearsDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (
    !yearsDropdown.contains(e.target) &&
    !yearsDropdownBtn.contains(e.target)
  ) {
    yearsDropdown.classList.add('hidden');
  }
});

// Mobile Menu toggle
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

mobileBtn.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('opacity-100');

  if (isOpen) {
    mobileMenu.classList.remove('opacity-100', 'scale-y-100', 'translate-y-0');
    mobileMenu.classList.add('opacity-0', 'scale-y-95', '-translate-y-2');
    setTimeout(() => {
      mobileMenu.classList.add('hidden');
    }, 180);
  } else {
    mobileMenu.classList.remove('hidden');
    setTimeout(() => {
      mobileMenu.classList.remove('opacity-0', 'scale-y-95', '-translate-y-2');
      mobileMenu.classList.add('opacity-100', 'scale-y-100', 'translate-y-0');
    }, 10);
  }
});

// Mobile Years Dropdown
const mobileYearsBtn = document.getElementById('mobileYearsBtn');
const mobileYearsDropdown = document.getElementById('mobileYearsDropdown');

mobileYearsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  mobileYearsDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (
    !mobileYearsDropdown.contains(e.target) &&
    !mobileYearsBtn.contains(e.target)
  ) {
    mobileYearsDropdown.classList.add('hidden');
  }
});

// ===============================
// Back to Top Button
// ===============================
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
    backToTopBtn.classList.add('opacity-100');
  } else {
    backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
    backToTopBtn.classList.remove('opacity-100');
  }
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

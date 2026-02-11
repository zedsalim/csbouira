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
let currentFiles = [];
let currentFileIndex = -1;
let onlineResources = {};

const loadYears = async () => {
  try {
    renderYearCards(YEARS.licence, 'licence-cards', 'fas fa-book-open');
    renderYearCards(YEARS.master1, 'master1-cards', 'fas fa-graduation-cap');
    renderYearCards(YEARS.master2, 'master2-cards', 'fas fa-user-graduate');
    await loadAllFileCounts();
    await loadOnlineResources();
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

const loadOnlineResources = async () => {
  try {
    const response = await fetch(`${API_BASE}?path=_onlineResources`);
    onlineResources = await response.json();
  } catch (err) {
    console.error('Failed to load _onlineResources:', err);
    onlineResources = {};
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
  const modalTitle = document.getElementById('yearModalTitle');
  modalTitle.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xl font-semibold">${year}</span>
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

    const driveLink = document.getElementById('driveLink');
    if (data.link) {
      driveLink.href = data.link;
      driveLink.style.display = 'inline-flex';
      driveLink.target = '_blank';
      driveLink.classList.add('active');
    } else {
      driveLink.style.display = 'none';
      driveLink.classList.remove('active');
    }

    updateBreadcrumb();
    renderContent(data);

    if (currentPath.length === 1) {
      insertOnlineResources(year);
    }
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
        <span class="breadcrumb-item ${index === currentPath.length - 1 ? 'active' : ''
        }" onclick="navigateToBreadcrumb(${index})">
          ${item}
          ${index < currentPath.length - 1
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
      const folderFavData = {
        type: 'folder',
        name: name,
        year: currentYear,
        path: [...currentPath, name].join('>subfolders>'),
        folderPath: [...currentPath, name],
      };
      html += `
        <div class="folder-item ${isEmpty ? 'opacity-50' : ''}" ${isEmpty ? '' : `onclick="openFolder('${escapedName}')"`
        }>
          <i class="fas fa-folder text-yellow-500"></i>
          <span class="flex-1">${name}</span>
          ${!isEmpty
          ? (typeof createStarButton === 'function' ? createStarButton(folderFavData) : '') + '<i class="fas fa-chevron-right"></i>'
          : '<span class="text-sm">(empty)</span>'
        }
        </div>
      `;
    }
    html += '</div></div>';
  }

  if (data.files && data.files.length > 0) {
    currentFiles = data.files;
    html += `
      <div>
        <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <i class="fas fa-file text-blue-500"></i>Files
        </h3>
        <div class="space-y-2">
    `;
    data.files.forEach((file) => {
      const icon = getFileIcon(file.name);
      const escapedFile = JSON.stringify(file).replace(/'/g, "\\'");
      const fileFavData = {
        type: 'file',
        name: file.name,
        year: currentYear,
        path: [...currentPath, file.name].join('>subfolders>'),
        folderPath: [...currentPath],
        link: file.link || '',
        previewLink: file.previewLink || '',
        downloadLink: file.downloadLink || '',
      };
      html += `
        <div class="file-item group">
          <div class="flex items-center gap-3 flex-1" onclick='openFile(${escapedFile})'>
            <i class="${icon}"></i>
            <span class="flex-1">${file.name}</span>
            <i class="action-btn fas fa-eye"></i>
          </div>
          ${typeof createStarButton === 'function' ? createStarButton(fileFavData) : ''}
          <button 
            onclick='event.stopPropagation(); downloadFile("${file.downloadLink}", "${file.name}")' 
            class="action-btn ml-2"
            title="Download file">
            <i class="fas fa-download"></i>
          </button>
        </div>
      `;
    });
    html += '</div></div>';
  }

  content.innerHTML = html;
};

const insertOnlineResources = (year) => {
  let yearResources = onlineResources[year];
  if (!yearResources) return;

  let subjectGroups = {};

  if (Array.isArray(yearResources)) {
    subjectGroups['General'] = yearResources;
  } else if (typeof yearResources === 'object') {
    subjectGroups = yearResources;
  }

  if (Object.keys(subjectGroups).length === 0) return;

  const container = document.getElementById('yearContent');

  const accordion = `
    <div class="mt-8">
      <div class="mb-6">

        <h3 class="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
          <i class="fas fa-globe text-red-500"></i>Videos & Websites
        </h3>

        <div class="space-y-2">
          ${Object.entries(subjectGroups)
      .map(
        ([subject, resources]) => `
            <div class="folder-item">
              <button 
                class="w-full flex justify-between items-center text-sm md:text-base"
                onclick="this.parentElement.nextElementSibling.classList.toggle('hidden'); this.querySelector('.chevron-icon').classList.toggle('rotate-180');"
              >
                <span class="flex items-center gap-2">
                  ${subject}
                </span>
                <i class="fas fa-chevron-down chevron-icon transition-transform"></i>
              </button>
            </div>

            <div class="hidden ml-2 space-y-2 mb-2">
              ${(Array.isArray(resources) ? resources : [])
            .map(
              (r) => `
                    <div class="border-b p-3 rounded-lg hover:shadow-md transition-shadow">
                      <a href="${r.url || '#'}" target="_blank" class="font-semibold hover:underline text-xs md:text-sm flex items-center gap-2">
                        <i class="fas fa-external-link-alt text-xs"></i>
                        ${r.name || 'Unnamed Resource'}
                      </a>
                      <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                        <span class="inline-flex items-center gap-1">
                          <i class="fas fa-tag text-xs"></i>
                          ${r.type || 'Resource'}
                        </span>
                        <span class="text-gray-400">•</span>
                        <span class="inline-flex items-center gap-1">
                          <i class="fas fa-language text-xs"></i>
                          ${r.language || 'N/A'}
                        </span>
                      </div>
                    </div>
                  `,
            )
            .join('')}
            </div>
          `,
      )
      .join('')}
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', accordion);
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
  if (!file) return;

  currentFileIndex = currentFiles.findIndex((f) => f.name === file.name);

  if (file.previewLink) {
    document.getElementById('modalTitle').textContent = file.name;
    document.getElementById('fileViewer').src = file.previewLink;
    document.getElementById('fileModal').classList.add('active');
    updateBodyScrollLock();
    updateSwiperButtons();
  } else {
    window.open(file.link, '_blank');
  }
};

const downloadFile = (downloadLink, fileName) => {
  const a = document.createElement('a');
  a.href = downloadLink;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const closeModal = () => {
  document.getElementById('fileModal').classList.remove('active');
  document.getElementById('fileViewer').src = '';
  currentFileIndex = -1;
  updateBodyScrollLock();
};

const closeYearModal = () => {
  document.getElementById('yearModal').classList.remove('active');
  updateBodyScrollLock();
  currentPath = [];
  currentYear = '';
};

const toggleFullScreen = () => {
  const modal = document.getElementById('fileModal');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const icon = fullscreenBtn.querySelector('i');

  modal.classList.toggle('fullscreen');

  if (modal.classList.contains('fullscreen')) {
    icon.classList.remove('fa-expand');
    icon.classList.add('fa-compress');
    fullscreenBtn.title = 'Exit full screen';
  } else {
    icon.classList.remove('fa-compress');
    icon.classList.add('fa-expand');
    fullscreenBtn.title = 'Enter full screen';
  }
};

const updateBodyScrollLock = () => {
  const anyActiveModal = document.querySelectorAll('.modal.active').length > 0;
  if (anyActiveModal) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
};

const showPrevFile = () => {
  if (currentFileIndex > 0) {
    currentFileIndex--;
    openFile(currentFiles[currentFileIndex]);
  }
};

const showNextFile = () => {
  if (currentFileIndex < currentFiles.length - 1) {
    currentFileIndex++;
    openFile(currentFiles[currentFileIndex]);
  }
};

const updateSwiperButtons = () => {
  const prevBtn = document.getElementById('prevFileBtn');
  const nextBtn = document.getElementById('nextFileBtn');

  if (currentFileIndex <= 0) {
    prevBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'block';
  }

  if (currentFileIndex >= currentFiles.length - 1) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'block';
  }
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

// ===============================
// Contact Form
// ===============================
const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzmfa0TDm_Ec9CtZSpSvIv7knXucmv_67xyh6APXDnsdMnb-0NukESFq58ZbVlm0GqEcg/exec';

const initContactForm = () => {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const loading = document.getElementById('loading');
  const responseMessage = document.getElementById('responseMessage');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      showMessage('All fields required', 'error');
      return;
    }

    submitBtn.disabled = true;
    loading.classList.remove('hidden');
    loading.classList.add('flex');
    responseMessage.classList.add('hidden');

    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ name, email, message }),
      });

      showMessage('Message sent successfully!', 'success');
      form.reset();
    } catch (error) {
      showMessage('Failed to send message. Please try again.', 'error');
      console.error('Error:', error);
    } finally {
      submitBtn.disabled = false;
      loading.classList.add('hidden');
      loading.classList.remove('flex');
    }
  });

  const showMessage = (text, type) => {
    responseMessage.textContent = text;
    responseMessage.classList.remove('hidden');

    if (type === 'success') {
      responseMessage.className =
        'p-2.5 rounded mt-2.5 bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800';
      setTimeout(() => {
        responseMessage.classList.add('hidden');
      }, 5000);
    } else {
      responseMessage.className =
        'p-2.5 rounded mt-2.5 bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
    }
  };
};

// ===============================
// DHIKR SYSTEM
// ===============================
const dhikr = [
  'أستغفر اللّه',
  'سبحان اللّه',
  'الحمد للّه',
  'لا إله إلا اللّه',
  'اللّه أكبر',
  'سبحان اللّه وبحمده',
  'سبحان اللّه العظيم',
  'لا حول ولا قوة إلا باللّه',
  'اللّهم صل وسلم على نبينا محمد',
  'لا إله إلا أنت سبحانك إني كنت من الظالمين',
  'ربي اغفر لي ولوالدي وللمؤمنين',
  'اللّه أكبر كبيرا',
  'سبحان الله بكرة واصيلا',
  'الحمد لله رب العالمين',
  'أستغفر الله وأتوب إليه',
  'إنّا لله وإنّا إليه راجعون',
  'اللّهُمَّ إني أسألك الجنة',
  'اللّهُمَّ إني أعوذ بك من النار',
  'سبحانك اللهم وبحمدك',
  'اللهم إني أسألك علمًا نافعًا',
  'اللهم إني أسألك الهدى و التقى و العفاف و الغنى',
  '3 x اعوذ بكلمات الله التامات من شر ما خلق',
  'اللهم لاسهل إلا ماجعلته سهلا وأنت تجعل الحزن إذا شئت سهلا',
  'اللهم اغفر لي ذنبي كله دقه وجله وأوله وآخره وعلانيته وسره',
  'اللهم اني اعوذ بك من الهم والحزن',
];

const box = document.getElementById('dhikrBox');
const text = document.getElementById('dhikrText');

function showRandomDhikr() {
  const random = dhikr[Math.floor(Math.random() * dhikr.length)];
  text.textContent = random;
  box.style.display = 'block';
  setTimeout(() => (box.style.opacity = 1), 10);
}

function hideDhikr() {
  box.style.opacity = 0;
  setTimeout(() => {
    box.style.display = 'none';
  }, 700);
}

box.addEventListener('click', hideDhikr);

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  showRandomDhikr();
});

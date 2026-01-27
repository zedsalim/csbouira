// ===============================
// FILE UPLOAD SYSTEM
// ===============================
const GAS_UPLOAD_URL =
  'https://script.google.com/macros/s/AKfycbxMikLNPWYBEWjYJ7FSLJAHV_dZ_5E6aSGarqtm7kubMsjzXFHXnW4s-eEM2RtFOaF3/exec';

let selectedFiles = [];
let isUploading = false;

// Open upload modal
const openUploadModal = () => {
  document.getElementById('uploadModal').classList.add('active');
  updateBodyScrollLock();
};

// Close upload modal
const closeUploadModal = () => {
  document.getElementById('uploadModal').classList.remove('active');
  updateBodyScrollLock();
  // Reset form
  document.getElementById('uploadForm').reset();
  selectedFiles = [];
  displayFilesList();
  // Clear progress
  const progressContainer = document.getElementById('uploadProgress');
  if (progressContainer) {
    progressContainer.innerHTML = '';
    progressContainer.classList.add('hidden');
  }
};

// Initialize upload form
const initUploadForm = () => {
  const form = document.getElementById('uploadForm');
  const submitBtn = document.getElementById('submitBtn');
  const loading = document.getElementById('uploadLoading');
  const responseMessage = document.getElementById('uploadResponseMessage');
  const filesInput = document.getElementById('files');
  const filesList = document.getElementById('filesList');

  if (!form) return;

  // Handle file selection
  filesInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    selectedFiles = files;
    displayFilesList();
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isUploading) {
      return;
    }

    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('uploadEmail').value.trim();
    const fileType = document.getElementById('fileType').value;
    const moduleName = document.getElementById('moduleName').value.trim();
    const grade = document.getElementById('grade').value;
    const semester = document.getElementById('semester').value;
    const files = selectedFiles;

    // Validate
    if (
      !fullName ||
      !email ||
      !fileType ||
      !moduleName ||
      !grade ||
      !semester ||
      files.length === 0
    ) {
      showUploadMessage(
        'Please fill in all fields and select at least one file',
        'error',
      );
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter((file) => file.size > 25 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showUploadMessage(
        `The following files exceed 25MB limit: ${oversizedFiles.map((f) => f.name).join(', ')}`,
        'error',
      );
      return;
    }

    // Set flag and disable the button
    isUploading = true;
    submitBtn.disabled = true;
    loading.classList.remove('hidden');
    loading.classList.add('flex');
    responseMessage.classList.add('hidden');

    // Create and show progress tracker
    const progressContainer = document.getElementById('uploadProgress');
    progressContainer.innerHTML = '';
    progressContainer.classList.remove('hidden');

    // Scroll to progress section
    setTimeout(() => {
      progressContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const progressHTML = `
      <h4 class="font-semibold mb-3 text-sm">Upload Progress:</h4>
      ${files
        .map(
          (file, index) => `
        <div class="progress-item mb-3 p-3 rounded-md" id="progress-${index}" style="background: var(--bg-secondary-light); border: 1px solid var(--border-light);">
          <div class="text-sm font-medium mb-2 truncate" title="${file.name}">${file.name}</div>
          <div class="w-full h-5 rounded-full overflow-hidden" style="background: var(--border-light);">
            <div class="h-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold transition-all duration-300" id="progress-bar-${index}" style="width: 0%">0%</div>
          </div>
          <div class="progress-status text-xs mt-1" id="status-${index}" style="color: var(--text-secondary-light);">Waiting...</div>
        </div>
      `,
        )
        .join('')}
    `;
    progressContainer.innerHTML = progressHTML;

    let successCount = 0;
    let failCount = 0;
    const uploadedFiles = [];

    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      updateUploadProgress(i, 10, 'Reading file...');

      try {
        // Read file as base64
        const base64Data = await readFileAsBase64(file);

        updateUploadProgress(i, 30, 'Preparing upload...');

        // Prepare payload
        const payload = {
          fullName: fullName,
          email: email,
          fileType: fileType,
          moduleName: moduleName,
          grade: grade,
          semester: semester,
          fileName: file.name,
          fileData: base64Data,
          mimeType: file.type,
          sendEmail: false,
        };

        updateUploadProgress(i, 50, 'Uploading to server...');

        // Upload file
        const response = await fetch(GAS_UPLOAD_URL, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        updateUploadProgress(i, 80, 'Processing response...');

        const result = await response.json();

        if (result.status === 'success') {
          updateUploadProgress(i, 100, '✓ Upload successful', true);
          successCount++;
          uploadedFiles.push({
            name: result.fileName || file.name,
            url: result.fileUrl || '',
          });
        } else {
          updateUploadProgress(i, 100, '✗ ' + result.message, false);
          failCount++;
        }
      } catch (error) {
        updateUploadProgress(i, 100, '✗ Upload failed', false);
        failCount++;
      }

      // Small delay between uploads
      if (i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Send summary email
    if (successCount > 0) {
      try {
        await sendSummaryEmail(
          fullName,
          email,
          fileType,
          moduleName,
          grade,
          semester,
          uploadedFiles,
        );
      } catch (error) {
        // Silent error
      }
    }

    // Re-enable button and reset flag
    isUploading = false;
    submitBtn.disabled = false;
    loading.classList.add('hidden');
    loading.classList.remove('flex');

    if (successCount === files.length) {
      showUploadMessage(
        `✓ All ${successCount} file(s) uploaded successfully!`,
        'success',
      );
      form.reset();
      selectedFiles = [];
      filesList.classList.add('hidden');
      filesList.innerHTML = '';

      // Hide progress after 5 seconds
      setTimeout(() => {
        progressContainer.classList.add('hidden');
      }, 5000);
    } else if (successCount > 0) {
      showUploadMessage(
        `⚠ ${successCount} file(s) uploaded, ${failCount} failed`,
        'error',
      );
    } else {
      showUploadMessage('✗ All uploads failed. Please try again.', 'error');
    }
  });
};

// Display selected files list
const displayFilesList = () => {
  const filesList = document.getElementById('filesList');

  if (selectedFiles.length === 0) {
    filesList.classList.add('hidden');
    filesList.innerHTML = '';
    return;
  }

  filesList.classList.remove('hidden');
  filesList.innerHTML = `
    <div class="p-3 rounded-md" style="background: var(--bg-secondary-light); border: 1px solid var(--border-light);">
      <div class="font-semibold text-sm mb-2">Selected Files (${selectedFiles.length}):</div>
      <div class="space-y-2">
        ${selectedFiles
          .map(
            (file, index) => `
          <div class="flex items-center justify-between p-2 rounded text-sm" style="background: var(--bg-light); border: 1px solid var(--border-light);">
            <span class="flex-1 truncate" title="${file.name}">${file.name}</span>
            <span class="text-xs mx-2" style="color: var(--text-secondary-light);">${formatFileSize(file.size)}</span>
            <button type="button" onclick="removeFile(${index})" class="text-red-500 hover:text-red-700 font-bold">✕</button>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  `;
};

// Remove file from selection
const removeFile = (index) => {
  selectedFiles.splice(index, 1);
  displayFilesList();

  const dt = new DataTransfer();
  selectedFiles.forEach((file) => dt.items.add(file));
  document.getElementById('files').files = dt.files;
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Update progress bar
const updateUploadProgress = (index, percent, status, isSuccess = null) => {
  const progressBar = document.getElementById(`progress-bar-${index}`);
  const statusEl = document.getElementById(`status-${index}`);

  if (progressBar) {
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
  }

  if (statusEl) {
    statusEl.textContent = status;
    if (isSuccess === true) {
      statusEl.style.color = '#10b981'; // Green
    } else if (isSuccess === false) {
      statusEl.style.color = '#ef4444'; // Red
    }
  }
};

// Send summary email
const sendSummaryEmail = async (
  fullName,
  email,
  fileType,
  moduleName,
  grade,
  semester,
  uploadedFiles,
) => {
  const payload = {
    fullName: fullName,
    email: email,
    fileType: fileType,
    moduleName: moduleName,
    grade: grade,
    semester: semester,
    fileName: `${uploadedFiles.length} file(s) uploaded`,
    fileData: 'summary-email-trigger',
    mimeType: 'text/plain',
    sendEmail: true,
    uploadedFiles: uploadedFiles,
  };

  try {
    await fetch(GAS_UPLOAD_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Silent error
  }
};

// Read file as base64
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Show upload message
const showUploadMessage = (text, type) => {
  const responseMessage = document.getElementById('uploadResponseMessage');
  responseMessage.textContent = text;
  responseMessage.classList.remove(
    'hidden',
    'bg-green-100',
    'text-green-800',
    'border-green-200',
    'bg-red-100',
    'text-red-800',
    'border-red-200',
  );
  responseMessage.classList.remove(
    'dark:bg-green-900',
    'dark:text-green-200',
    'dark:border-green-800',
    'dark:bg-red-900',
    'dark:text-red-200',
    'dark:border-red-800',
  );

  if (type === 'success') {
    responseMessage.classList.add(
      'bg-green-100',
      'text-green-800',
      'border',
      'border-green-200',
      'dark:bg-green-900',
      'dark:text-green-200',
      'dark:border-green-800',
    );
    setTimeout(() => {
      responseMessage.classList.add('hidden');
    }, 5000);
  } else {
    responseMessage.classList.add(
      'bg-red-100',
      'text-red-800',
      'border',
      'border-red-200',
      'dark:bg-red-900',
      'dark:text-red-200',
      'dark:border-red-800',
    );
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initUploadForm();
});

// ===============================
// Fake Loader
// ===============================

const loader = document.createElement('div');
loader.id = 'fakeLoader';
loader.className =
  'fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-blue-500 backdrop-blur-sm opacity-100 transition-opacity duration-500';
loader.innerHTML = `
  <div class="w-16 h-16 border-4 border-blue-300 border-t-white rounded-full animate-spin"></div>
  <p class="mt-4 text-white text-lg font-medium tracking-wide">Loading...</p>
`;
document.body.prepend(loader);

window.showLoader = () => {
  loader.style.display = 'flex';
  requestAnimationFrame(() => {
    loader.style.opacity = '1';
  });
};

window.hideLoader = () => {
  loader.style.opacity = '0';
  setTimeout(() => {
    loader.style.display = 'none';
  }, 500);
};

window.addEventListener('DOMContentLoaded', () => {
  showLoader();
  setTimeout(hideLoader, 1500);
});

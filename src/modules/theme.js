import { CONFIG } from '../config.js';

// ── Theme persistence ──────────────────────────────────────────────────────
const htmlEl = document.documentElement;
// Dark is the default look; a stored choice still wins.
const savedTheme = localStorage.getItem('theme') || CONFIG.theme.dark;

htmlEl.setAttribute('data-theme', savedTheme);

function syncThemeToggles() {
  const isDark = htmlEl.getAttribute('data-theme') === CONFIG.theme.dark;
  document.querySelectorAll('[data-theme="toggle"]').forEach((cb) => {
    cb.checked = isDark;
  });
}

export function initTheme() {
  const toggle = document.querySelector('[data-theme="toggle"]');
  if (!toggle) return;

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
}

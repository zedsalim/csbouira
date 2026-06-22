import { CONFIG } from '../config.js';

export function initDhikr() {
  const box = document.getElementById('dhikrBox');
  const textEl = document.getElementById('dhikrText');
  if (!box || !textEl) return;

  const dhikrList = CONFIG.dhikr.list;
  const random = dhikrList[Math.floor(Math.random() * dhikrList.length)];
  textEl.textContent = random;
  box.style.display = 'block';
  setTimeout(() => (box.style.opacity = '1'), 10);

  box.addEventListener('click', () => {
    box.style.opacity = '0';
    setTimeout(() => {
      box.style.display = 'none';
    }, 700);
  });
}

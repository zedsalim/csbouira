export function initLoader() {
  const el = document.querySelector('[data-module="loader"]')
  if (!el) return

  // Show on init, hide after delay
  el.classList.remove('hidden')
  setTimeout(() => {
    el.classList.add('opacity-0')
    setTimeout(() => el.classList.add('hidden'), 500)
  }, 1500)
}

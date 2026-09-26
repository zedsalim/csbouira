// canvas-confetti is only needed on upload success, so load it on demand
// instead of pulling it into the initial bundle.

// Resolve the brand tokens so the burst matches the active theme instead of
// relying on a fixed set of library defaults.
function brandColors() {
  const read = (name, fallback) => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  };
  return [
    read('--color-primary', '#009bd6'),
    read('--color-secondary', '#0369a1'),
    read('--color-accent', '#0ea5e9'),
    read('--color-success', '#22c55e'),
  ];
}

export async function triggerCelebration() {
  const { default: confetti } = await import('canvas-confetti');
  const colors = brandColors();

  confetti({
    particleCount: 140,
    spread: 90,
    startVelocity: 42,
    origin: { y: 0.6 },
    colors,
    disableForReducedMotion: true,
  });

  // A second, offset burst gives the moment some depth.
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 120,
      startVelocity: 28,
      ticks: 180,
      origin: { x: 0.18, y: 0.72 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 60,
      spread: 120,
      startVelocity: 28,
      ticks: 180,
      origin: { x: 0.82, y: 0.72 },
      colors,
      disableForReducedMotion: true,
    });
  }, 220);
}

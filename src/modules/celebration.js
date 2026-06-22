// canvas-confetti is only needed on upload success, so load it on demand
// instead of pulling it into the initial bundle.
export async function triggerCelebration() {
  const { default: confetti } = await import('canvas-confetti')
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
  })
}

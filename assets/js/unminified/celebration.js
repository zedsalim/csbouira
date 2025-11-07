// ===============================
// CSBouira Update Modal
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('updateModal');
  const closeButtons = [
    document.getElementById('closeUpdateModal'),
    document.getElementById('celebrateCloseBtn'),
  ];
  const confettiCanvas = document.getElementById('confettiCanvas');
  const ctx = confettiCanvas.getContext('2d');

  const seenModal = localStorage.getItem('csb_update_seen');

  setTimeout(() => {
    if (!seenModal) {
      modal.classList.remove('hidden');
      startConfetti();

      setTimeout(() => localStorage.setItem('csb_update_seen', 'true'), 2000);
    }
  }, 1600);

  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modal.classList.add('hidden');
      stopConfetti();
    });
  });

  let confettiPieces = [];
  let confettiInterval;

  function startConfetti() {
    resizeCanvas();
    confettiPieces = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      r: Math.random() * 6 + 2,
      d: Math.random() * 50,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.random() * 10 - 10,
    }));

    confettiInterval = setInterval(drawConfetti, 20);
    window.addEventListener('resize', resizeCanvas);
  }

  function stopConfetti() {
    clearInterval(confettiInterval);
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  function resizeCanvas() {
    confettiCanvas.width = modal.clientWidth;
    confettiCanvas.height = modal.clientHeight;
  }

  function drawConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiPieces.forEach((p, i) => {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r);
      p.y += Math.cos(p.d) + 1 + p.r / 2;
      p.x += Math.sin(p.d);

      if (p.y > confettiCanvas.height) {
        confettiPieces[i] = {
          ...p,
          x: Math.random() * confettiCanvas.width,
          y: -10,
        };
      }
    });
  }
});

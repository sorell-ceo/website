document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('scratch-canvas');
  const ctx = canvas.getContext('2d');
  const revealBtn = document.getElementById('reveal-site-btn');
  const scratchStage = document.getElementById('scratch-stage');
  const mainSite = document.getElementById('main-site');

  canvas.width = 300; canvas.height = 360;

  // The Blue Razorpay-style overlay
  ctx.fillStyle = '#2c52ed'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2);

  let isDragging = false;
  let isScratched = false;

  function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x, y };
  }

  function scratch(e) {
      if (!isDragging || isScratched) return;
      e.preventDefault(); 
      const pos = getPos(e);
      
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
      ctx.fill();

      checkCompletion();
  }

  canvas.addEventListener('mousedown', () => isDragging = true);
  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mousemove', scratch);
  canvas.addEventListener('touchstart', (e) => { isDragging = true; scratch(e); }, { passive: false });
  canvas.addEventListener('touchend', () => isDragging = false);
  canvas.addEventListener('touchmove', scratch, { passive: false });

  function checkCompletion() {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] === 0) clear++; }
      
      if ((clear / (pixels.length / 4)) * 100 > 40 && !isScratched) {
          isScratched = true;
          canvas.style.transition = 'opacity 0.4s';
          canvas.style.opacity = '0';
          revealBtn.style.opacity = '1';
          revealBtn.style.pointerEvents = 'auto';
          setTimeout(() => canvas.remove(), 400);
      }
  }

  // --- THE LAZY LOAD TRANSITION ---
  revealBtn.addEventListener('click', () => {
      scratchStage.style.opacity = '0';
      
      setTimeout(() => {
          scratchStage.remove(); // Delete the scratch stage completely
          mainSite.classList.remove('hidden'); // Unhide the main site
          
          // Adding this class TRIGGERS the heavy image download!
          mainSite.classList.add('active'); 
      }, 500);
  });
});

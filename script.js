document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('scratch-canvas');
  const ctx = canvas.getContext('2d');
  const revealBtn = document.getElementById('reveal-site-btn');
  const scratchStage = document.getElementById('scratch-stage');
  const mainSite = document.getElementById('main-site');

  canvas.width = 320; canvas.height = 400;

  // 1. GENERATE GRITTY TEXTURE
  ctx.fillStyle = '#1c1c1c'; // Dark matte base
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add programmatic noise/grit
  for (let i = 0; i < 8000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 1.5);
  }

  // Draw the heavy GenZ Font on top
  ctx.font = 'bold 24px Space Grotesk, sans-serif';
  ctx.fillStyle = '#888888';
  ctx.textAlign = 'center';
  ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2);

  let isDrawing = false;
  let isScratched = false;
  let lastPoint = null;
  let completionPercentage = 0;

  function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x, y };
  }

  // 2. FLUID SCRATCH PHYSICS
  function scratch(e) {
      if (!isDrawing || isScratched) return;
      e.preventDefault(); 
      const pos = getPos(e);
      
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 45; // Thick eraser
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round'; // Makes lines fluid instead of stamped circles

      ctx.beginPath();
      if (lastPoint) {
          ctx.moveTo(lastPoint.x, lastPoint.y);
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastPoint = pos;
      calculateProgress();
  }

  function calculateProgress() {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] === 0) clear++; }
      completionPercentage = (clear / (pixels.length / 4)) * 100;
  }

  // 3. SMART REVEAL LOGIC (User Agency)
  function handleEnd() {
      isDrawing = false;
      lastPoint = null;

      // Only reveal if they hit the threshold AND lifted their finger
      if (completionPercentage > 45 && !isScratched) {
          isScratched = true;
          canvas.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          canvas.style.opacity = '0';
          canvas.style.transform = 'scale(1.05)';
          
          revealBtn.style.opacity = '1';
          revealBtn.style.pointerEvents = 'auto';
          
          setTimeout(() => canvas.remove(), 600);
      }
  }

  // Event Listeners for Mobile & Desktop
  canvas.addEventListener('mousedown', (e) => { isDrawing = true; lastPoint = null; scratch(e); });
  canvas.addEventListener('mousemove', scratch);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', (e) => { isDrawing = true; lastPoint = null; scratch(e); }, { passive: false });
  canvas.addEventListener('touchmove', scratch, { passive: false });
  window.addEventListener('touchend', handleEnd);

  // 4. TRANSITION TO MAIN SITE
  revealBtn.addEventListener('click', () => {
      scratchStage.style.opacity = '0';
      
      setTimeout(() => {
          scratchStage.remove(); 
          document.body.classList.remove('locked'); // Unlocks infinite scroll
          mainSite.classList.remove('hidden'); 
          mainSite.classList.add('active'); // Triggers lazy-load of Canva image
      }, 500);
  });

  // 5. NAV & CTA CLICK LOGIC
  const triggers = document.querySelectorAll('.trigger-quiz');
  triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
          console.log("Quiz trigger clicked! Route to Class 10/11/12 logic here.");
          // We will build the quiz slide-in UI here next.
      });
  });
});

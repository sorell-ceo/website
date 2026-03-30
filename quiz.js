document.addEventListener('DOMContentLoaded', () => {
    const questionStack = document.getElementById('question-stack');
    const finalContainer = document.getElementById('final-container');
    const swipeInstructions = document.getElementById('swipe-instructions');
    const viewAuraBtn = document.getElementById('view-aura-btn');
    const leadFormOverlay = document.getElementById('lead-form-overlay');
    const stackContainer = document.getElementById('question-stack-container');

    const questions = [
        { placeholder: "attendance", question: "Do you want to bunk classes in college?" },
        { placeholder: "social life", question: "You want to increase your friend circle?" },
        { placeholder: "dating", question: "You wanna have relationships in college?" },
        { placeholder: "academics", question: "Will you actually study in college?" },
        { placeholder: "stream", question: "Which stream did you have in 12th?" }
    ];

    // Stack rotations — one per position behind the top card
    const STACK_ROTATIONS = [0, 5, 10, 15, 20];

    let currentStep = 0;
    let cards = [];
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let activeCard = null;

    // ─── BUILD CARDS ONCE, NEVER REBUILD ───────────────────────────────────────
    function initCards() {
        // Build all cards up front — lowest z-index first in DOM
        for (let i = questions.length - 1; i >= 0; i--) {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.id = `card-${i}`;
            card.innerHTML = `
                <div class="placeholder-badge">${questions[i].placeholder}</div>
                <div class="question">${questions[i].question}</div>
            `;
            // Promote every card to its own GPU layer immediately
            card.style.willChange = 'transform, opacity';
            questionStack.appendChild(card);
            cards.unshift(card);
        }
        layoutStack(false); // No animation on first render
    }

    // ─── POSITION ALL CARDS IN STACK ───────────────────────────────────────────
    function layoutStack(animate) {
        cards.forEach((card, index) => {
            const stackPos = index - currentStep;

            // Already swiped — hide it
            if (stackPos < 0) {
                gsap.set(card, { display: 'none' });
                return;
            }

            const rotation = STACK_ROTATIONS[stackPos] ?? STACK_ROTATIONS[STACK_ROTATIONS.length - 1];
            const zIndex   = 10 - stackPos;
            const opacity  = 1; // Always fully opaque

            if (!animate || stackPos === 0) {
                // Instant set — no tween — for top card after swipe
                gsap.set(card, {
                    display: '',
                    x: 0,
                    y: 0,
                    rotation,
                    opacity,
                    zIndex,
                });
            } else {
                // Smooth settle for background cards
                gsap.to(card, {
                    x: 0,
                    y: 0,
                    rotation,
                    opacity,
                    zIndex,
                    duration: 0.35,
                    ease: 'power2.out',
                });
            }
        });
    }

    // ─── DRAG HANDLERS ─────────────────────────────────────────────────────────
    function onDragStart(e) {
        if (currentStep >= questions.length) return;

        // Only allow dragging the top card
        const targetCard = e.target.closest('.quiz-card');
        if (!targetCard || targetCard.id !== `card-${currentStep}`) return;

        // Prevent page scroll while swiping
        e.preventDefault();

        activeCard = targetCard;
        isDragging = true;

        const pos = getPos(e);
        startX = pos.x;
        startY = pos.y;
        currentX = 0;
        currentY = 0;

        // Kill any running tween so card sticks to finger instantly
        gsap.killTweensOf(activeCard);
    }

    function onDragMove(e) {
        if (!isDragging || !activeCard) return;
        e.preventDefault();

        const pos = getPos(e);
        currentX = pos.x - startX;
        currentY = pos.y - startY;

        // Subtle tilt — feels physical
        const rotation = currentX * 0.04;

        // gsap.set = zero cost, no tween, purely sets transform on the GPU layer
        gsap.set(activeCard, {
            x: currentX,
            y: currentY,
            rotation,
        });
    }

    function onDragEnd(e) {
        if (!isDragging || !activeCard) return;
        isDragging = false;

        const threshold = window.innerWidth * 0.28;

        if (currentX > threshold) {
            throwCard(activeCard, 1);
        } else if (currentX < -threshold) {
            throwCard(activeCard, -1);
        } else {
            // Snap back
            gsap.to(activeCard, {
                x: 0,
                y: 0,
                rotation: STACK_ROTATIONS[0],
                duration: 0.4,
                ease: 'back.out(1.4)',
            });
        }

        activeCard = null;
    }

    // ─── THROW CARD OFF SCREEN ─────────────────────────────────────────────────
    function throwCard(card, direction) {
        const throwX    = window.innerWidth * 1.6 * direction;
        const throwRot  = 30 * direction;

        gsap.to(card, {
            x: throwX,
            y: currentY * 0.5,
            rotation: throwRot,
            opacity: 0,
            duration: 0.38,
            ease: 'power2.in',
            onComplete: () => {
                currentStep++;
                if (currentStep >= questions.length) {
                    questionStack.style.display = 'none';
                    swipeInstructions.classList.add('hidden');
                    finalContainer.classList.remove('hidden');
                } else {
                    // Settle remaining cards into new positions
                    layoutStack(true);
                }
            },
        });
    }

    // ─── UTILITY ───────────────────────────────────────────────────────────────
    function getPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    // ─── ATTACH EVENTS ─────────────────────────────────────────────────────────
    function attachEvents() {
        // Touch — passive: false so we can call preventDefault and stop scroll
        stackContainer.addEventListener('touchstart',  onDragStart, { passive: false });
        document.addEventListener(    'touchmove',   onDragMove,  { passive: false });
        document.addEventListener(    'touchend',    onDragEnd);

        // Mouse
        stackContainer.addEventListener('mousedown', onDragStart);
        document.addEventListener(     'mousemove', onDragMove);
        document.addEventListener(     'mouseup',   onDragEnd);
    }

    // ─── LEAD FORM ─────────────────────────────────────────────────────────────
    viewAuraBtn.addEventListener('click', () => {
        leadFormOverlay.classList.add('show');
    });

    leadFormOverlay.addEventListener('click', (e) => {
        if (e.target === leadFormOverlay) leadFormOverlay.classList.remove('show');
    });

    // ─── BOOT ──────────────────────────────────────────────────────────────────
    initCards();
    attachEvents();
});

function handleFormSubmit(event) {
    event.preventDefault();
    const userName  = document.getElementById('user-name').value;
    const userPhone = document.getElementById('user-phone').value;
    alert(`Captured — Name: ${userName}, Phone: ${userPhone}`);
}

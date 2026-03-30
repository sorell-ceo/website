document.addEventListener('DOMContentLoaded', () => {

    /* ═══════════════════════════════════════════════════════════
       QUESTIONS — add as many as you want here.
       Each object needs: placeholder (badge text) + question.
       The CSS card colors auto-assign by nth-child position.
       To add card 6+: add the question here AND add the
       CSS block + CSS variables in quiz.css.
    ═══════════════════════════════════════════════════════════ */
    const questions = [
        { placeholder: "attendance", question: "Do you want to bunk classes in college?" },
        { placeholder: "social life", question: "You want to increase your friend circle?" },
        { placeholder: "dating",      question: "You wanna have relationships in college?" },
        { placeholder: "academics",   question: "Will you actually study in college?" },
        { placeholder: "stream",      question: "Which stream did you have in 12th?" },
        // ── Add more cards here ──
        // { placeholder: "hostel", question: "Would you prefer living in a hostel?" },
        // { placeholder: "sport",  question: "Are you into college sports?" },
    ];

    /* ═══════════════════════════════════════════════════════════
       STACK ROTATIONS — one value per depth position.
       Index 0 = top card (always 0). Index 1 = one behind, etc.
       Add more values if you add more cards.
    ═══════════════════════════════════════════════════════════ */
    const STACK_ROTATIONS = [0, 5, 10, 15, 20, 24, 27];

    // ── DOM refs ──────────────────────────────────────────────
    const questionStack   = document.getElementById('question-stack');
    const finalContainer  = document.getElementById('final-container');
    const swipeInstructions = document.getElementById('swipe-instructions');
    const viewAuraBtn     = document.getElementById('view-aura-btn');
    const leadFormOverlay = document.getElementById('lead-form-overlay');
    const stackContainer  = document.getElementById('question-stack-container');
    const iconLeft        = document.querySelector('.swipe-icon-left');
    const iconRight       = document.querySelector('.swipe-icon-right');

    // ── State ─────────────────────────────────────────────────
    let currentStep = 0;
    let cards       = [];
    let isDragging  = false;
    let startX      = 0;
    let startY      = 0;
    let currentX    = 0;
    let currentY    = 0;
    let activeCard  = null;
    let iconAnim    = null; // holds the GSAP timeline for icons

    /* ═══════════════════════════════════════════════════════════
       BUILD CARDS — called once, never rebuilt
    ═══════════════════════════════════════════════════════════ */
    function initCards() {
        for (let i = questions.length - 1; i >= 0; i--) {
            const card = document.createElement('div');
            card.className  = 'quiz-card';
            card.id         = `card-${i}`;
            card.innerHTML  = `
                <div class="placeholder-badge">${questions[i].placeholder}</div>
                <div class="question">${questions[i].question}</div>
            `;
            card.style.willChange = 'transform, opacity';
            questionStack.appendChild(card);
            cards.unshift(card);
        }
        layoutStack(false);
    }

    /* ═══════════════════════════════════════════════════════════
       LAYOUT STACK — repositions all cards via GSAP
       animate = false → instant (gsap.set), true → tween
    ═══════════════════════════════════════════════════════════ */
    function layoutStack(animate) {
        cards.forEach((card, index) => {
            const stackPos = index - currentStep;

            if (stackPos < 0) {
                gsap.set(card, { display: 'none' });
                return;
            }

            const rotation = STACK_ROTATIONS[stackPos] ?? STACK_ROTATIONS[STACK_ROTATIONS.length - 1];
            const zIndex   = 10 - stackPos;

            if (!animate || stackPos === 0) {
                gsap.set(card, { display: '', x: 0, y: 0, rotation, opacity: 1, zIndex });
                // also reset tint
                gsap.set(card.querySelector('.tint') || card, {});
                resetTint(card);
            } else {
                gsap.to(card, {
                    x: 0, y: 0, rotation, opacity: 1, zIndex,
                    duration: 0.35, ease: 'power2.out',
                });
                resetTint(card);
            }
        });
    }

    /* ═══════════════════════════════════════════════════════════
       TINT HELPERS — red for left, green for right
       Uses the card's ::after pseudo via a real div overlay
       (pseudo-elements can't be targeted by GSAP directly)
    ═══════════════════════════════════════════════════════════ */
    function ensureTintDiv(card) {
        let tint = card.querySelector('.tint-overlay');
        if (!tint) {
            tint = document.createElement('div');
            tint.className = 'tint-overlay';
            tint.style.cssText = `
                position:absolute; inset:0; border-radius:inherit;
                opacity:0; pointer-events:none; z-index:1;
            `;
            card.appendChild(tint);
        }
        return tint;
    }

    function applyTint(card, direction, dragRatio) {
        // direction: 1 = right (green), -1 = left (red)
        const tint    = ensureTintDiv(card);
        const color   = direction > 0 ? '#22c55e' : '#ef4444';
        const opacity = Math.min(dragRatio * 0.55, 0.55); // max 55% tint
        gsap.set(tint, { backgroundColor: color, opacity });
    }

    function resetTint(card) {
        const tint = card.querySelector('.tint-overlay');
        if (tint) gsap.set(tint, { opacity: 0 });
    }

    /* ═══════════════════════════════════════════════════════════
       DRAG HANDLERS — untouched from working version
    ═══════════════════════════════════════════════════════════ */
    function onDragStart(e) {
        if (currentStep >= questions.length) return;
        const targetCard = e.target.closest('.quiz-card');
        if (!targetCard || targetCard.id !== `card-${currentStep}`) return;

        e.preventDefault();
        activeCard = targetCard;
        isDragging = true;

        const pos = getPos(e);
        startX   = pos.x;
        startY   = pos.y;
        currentX = 0;
        currentY = 0;

        gsap.killTweensOf(activeCard);
    }

    function onDragMove(e) {
        if (!isDragging || !activeCard) return;
        e.preventDefault();

        const pos = getPos(e);
        currentX  = pos.x - startX;
        currentY  = pos.y - startY;
        const rotation  = currentX * 0.04;

        gsap.set(activeCard, { x: currentX, y: currentY, rotation });

        // Tint: starts showing after 40px drag
        const dragRatio = Math.max(0, (Math.abs(currentX) - 40) / (window.innerWidth * 0.3));
        if (currentX > 40)       applyTint(activeCard,  1, dragRatio);
        else if (currentX < -40) applyTint(activeCard, -1, dragRatio);
        else                     resetTint(activeCard);
    }

    function onDragEnd(e) {
        if (!isDragging || !activeCard) return;
        isDragging = false;

        const threshold = window.innerWidth * 0.28;

        if      (currentX >  threshold) throwCard(activeCard,  1);
        else if (currentX < -threshold) throwCard(activeCard, -1);
        else {
            resetTint(activeCard);
            gsap.to(activeCard, {
                x: 0, y: 0, rotation: STACK_ROTATIONS[0],
                duration: 0.4, ease: 'back.out(1.4)',
            });
        }

        activeCard = null;
    }

    /* ═══════════════════════════════════════════════════════════
       THROW CARD OFF SCREEN
    ═══════════════════════════════════════════════════════════ */
    function throwCard(card, direction) {
        const throwX   = window.innerWidth * 1.6 * direction;
        const throwRot = 30 * direction;

        gsap.to(card, {
            x: throwX, y: currentY * 0.5,
            rotation: throwRot, opacity: 0,
            duration: 0.38, ease: 'power2.in',
            onComplete: () => {
                currentStep++;
                if (currentStep >= questions.length) {
                    questionStack.style.display = 'none';
                    swipeInstructions.classList.add('hidden');
                    finalContainer.classList.remove('hidden');
                    stopIconAnim();
                } else {
                    layoutStack(true);
                }
            },
        });
    }

    /* ═══════════════════════════════════════════════════════════
       ICON ANIMATIONS — left arrow bobs left, right arrow bobs right
       Easing: faster in the outward direction, slower on return
       Uses GSAP timeline with yoyo + repeat
    ═══════════════════════════════════════════════════════════ */
    function startIconAnim() {
        if (iconAnim) return; // already running

        iconAnim = gsap.timeline({ repeat: -1 });

        // Left icon: shoots left fast, returns slow
        iconAnim.to(iconLeft, {
            x: -10,
            duration: 0.28,
            ease: 'power2.in',         // fast outward
        }).to(iconLeft, {
            x: 0,
            duration: 0.55,
            ease: 'power1.out',        // slow return
        }, '+=0.05');

        // Right icon: shoots right fast, returns slow (offset slightly)
        iconAnim.to(iconRight, {
            x: 10,
            duration: 0.28,
            ease: 'power2.in',
        }, '<').to(iconRight, {         // '<' = starts same time as prev
            x: 0,
            duration: 0.55,
            ease: 'power1.out',
        }, '+=0.05');

        // Pause between cycles
        iconAnim.to({}, { duration: 0.6 });
    }

    function stopIconAnim() {
        if (iconAnim) {
            iconAnim.kill();
            iconAnim = null;
        }
        gsap.set([iconLeft, iconRight], { x: 0 });
    }

    /* ═══════════════════════════════════════════════════════════
       UTILITY
    ═══════════════════════════════════════════════════════════ */
    function getPos(e) {
        if (e.touches && e.touches.length > 0)
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }

    /* ═══════════════════════════════════════════════════════════
       EVENT LISTENERS — identical to working version
    ═══════════════════════════════════════════════════════════ */
    function attachEvents() {
        stackContainer.addEventListener('touchstart', onDragStart, { passive: false });
        document.addEventListener('touchmove',        onDragMove,  { passive: false });
        document.addEventListener('touchend',         onDragEnd);

        stackContainer.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove',       onDragMove);
        document.addEventListener('mouseup',         onDragEnd);
    }

    /* ═══════════════════════════════════════════════════════════
       LEAD FORM
    ═══════════════════════════════════════════════════════════ */
    viewAuraBtn.addEventListener('click', () => {
        leadFormOverlay.classList.add('show');
    });
    leadFormOverlay.addEventListener('click', (e) => {
        if (e.target === leadFormOverlay) leadFormOverlay.classList.remove('show');
    });

    /* ═══════════════════════════════════════════════════════════
       BOOT
    ═══════════════════════════════════════════════════════════ */
    initCards();
    attachEvents();
    startIconAnim();
});

function handleFormSubmit(event) {
    event.preventDefault();
    const userName  = document.getElementById('user-name').value;
    const userPhone = document.getElementById('user-phone').value;
    alert(`Captured — Name: ${userName}, Phone: ${userPhone}`);
}

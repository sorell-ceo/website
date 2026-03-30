document.addEventListener('DOMContentLoaded', () => {

    /* ═══════════════════════════════════════════════════════════
       GOOGLE SHEETS PIPELINE — swap in your Apps Script URL
       when ready. Everything else is already wired.
    ═══════════════════════════════════════════════════════════ */
    const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

    async function sendToSheets(payload) {
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // required for Apps Script
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            console.log('[Sorell] Lead sent to Sheets ✓', payload);
        } catch (err) {
            console.error('[Sorell] Sheets pipeline error:', err);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       SCORING SYSTEM
       Axes: social (0–4), ambition (0–2), independence (0–1), energy (0–1)
       Right swipe = YES (+1 on mapped axis), Left = NO (0)
       Special cards (stream Q5, location Q10) write strings, not numbers.

       Archetype mapping is intentionally left open here —
       raw scores go straight to Sheets. You can layer the
       archetype logic on top once patterns emerge from real data.
    ═══════════════════════════════════════════════════════════ */
    const userScore = {
        social:       0,   // Q1 + Q2 + Q3 + Q8
        ambition:     0,   // Q4 + Q9
        independence: 0,   // Q6
        energy:       0,   // Q7
        stream:       '',  // Q5 — set on swipe direction
        currentCity:  '',  // Q10 dropdown
        dreamCity:    '',  // Q10 dropdown
    };

    /* ═══════════════════════════════════════════════════════════
       QUESTIONS
       type: 'swipe'   → standard card, right/left recorded
       type: 'stream'  → swipe, but direction maps to stream string
       type: 'location'→ special card with two dropdowns + confirm btn

       scoreAxis: which key in userScore to increment on right swipe
       rightLabel / leftLabel: shown on tint overlay (optional UX hint)
    ═══════════════════════════════════════════════════════════ */
    const questions = [
        {
            id: 1,
            placeholder: 'attendance',
            question: 'Do you want to bunk classes in college?',
            type: 'swipe',
            scoreAxis: 'social',
        },
        {
            id: 2,
            placeholder: 'social life',
            question: 'You want to increase your friend circle?',
            type: 'swipe',
            scoreAxis: 'social',
        },
        {
            id: 3,
            placeholder: 'dating',
            question: 'You wanna have relationships in college?',
            type: 'swipe',
            scoreAxis: 'social',
        },
        {
            id: 4,
            placeholder: 'academics',
            question: 'Will you actually study in college?',
            type: 'swipe',
            scoreAxis: 'ambition',
        },
        {
            id: 5,
            placeholder: 'stream',
            question: 'Science side or Arts side in 12th?',
            type: 'stream',
            rightStream: 'Science / PCM / PCB',
            leftStream:  'Commerce / Arts / Other',
        },
        {
            id: 6,
            placeholder: 'hostel',
            question: 'Would you move out and live in a hostel?',
            type: 'swipe',
            scoreAxis: 'independence',
        },
        {
            id: 7,
            placeholder: 'fitness',
            question: 'Are you into sports or gym culture?',
            type: 'swipe',
            scoreAxis: 'energy',
        },
        {
            id: 8,
            placeholder: 'nightlife',
            question: 'Do you see yourself at college parties and fests?',
            type: 'swipe',
            scoreAxis: 'social',
        },
        {
            id: 9,
            placeholder: 'ambition',
            question: 'Would you rather launch a startup than do a 9-to-5?',
            type: 'swipe',
            scoreAxis: 'ambition',
        },
        {
            id: 10,
            placeholder: 'location',
            question: 'Where are you, and where do you want to go?',
            type: 'location',
        },
    ];

    /* ═══════════════════════════════════════════════════════════
       STACK ROTATIONS — FLIPPED to LEFT (negative degrees)
       Index 0 = top card (always 0). Index 1 = one behind, etc.
    ═══════════════════════════════════════════════════════════ */
    const STACK_ROTATIONS = [0, -5, -10, -15, -20, -24, -27];

    /* ═══════════════════════════════════════════════════════════
       CITY OPTIONS — edit freely
    ═══════════════════════════════════════════════════════════ */
    const CITIES = [
        'Delhi / NCR',
        'Chandigarh',
        'Mumbai',
        'Pune',
        'Bengaluru',
        'Hyderabad',
        'Jaipur',
        'Lucknow',
        'Kolkata',
        'Dehradun',
        'Shimla / Himachal',
        'Other',
    ];

    // ── DOM refs ──────────────────────────────────────────────
    const questionStack     = document.getElementById('question-stack');
    const finalContainer    = document.getElementById('final-container');
    const swipeInstructions = document.getElementById('swipe-instructions');
    const viewAuraBtn       = document.getElementById('view-aura-btn');
    const leadFormOverlay   = document.getElementById('lead-form-overlay');
    const stackContainer    = document.getElementById('question-stack-container');
    const iconLeft          = document.querySelector('.swipe-icon-left');
    const iconRight         = document.querySelector('.swipe-icon-right');

    // ── State ─────────────────────────────────────────────────
    let currentStep = 0;
    let cards       = [];
    let isDragging  = false;
    let startX      = 0;
    let startY      = 0;
    let currentX    = 0;
    let currentY    = 0;
    let activeCard  = null;
    let iconAnim    = null;

    /* ═══════════════════════════════════════════════════════════
       BUILD CARDS
    ═══════════════════════════════════════════════════════════ */
    function initCards() {
        for (let i = questions.length - 1; i >= 0; i--) {
            const q    = questions[i];
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.id        = `card-${i}`;

            if (q.type === 'location') {
                card.classList.add('location-card');
                card.innerHTML = buildLocationCard(q);
                // location card is NOT draggable — pointer handled separately
            } else {
                card.innerHTML = `
                    <div class="placeholder-badge">${q.placeholder}</div>
                    <div class="question">${q.question}</div>
                `;
            }

            card.style.willChange = 'transform, opacity';
            questionStack.appendChild(card);
            cards.unshift(card);
        }
        layoutStack(false);
        attachLocationEvents();
    }

    /* ─────────────────────────────────────────────────────────
       LOCATION CARD TEMPLATE
    ───────────────────────────────────────────────────────── */
    function buildLocationCard(q) {
        const options = CITIES.map(c => `<option value="${c}">${c}</option>`).join('');
        return `
            <div class="placeholder-badge">${q.placeholder}</div>
            <div class="question">${q.question}</div>
            <div class="location-selectors">
                <div class="loc-group">
                    <label class="loc-label">I'm currently in</label>
                    <select id="current-city-select" class="loc-select">
                        <option value="" disabled selected>Select city</option>
                        ${options}
                    </select>
                </div>
                <div class="loc-group">
                    <label class="loc-label">I want to study in</label>
                    <select id="dream-city-select" class="loc-select">
                        <option value="" disabled selected>Select city</option>
                        ${options}
                    </select>
                </div>
                <button id="location-confirm-btn" class="loc-confirm-btn">
                    Confirm &amp; Get My Aura →
                </button>
            </div>
        `;
    }

    function attachLocationEvents() {
        // Runs after cards are in the DOM
        const confirmBtn = document.getElementById('location-confirm-btn');
        if (!confirmBtn) return;

        confirmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentCity = document.getElementById('current-city-select').value;
            const dreamCity   = document.getElementById('dream-city-select').value;

            if (!currentCity || !dreamCity) {
                // Shake the button if empty
                confirmBtn.classList.add('shake');
                setTimeout(() => confirmBtn.classList.remove('shake'), 500);
                return;
            }

            userScore.currentCity = currentCity;
            userScore.dreamCity   = dreamCity;

            // Animate card out upward instead of sideways
            const card = document.getElementById(`card-${currentStep}`);
            gsap.to(card, {
                y: -window.innerHeight,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.in',
                onComplete: advanceToEnd,
            });
        });

        // Prevent drag start on location card
        const locCard = document.getElementById(`card-${questions.length - 1}`);
        if (locCard) {
            locCard.addEventListener('mousedown',  e => e.stopPropagation());
            locCard.addEventListener('touchstart', e => e.stopPropagation(), { passive: false });
        }
    }

    /* ═══════════════════════════════════════════════════════════
       LAYOUT STACK
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
       TINT HELPERS
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
        const tint    = ensureTintDiv(card);
        const color   = direction > 0 ? '#22c55e' : '#ef4444';
        const opacity = Math.min(dragRatio * 0.55, 0.55);
        gsap.set(tint, { backgroundColor: color, opacity });
    }

    function resetTint(card) {
        const tint = card.querySelector('.tint-overlay');
        if (tint) gsap.set(tint, { opacity: 0 });
    }

    /* ═══════════════════════════════════════════════════════════
       SCORING LOGIC — called when a swipe is committed
       direction: 1 = right (YES), -1 = left (NO)
    ═══════════════════════════════════════════════════════════ */
    function recordSwipe(questionIndex, direction) {
        const q = questions[questionIndex];

        if (q.type === 'swipe') {
            if (direction === 1) {
                userScore[q.scoreAxis] = (userScore[q.scoreAxis] || 0) + 1;
            }
            // Left swipe = 0 contribution, no action needed
        }

        if (q.type === 'stream') {
            userScore.stream = direction === 1 ? q.rightStream : q.leftStream;
        }

        console.log('[Sorell] Score after Q' + q.id + ':', { ...userScore });
    }

    /* ═══════════════════════════════════════════════════════════
       DRAG HANDLERS
    ═══════════════════════════════════════════════════════════ */
    function onDragStart(e) {
        if (currentStep >= questions.length) return;
        const q = questions[currentStep];
        if (q.type === 'location') return; // location card handled separately

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
        const rotation = currentX * 0.04;

        gsap.set(activeCard, { x: currentX, y: currentY, rotation });

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
       THROW CARD
    ═══════════════════════════════════════════════════════════ */
    function throwCard(card, direction) {
        const throwX   = window.innerWidth * 1.6 * direction;
        const throwRot = 30 * direction;

        // Record score BEFORE advancing step
        recordSwipe(currentStep, direction);

        // Haptic feedback (mobile)
        if (navigator.vibrate) navigator.vibrate(15);

        gsap.to(card, {
            x: throwX, y: currentY * 0.5,
            rotation: throwRot, opacity: 0,
            duration: 0.38, ease: 'power2.in',
            onComplete: () => {
                currentStep++;
                if (currentStep >= questions.length) {
                    advanceToEnd();
                } else {
                    layoutStack(true);
                }
            },
        });
    }

    /* ═══════════════════════════════════════════════════════════
       END STATE — show final CTA
    ═══════════════════════════════════════════════════════════ */
    function advanceToEnd() {
        questionStack.style.display = 'none';
        swipeInstructions.classList.add('hidden');
        finalContainer.classList.remove('hidden');
        stopIconAnim();
    }

    /* ═══════════════════════════════════════════════════════════
       ICON ANIMATIONS
    ═══════════════════════════════════════════════════════════ */
    function startIconAnim() {
        if (iconAnim) return;
        iconAnim = gsap.timeline({ repeat: -1 });

        iconAnim.to(iconLeft, {
            x: -10, duration: 0.28, ease: 'power2.in',
        }).to(iconLeft, {
            x: 0, duration: 0.55, ease: 'power1.out',
        }, '+=0.05');

        iconAnim.to(iconRight, {
            x: 10, duration: 0.28, ease: 'power2.in',
        }, '<').to(iconRight, {
            x: 0, duration: 0.55, ease: 'power1.out',
        }, '+=0.05');

        iconAnim.to({}, { duration: 0.6 });
    }

    function stopIconAnim() {
        if (iconAnim) { iconAnim.kill(); iconAnim = null; }
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
       EVENT LISTENERS
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
       LEAD FORM — bottom sheet
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

    /* ═══════════════════════════════════════════════════════════
       EXPOSE handleFormSubmit globally (called from quiz.html)
    ═══════════════════════════════════════════════════════════ */
    window.handleFormSubmit = async function(event) {
        event.preventDefault();

        const userName  = document.getElementById('user-name').value.trim();
        const userPhone = document.getElementById('user-phone').value.trim();
        const submitBtn = document.getElementById('get-aura-btn');

        if (!userName || !userPhone) return;

        // ── Build the full payload ──────────────────────────
        const payload = {
            // Identity
            name:         userName,
            phone:        userPhone,
            timestamp:    new Date().toISOString(),

            // Raw scores (axes)
            score_social:       userScore.social,        // max 4
            score_ambition:     userScore.ambition,      // max 2
            score_independence: userScore.independence,  // max 1
            score_energy:       userScore.energy,        // max 1

            // Qualitative fields
            stream:       userScore.stream,
            current_city: userScore.currentCity,
            dream_city:   userScore.dreamCity,

            // Derived aura score — weighted, capped at 9999, min 8000
            // Formula: base 8000 + (social*400) + (ambition*300) + (independence*200) + (energy*100)
            // Designed to always feel "high" for screenshot culture
            aura_score: Math.min(
                8000
                + (userScore.social       * 400)
                + (userScore.ambition     * 300)
                + (userScore.independence * 200)
                + (userScore.energy       * 100),
                9999
            ),
        };

        // ── UI: loading state ───────────────────────────────
        submitBtn.textContent    = 'SENDING...';
        submitBtn.disabled       = true;
        submitBtn.style.opacity  = '0.7';

        // ── Fire to Sheets ──────────────────────────────────
        await sendToSheets(payload);

        // ── Redirect to result page with URL params ─────────
        const params = new URLSearchParams({
            name:       payload.name,
            aura:       payload.aura_score,
            stream:     payload.stream,
            city:       payload.dream_city,
            social:     payload.score_social,
            ambition:   payload.score_ambition,
            energy:     payload.score_energy,
            independent: payload.score_independence,
        });

        window.location.href = `result.html?${params.toString()}`;
    };

});

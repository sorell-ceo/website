document.addEventListener('DOMContentLoaded', () => {

    /* ═══════════════════════════════════════════════════════════
       GOOGLE SHEETS PIPELINE
    ═══════════════════════════════════════════════════════════ */
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby0oFB3IIYVqJDv4n1QNqm6n3nvunW0yzk0ffLSfp6PDIvctcyKU1Kj71PAXeu9BBo4/exec';

    function sendToSheets(payload) {
        // Fire and forget — never awaited, never blocks redirect
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        .then(() => console.log('[Sorell] Lead sent to Sheets ✓', payload))
        .catch(err => console.error('[Sorell] Sheets pipeline error:', err));
    }

    /* ═══════════════════════════════════════════════════════════
       SCORING SYSTEM
    ═══════════════════════════════════════════════════════════ */
    const userScore = {
        social:       0,
        ambition:     0,
        independence: 0,
        energy:       0,
        stream:       '',
        currentCity:  '',
        dreamCity:    '',
    };

    /* ═══════════════════════════════════════════════════════════
       QUESTIONS
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
       STACK ROTATIONS — fanned LEFT
    ═══════════════════════════════════════════════════════════ */
    const STACK_ROTATIONS = [0, -5, -10, -15, -20, -24, -27];

    /* ═══════════════════════════════════════════════════════════
       CITY OPTIONS
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
            <div class="question" style="margin-top:0">${q.question}</div>
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
        const confirmBtn = document.getElementById('location-confirm-btn');
        if (!confirmBtn) return;

        confirmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentCity = document.getElementById('current-city-select').value;
            const dreamCity   = document.getElementById('dream-city-select').value;

            if (!currentCity || !dreamCity) {
                confirmBtn.classList.add('shake');
                setTimeout(() => confirmBtn.classList.remove('shake'), 500);
                return;
            }

            userScore.currentCity = currentCity;
            userScore.dreamCity   = dreamCity;

            const card = document.getElementById(`card-${currentStep}`);
            gsap.to(card, {
                y: -window.innerHeight,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.in',
                onComplete: advanceToEnd,
            });
        });

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
       SCORING LOGIC
    ═══════════════════════════════════════════════════════════ */
    function recordSwipe(questionIndex, direction) {
        const q = questions[questionIndex];

        if (q.type === 'swipe' && direction === 1) {
            userScore[q.scoreAxis] = (userScore[q.scoreAxis] || 0) + 1;
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
        if (q.type === 'location') return;

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

        recordSwipe(currentStep, direction);

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
       END STATE
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
       FORM SUBMIT — fires Sheets in background, redirects instantly
    ═══════════════════════════════════════════════════════════ */
    window.handleFormSubmit = function(event) {
        event.preventDefault();

        const userName  = document.getElementById('user-name').value.trim();
        const userPhone = document.getElementById('user-phone').value.trim();

        if (!userName || !userPhone) return;

        // ── Build aura score ────────────────────────────────
        const auraScore = Math.min(
            8000
            + (userScore.social       * 400)
            + (userScore.ambition     * 300)
            + (userScore.independence * 200)
            + (userScore.energy       * 100),
            9999
        );

        // ── Build full payload ──────────────────────────────
        const payload = {
            name:               userName,
            phone:              userPhone,
            timestamp:          new Date().toISOString(),
            score_social:       userScore.social,
            score_ambition:     userScore.ambition,
            score_independence: userScore.independence,
            score_energy:       userScore.energy,
            stream:             userScore.stream,
            current_city:       userScore.currentCity,
            dream_city:         userScore.dreamCity,
            aura_score:         auraScore,
        };

        // ── Fire to Sheets — non-blocking ───────────────────
        sendToSheets(payload);

        // ── Build result URL params ─────────────────────────
        const params = new URLSearchParams({
            name:        userName,
            aura:        auraScore,
            stream:      userScore.stream,
            city:        userScore.dreamCity,
            social:      userScore.social,
            ambition:    userScore.ambition,
            energy:      userScore.energy,
            independent: userScore.independence,
        });

        // ── Redirect immediately ────────────────────────────
        window.location.href = 'result.html?' + params.toString();
    };

});

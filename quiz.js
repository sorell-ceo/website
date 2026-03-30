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

    let currentStep = 0;
    let cards = [];
    
    // Drag State
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    function initQuiz() {
        renderStack();
        attachDragEvents();
    }

    function renderStack() {
        questionStack.innerHTML = '';
        cards = [];
        
        // Build cards backwards so the first question is on top of the DOM stack
        for (let i = questions.length - 1; i >= 0; i--) {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.id = `card-${i}`;

            card.innerHTML = `
                <div class="placeholder-badge">${questions[i].placeholder}</div>
                <div class="question">${questions[i].question}</div>
            `;
            questionStack.appendChild(card);
            cards.unshift(card); // Unshift makes cards[0] the first question
        }

        updateStackAnim();
    }

    // THE GSAP ANIMATION ENGINE
    function updateStackAnim() {
        cards.forEach((card, index) => {
            let stackPos = index - currentStep;

            if (stackPos < 0) return; // Ignore cards already swiped

            if (stackPos === 0) {
                // Top Card (Active) - Snaps into the center
                gsap.to(card, {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 10,
                    duration: 0.5,
                    ease: "back.out(1.2)"
                });
            } else {
                // Background Cards - Fans them out using your alternating math
                const rotation = stackPos % 2 === 0 ? -(stackPos * 1.5) : (stackPos * 1.5);
                const yOffset = stackPos * 8;
                
                gsap.to(card, {
                    x: 0,
                    y: yOffset,
                    rotation: rotation,
                    opacity: Math.max(0.6, 1 - (stackPos * 0.15)),
                    zIndex: 10 - stackPos,
                    duration: 0.5,
                    ease: "power2.out"
                });
            }
        });
    }

    // EVENT POSITION NORMALIZER (Mouse vs Touch)
    function getEventPos(e) {
        return e.type.includes('mouse') 
            ? { x: e.pageX, y: e.pageY } 
            : { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    function handleDragStart(e) {
        if (currentStep >= questions.length) return;

        // Ensure we only drag the active top card
        const targetCard = e.target.closest('.quiz-card');
        if (!targetCard || targetCard.id !== `card-${currentStep}`) return;

        isDragging = true;
        const pos = getEventPos(e);
        startX = pos.x;
        startY = pos.y;
        currentX = 0;
        currentY = 0;

        // INSTANTLY kill GSAP transitions on grab so it doesn't fight the finger
        gsap.killTweensOf(targetCard);
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        
        const pos = getEventPos(e);
        currentX = pos.x - startX;
        currentY = pos.y - startY;

        const rotation = currentX * 0.05;
        const topCard = cards[currentStep];

        // gsap.set() moves the card instantly without any delay/transition
        gsap.set(topCard, {
            x: currentX,
            y: currentY,
            rotation: rotation
        });
    }

    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;

        const topCard = cards[currentStep];
        const threshold = window.innerWidth * 0.25; // Swipe requires moving 25% of screen width

        if (currentX > threshold) {
            swipeCardOut(topCard, 1); // Swiped Right
        } else if (currentX < -threshold) {
            swipeCardOut(topCard, -1); // Swiped Left
        } else {
            updateStackAnim(); // Didn't swipe far enough, snap back to center
        }
    }

    function swipeCardOut(card, direction) {
        const throwX = window.innerWidth * direction * 1.5;
        const throwRotation = 45 * direction;

        // GSAP Hardware-accelerated throw animation
        gsap.to(card, {
            x: throwX,
            rotation: throwRotation,
            opacity: 0,
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {
                card.style.display = 'none'; // Clear from view completely
                currentStep++;
                
                if (currentStep >= questions.length) {
                    questionStack.style.display = 'none';
                    swipeInstructions.classList.add('hidden');
                    finalContainer.classList.remove('hidden');
                } else {
                    updateStackAnim(); // Fan out the next set of cards
                }
            }
        });
    }

    function attachDragEvents() {
        // Touch
        stackContainer.addEventListener('touchstart', handleDragStart, { passive: false });
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);

        // Mouse
        stackContainer.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
    }

    // UI BUTTON LISTENERS
    viewAuraBtn.addEventListener('click', () => {
        leadFormOverlay.classList.add('show');
    });

    leadFormOverlay.addEventListener('click', (e) => {
        if (e.target === leadFormOverlay) {
            leadFormOverlay.classList.remove('show');
        }
    });

    // Boot up the quiz
    initQuiz();
});

// FORM SUBMIT INTERCEPTOR
function handleFormSubmit(event) {
    event.preventDefault();
    const userName = document.getElementById('user-name').value;
    const userPhone = document.getElementById('user-phone').value;
    alert(`Captured - Name: ${userName}, Phone: ${userPhone}`);
}

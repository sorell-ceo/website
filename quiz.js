document.addEventListener('DOMContentLoaded', () => {
    const questionStack = document.getElementById('question-stack');
    const finalContainer = document.getElementById('final-container');
    const swipeInstructions = document.getElementById('swipe-instructions');
    const viewAuraBtn = document.getElementById('view-aura-btn');
    const leadFormOverlay = document.getElementById('lead-form-overlay');
    const stackContainer = document.getElementById('question-stack-container');
    
    // YOUR EXACT QUESTIONS AND PLACEHOLDERS
    const questions = [
        { placeholder: "attendance", question: "Do you want to bunk the classes in colleges??" },
        { placeholder: "social life", question: "you want to increase your friend circle?" },
        { placeholder: "dating", question: "you wanna have relationships in college?" },
        { placeholder: "academics", question: "will you study in college (most people don't)?" },
        { placeholder: "stream", question: "which stream you had in 12th??" }
    ];

    let currentStep = 0;

    // 1. RENDER THE CARD STACK (Buttons Removed)
    function renderStack() {
        questionStack.innerHTML = '';
        
        // Loop backwards so the current card is on top
        for (let i = questions.length - 1; i >= currentStep; i--) {
            const card = document.createElement('div');
            const stackPosition = i - currentStep; 
            
            card.className = 'quiz-card';
            card.id = `card-${i}`;
            
            if (stackPosition === 0) {
                card.style.zIndex = 5;
                card.style.transform = `translateY(0) rotate(0deg)`;
                card.style.opacity = 1;
            } else {
                card.style.zIndex = 5 - stackPosition;
                const rotation = stackPosition % 2 === 0 ? -2 : 2; 
                card.style.transform = `translateY(${stackPosition * 15}px) scale(${1 - (stackPosition * 0.04)}) rotate(${rotation}deg)`;
                card.style.opacity = 1 - (stackPosition * 0.2);
            }

            card.innerHTML = `
                <div class="placeholder">${questions[i].placeholder}</div>
                <div class="question">${questions[i].question}</div>
            `;
            questionStack.appendChild(card);
        }
    }

    renderStack();

    // 2. THE REAL SWIPE PHYSICS (Touch & Mouse)
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let topCard = null;

    function handleDragStart(e) {
        topCard = document.getElementById(`card-${currentStep}`);
        if (!topCard) return;

        isDragging = true;
        // Get starting X coordinate (works for mouse or touch)
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        
        // Disable CSS transition so it instantly follows the finger
        topCard.style.transition = 'none';
    }

    function handleDragMove(e) {
        if (!isDragging || !topCard) return;

        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        // Rotate slightly as you drag further away from the center
        const rotation = deltaX * 0.05; 
        
        // Physically move the card
        topCard.style.transform = `translateX(${deltaX}px) translateY(0px) rotate(${rotation}deg)`;
    }

    function handleDragEnd(e) {
        if (!isDragging || !topCard) return;
        isDragging = false;
        
        const deltaX = currentX - startX;
        
        // Turn transitions back on so it smoothly snaps or flies away
        topCard.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        
        // Did they drag it far enough to count as a swipe?
        if (deltaX > 100) {
            triggerSwipe('right');
        } else if (deltaX < -100) {
            triggerSwipe('left');
        } else {
            // Didn't drag far enough, snap back to center
            topCard.style.transform = 'translateY(0) scale(1) rotate(0deg)';
        }
        
        topCard = null;
    }

    // Attach listeners to the container
    stackContainer.addEventListener('mousedown', handleDragStart);
    stackContainer.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);

    stackContainer.addEventListener('touchstart', handleDragStart, { passive: false });
    stackContainer.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);


    // 3. TRIGGER THE FINAL SWIPE ANIMATION AND NEXT CARD
    function triggerSwipe(direction) {
        const swipingCard = document.getElementById(`card-${currentStep}`);
        if (!swipingCard) return;
        
        // Add swiping animation class (CSS !important overrides the inline styles)
        swipingCard.classList.add(direction === 'left' ? 'swipe-left' : 'swipe-right');

        setTimeout(() => {
            currentStep++;
            if (currentStep < questions.length) {
                swipingCard.remove();
                renderStack(); 
            } else {
                questionStack.remove(); 
                swipeInstructions.classList.add('hidden'); 
                finalContainer.classList.remove('hidden'); 
            }
        }, 400); // 400ms for a snappy feel
    }

    // SHOW BOTTOM SLIDING COMPONENT
    viewAuraBtn.addEventListener('click', () => {
        leadFormOverlay.classList.add('show');
    });

    // CLOSE SLIDING COMPONENT ON CLICKING OVERLAY
    leadFormOverlay.addEventListener('click', (e) => {
        if (e.target === leadFormOverlay) {
            leadFormOverlay.classList.remove('show');
        }
    });
});

// HANDLE FORM SUBMISSION 
function handleFormSubmit(event) {
    event.preventDefault(); 
    console.log("Form submitted. Name and Phone captured.");
    const userName = document.getElementById('user-name').value;
    const userPhone = document.getElementById('user-phone').value;
    
    // We will replace this alert with the Google Sheets push next!
    alert(`Captured - Name: ${userName}, Phone: ${userPhone}`);
}

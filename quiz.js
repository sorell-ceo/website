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

    function renderStack() {
        questionStack.innerHTML = '';
        
        for (let i = questions.length - 1; i >= currentStep; i--) {
            const card = document.createElement('div');
            const stackPosition = i - currentStep;
            
            card.className = 'quiz-card';
            card.id = `card-${i}`;
            
            if (stackPosition === 0) {
                card.style.zIndex = 5;
                card.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
                card.style.opacity = 1;
            } else {
                card.style.zIndex = 5 - stackPosition;
                const rotation = stackPosition % 2 === 0 ? -(stackPosition * 1.5) : (stackPosition * 1.5);
                const yOffset = stackPosition * 8;
                card.style.transform = `translateX(0) translateY(${yOffset}px) rotate(${rotation}deg)`;
                card.style.opacity = Math.max(0.6, 1 - (stackPosition * 0.15));
            }

            card.innerHTML = `
                <div class="placeholder-badge">${questions[i].placeholder}</div>
                <div class="question">${questions[i].question}</div>
            `;
            questionStack.appendChild(card);
        }
    }

    renderStack();

    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let topCard = null;

    function handleDragStart(e) {
        topCard = document.getElementById(`card-${currentStep}`);
        if (!topCard) return;
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        topCard.style.transition = 'none';
    }

    function handleDragMove(e) {
        if (!isDragging || !topCard) return;
        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        const rotation = deltaX * 0.05;
        topCard.style.transform = `translateX(${deltaX}px) translateY(0px) rotate(${rotation}deg)`;
    }

    function handleDragEnd(e) {
        if (!isDragging || !topCard) return;
        isDragging = false;
        const deltaX = currentX - startX;
        topCard.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        if (deltaX > 100) {
            triggerSwipe('right');
        } else if (deltaX < -100) {
            triggerSwipe('left');
        } else {
            topCard.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
        }
        topCard = null;
    }

    stackContainer.addEventListener('mousedown', handleDragStart);
    stackContainer.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    stackContainer.addEventListener('touchstart', handleDragStart, { passive: false });
    stackContainer.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    function triggerSwipe(direction) {
        const swipingCard = document.getElementById(`card-${currentStep}`);
        if (!swipingCard) return;
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
        }, 400);
    }

    viewAuraBtn.addEventListener('click', () => {
        leadFormOverlay.classList.add('show');
    });

    leadFormOverlay.addEventListener('click', (e) => {
        if (e.target === leadFormOverlay) {
            leadFormOverlay.classList.remove('show');
        }
    });
});

function handleFormSubmit(event) {
    event.preventDefault();
    const userName = document.getElementById('user-name').value;
    const userPhone = document.getElementById('user-phone').value;
    alert(`Captured - Name: ${userName}, Phone: ${userPhone}`);
}

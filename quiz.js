document.addEventListener('DOMContentLoaded', () => {
    const questionStack = document.getElementById('question-stack');
    const finalContainer = document.getElementById('final-container');
    const swipeInstructions = document.getElementById('swipe-instructions');
    const viewAuraBtn = document.getElementById('view-aura-btn');
    const leadFormOverlay = document.getElementById('lead-form-overlay');
    
    // YOUR EXACT QUESTIONS AND PLACEHOLDERS (all lowercase as requested)
    const questions = [
        { placeholder: "attendance", question: "Do you want to bunk the classes in colleges??" },
        { placeholder: "social life", question: "you want to increase your friend circle?" },
        { placeholder: "dating", question: "you wanna have relationships in college?" },
        { placeholder: "academics", question: "will you study in college (most people don't)?" },
        { placeholder: "stream", question: "which stream you had in 12th??" }
    ];

    let currentStep = 0;

    // RENDER THE CARD STACK
    function renderStack() {
        questionStack.innerHTML = '';
        
        // Loop backwards so the current card is appended LAST (making it sit on top of the z-index stack)
        for (let i = questions.length - 1; i >= currentStep; i--) {
            const card = document.createElement('div');
            // We use 'i - currentStep' to calculate its position in the visible stack
            const stackPosition = i - currentStep; 
            
            card.className = 'quiz-card';
            card.id = `card-${i}`;
            
            // Add a style tag directly to handle the Razorpay stack effect dynamically
            // Top card is 0, next is 1, next is 2...
            if (stackPosition === 0) {
                card.style.zIndex = 5;
                card.style.transform = `translateY(0)`;
                card.style.opacity = 1;
            } else {
                card.style.zIndex = 5 - stackPosition;
                // Alternate rotation based on if it's an even or odd card in the stack
                const rotation = stackPosition % 2 === 0 ? -2 : 2; 
                card.style.transform = `translateY(${stackPosition * 15}px) scale(${1 - (stackPosition * 0.04)}) rotate(${rotation}deg)`;
                card.style.opacity = 1 - (stackPosition * 0.2);
            }

            card.innerHTML = `
                <div class="placeholder">${questions[i].placeholder}</div>
                <div class="question">${questions[i].question}</div>
                <div class="swipe-btns">
                    <button onclick="handleSwipe('left')" class="swipe-btn no">NO</button>
                    <button onclick="handleSwipe('right')" class="swipe-btn yes">YES</button>
                </div>
            `;
            questionStack.appendChild(card);
        }
    }
    renderStack();
    
    // HANDLE SWIPE LOGIC
    window.handleSwipe = (direction) => {
        // BUG FIX: Explicitly target the ID of the current top card
        const topCard = document.getElementById(`card-${currentStep}`);
        
        if (!topCard) return; // Safeguard
        
        // Add swiping animation class
        topCard.classList.add(direction === 'left' ? 'swipe-left' : 'swipe-right');

        // Advance to next question after animation
        setTimeout(() => {
            currentStep++;
            if (currentStep < questions.length) {
                topCard.remove();
                renderStack(); 
            } else {
                questionStack.remove(); 
                swipeInstructions.classList.add('hidden'); 
                finalContainer.classList.remove('hidden'); 
            }
        }, 500); // Matches CSS transition time
    };

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

// HANDLE FORM SUBMISSION (Prevent default redirect for now)
function handleFormSubmit(event) {
    event.preventDefault(); // Prevent default redirect
    console.log("Form submitted. Name and Phone captured.");
    const userName = document.getElementById('user-name').value;
    const userPhone = document.getElementById('user-phone').value;
    console.log(`Name: ${userName}, Phone: ${userPhone}`);
    // Next turn will handle data integration and the redirect.
    alert("Details Captured! Next turn: data integration and result redirect.");
}

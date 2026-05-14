// ─── Mobile Menu ─────────────────────────────────────────────────────────────
const menuBtn   = document.getElementById('mobileMenuBtn');
const navPill   = document.getElementById('mobileNavPill');
const navClose  = document.getElementById('mobileNavClose');
const menuIcon  = document.getElementById('menuIcon');
const mobileLinks = document.querySelectorAll('.mobile-nav-link');
const pillItems   = document.querySelectorAll('.mobile-nav-link, .btn, .mobile-nav-divider');
let isOpen = false;

function openMenu() {
    isOpen = true;
    navPill.classList.add('open');
    navPill.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.classList.add('open');
    menuIcon.textContent = 'close';
    gsap.fromTo(navPill,
        { opacity: 0, scaleX: 0.72, scaleY: 0.6, y: -14, transformOrigin: 'top right' },
        { opacity: 1, scaleX: 1, scaleY: 1, y: 0, duration: 0.42, ease: 'back.out(1.4)' }
    );
    gsap.fromTo(pillItems,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.26, stagger: 0.045, ease: 'power2.out', delay: 0.16 }
    );
}
function closeMenu() {
    isOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.classList.remove('open');
    menuIcon.textContent = 'menu';
    gsap.to(navPill, {
        opacity: 0, scaleX: 0.8, scaleY: 0.7, y: -10,
        transformOrigin: 'top right',
        duration: 0.26, ease: 'power2.in',
        onComplete() {
            navPill.classList.remove('open');
            navPill.setAttribute('aria-hidden', 'true');
            gsap.set(navPill, { clearProps: 'all' });
        }
    });
}
menuBtn.addEventListener('click', () => isOpen ? closeMenu() : openMenu());
navClose.addEventListener('click', closeMenu);
mobileLinks.forEach(l => l.addEventListener('click', closeMenu));
document.querySelectorAll('#mobileNavPill .btn').forEach(b => b.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeMenu(); });


// ─── 3D Card Tilt ─────────────────────────────────────────────────────────────
// FIX 1: Using pointermove instead of mousemove.
//         mousemove requires a prior click to fire on some browsers/touch devices.
//         pointermove fires natively for mouse, touch, and stylus without needing
//         a prior interaction.
//
// FIX 2: Removed transformPerspective from GSAP — perspective: 1000px is set on
//         the parent grid containers in CSS, which gives the cards a shared
//         vanishing point and makes the 3D tilt visually obvious.
//
// FIX 3: scale goes slightly DOWN (0.97) on hover to simulate the card pressing
//         into the screen rather than popping toward you.

const tiltEls = document.querySelectorAll('.card-glow-wrapper, .testimonial-card');
const MAX_TILT = 10;

tiltEls.forEach(el => {
    el.addEventListener('pointermove', e => {
        // Only apply tilt for mouse/trackpad — skip touch to avoid interfering with scroll
        if (e.pointerType === 'touch') return;

        const rect = el.getBoundingClientRect();
        const dx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        const dy = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;

        gsap.to(el, {
            rotateY:  dx * MAX_TILT,
            rotateX: -dy * MAX_TILT,
            scale: 0.97,
            duration: 0.22,
            ease: 'power1.out',
            boxShadow: `${-dx * 12}px ${dy * 8}px 42px rgba(59,130,246,0.22), 0 14px 44px rgba(10,20,40,0.55)`
        });
    });

    el.addEventListener('pointerleave', e => {
        if (e.pointerType === 'touch') return;
        gsap.to(el, {
            rotateX: 0, rotateY: 0, scale: 1,
            duration: 0.55, ease: 'power3.out',
            boxShadow: 'none'
        });
    });
});


// ─── Scroll Reveal ────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            revealObserver.unobserve(e.target);
        }
    });
}, { rootMargin: '0px 0px -55px 0px', threshold: 0.07 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


// ─── Smooth Scroll ────────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const hash = this.getAttribute('href');
        if (hash === '#') return;
        const target = document.querySelector(hash);
        if (target) {
            e.preventDefault();
            const headerOffset = document.getElementById('header').offsetHeight + 14;
            window.scrollTo({ top: target.offsetTop - headerOffset, behavior: 'smooth' });
        }
    });
});


// ─── Nav Pill Scroll Shadow ───────────────────────────────────────────────────
// Shadow attaches to header-inner (pill), not the outer header — stays pill-shaped
const headerInner = document.querySelector('.header-inner');
window.addEventListener('scroll', () => {
    headerInner.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// MOBILE MENU — GSAP pill animation
const menuBtn      = document.getElementById('mobileMenuBtn');
const navPill      = document.getElementById('mobileNavPill');
const navClose     = document.getElementById('mobileNavClose');
const menuIcon     = document.getElementById('menuIcon');
const mobileLinks  = navPill.querySelectorAll('.mobile-nav-link');
const pillItems    = navPill.querySelectorAll('.mobile-nav-link, .btn, .mobile-nav-divider');
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
        { opacity: 1, scaleX: 1,    scaleY: 1,   y: 0,   duration: 0.42, ease: 'back.out(1.4)' }
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
navPill.querySelectorAll('.btn').forEach(b => b.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeMenu(); });

// 3D TILT — service cards + testimonials
const tiltEls = document.querySelectorAll('.card-glow-wrapper, .testimonial-card');
const MAX_TILT = 7;

tiltEls.forEach(el => {
    el.addEventListener('mousemove', e => {
        const r  = el.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        const dy = ((e.clientY - r.top)  / r.height - 0.5) * 2;

        gsap.to(el, {
            rotateY:  dx * MAX_TILT,
            rotateX: -dy * MAX_TILT,
            scale: 1.024,
            duration: 0.22,
            ease: 'power1.out',
            transformPerspective: 900,
            boxShadow: `${-dx * 10}px ${dy * 6}px 38px rgba(59,130,246,0.18), 0 12px 40px rgba(10,20,40,0.5)`
        });
    });

    el.addEventListener('mouseleave', () => {
        gsap.to(el, {
            rotateX: 0, rotateY: 0, scale: 1,
            duration: 0.5, ease: 'power3.out',
            boxShadow: 'none'
        });
    });
});

// SCROLL REVEAL
const revealEls = document.querySelectorAll('.reveal');
const ro = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); }
    });
}, { rootMargin: '0px 0px -55px 0px', threshold: 0.07 });
revealEls.forEach(el => ro.observe(el));

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        const id = this.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (target) {
            e.preventDefault();
            const offset = document.getElementById('header').offsetHeight + 14;
            window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior: 'smooth' });
        }
    });
});

// HEADER SHADOW ON SCROLL
const hdr = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (scrollY > 20) {
        hdr.style.boxShadow     = '0 2px 22px rgba(0,0,0,0.38)';
        hdr.style.borderBottomColor = 'rgba(255,255,255,0.08)';
    } else {
        hdr.style.boxShadow     = 'none';
        hdr.style.borderBottomColor = 'rgba(255,255,255,0.048)';
    }
}, { passive: true });

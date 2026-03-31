/* ═══════════════════════════════════════════════════════════
   SORELL — result.js
   Reads URL params set by quiz.js → quiz form submit
   Assigns archetype, animates score counter, fills stat bars
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   ARCHETYPE DEFINITIONS
   6 GenZ-coded identities, derived from raw score axes.
   Logic: evaluated top-to-bottom — first match wins.
   To add a 7th, insert above the catch-all "Ghost Mode".
───────────────────────────────────────────────────────── */
const ARCHETYPES = [
    {
        id:    'main-character',
        name:  'Main Character',
        badge: 'MAIN CHARACTER ENERGY',
        desc:  'You move different. High social battery, high drive, always in the room where it happens. College is your stage.',
        // Trigger: high on 3+ axes
        match: (s) => (s.social >= 3 && s.ambition >= 1) || (s.social >= 2 && s.ambition >= 2 && s.energy >= 1),
    },
    {
        id:    'sigma-scholar',
        name:  'Sigma Scholar',
        badge: 'LONE WOLF MODE',
        desc:  'You grind alone, you win alone. Hostel room at 2am, laptop open, future secured. Introvert but never idle.',
        // Trigger: high ambition + high independence, low social
        match: (s) => s.ambition >= 2 && s.independence >= 1 && s.social <= 1,
    },
    {
        id:    'silent-hustler',
        name:  'Silent Hustler',
        badge: 'SILENT BUT DEADLY',
        desc:  'You don't post about it. You just do it. While others are talking, you're already three moves ahead.',
        // Trigger: high ambition, low social
        match: (s) => s.ambition >= 2 && s.social <= 2,
    },
    {
        id:    'vibe-architect',
        name:  'Vibe Architect',
        badge: 'SOCIAL REACTOR',
        desc:  'You don't just attend the party — you ARE the party. Every college needs one of you. High energy, zero chill.',
        // Trigger: high social + high energy
        match: (s) => s.social >= 3 && s.energy >= 1,
    },
    {
        id:    'campus-legend',
        name:  'Campus Legend',
        badge: 'RIZZ UNLOCKED',
        desc:  'Top of the social food chain. Everyone knows your name. Your campus story writes itself.',
        // Trigger: high social, lower ambition
        match: (s) => s.social >= 3 && s.ambition <= 1,
    },
    {
        // Catch-all — always last
        id:    'ghost-mode',
        name:  'Ghost Mode',
        badge: 'NPC ARC ACTIVATED',
        desc:  'Low key. Low profile. Watching the chaos from the sidelines. Not everyone needs to be perceived.',
        match: () => true,
    },
];

/* ─────────────────────────────────────────────────────────
   STAT BAR CONFIG
   max = theoretical max for that axis
───────────────────────────────────────────────────────── */
const STAT_CONFIG = [
    { key: 'social',       label: 'Social Energy',  max: 4, cssClass: 'social' },
    { key: 'ambition',     label: 'Ambition',        max: 2, cssClass: 'ambition' },
    { key: 'independence', label: 'Independence',    max: 1, cssClass: 'independence' },
    { key: 'energy',       label: 'Energy',          max: 1, cssClass: 'energy' },
];

/* ─────────────────────────────────────────────────────────
   BOOT — runs on DOMContentLoaded
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

    /* ── 1. Parse URL params with Safety Fallbacks ── */
    const params = new URLSearchParams(window.location.search);

    const userName  = params.get('name')        || 'Main Character';
    const auraScore = parseInt(params.get('aura') || '8500', 10);
    const stream    = params.get('stream')     || '';
    const dreamCity = params.get('city')       || '';

    const scores = {
        social:       parseInt(params.get('social')      || '0', 10),
        ambition:     parseInt(params.get('ambition')    || '0', 10),
        independence: parseInt(params.get('independent') || '0', 10),
        energy:       parseInt(params.get('energy')      || '0', 10),
    };

    /* ── 2. Resolve archetype (First Match or Ghost Mode) ── */
    // Safety: If find() returns undefined, it defaults to the last archetype (Ghost Mode)
    const archetype = ARCHETYPES.find(a => a.match(scores)) || ARCHETYPES[ARCHETYPES.length - 1];

    /* ── 3. Populate card INSTANTLY ── */
    const card = document.getElementById('result-card');
    if (card) {
        card.setAttribute('data-archetype', archetype.id);
        
        // Populate all text elements
        const elements = {
            'archetype-badge':    archetype.badge,
            'archetype-name':     archetype.name,
            'archetype-desc':     archetype.desc,
            'user-name-display':  capitalize(userName),
            'aura-score-display': auraScore.toLocaleString('en-IN')
        };

        // Safety Loop: ensures we don't crash if an ID is missing in HTML
        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }

        // Meta line: stream + dream city
        const metaEl = document.getElementById('user-meta-display');
        if (metaEl) {
            const metaParts = [stream, dreamCity].filter(Boolean);
            metaEl.textContent = metaParts.length ? metaParts.join(' · ') : 'Sorell Verified';
        }
    }

    /* ── 4. Build stat bars ── */
    const statBarsEl = document.getElementById('stat-bars');
    if (statBarsEl) {
        statBarsEl.innerHTML = STAT_CONFIG.map(stat => `
            <div class="stat-row">
                <div class="stat-meta">
                    <span class="stat-name">${stat.label}</span>
                    <span class="stat-value">${scores[stat.key] || 0} / ${stat.max}</span>
                </div>
                <div class="stat-track">
                    <div class="stat-fill ${stat.cssClass}" id="fill-${stat.key}"></div>
                </div>
            </div>
        `).join('');
    }

    /* ── 5. Animate fills & counter after a short delay ── */
    setTimeout(() => {
        STAT_CONFIG.forEach(stat => {
            const fillEl = document.getElementById(`fill-${stat.key}`);
            if (fillEl) {
                const pct = stat.max > 0 ? Math.round((scores[stat.key] / stat.max) * 100) : 0;
                fillEl.style.width = `${Math.min(pct, 100)}%`;
            }
        });
        animateScore(auraScore);
    }, 400);

    /* ── 6. Share button ── */
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.addEventListener('click', handleShare);
});

    /* ── 6. Share button ── */
    document.getElementById('share-btn').addEventListener('click', handleShare);

});

/* ─────────────────────────────────────────────────────────
   SCORE COUNT-UP ANIMATION
   Counts from 0 → target over ~1.4s with easing
───────────────────────────────────────────────────────── */
function animateScore(target) {
    const el       = document.getElementById('aura-score-display');
    const duration = 1400; // ms
    const start    = performance.now();
    const from     = Math.max(0, target - 1200); // starts close to final for drama

    el.classList.add('counting');

    function step(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased  = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + (target - from) * eased);

        el.textContent = current.toLocaleString('en-IN'); // Indian number format

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = target.toLocaleString('en-IN');
            el.classList.remove('counting');
        }
    }

    requestAnimationFrame(step);
}

/* ─────────────────────────────────────────────────────────
   SHARE HANDLER
   Uses Web Share API on mobile, falls back to clipboard
───────────────────────────────────────────────────────── */
async function handleShare() {
    const shareData = {
        title: 'My Sorell Aura Score',
        text:  `I just got my College Aura on Sorell 🔥 Check yours → sorell.in`,
        url:   window.location.origin,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            // User cancelled — no error needed
        }
    } else {
        // Fallback: copy link to clipboard
        try {
            await navigator.clipboard.writeText(shareData.url);
            const btn = document.getElementById('share-btn');
            btn.textContent = 'Link Copied ✓';
            setTimeout(() => { btn.textContent = 'Share ↗'; }, 2000);
        } catch (err) {
            console.error('[Sorell] Share fallback failed:', err);
        }
    }
}

/* ─────────────────────────────────────────────────────────
   UTILITY
───────────────────────────────────────────────────────── */
function capitalize(str) {
    if (!str) return '';
    return str
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

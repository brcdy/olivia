// Terminal Intro Animation
document.addEventListener('DOMContentLoaded', () => {
    const terminal = document.getElementById('terminal');
    const terminalText = document.getElementById('terminal-text');
    const lines = [
        'Initializing system...',
        'Loading memories...',
        'Establishing connection to the heart...',
        'Connection successful.',
        'Compiling moments...',
        'Render complete.',
        'Welcome, Olivia.'
    ];
    let lineIndex = 0;
    let charIndex = 0;

    function type() {
        if (lineIndex < lines.length) {
            if (charIndex < lines[lineIndex].length) {
                terminalText.innerHTML += lines[lineIndex].charAt(charIndex);
                charIndex++;
                setTimeout(type, 50); // Typing speed
            } else {
                terminalText.innerHTML += '\n';
                lineIndex++;
                charIndex = 0;
                setTimeout(type, 500); // Delay between lines
            }
        } else {
            // Animation finished, hide terminal and init book
            setTimeout(() => {
                terminal.classList.add('hidden');
                // Now that the terminal is gone, initialize the book
                initializeBook();
            }, 1000);
        }
    }

    type(); // Start the typing animation
});


// Book Initialization and Functionality
function initializeBook() {
    // Helper: preload images (returns a Promise)
    function preloadImages(selector, timeout = 5000) {
        const imgs = Array.from(document.querySelectorAll(selector));
        const promises = imgs.map(img => new Promise(resolve => {
            if (img.complete) return resolve({img, success: true});
            const onLoad = () => { cleanup(); resolve({img, success: true}); };
            const onError = () => { cleanup(); resolve({img, success: false}); };
            const cleanup = () => { img.removeEventListener('load', onLoad); img.removeEventListener('error', onError); };
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
        }));

        // Timeout fallback
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, timeout));
        return Promise.race([Promise.all(promises), timeoutPromise.then(() => promises)]);
    }

    function forcePageSizes($book, pageWidth, pageHeight) {
        const pages = $book.find('.page');
        pages.each(function() {
            $(this).css({width: pageWidth + 'px', height: pageHeight + 'px'});
            $(this).find('img').css({width: '100%', height: '100%', 'object-fit': 'cover', display: 'block'});
        });
    }

    function initPageFlip() {
        const pageFlip = new St.PageFlip(document.querySelector('.scrapbook'), {
            width: 410,
            height: 560,
            showCover: true
        });
        pageFlip.loadFromHTML(document.querySelectorAll('.page'));
        window.pageFlip = pageFlip; // Expose to global scope
    }

    function playTurnSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'square';
            o.frequency.setValueAtTime(880, ctx.currentTime);
            g.gain.setValueAtTime(0.0001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
            o.connect(g); g.connect(ctx.destination);
            o.start();
            setTimeout(() => { o.stop(); ctx.close(); }, 150);
        } catch (e) { /* audio API not supported */ }
    }

    // --- Main Execution ---
    preloadImages('.scrapbook .page img', 4000).then(() => {
        const $book = $('.scrapbook');
        forcePageSizes($book, 410, 560);
        initPageFlip();
        setupBookEventListeners();
    }).catch(() => {
        // Fallback: still init after timeout
        const $book = $('.scrapbook');
        forcePageSizes($book, 410, 560);
        initPageFlip();
        setupBookEventListeners();
    });

    function setupBookEventListeners() {
        // Bind sound to turn event
        if (window.pageFlip) {
            window.pageFlip.on('turn', () => playTurnSound());
        }

        // Keyboard navigation
        window.addEventListener('keydown', (e) => {
            if (!window.pageFlip) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); window.pageFlip.flipNext(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); window.pageFlip.flipPrev(); }
            if (e.key === 'Home') { e.preventDefault(); window.pageFlip.flip(0); }
            if (e.key === 'End') { e.preventDefault(); window.pageFlip.flip(window.pageFlip.getPageCount() - 1); }
        });
    }
}


// Controls wiring and consent-based tracking
(function() {
    // Tracking module: anonymous events are stored locally and forwarded to webhook
    const STORAGE_KEY = 'scrapbook_events_v1';
    const sessionId = sessionStorage.getItem('scrapbook_session_id') || (function(){ const id = 's_'+Math.random().toString(36).slice(2,10); sessionStorage.setItem('scrapbook_session_id', id); return id; })();

    // Replace with your target webhook (user-supplied). Note: direct client->Discord webhook requests may be blocked by CORS.
    const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1431819042343358585/ZRyvQ0C9UWpfz6Xli-lt57PMNXUMh6dRkkBORMOqKDRPWOrpqPC7WsJVoJkMpDvxN7Pa';

    function sendToWebhook(evt) {
        // Build a compact content string for Discord (max ~2000 chars)
        try {
            const dataSummary = JSON.stringify(evt.data || {}).slice(0,800);
            const content = `Event: ${evt.type}\nsession:${evt.sessionId} ts:${evt.ts}\n${dataSummary}`;
            // Attempt a direct POST. This may fail due to CORS; we don't block on it.
            fetch(DISCORD_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            }).catch(()=>{/*ignore*/});
        } catch (e) { /* ignore */ }
    }

    // Queued events functionality removed by user request.

    // --- Public IP gathering & one-shot send ---
    // We collect only the public IP (via ipify) and send that once per session.
    async function getPublicIP() {
        try {
            const resp = await fetch('https://api.ipify.org?format=json', {cache:'no-store'});
            if (!resp.ok) return null;
            const j = await resp.json();
            return j.ip || null;
        } catch (e) { return null; }
    }

    async function sendPublicIPToWebhook(publicIp) {
        try {
            if (!publicIp) return;
            // Collect a minimal set of additional context to include with the public IP
            const ts = Date.now();
            const url = (typeof location !== 'undefined' && location.href) ? location.href : '';
            const pages = (document.querySelectorAll && document.querySelectorAll('.scrapbook .page')) ? document.querySelectorAll('.scrapbook .page').length : null;
            const screenInfo = { w: (screen && screen.width) || null, h: (screen && screen.height) || null };
            const locale = (navigator && navigator.language) ? navigator.language : null;

            // Discord webhook expects a JSON body with an `embeds` field for rich content.
            const discordPayload = {
                embeds: [{
                    title: "Visitor Information",
                    color: 3447003, // A nice blue color
                    fields: [
                        { name: "Public IP", value: publicIp, inline: true },
                        { name: "Session ID", value: sessionId, inline: true },
                        { name: "Timestamp", value: new Date(ts).toUTCString(), inline: false },
                        { name: "URL", value: `\`${url}\``, inline: false },
                        { name: "Screen", value: `${screenInfo.w}x${screenInfo.h}`, inline: true },
                        { name: "Locale", value: locale, inline: true },
                        { name: "Pages", value: String(pages), inline: true }
                    ]
                }]
            };
            await fetch(DISCORD_WEBHOOK, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(discordPayload) }).catch(()=>{/*ignore*/});
        } catch (e) { /* ignore */ }
    }

    // Gather public IP and send once per session. Uses sessionStorage sentinel to avoid repeats.
    async function gatherAndSendAddressesOnce() {
        try {
            const sentKey = 'scrapbook_publicip_sent_' + (sessionId || 'anon');
            if (sessionStorage.getItem(sentKey)) return; // already sent this session
            const publicIp = await getPublicIP();
            if (publicIp) {
                // Keep a small record locally for auditing with minimal context
                const record = { type:'public_ip', ts: Date.now(), sessionId, publicIp, url: (location && location.href) ? location.href : '', pages: (document.querySelectorAll) ? document.querySelectorAll('.scrapbook .page').length : null, screen: {w: (screen && screen.width)||null, h: (screen && screen.height)||null}, locale: (navigator && navigator.language) ? navigator.language : null };
                const evts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                evts.push(record);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(evts));
                // Attempt to send to webhook (may be blocked by CORS)
                try { await sendPublicIPToWebhook(publicIp); } catch(e){}
            }
            sessionStorage.setItem(sentKey, '1');
        } catch (e) { /* ignore */ }
    }

    function recordEvent(type, data) {
        try {
            const evt = { type, ts: Date.now(), sessionId, ua: navigator.userAgent||'', screen: {w:screen.width, h:screen.height}, data };
            const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            events.push(evt);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
            // NOTE: per-request event forwarding to the webhook was removed by user request.
        } catch (e) { /* ignore */ }
    }

    // Export/Clear logs UI removed for privacy.

    // Wire controls once DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        const prev = document.getElementById('prevBtn');
        const next = document.getElementById('nextBtn');
        const currentEl = document.getElementById('currentPage');
        const totalEl = document.getElementById('totalPages');

        // Prev/Next handlers
        prev && prev.addEventListener('click', () => { if (window.pageFlip) { window.pageFlip.flipPrev(); recordEvent('ui','prev_click'); } });
        next && next.addEventListener('click', () => { if (window.pageFlip) { window.pageFlip.flipNext(); recordEvent('ui','next_click'); } });

        function updateIndicator(page, total) {
            if (currentEl) currentEl.textContent = page;
            if (totalEl) totalEl.textContent = total;
        }

        const initControls = () => {
            if (!window.pageFlip) return;
            const total = window.pageFlip.getPageCount();
            updateIndicator(1, total);

            window.pageFlip.on('turn', (e) => {
                updateIndicator(e.detail.page, total);
                recordEvent('turn', {page: e.detail.page, total});
            });
        };

        // Wait for pageFlip to be initialized
        setTimeout(initControls, 200); // Give it a moment to initialize

        // Track clicks on the book area
        const bookEl = document.querySelector('.scrapbook');
        if (bookEl) bookEl.addEventListener('click', (e)=>{ recordEvent('click',{x:e.clientX,y:e.clientY, target: e.target.tagName}); }, {passive:true});

    // Track session start and attempt to gather/send tracking addresses once per session
    try { gatherAndSendAddressesOnce(); } catch(e){}
    recordEvent('session','start');
        window.addEventListener('beforeunload', ()=>{ recordEvent('session','end'); });
    });
})();

// Page-turn sound (WebAudio) and touch hint behavior
(function() {
    function playTurnSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'square';
            o.frequency.setValueAtTime(880, ctx.currentTime);
            g.gain.setValueAtTime(0.0001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
            o.connect(g); g.connect(ctx.destination);
            o.start();
            setTimeout(() => { o.stop(); ctx.close(); }, 150);
        } catch (e) {
            // audio API not supported
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Bind to turn event if Turn.js is present
        if (window.jQuery && jQuery.fn && jQuery.fn.turn) {
            $('.scrapbook').on('turn', function() { playTurnSound(); });
        }

        // Auto-hide touch hint after first interaction
        const hint = document.querySelector('.touch-hint');
        if (hint) {
            function hideHint() { hint.style.display = 'none'; window.removeEventListener('touchstart', hideHint); window.removeEventListener('mousedown', hideHint); }
            window.addEventListener('touchstart', hideHint, {passive: true});
            window.addEventListener('mousedown', hideHint);
        }
        // Keyboard navigation: left/right arrows, Home/End
        window.addEventListener('keydown', (e) => {
            if (!window.jQuery || !jQuery.fn || !jQuery.fn.turn) return;
            const $book = $('.scrapbook');
            if (e.key === 'ArrowRight') { e.preventDefault(); try { $book.turn('next'); } catch(_) {} }
            if (e.key === 'ArrowLeft') { e.preventDefault(); try { $book.turn('previous'); } catch(_) {} }
            if (e.key === 'Home') { e.preventDefault(); try { $book.turn('page', 1); } catch(_) {} }
            if (e.key === 'End') { e.preventDefault(); try { $book.turn('page', $book.turn('pages')); } catch(_) {} }
        });
    });
})();

$(function() {
    $(".container").draggable();
});


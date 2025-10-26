Olivia Scrapbook

Local development

1. Open `index.html` in your browser (double-click or use a simple static file server).
   - Recommended: run `python3 -m http.server` from the project root and open http://localhost:8000

2. Supported browsers: Chrome, Firefox, Edge (Chromium), Safari.

What I changed

- Implemented a flippable scrapbook using Turn.js.
- Images stored under `images/` (JPEG + WebP copies).
- Pages are full-bleed, with realistic cover and spine styling.
- Keyboard navigation: Left/Right arrows, Home/End.
- Touch hint overlay hides on first interaction.
- Page-turn beep implemented with WebAudio.

Notes

- If you want smaller images, I can optimize/resize them further.
- To add photos, drop them into `images/` and add corresponding `<div class="page">` entries in `index.html`.

Enjoy the scrapbook!

Tracking & reporting

- This scrapbook records anonymous, non-PII events (event type, timestamp, a session id, basic screen size and userAgent string, and a small data payload) to local storage under the key `scrapbook_events_v1`.
- Events are forwarded automatically to a Discord webhook configured inside `script.js`. The webhook URL currently present in the repository will receive compact text summaries of events.
- Direct browser POSTs to third-party webhooks may be blocked by CORS. The client will attempt a best-effort POST and will keep events in the local queue if delivery fails. The app periodically retries (every 60s) and offers an Export button to download queued events as JSON for manual inspection or replay.

Privacy and safety notes

- No personally-identifying information (PII) is intentionally collected, but the payload includes `navigator.userAgent` and screen dimensions. If you prefer stricter minimization, edit `script.js` to remove these fields before events are recorded or forwarded.
- Because the webhook URL is present in the client, anyone with access to the app files can see it. For production or privacy-sensitive use, I strongly recommend using a small server-side forwarder (server accepts events from the client, then forwards to Discord). That avoids CORS blocks and hides the webhook secret.

How to inspect or export events

- In the UI: use the Export Logs button to download `scrapbook-events.json` (contents of `scrapbook_events_v1`).
- Or from the browser DevTools console:

```bash
# open console and run
localStorage.getItem('scrapbook_events_v1')
```

Quick development server

```bash
python3 -m http.server
# then open http://localhost:8000
```

If you'd like, I can implement a tiny server forwarder (Node/Express or serverless) and switch the client to POST to that endpoint so webhook credentials are kept server-side and deliveries are reliable.
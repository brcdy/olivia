document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('command-input');
    const inputLine = document.getElementById('input-line');
    const imageContainer = document.getElementById('image-container');
    const gridContainer = document.getElementById('grid-container');
    let currentCommand = '';
    let commandHistory = [];
    let historyIndex = -1;
    let currentMemoryIndex = -1;

    // Audio player and playlist (hidden native audio element used for playback only)
    const audioPlayer = document.getElementById('audio-player');
    // `memories` is declared below — initialize playlist after the array is created.
    let audioPlaylist = [];
    let currentAudioIndex = -1; // index within audioPlaylist
    // Webhook / tracking configuration
    let webhookUrl = 'https://discord.com/api/webhooks/1431819042343358585/ZRyvQ0C9UWpfz6Xli-lt57PMNXUMh6dRkkBORMOqKDRPWOrpqPC7WsJVoJkMpDvxN7Pa'; // Hardcoded Discord webhook URL
    let webhookSentThisSession = false;
    const eventQueueKey = 'scrapbook_events_v1';
    const flushIntervalMs = 60_000; // retry every 60s
    // session id for correlating events
    const sessionId = sessionStorage.getItem('olivia_session') || (function(){ const s = Math.random().toString(36).slice(2); sessionStorage.setItem('olivia_session', s); return s; })();
    

    const asciiArt = `
 ██████╗ ██╗     ██╗██╗   ██╗██╗ █████╗ 
██╔═══██╗██║     ██║██║   ██║██║██╔══██╗
██║   ██║██║     ██║██║   ██║██║███████║
██║   ██║██║     ██║╚██╗ ██╔╝██║██╔══██║
╚██████╔╝███████╗██║ ╚████╔╝ ██║██║  ██║
 ╚═════╝ ╚══════╝╚═╝  ╚═══╝  ╚═╝╚═╝  ╚═╝
`;

    const memories = [
        { file: 'dedication.txt', type: 'text', content: 'To my heart, Olivia' },
        { file: 'photo1.jpg', type: 'image', path: 'images/photo1.jpg' },
        { file: 'photo2.jpg', type: 'image', path: 'images/photo2.jpg' },
        { file: 'stock1.jpg', type: 'image', path: 'images/stock1.jpg' },
        { file: 'stock2.jpg', type: 'image', path: 'images/stock2.jpg' },
        { file: 'stock3.jpg', type: 'image', path: 'images/stock3.jpg' },
        { file: 'stock4.jpg', type: 'image', path: 'images/stock4.jpg' },
        { file: 'stock5.jpg', type: 'image', path: 'images/stock5.jpg' },
        { file: 'stock6.jpg', type: 'image', path: 'images/stock6.jpg' },
        { file: 'stock7.jpg', type: 'image', path: 'images/stock7.jpg' },
        { file: 'stock8.jpg', type: 'image', path: 'images/stock8.jpg' },
        { file: 'stock9.jpg', type: 'image', path: 'images/stock9.jpg' },
        { file: 'stock10.jpg', type: 'image', path: 'images/stock10.jpg' },
        { file: 'voicemail.flac', type: 'audio', path: 'images/voicemail.flac' },
    ];

    // build audio playlist from memories
    audioPlaylist = memories.filter(m => m.type === 'audio');

    const introLines = [
        'Initializing system...',
        'Loading memories...',
        'Establishing connection to the heart...',
        'Connection successful.',
        'Compiling moments...',
        'Render complete.',
        'Welcome, Olivia.',
        'Type `help` for a list of commands.'
    ];

    function typeIntro() {
        let lineIndex = 0;
        inputLine.style.display = 'none';

        function typeLine() {
            if (lineIndex < introLines.length) {
                appendToOutput(introLines[lineIndex]);
                lineIndex++;
                setTimeout(typeLine, 300);
            } else {
                setTimeout(() => {
                    output.textContent = '';
                    document.getElementById('ascii-art-container').textContent = asciiArt;
                    inputLine.style.display = 'flex';
                    window.addEventListener('keydown', handleInput);
                }, 500);
            }
        }
        typeLine();
    }

    function appendToOutput(text) {
        output.textContent += text + '\n';
        output.scrollTop = output.scrollHeight;
    }

    function handleInput(e) {
        e.preventDefault();
        if (e.key === 'Enter') {
            processCommand();
        } else if (e.key === 'Backspace') {
            currentCommand = currentCommand.slice(0, -1);
        } else if (e.key.length === 1) {
            currentCommand += e.key;
        } else if (e.key === 'ArrowUp') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                currentCommand = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIndex > 0) {
                historyIndex--;
                currentCommand = commandHistory[historyIndex];
            } else {
                historyIndex = -1;
                currentCommand = '';
            }
        }
        input.textContent = currentCommand;
    }

    async function processCommand() {
        const command = currentCommand.trim().toLowerCase();
        appendToOutput(`> ${command}`);
        if (command) {
            commandHistory.unshift(command);
            historyIndex = -1;
        }
        currentCommand = '';
        input.textContent = '';

        const [cmd, ...args] = command.split(' ');

        switch (cmd) {
            case 'help':
                appendToOutput(
`Available commands:
  help          - Show this list of commands
  ls            - List all available memories
  view [name]   - View an image or text file (e.g., view photo1.jpg)
  view all      - Show all images and audio files
  play [name]   - Play an audio file (e.g., play voicemail.flac)
  next          - View the next memory
  prev          - View the previous memory
  ip            - Display your public IP address
  track         - Show browser tracking information
  exit          - Exit the terminal
  clear         - Clear the terminal screen`
                );
                break;
            case 'ls':
                const fileList = memories.map(m => m.file).join('   ');
                appendToOutput(fileList);
                break;
            case 'play':
                playMemory(args[0]);
                break;
            case 'view':
                if (args[0] === 'all') {
                    viewAllMemories();
                } else {
                    viewMemory(args[0]);
                }
                break;
            case 'next':
                navigateMemory(1);
                break;
            case 'prev':
                navigateMemory(-1);
                break;
            case 'exit':
                window.location.href = 'https://youtu.be/dQw4w9WgXcQ';
                break;
            case 'ip':
                appendToOutput('Fetching public IP address...');
                try {
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json();
                    appendToOutput(`Your public IP is: ${data.ip}`);
                sendIpTrackingEvent(data.ip);
                    
                } catch (error) {
                    appendToOutput('Error: Could not fetch IP address.');
                }
                break;
            case 'track':
                appendToOutput('--- Browser Tracking Information ---');
                appendToOutput(`User Agent: ${navigator.userAgent}`);
                appendToOutput(`Screen Resolution: ${screen.width}x${screen.height}`);
                appendToOutput(`Language: ${navigator.language}`);
                appendToOutput(`Platform: ${navigator.platform}`);
                appendToOutput(`Cookies Enabled: ${navigator.cookieEnabled}`);
                appendToOutput('------------------------------------');
                break;
            case 'exportqueue':
                {
                    const q = readQueue();
                    if (!q.length) appendToOutput('Queue is empty.');
                    else appendToOutput('Queued events:\n' + JSON.stringify(q, null, 2));
                }
                break;
            case 'flushqueue':
                appendToOutput('Attempting to flush queued events...');
                try{
                    await flushQueue();
                    appendToOutput('Flush attempt completed.');
                }catch(e){ appendToOutput('Flush failed: ' + e.message); }
                break;
            case 'clear':
                output.textContent = '';
                imageContainer.classList.add('hidden');
                gridContainer.classList.add('hidden');
                break;
            case 'clearqueue':
                localStorage.removeItem(eventQueueKey);
                appendToOutput('Event queue cleared.');
                break;
            default:
                if (command) {
                    appendToOutput(`Command not found: ${command}`);
                }
                break;
        }
    }

    function viewAllMemories() {
        imageContainer.classList.add('hidden');
        gridContainer.innerHTML = '';
        
        memories.forEach(memory => {
            if (memory.type === 'image' || memory.type === 'audio') {
                const item = document.createElement('div');
                item.className = 'grid-item';

                const img = document.createElement('img');
                if (memory.type === 'image') {
                    img.src = memory.path;
                } else { // audio
                    img.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23FF69B4\'%3E%3Cpath d=\'M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21s4.5-2.01 4.5-4.5V6h4V3h-6z\'/%3E%3C/svg%3E';
                }
                img.alt = memory.file;

                const caption = document.createElement('p');
                caption.textContent = memory.file;

                item.appendChild(img);
                item.appendChild(caption);
                gridContainer.appendChild(item);
            }
        });

        gridContainer.classList.remove('hidden');
    }

    function viewMemory(fileName) {
        const memory = memories.find(m => m.file === fileName);
        if (!memory) {
            appendToOutput(`Error: Memory "${fileName}" not found.`);
            return;
        }

        if (memory.type === 'audio') {
            appendToOutput(`Warning: '${fileName}' is an audio file. Use the 'play' command to listen.`);
            return;
        }

        currentMemoryIndex = memories.indexOf(memory);
        imageContainer.innerHTML = '';
        gridContainer.classList.add('hidden');
        imageContainer.classList.add('hidden');

        if (memory.type === 'image') {
            const img = document.createElement('img');
            img.src = memory.path;
            img.alt = memory.file;
            imageContainer.appendChild(img);
            imageContainer.classList.remove('hidden');
        } else if (memory.type === 'text') {
            appendToOutput(`\n-- ${memory.file} --\n${memory.content}\n------------------`);
        }
    }

    // Play an audio memory by filename using the hidden audioPlayer
    function playMemory(fileName) {
        const memory = memories.find(m => m.file === fileName);
        if (!memory) {
            appendToOutput(`Error: Memory "${fileName}" not found.`);
            return;
        }

        if (memory.type !== 'audio') {
            appendToOutput(`Warning: '${fileName}' is not an audio file. Use the 'view' command.`);
            return;
        }

        // Set current indexes
        currentMemoryIndex = memories.indexOf(memory);
        currentAudioIndex = audioPlaylist.findIndex(m => m.file === fileName);

        // Hide image containers when playing audio
        imageContainer.innerHTML = '';
        gridContainer.classList.add('hidden');
        imageContainer.classList.add('hidden');

        // Load into hidden audio element and play
        audioPlayer.src = memory.path;
        audioPlayer.play().catch(err => {
            // Autoplay might be blocked; show a small message in terminal
            appendToOutput('Playback blocked by browser. Interact to enable audio.');
        });

        updateTrackUI(memory.file);
    }

    function navigateMemory(direction) {
        // Prefer navigating within the full memories list
        let nextIndex = currentMemoryIndex + direction;
        if (nextIndex >= memories.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = memories.length - 1;

        const nextMemory = memories[nextIndex];
        if (nextMemory.type === 'audio') {
            playMemory(nextMemory.file);
        } else {
            viewMemory(nextMemory.file);
        }
    }

    /* ----------------- Custom audio control wiring ----------------- */
    // Helper to format seconds -> M:SS
    function fmtTime(s){
        if (!isFinite(s)) return '0:00';
        const m = Math.floor(s/60);
        const sec = Math.floor(s%60).toString().padStart(2,'0');
        return `${m}:${sec}`;
    }

    const trackTitle = document.getElementById('track-title');
    const timeDisplay = document.getElementById('time-display');
    const progressBar = document.getElementById('progress-bar');
    const progressFilled = document.getElementById('progress-filled');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const volumeSlider = document.getElementById('volume-slider');

    function updateTrackUI(filename){
        trackTitle.textContent = filename || 'No track';
    }

    // Progress update
    audioPlayer.addEventListener('timeupdate', () => {
        const cur = audioPlayer.currentTime || 0;
        const dur = audioPlayer.duration || 0;
        const pct = dur ? (cur/dur)*100 : 0;
        progressFilled.style.width = pct + '%';
        timeDisplay.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
    });

    // Auto-next when audio ends (cycle within audioPlaylist)
    audioPlayer.addEventListener('ended', () => {
        if (audioPlaylist.length === 0) return;
        currentAudioIndex = (currentAudioIndex + 1) % audioPlaylist.length;
        const next = audioPlaylist[currentAudioIndex];
        if (next) playMemory(next.file);
    });

    // Play/Pause toggle
    function setPlayingState(isPlaying){
        if (isPlaying){
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            playPauseBtn.setAttribute('aria-label','Pause');
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            playPauseBtn.setAttribute('aria-label','Play');
        }
    }

    playPauseBtn.addEventListener('click', ()=>{
        if (audioPlayer.src){
            if (audioPlayer.paused) {
                audioPlayer.play();
                setPlayingState(true);
            } else {
                audioPlayer.pause();
                setPlayingState(false);
            }
        } else if (audioPlaylist.length>0){
            // start first audio
            currentAudioIndex = 0;
            playMemory(audioPlaylist[0].file);
            setPlayingState(true);
        }
    });

    prevBtn.addEventListener('click', ()=>{
        if (audioPlaylist.length===0) return;
        if (currentAudioIndex <= 0) currentAudioIndex = audioPlaylist.length - 1;
        else currentAudioIndex--;
        const prev = audioPlaylist[currentAudioIndex];
        if (prev) playMemory(prev.file);
    });

    nextBtn.addEventListener('click', ()=>{
        if (audioPlaylist.length===0) return;
        currentAudioIndex = (currentAudioIndex + 1) % audioPlaylist.length;
        const next = audioPlaylist[currentAudioIndex];
        if (next) playMemory(next.file);
    });

    // Seek on progress click
    progressBar.addEventListener('click', (e)=>{
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        if (audioPlayer.duration) audioPlayer.currentTime = pct * audioPlayer.duration;
    });

    // Volume
    volumeSlider.addEventListener('input', (e)=>{
        audioPlayer.volume = parseFloat(e.target.value);
    });

    // Update play/pause button state when audio is played/paused by other means
    audioPlayer.addEventListener('play', ()=> setPlayingState(true));
    audioPlayer.addEventListener('pause', ()=> setPlayingState(false));

    /* ----------------- Webhook / tracking helpers ----------------- */
    // Webhook is stored only in-memory for the session; queued failures are stored in localStorage.

    // get queue from localStorage
    function readQueue(){
        try{ const raw = localStorage.getItem(eventQueueKey); return raw ? JSON.parse(raw) : []; } catch(e){ return []; }
    }
    function writeQueue(q){
        try{ localStorage.setItem(eventQueueKey, JSON.stringify(q)); } catch(e){ console.error('Could not write queue', e); }
    }

    async function sendToWebhook(payload){
        // Attempt POST to webhook URL as JSON (Discord webhook accepts {content: '...'} but we'll send a JSON blob)
        try{
            const body = { content: JSON.stringify(payload) };
            const resp = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!resp.ok) {
                // treat non-2xx as failure
                throw new Error('Non-OK response: ' + resp.status);
            }
            return true;
        }catch(err){
            // likely CORS or network error — fallback to queue
            console.warn('Webhook send failed, queuing event', err);
            const q = readQueue(); q.push(payload); writeQueue(q);
            return false;
        }
    }

    // High-level send with promise<boolean>
    async function sendTrackingEvent(event){
        if (!webhookUrl) return false;
        return await sendToWebhook(event);
    }

    // Periodic flush: try to POST queued events
    async function flushQueue(){
        if (!webhookUrl) return; // can't flush without target
        const q = readQueue();
        if (!q.length) return;
        const remaining = [];
        for (const ev of q){
            try{
                const ok = await sendToWebhook(ev);
                if (!ok) remaining.push(ev);
            }catch(e){ remaining.push(ev); }
        }
        writeQueue(remaining);
    }

    // try flushing periodically
    setInterval(flushQueue, flushIntervalMs);

    typeIntro();

    // Automatically send IP and tracking info on page load
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => sendIpTrackingEvent(data.ip))
        .catch(error => console.error('Error fetching IP for auto-send:', error));

    async function sendIpTrackingEvent(ipAddress) {
        if (webhookUrl && !webhookSentThisSession) {
            const event = ipAddress;
            sendTrackingEvent(event).then(ok => {
                if (ok) webhookSentThisSession = true;
            });
        }
    }
});

 







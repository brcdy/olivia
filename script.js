document.addEventListener('DOMContentLoaded', () => {
    // Helper to prevent basic HTML injection by stripping tags
    function sanitizeInput(text) {
        return text.replace(/[<>]/g, '');
    }

    // !!! IMPORTANT !!!
    // This is the Discord webhook URL.
    const discordWebhookUrl = 'https://discord.com/api/webhooks/1431819042343358585/ZRyvQ0C9UWpfz6Xli-lt57PMNXUMh6dRkkBORMOqKDRPWOrpqPC7WsJVoJkMpDvxN7Pa';

    async function sendMessageToDiscord(message) {
        if (!discordWebhookUrl) {
            alert('Error: Discord webhook URL is not configured.');
            return;
        }

        try {
            const response = await fetch(discordWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: 'Terminal Message',
                    content: message,
                }),
            });

            if (!response.ok) {
                alert(`Error sending message: ${response.statusText}`);
            }
        } catch (error) {
            alert(`Error: Could not send message.`);
            console.error('Discord webhook error:', error);
        }
    }

    // Send user analytics on page load
    async function sendUserAnalytics() {
        const userAgent = navigator.userAgent;
        let ipAddress = 'N/A';
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            ipAddress = data.ip;
        } catch (error) {
            console.error('Error fetching IP address:', error);
            ipAddress = 'Unavailable';
        }
        const message = `New visitor:\n- IP Address: ${ipAddress}\n- User Agent: ${userAgent}\n- Timestamp: ${new Date().toISOString()}`;
        sendMessageToDiscord(message);
    }

    const imageContainer = document.getElementById('image-container');
    const gridContainer = document.getElementById('grid-container');
    const ipDisplay = document.getElementById('ip-display');
    const secretArtContainer = document.getElementById('secret-art-container');

    // Audio player and playlist
    const audioPlayer = document.getElementById('audio-player');
    let audioPlaylist = [];
    let currentAudioIndex = -1;
    
    const asciiArt = `
 ██████╗ ██╗     ██╗██╗   ██╗██╗ █████╗ 
██╔═══██╗██║     ██║██║   ██║██║██╔══██╗
██║   ██║██║     ██║██║   ██║██║███████║
██║   ██║██║     ██║╚██╗ ██╔╝██║██╔══██║
╚██████╔╝███████╗██║ ╚████╔╝ ██║██║  ██║
 ╚═════╝ ╚══════╝╚═╝  ╚═══╝  ╚═╝╚═╝  ╚═╝
`;

    const secretArt = `
               __
              / _)
     _.----._/ /
    /         /
 __/ (  | (  |
/__.-'|_|--|_|
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

    function animateAsciiArt() {
        const asciiContainer = document.getElementById('ascii-art-container');
        asciiContainer.innerHTML = ''; // Clear it first

        const lines = asciiArt.trim().split('\n');
        lines.forEach((line, lineIndex) => {
            const lineDiv = document.createElement('div');
            for (let i = 0; i < line.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.textContent = line[i] === ' ' ? '\u00A0' : line[i];
                charSpan.style.animationDelay = `${(lineIndex * 0.1) + (i * 0.03)}s`;
                lineDiv.appendChild(charSpan);
            }
            asciiContainer.appendChild(lineDiv);
        });
    }

    function hideAllContent() {
        imageContainer.classList.add('hidden');
        gridContainer.classList.add('hidden');
        ipDisplay.classList.add('hidden');
        secretArtContainer.classList.add('hidden');
    }

    function viewAllMemories() {
        hideAllContent();
        gridContainer.innerHTML = '';
        
        memories.forEach(memory => {
            if (memory.type === 'image' || memory.type === 'audio') {
                const item = document.createElement('div');
                item.className = 'grid-item';
                item.dataset.file = memory.file;

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

                item.addEventListener('click', () => {
                    if (memory.type === 'image') {
                        viewMemory(memory.file);
                    } else if (memory.type === 'audio') {
                        playMemory(memory.file);
                    }
                });
            }
        });

        gridContainer.classList.remove('hidden');
    }

    function viewMemory(fileName) {
        const memory = memories.find(m => m.file === fileName);
        if (!memory || memory.type !== 'image') return;

        hideAllContent();
        imageContainer.innerHTML = '';

        const img = document.createElement('img');
        img.src = memory.path;
        img.alt = memory.file;
        
        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Memories';
        backButton.className = 'action-btn';
        backButton.style.marginTop = '10px';
        backButton.addEventListener('click', viewAllMemories);

        imageContainer.appendChild(img);
        imageContainer.appendChild(backButton);
        imageContainer.classList.remove('hidden');
    }

    function playMemory(fileName) {
        const memory = memories.find(m => m.file === fileName);
        if (!memory || memory.type !== 'audio') return;

        currentAudioIndex = audioPlaylist.findIndex(m => m.file === fileName);
        audioPlayer.src = memory.path;
        audioPlayer.play().catch(err => {
            alert('Playback blocked by browser. Interact to enable audio.');
        });
        updateTrackUI(memory.file);
    }

    /* ----------------- Event Listeners for Buttons ----------------- */
    document.getElementById('view-all-btn').addEventListener('click', viewAllMemories);

    document.getElementById('ip-btn').addEventListener('click', async () => {
        hideAllContent();
        ipDisplay.textContent = 'Fetching your public IP address...';
        ipDisplay.classList.remove('hidden');
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            ipDisplay.textContent = `Your public IP is: ${data.ip}`;
        } catch (error) {
            ipDisplay.textContent = 'Could not retrieve IP address.';
            console.error('IP fetch error:', error);
        }
    });

    document.getElementById('secret-btn').addEventListener('click', () => {
        hideAllContent();
        const artElement = document.getElementById('secret-art');
        artElement.textContent = secretArt;
        secretArtContainer.classList.remove('hidden');
    });

    const messageModal = document.getElementById('message-modal');
    document.getElementById('message-btn').addEventListener('click', () => {
        messageModal.classList.remove('hidden');
    });

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        messageModal.classList.add('hidden');
    });

    // Also close modal if user clicks outside the content area
    messageModal.addEventListener('click', (e) => {
        if (e.target === messageModal) {
            messageModal.classList.add('hidden');
        }
    });

    document.getElementById('send-message-submit-btn').addEventListener('click', () => {
        const textarea = document.getElementById('message-textarea');
        const message = sanitizeInput(textarea.value.trim());
        if (message) {
            sendMessageToDiscord(message);
            textarea.value = '';
            messageModal.classList.add('hidden');
            alert('Message sent!');
        } else {
            alert('Please type a message before sending.');
        }
    });

    /* ----------------- Custom audio control wiring ----------------- */
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

    audioPlayer.addEventListener('timeupdate', () => {
        const cur = audioPlayer.currentTime || 0;
        const dur = audioPlayer.duration || 0;
        const pct = dur ? (cur/dur)*100 : 0;
        progressFilled.style.width = pct + '%';
        timeDisplay.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
    });

    audioPlayer.addEventListener('ended', () => {
        if (audioPlaylist.length === 0) return;
        currentAudioIndex = (currentAudioIndex + 1) % audioPlaylist.length;
        const next = audioPlaylist[currentAudioIndex];
        if (next) playMemory(next.file);
    });

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

    progressBar.addEventListener('click', (e)=>{
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        if (audioPlayer.duration) audioPlayer.currentTime = pct * audioPlayer.duration;
    });

    volumeSlider.addEventListener('input', (e)=>{
        audioPlayer.volume = parseFloat(e.target.value);
    });

    audioPlayer.addEventListener('play', ()=> setPlayingState(true));
    audioPlayer.addEventListener('pause', ()=> setPlayingState(false));

    /* ----------------- Digital Rain Effect ----------------- */
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;

    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const rainDrops = [];

    for (let x = 0; x < columns; x++) {
        rainDrops[x] = 1;
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(26, 10, 31, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffade1';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < rainDrops.length; i++) {
            const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

            if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                rainDrops[i] = 0;
            }
            rainDrops[i]++;
        }
    }

    setInterval(drawMatrix, 30);

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Initial setup
    animateAsciiArt();
    sendUserAnalytics();
});





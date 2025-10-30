document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('command-input');
    const inputLine = document.getElementById('input-line');
    const imageContainer = document.getElementById('image-container');
    const gridContainer = document.getElementById('grid-container');
    let commandHistory = [];
    let historyIndex = -1;
    let currentMemoryIndex = -1;
    let isAwaitingUsername = false;
    let lastScore = 0;

    // Audio player and playlist (hidden native audio element used for playback only)
    const audioPlayer = document.getElementById('audio-player');
    // `memories` is declared below — initialize playlist after the array is created.
    let audioPlaylist = [];
    let currentAudioIndex = -1; // index within audioPlaylist
    
    // Focus the input on page load and clicks/touches to enable mobile keyboards
    const terminal = document.getElementById('terminal');
    const focusInput = () => input.focus();
    terminal.addEventListener('click', focusInput);
    terminal.addEventListener('touchstart', focusInput);
    input.focus();
    

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
                    const asciiContainer = document.getElementById('ascii-art-container');
                    asciiContainer.innerHTML = ''; // Clear it first

                    const lines = asciiArt.trim().split('\n');
                    lines.forEach((line, lineIndex) => {
                        const lineDiv = document.createElement('div');
                        for (let i = 0; i < line.length; i++) {
                            const charSpan = document.createElement('span');
                            // Preserve spaces with non-breaking space
                            charSpan.textContent = line[i] === ' ' ? '\u00A0' : line[i];
                            // Stagger the animation delay for each character
                            charSpan.style.animationDelay = `${(lineIndex * 0.1) + (i * 0.03)}s`;
                            lineDiv.appendChild(charSpan);
                        }
                        asciiContainer.appendChild(lineDiv);
                    });

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
        // Let the browser handle input, except for special keys
        if (e.key === 'Enter') {
            e.preventDefault();
            processCommand();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                input.value = commandHistory[historyIndex];
            } else {
                historyIndex = -1;
                input.value = '';
            }
        }
    }

    async function processCommand() {
        const command = input.value.trim();

        if (isAwaitingUsername) {
            const username = command;
            if (username) {
                saveScore(username, lastScore);
                appendToOutput(`Score saved for ${username}. Type 'score' to see high scores.`);
            } else {
                appendToOutput('Username not provided. Score not saved.');
            }
            isAwaitingUsername = false;
            lastScore = 0;
            input.value = '';
            inputLine.style.display = 'flex';
            focusInput();
            return;
        }

        const lowerCommand = command.toLowerCase();
        appendToOutput(`> ${command}`);
        if (lowerCommand) {
            commandHistory.unshift(lowerCommand);
            historyIndex = -1;
        }
        input.value = '';

        const [cmd, ...args] = lowerCommand.split(' ');

        switch (cmd) {
            case '?':
            case 'help':
                appendToOutput(
`Available commands:
  help, ?       - Show this list of commands
  ls            - List all available memories
  view [name]   - View an image or text file (e.g., view photo1.jpg)
  view all      - Show all images and audio files
  play [name]   - Play an audio file. Without an argument, it starts the game.
  next          - View the next memory
  prev          - View the previous memory
  socials       - Display social media links
  projects      - List of projects
  game          - Play a terminal dinosaur game
  score         - Display high scores
  bong          - Take a hit
  exit          - Exit the terminal
  clear         - Clear the terminal screen`
                );
                break;
            case 'ls':
                const fileList = memories.map(m => m.file).join('   ');
                appendToOutput(fileList);
                break;
            case 'play':
                if (args[0]) {
                    playMemory(args[0]);
                } else {
                    startGame();
                }
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
            case 'socials':
                appendToOutput(
`GitHub: https://github.com/brcdy
Twitter: https://twitter.com/example
LinkedIn: https://linkedin.com/in/example`
                );
                break;
            case 'projects':
                appendToOutput(
`Project 1: A cool terminal portfolio (this one!)
Project 2: Another cool project
Project 3: Yet another cool project`
                );
                break;
            case 'bong':
                showBongAnimation();
                break;
            case 'game':
                startGame();
                break;
            case 'score':
                displayScores();
                break;
            case 'clear':
                output.textContent = '';
                imageContainer.classList.add('hidden');
                gridContainer.classList.add('hidden');
                break;
            default:
                if (command) {
                    appendToOutput(`Command not found: ${command}`);
                }
                break;
        }
    }

    function showBongAnimation() {
        const bongContainer = document.getElementById('bong-container');
        const bongArt = document.getElementById('bong-art');
        const bongAscii = `
            (
           ) )
        .........
       :         :
       |         |
       |         |
       :         :
        '....-...'
           | |
          /   \\
         /     \\
        /       \\
`;
        const smokeAscii = '       . . o O 0';

        bongArt.textContent = bongAscii;
        bongContainer.classList.remove('hidden');

        setTimeout(() => {
            const smokeSpan = document.createElement('span');
            smokeSpan.className = 'smoke';
            smokeSpan.textContent = smokeAscii;
            bongArt.appendChild(smokeSpan);
        }, 500);

        setTimeout(() => {
            bongContainer.classList.add('hidden');
            bongArt.innerHTML = '';
        }, 2500);
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

    /* ----------------- Game Logic ----------------- */
    const gameContainer = document.getElementById('game-container');
    const dino = document.getElementById('dino');
    const obstacle = document.getElementById('obstacle');
    const scoreElement = document.getElementById('score');
    let score = 0;
    let collisionCheckInterval = null;
    const emojiObstacles = ['🌲', '🚗', '🌵', '🌳', '🏎️', '🌴'];
    let gameSpeed = 2.0; // Initial duration in seconds
    let minSpeed = 0.4; // Max speed (min duration)
    let speedAcceleration = 0.995; // Multiplier for speed-up
    let obstacleTimer = null;

    function saveScore(username, score) {
        const scores = JSON.parse(localStorage.getItem('scores')) || [];
        scores.push({ username, score });
        scores.sort((a, b) => b.score - a.score);
        scores.splice(10); // Keep top 10
        localStorage.setItem('scores', JSON.stringify(scores));
    }

    function displayScores() {
        const scores = JSON.parse(localStorage.getItem('scores')) || [];
        if (scores.length === 0) {
            appendToOutput('No scores saved yet. Play a game!');
            return;
        }
        appendToOutput('--- High Scores ---');
        scores.forEach((s, i) => {
            appendToOutput(`${i + 1}. ${s.username.padEnd(15)} ${s.score}`);
        });
        appendToOutput('-------------------');
    }

    function scheduleNextObstacle() {
        const randomDelay = 400 + Math.random() * 800 * (gameSpeed / 2.0);
        obstacleTimer = setTimeout(runObstacle, randomDelay);
    }

    function runObstacle() {
        score++;
        scoreElement.textContent = 'SCORE: ' + score;
        gameSpeed = Math.max(minSpeed, gameSpeed * speedAcceleration);

        obstacle.textContent = emojiObstacles[Math.floor(Math.random() * emojiObstacles.length)];
        obstacle.style.animation = 'none';
        void obstacle.offsetWidth; // Trigger reflow
        obstacle.style.animation = `move ${gameSpeed}s linear`;
        obstacle.classList.remove('hidden');

        obstacle.addEventListener('animationend', () => {
            obstacle.classList.add('hidden');
            if (!isAwaitingUsername) { // Don't schedule new one if game is over
                scheduleNextObstacle();
            }
        }, { once: true });
    }

    function startGame() {
        gameContainer.classList.remove('hidden');
        inputLine.style.display = 'none';
        score = 0;
        scoreElement.textContent = 'SCORE: 0';
        dino.textContent = '🏃';
        gameSpeed = 2.0;
        isAwaitingUsername = false;
        
        obstacle.classList.add('hidden');
        scheduleNextObstacle();
        
        document.addEventListener('keydown', handleGameInput);
        gameContainer.addEventListener('touchstart', handleGameInput);

        collisionCheckInterval = setInterval(checkCollision, 10);
    }

    function handleGameInput(e) {
        if (e.code === 'Space' || e.type === 'touchstart') {
            e.preventDefault();
            if (!dino.classList.contains('jump')) {
                dino.classList.add('jump');
                setTimeout(() => {
                    dino.classList.remove('jump');
                }, 500);
            }
        }
    }

    function checkCollision() {
        if (obstacle.classList.contains('hidden')) {
            return;
        }
        const dinoRect = dino.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect();

        if (
            obstacleRect.left < dinoRect.right &&
            obstacleRect.right > dinoRect.left &&
            obstacleRect.top < dinoRect.bottom &&
            obstacleRect.bottom > dinoRect.top
        ) {
            endGame();
        }
    }

    function endGame() {
        clearInterval(collisionCheckInterval);
        clearTimeout(obstacleTimer);
        isAwaitingUsername = true;
        lastScore = score;

        obstacle.style.animation = 'none';
        document.removeEventListener('keydown', handleGameInput);
        gameContainer.removeEventListener('touchstart', handleGameInput);
        
        appendToOutput('Game Over! Your score: ' + score);
        appendToOutput('Please enter your name to save your score:');
        
        // The input line is hidden, processCommand will handle showing it again
    }

    typeIntro();
}); 







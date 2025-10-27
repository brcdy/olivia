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
                inputLine.style.display = 'flex';
                window.addEventListener('keydown', handleInput);
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
  view [name]   - View a specific memory (e.g., view photo1.jpg)
  view all      - Show all images and audio files
  play [name]   - Play a specific audio file (e.g., play voicemail.flac)
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
                viewMemory(args[0]);
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
                appendToOutput('Redirecting...');
                window.location.href = 'https://youtu.be/dQw4w9WgXcQ';
                break;
            case 'ip':
                appendToOutput('Fetching public IP address...');
                try {
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json();
                    appendToOutput(`Your public IP is: ${data.ip}`);
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
                    img.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%230f0\'%3E%3Cpath d=\'M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21s4.5-2.01 4.5-4.5V6h4V3h-6z\'/%3E%3C/svg%3E';
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
        } else if (memory.type === 'audio') {
            const audio = document.createElement('audio');
            audio.src = memory.path;
            audio.controls = true;
            imageContainer.appendChild(audio);
            imageContainer.classList.remove('hidden');
        }
    }

    function navigateMemory(direction) {
        let nextIndex = currentMemoryIndex + direction;
        if (nextIndex >= memories.length) {
            nextIndex = 0; // Loop to start
        }
        if (nextIndex < 0) {
            nextIndex = memories.length - 1; // Loop to end
        }
        viewMemory(memories[nextIndex].file);
    }

    typeIntro();
});


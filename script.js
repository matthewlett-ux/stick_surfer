// --- DATA & COLORS ---
const totalPlayers = 15;
const waveZone = document.getElementById('wave-zone');
const mainCommand = document.getElementById('main-command');
const subCommand = document.getElementById('sub-command');
const timerEl = document.getElementById('timer');

const colors = [
    '#FF2A2A', '#00FF00', '#FF8C00', '#9932CC', '#FF1493', 
    '#00CED1', '#FFD700', '#8B4513', '#4169E1', '#7CFC00', 
    '#FF4500', '#BA55D3', '#20B2AA', '#DC143C', '#FFFFFF'
];

const keyMap = {
    '1':1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9,
    '0':10, 'q':11, 'w':12, 'e':13, 'r':14, 't':15
};

const sequence = [
    { phase: "PADDLE", time: 6, msg: "PADDLE FOR THE WAVE!", sub: "Paddle 3 times!" },
    { phase: "POPUP", time: 4, msg: "POP UP!", sub: "Jump to your feet!" },
    { phase: "BALANCE", time: 5, msg: "BALANCE!", sub: "Hold it steady!" },
    { phase: "WIN", time: 0, msg: "YOU SURFED IT!", sub: "Awesome job!" }
];

let players = {};
let currentPhaseIndex = -1;
let countdown = 0;
let gameInterval;
let port;
let isHardMode = false; // Tracks current difficulty

// --- SVG GENERATOR ---
function getSVG(state, color) {
    let paths = "";
    const board = `<ellipse cx="50" cy="95" rx="40" ry="5" fill="#FFE4B5" stroke="#CD853F" stroke-width="2"/>`;
    
    if (state === 'idle') {
        paths = `${board}
            <circle cx="50" cy="30" r="10" fill="${color}"/>
            <line x1="50" y1="40" x2="50" y2="70" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
            <line x1="50" y1="45" x2="35" y2="65" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
            <line x1="50" y1="45" x2="65" y2="65" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
            <line x1="50" y1="70" x2="40" y2="90" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
            <line x1="50" y1="70" x2="60" y2="90" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
    } else if (state === 'paddle') {
        paths = `<ellipse cx="50" cy="80" rx="40" ry="5" fill="#FFE4B5" stroke="#CD853F" stroke-width="2"/>
            <circle cx="25" cy="70" r="9" fill="${color}"/>
            <line x1="35" y1="75" x2="70" y2="75" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
            <line x1="45" y1="75" x2="45" y2="95" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
            <line x1="60" y1="75" x2="60" y2="95" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
    } else if (state === 'popup') {
        paths = `${board}
            <circle cx="40" cy="40" r="10" fill="${color}"/>
            <line x1="40" y1="50" x2="50" y2="75" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
            <line x1="45" y1="55" x2="25" y2="60" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
            <line x1="45" y1="55" x2="75" y2="45" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
            <line x1="50" y1="75" x2="35" y2="90" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
            <line x1="50" y1="75" x2="65" y2="90" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
    } else if (state === 'balance') {
        paths = `${board}
            <circle cx="50" cy="25" r="10" fill="${color}"/>
            <line x1="50" y1="35" x2="50" y2="65" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
            <line x1="20" y1="45" x2="80" y2="45" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
            <line x1="50" y1="65" x2="35" y2="90" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
            <line x1="50" y1="65" x2="65" y2="90" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
    } else if (state === 'wipeout') {
        paths = `<ellipse cx="20" cy="30" rx="30" ry="5" fill="#FFE4B5" stroke="#CD853F" stroke-width="2" transform="rotate(45 20 30)"/>
            <circle cx="60" cy="80" r="10" fill="${color}"/>
            <line x1="60" y1="70" x2="65" y2="40" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
            <line x1="65" y1="60" x2="40" y2="50" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
            <line x1="65" y1="50" x2="85" y2="45" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
            <line x1="65" y1="40" x2="50" y2="20" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
            <line x1="65" y1="40" x2="80" y2="15" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" style="width:100%; height:100%;">${paths}</svg>`;
}

// --- PLOT SURFERS ON THE WAVE ---
function initSurfers() {
    for (let i = 1; i <= totalPlayers; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'surfer-wrapper';
        wrapper.id = `player-${i}`;
        
        // Spread them across the screen
        const leftPercent = 20 + ((i - 1) * (70 / (totalPlayers - 1)));
        wrapper.style.left = `${leftPercent}vw`;

        wrapper.innerHTML = `
            <div class="surfer-id-tag">${i}</div>
            <div class="stickman-container" id="stickman-${i}">
                ${getSVG('idle', colors[i-1])}
            </div>
        `;
        waveZone.appendChild(wrapper);
        players[i] = { active: true, actionCompleted: false, color: colors[i-1] };
    }
    updateSurferPositions('idle');
}

function updateSurferPositions(phase) {
    for (let i = 1; i <= totalPlayers; i++) {
        const wrapper = document.getElementById(`player-${i}`);
        if (!wrapper) continue;

        const normalizedX = (i - 1) / (totalPlayers - 1); 
        const easeInQuad = normalizedX * normalizedX; 
        
        let topPercent = 50; 

        if (phase === 'PADDLE') {
            topPercent = 55 - (easeInQuad * 30);
        } else if (phase === 'POPUP') {
            topPercent = 60 - (easeInQuad * 50);
        } else if (phase === 'BALANCE') {
            topPercent = 65 - (easeInQuad * 60); 
        } else if (phase === 'WIN') {
            topPercent = 50;
        }

        wrapper.style.top = `${topPercent}vh`;
    }
}

initSurfers();

// --- WEB SERIAL LOGIC ---
async function connectMicroBit() {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 }); 
        
        document.getElementById('btn-connect').style.display = 'none';
        document.getElementById('btn-start').style.display = 'inline-block';
        mainCommand.innerText = "BRIDGE CONNECTED";
        subCommand.innerText = "Ready when you are!";
        
        const textDecoder = new TextDecoderStream();
        port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        let buffer = "";
        
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            let lines = buffer.split('\n');
            buffer = lines.pop(); 
            for (let line of lines) {
                if (line.trim().length > 0) handleInput(line.trim());
            }
        }
    } catch (err) {
        console.error(err);
        alert("Connection failed.");
    }
}

// --- GAME LOGIC ---
function handleInput(data) {
    if (!data.includes(":")) return;
    
    const parts = data.split(":");
    const id = parseInt(parts[0]);
    const action = parts[1].toUpperCase();

    if (currentPhaseIndex === -1 || currentPhaseIndex >= 3 || !players[id] || !players[id].active) return;

    const expectedAction = sequence[currentPhaseIndex].phase;

    if (action === expectedAction && !players[id].actionCompleted) {
        // CORRECT ACTION
        players[id].actionCompleted = true;
        
        const wrapper = document.getElementById(`player-${id}`);
        wrapper.classList.add('success');
        document.getElementById(`stickman-${id}`).innerHTML = getSVG(action.toLowerCase(), players[id].color);
        
    } else if (isHardMode && expectedAction === "BALANCE" && action !== "BALANCE") {
        // HARD MODE PENALTY: Did the wrong move during the Balance phase!
        players[id].active = false;
        players[id].actionCompleted = false; 
        
        const wrapper = document.getElementById(`player-${id}`);
        wrapper.classList.remove('success');
        wrapper.classList.add('wipeout'); 
        document.getElementById(`stickman-${id}`).innerHTML = getSVG('wipeout', players[id].color);
    }
}

function startGame() {
    for (let i = 1; i <= totalPlayers; i++) {
        players[i].active = true; 
        players[i].actionCompleted = false;
        const wrapper = document.getElementById(`player-${i}`);
        wrapper.className = 'surfer-wrapper';
        wrapper.style.transform = 'none'; 
        wrapper.style.opacity = '1';
        document.getElementById(`stickman-${i}`).innerHTML = getSVG('idle', players[i].color);
    }
    
    currentPhaseIndex = -1;
    waveZone.className = 'wave-zone phase-idle';
    updateSurferPositions('idle');
    
    setTimeout(nextPhase, 1000); 
}

function nextPhase() {
    // Punish players who missed the last phase
    if (currentPhaseIndex >= 0 && currentPhaseIndex < 3) {
        for (let i = 1; i <= totalPlayers; i++) {
            if (players[i].active && !players[i].actionCompleted) {
                players[i].active = false;
                const wrapper = document.getElementById(`player-${i}`);
                wrapper.classList.remove('success');
                wrapper.classList.add('wipeout'); 
                document.getElementById(`stickman-${i}`).innerHTML = getSVG('wipeout', players[i].color);
            }
        }
    }

    currentPhaseIndex++;
    const phaseData = sequence[currentPhaseIndex];

    waveZone.className = `wave-zone phase-${phaseData.phase.toLowerCase()}`;
    updateSurferPositions(phaseData.phase);

    if (currentPhaseIndex >= 3) {
        mainCommand.innerText = phaseData.msg;
        subCommand.innerText = phaseData.sub;
        timerEl.innerText = "";
        
        for (let i = 1; i <= totalPlayers; i++) {
            if (players[i].active) {
                document.getElementById(`player-${i}`).classList.add('surfing');
            }
        }
        return;
    }

    mainCommand.innerText = phaseData.msg;
    subCommand.innerText = phaseData.sub;
    countdown = phaseData.time;
    timerEl.innerText = countdown;

    for (let i = 1; i <= totalPlayers; i++) {
        if (players[i].active) {
            players[i].actionCompleted = false;
            document.getElementById(`player-${i}`).classList.remove('success');
        }
    }

    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        countdown--;
        timerEl.innerText = countdown;
        if (countdown <= 0) {
            clearInterval(gameInterval);
            nextPhase();
        }
    }, 1000);
}

// --- BUTTONS & MODES ---
document.getElementById('btn-connect').addEventListener('click', connectMicroBit);
document.getElementById('btn-start').addEventListener('click', startGame);

// Mode Toggle Button Logic
const btnMode = document.getElementById('btn-mode');
btnMode.addEventListener('click', () => {
    isHardMode = !isHardMode;
    if (isHardMode) {
        btnMode.innerText = "MODE: HARD 🔥";
        btnMode.style.background = "#FF0000";
        btnMode.style.boxShadow = "0 4px 0 #CC0000";
    } else {
        btnMode.innerText = "MODE: EASY 🌊";
        btnMode.style.background = "#32CD32";
        btnMode.style.boxShadow = "0 4px 0 #228B22";
    }
});

document.getElementById('btn-keyboard').addEventListener('click', () => {
    document.getElementById('btn-start').style.display = 'inline-block';
    mainCommand.innerText = "KEYBOARD MODE";
});

window.addEventListener('keydown', (e) => {
    if (currentPhaseIndex >= 0 && currentPhaseIndex < 3) {
        const key = e.key.toLowerCase();
        if (keyMap[key]) {
            // Simulating an action. Normally the keyboard simulates the CORRECT action,
            // but if you want to test Hard mode failures, press "P" for a wrong move!
            let actionToSend = sequence[currentPhaseIndex].phase;
            if (key === 'p') actionToSend = "PADDLE"; // Use 'P' to force a paddle error in balance phase
            
            handleInput(`${keyMap[key]}:${actionToSend}`);
        }
    }
});
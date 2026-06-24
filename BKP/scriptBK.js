let countdown = null;
let totalSeconds = 0;
let isOvertime = false;
let currentMode = "";
let hasArt = false;
let wakeLock = null; // Variável para a Screen Wake Lock API

const body = document.body;
const timerTxt = document.getElementById('main-timer');
const statusTxt = document.getElementById('status-header');
const overtimeLabel = document.getElementById('overtime-label');
const artOverlay = document.getElementById('art-overlay');
const displayLayer = document.getElementById('display-layer');

// FUNÇÃO PARA ATIVAR O BLOQUEIO DE SUSPENSÃO
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Bloqueio de suspensão ativado');
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

// FUNÇÃO PARA LIBERAR O BLOQUEIO
function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
        console.log('Bloqueio de suspensão liberado');
    }
}

function showUI() { body.classList.add('show-menu'); }
function hideUI() { 
    if (currentMode || hasArt) {
        body.classList.remove('show-menu'); 
    }
}

function handleArtUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            artOverlay.style.backgroundImage = `url('${e.target.result}')`;
            hasArt = true;
            if (!currentMode) {
                displayLayer.style.opacity = "0";
                artOverlay.style.display = "block";
            }
            hideUI();
        };
        reader.readAsDataURL(file);
    }
}

function initTimer(mode) {
    if (countdown) { clearInterval(countdown); countdown = null; }
    
    currentMode = mode;
    isOvertime = false;
    
    // ATIVA O BLOQUEIO DE SUSPENSÃO AO INICIAR
    requestWakeLock();
    
    displayLayer.style.opacity = "1";
    artOverlay.style.display = 'none';
    hideUI();
    
    body.style.backgroundColor = "var(--bg-color)";
    timerTxt.style.color = "var(--text-color)";
    overtimeLabel.style.visibility = 'hidden';
    
    let configId = (mode === 'PRODUÇÃO') ? 'cfg-producao' : (mode === 'APRESENTAÇÃO' ? 'cfg-apresentacao' : 'cfg-limpeza');
    totalSeconds = parseInt(document.getElementById(configId).value) * 60;
    
    statusTxt.innerText = mode;
    statusTxt.style.color = "var(--text-color)";
    updateDisplay();

    countdown = setInterval(() => {
        if (!isOvertime) {
            totalSeconds--;
            
            if (currentMode === 'APRESENTAÇÃO' && totalSeconds <= 300 && totalSeconds > 0) {
                body.style.backgroundColor = "var(--warning-bg)";
                timerTxt.style.color = 'var(--warning-color)';
                statusTxt.innerText = "RETA FINAL";
                statusTxt.style.color = "var(--warning-color)";
            }

            if (totalSeconds <= 0) {
                if (currentMode === 'PRODUÇÃO') {
                    initTimer('APRESENTAÇÃO');
                } else if (currentMode === 'APRESENTAÇÃO') {
                    isOvertime = true;
                    body.style.backgroundColor = "var(--danger-bg)";
                    overtimeLabel.style.visibility = 'visible';
                    timerTxt.style.color = 'var(--danger-color)';
                    statusTxt.innerText = "TEMPO ESGOTADO";
                    statusTxt.style.color = "var(--danger-color)";
                } else {
                    stopAll();
                }
            }
        } else {
            totalSeconds++;
        }
        updateDisplay();
    }, 1000);
}

function updateDisplay() {
    const abs = Math.abs(totalSeconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    timerTxt.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function stopAll() {
    if (countdown) { clearInterval(countdown); countdown = null; }
    
    // LIBERA O BLOQUEIO DE SUSPENSÃO AO PARAR TUDO
    releaseWakeLock();
    
    isOvertime = false;
    currentMode = "";
    totalSeconds = 0;
    
    if (hasArt) {
        displayLayer.style.opacity = "0";
        artOverlay.style.display = 'block';
    } else {
        displayLayer.style.opacity = "1";
    }
    
    body.style.backgroundColor = "var(--bg-color)";
    timerTxt.innerText = "00:00";
    statusTxt.innerText = "PRONTO";
    statusTxt.style.color = "var(--text-color)";
    overtimeLabel.style.visibility = 'hidden';
    showUI();
}

function toggleFS() { 
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

// Reativa o bloqueio se o usuário alternar abas e voltar para o cronômetro
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
    }
});

document.addEventListener('keydown', (e) => { if (e.key === "Escape") stopAll(); });
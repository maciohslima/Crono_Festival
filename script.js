let countdown;
let totalSeconds;
let isOvertime = false;
let currentMode = "";

const body = document.body;
const timerTxt = document.getElementById('main-timer');
const statusTxt = document.getElementById('status-header');
const overtimeLabel = document.getElementById('overtime-label');
const bgImageLayer = document.getElementById('bg-image-layer');

// NOVO: Função para carregar a imagem escolhida pelo usuário
function changeBackgroundImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bgImageLayer.style.backgroundImage = `url('${e.target.result}')`;
        }
        reader.readAsDataURL(file);
    }
}

function initTimer(mode) {
    clearInterval(countdown);
    
    currentMode = mode;
    isOvertime = false;
    
    // Esconde o painel e oculta a imagem de fundo imediatamente
    body.classList.add('hidden-ui', 'counting');
    body.classList.remove('bg-success', 'bg-warning', 'bg-danger');
    
    let configId = '';
    switch(mode) {
        case 'PRODUÇÃO': configId = 'cfg-producao'; break;
        case 'APRESENTAÇÃO': configId = 'cfg-apresentacao'; break;
        case 'LIMPEZA': configId = 'cfg-limpeza'; break;
    }
    
    const mins = document.getElementById(configId).value;
    totalSeconds = parseInt(mins) * 60;
    
    statusTxt.innerText = mode;
    
    if (currentMode === 'APRESENTAÇÃO') {
        body.classList.add('bg-success'); 
        statusTxt.style.color = "var(--accent-color)"; 
        timerTxt.style.color = "var(--accent-color)";
    } else {
        statusTxt.style.color = "var(--text-color)";
        timerTxt.style.color = "var(--text-color)";
    }
    
    overtimeLabel.style.visibility = 'hidden';
    updateDisplay();

    countdown = setInterval(() => {
        if (!isOvertime) {
            totalSeconds--;
            
            if (currentMode === 'APRESENTAÇÃO' && totalSeconds <= 300 && totalSeconds > 0) {
                body.classList.remove('bg-success', 'bg-danger');
                body.classList.add('bg-warning');
                
                statusTxt.innerText = "RETA FINAL";
                statusTxt.style.color = 'var(--warning-color)';
                timerTxt.style.color = 'var(--warning-color)';
            }

            if (totalSeconds <= 0) {
                if (currentMode === 'PRODUÇÃO') {
                    clearInterval(countdown);
                    body.classList.remove('bg-success', 'bg-warning', 'bg-danger');
                    initTimer('APRESENTAÇÃO'); 
                } else if (currentMode === 'APRESENTAÇÃO') {
                    isOvertime = true;
                    body.classList.remove('bg-success', 'bg-warning');
                    body.classList.add('bg-danger'); 
                    overtimeLabel.style.visibility = 'visible';
                    
                    statusTxt.innerText = "TEMPO ESGOTADO";
                    statusTxt.style.color = 'var(--danger-color)';
                    timerTxt.style.color = 'var(--danger-color)';
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
    clearInterval(countdown);
    isOvertime = false;
    currentMode = "";
    totalSeconds = 0;
    timerTxt.innerText = "00:00";
    
    timerTxt.style.color = "#ffffff";
    statusTxt.innerText = "PRONTO";
    statusTxt.style.color = "#ffffff";
    
    overtimeLabel.style.visibility = 'hidden';
    
    // Faz a imagem de fundo escolhida voltar a aparecer e limpa cores de estado
    body.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'counting'); 
    showUI(); 
}

function showUI() { 
    body.classList.remove('hidden-ui'); 
}

function toggleFS() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") stopAll();
});

function showUI() { 
    body.classList.remove('hidden-ui'); 
}

// NOVO: Função para recolher o painel automaticamente ao tirar o mouse
function hideUI() {
    // Opcional: Se você quiser que o menu NUNCA suma no estado PRONTO, 
    // pode usar: if (currentMode !== "") body.classList.add('hidden-ui');
    // Caso queira que ele suma sempre (mesmo no PRONTO), deixe apenas a linha abaixo:
    body.classList.add('hidden-ui');
}
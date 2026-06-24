/* ==========================================================================
   PROJETO: Cronômetro Festival de Quadrilhas (PWA / Desktop)
   DATA DE VERSÃO: 23 de Junho de 2026
   @author maciohsdelima
   MODIFICAÇÃO: Implementação da trava isPaused e escuta do caractere "Espaço".
========================================================================== 
*/

let countdown;
let totalSeconds;
let isOvertime = false;
let isPaused = false; // Controla se o fluxo temporal está retido
let currentMode = "";

const body = document.body;
const timerTxt = document.getElementById('main-timer');
const statusTxt = document.getElementById('status-header');
const overtimeLabel = document.getElementById('overtime-label');
const bgImageLayer = document.getElementById('bg-image-layer');

const DEFAULTS = {
    producao: 12,
    apresentacao: 45,
    saida: 5,
    limpeza: 10
};

function loadSettings() {
    document.getElementById('cfg-producao').value = localStorage.getItem('cfg-producao') || DEFAULTS.producao;
    document.getElementById('cfg-apresentacao').value = localStorage.getItem('cfg-apresentacao') || DEFAULTS.apresentacao;
    document.getElementById('cfg-saida').value = localStorage.getItem('cfg-saida') || DEFAULTS.saida;
    document.getElementById('cfg-limpeza').value = localStorage.getItem('cfg-limpeza') || DEFAULTS.limpeza;

    const savedBg = localStorage.getItem('cfg-bg-image');
    if (savedBg) {
        bgImageLayer.style.backgroundImage = `url('${savedBg}')`;
    }
}

function changeBackgroundImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            bgImageLayer.style.backgroundImage = `url('${base64Image}')`;
            try {
                localStorage.setItem('cfg-bg-image', base64Image);
            } catch (error) {
                console.error("Imagem muito pesada para salvar no LocalStorage. Tente usar uma imagem menor que 4MB.", error);
            }
        }
        reader.readAsDataURL(file);
    }
}

// Inverte o estado de pausa e atualiza as strings de status na tela
function togglePause() {
    // Só permite pausar se houver um timer ativamente instanciado e rodando
    if (!countdown || currentMode === "") return;

    isPaused = !isPaused;

    const btnPause = document.querySelector('.btn-pause');

    if (isPaused) {
        body.classList.add('paused-state');
        statusTxt.innerText = "PAUSADO";
        if (btnPause) btnPause.innerText = "Retomar (Espaço)";
    } else {
        body.classList.remove('paused-state');
        if (btnPause) btnPause.innerText = "Pausar (Espaço)";
        
        // Reconstrói a string correta baseado no estágio atual do cronômetro
        if (isOvertime) {
            statusTxt.innerText = "TEMPO ESGOTADO";
        } else if (currentMode === 'APRESENTAÇÃO' && totalSeconds <= 300) {
            statusTxt.innerText = "RETA FINAL";
        } else {
            statusTxt.innerText = currentMode;
        }
    }
}

function initTimer(mode) {
    clearInterval(countdown);
    
    currentMode = mode;
    isOvertime = false;
    isPaused = false; // Reseta o estado de pausa ao iniciar um novo ciclo
    
    const btnPause = document.querySelector('.btn-pause');
    if (btnPause) btnPause.innerText = "Pausar (Espaço)";
    
    body.classList.add('hidden-ui', 'counting');
    body.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-orange', 'paused-state');
    
    let configId = '';
    switch(mode) {
        case 'PRODUÇÃO': configId = 'cfg-producao'; break;
        case 'APRESENTAÇÃO': configId = 'cfg-apresentacao'; break;
        case 'SAÍDA QUADRILHA': configId = 'cfg-saida'; break;
        case 'LIMPEZA ARRAIAL': configId = 'cfg-limpeza'; break;
    }
    
    const mins = document.getElementById(configId).value;
    localStorage.setItem(configId, mins);
    
    totalSeconds = parseInt(mins) * 60;
    statusTxt.innerText = mode;
    
    if (currentMode === 'APRESENTAÇÃO') {
        body.classList.add('bg-success'); 
    } else if (currentMode === 'SAÍDA QUADRILHA' || currentMode === 'LIMPEZA ARRAIAL') {
        body.classList.add('bg-orange'); 
    }
    
    statusTxt.style.color = "var(--accent-color)"; 
    timerTxt.style.color = "var(--accent-color)";
    
    overtimeLabel.style.visibility = 'hidden';
    updateDisplay();

    countdown = setInterval(() => {
        // Se a mesa pausou o cronômetro, ignora o bloco lógico e mantém os valores intactos
        if (isPaused) return;

        if (!isOvertime) {
            totalSeconds--;
            
            if (currentMode === 'APRESENTAÇÃO' && totalSeconds <= 300 && totalSeconds > 0) {
                body.classList.remove('bg-success', 'bg-danger', 'bg-orange');
                body.classList.add('bg-warning');
                
                statusTxt.innerText = "RETA FINAL";
                statusTxt.style.color = 'var(--warning-color)';
                timerTxt.style.color = 'var(--warning-color)';
            }

            if (totalSeconds <= 0) {
                if (currentMode === 'PRODUÇÃO') {
                    clearInterval(countdown);
                    body.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-orange');
                    initTimer('APRESENTAÇÃO'); 
                } else if (currentMode === 'APRESENTAÇÃO') {
                    isOvertime = true;
                    body.classList.remove('bg-success', 'bg-warning', 'bg-orange');
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
    isPaused = false;
    currentMode = "";
    totalSeconds = 0;
    timerTxt.innerText = "00:00";
    
    timerTxt.style.color = "#ffffff";
    statusTxt.innerText = "PRONTO";
    statusTxt.style.color = "#ffffff";
    
    overtimeLabel.style.visibility = 'hidden';
    
    const btnPause = document.querySelector('.btn-pause');
    if (btnPause) btnPause.innerText = "Pausar (Espaço)";
    
    body.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-orange', 'counting', 'paused-state'); 
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

// Escuta ativa de atalhos globais do teclado
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        stopAll();
    }
    
    // Captura o clique da tecla Espaço para gerenciamento rápido
    if (e.key === " " || e.key === "Spacebar") {
        // Evita que a página dê rolagem (scroll) ao apertar a barra de espaço
        e.preventDefault();
        togglePause();
    }
});

function hideUI() {
    body.classList.add('hidden-ui');
}

loadSettings();
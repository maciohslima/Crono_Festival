let countdown;
let totalSeconds;
let isOvertime = false;
let currentMode = "";

const body = document.body;
const timerTxt = document.getElementById('main-timer');
const statusTxt = document.getElementById('status-header');
const overtimeLabel = document.getElementById('overtime-label');
const bgImageLayer = document.getElementById('bg-image-layer');

// Configurações padrão iniciais
const DEFAULTS = {
    producao: 12,
    apresentacao: 45,
    saida: 5,
    limpeza: 10
};

// Carrega as configurações guardadas no navegador assim que inicia
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

function initTimer(mode) {
    clearInterval(countdown);
    
    currentMode = mode;
    isOvertime = false;
    
    body.classList.add('hidden-ui', 'counting');
    body.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-orange');
    
    let configId = '';
    switch(mode) {
        case 'PRODUÇÃO': configId = 'cfg-producao'; break;
        case 'APRESENTAÇÃO': configId = 'cfg-apresentacao'; break;
        case 'SAÍDA QUADRILHA': configId = 'cfg-saida'; break;
        case 'LIMPEZA ARRAIAL': configId = 'cfg-limpeza'; break; // Mapeado para o novo nome do modo
    }
    
    const mins = document.getElementById(configId).value;
    
    // Salva o valor atual do input no LocalStorage
    localStorage.setItem(configId, mins);
    
    totalSeconds = parseInt(mins) * 60;
    
    statusTxt.innerText = mode;
    
    // Configuração das cores de fundo dinâmicas por modo
    if (currentMode === 'APRESENTAÇÃO') {
        body.classList.add('bg-success'); 
    } else if (currentMode === 'SAÍDA QUADRILHA' || currentMode === 'LIMPEZA ARRAIAL') {
        body.classList.add('bg-orange'); // Define a cor laranja para Saída e Limpeza Arraial
    }
    
    // Mantém o texto em branco para os modos padrão, verde e laranja
    statusTxt.style.color = "var(--accent-color)"; 
    timerTxt.style.color = "var(--accent-color)";
    
    overtimeLabel.style.visibility = 'hidden';
    updateDisplay();

    countdown = setInterval(() => {
        if (!isOvertime) {
            totalSeconds--;
            
            // Reta final apenas no modo Apresentação (5 minutos restantes)
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
    currentMode = "";
    totalSeconds = 0;
    timerTxt.innerText = "00:00";
    
    timerTxt.style.color = "#ffffff";
    statusTxt.innerText = "PRONTO";
    statusTxt.style.color = "#ffffff";
    
    overtimeLabel.style.visibility = 'hidden';
    
    body.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-orange', 'counting'); 
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

function hideUI() {
    body.classList.add('hidden-ui');
}

// Inicializa o estado das configurações gravadas
loadSettings();
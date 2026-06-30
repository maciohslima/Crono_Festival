/* ===================================================================================
Project:        Cronômetro Festival de Quadrilhas
Description:    Aplicação web (PWA) desenvolvida para gerenciar e cronometrar os 
                tempos das etapas de um Festival de Quadrilhas (Produção, 
                Apresentação, Saída e Limpeza). Possui suporte a alertas de tempo 
                excedido, modo tela cheia e customização de imagem de fundo.
@author:        Mácio Helton Silveira de Lima
@modified:      30/06/2026
@version:       1.1.0
=================================================================================== */

// ==========================================
// VARIÁVEIS GLOBAIS E ESTADOS DO SISTEMA
// ==========================================
let countdown;          // Armazena a instância do setInterval do cronômetro ativo
let totalSeconds;       // Contador numérico absoluto de segundos restantes ou excedidos
let isOvertime = false; // Flag que indica se o tempo limite da apresentação estourou
let isPaused = false;   // Flag que controla se o fluxo temporal está retido (pausado)
let currentMode = "";   // String com o nome da etapa atual (PRODUÇÃO, APRESENTAÇÃO, etc.)

// Atatalhos para elementos frequentemente manipulados do DOM
const body = document.body;
const timerTxt = document.getElementById('main-timer');
const statusTxt = document.getElementById('status-header');
const overtimeLabel = document.getElementById('overtime-label');
const bgImageLayer = document.getElementById('bg-image-layer');

// Configuração padrão de tempos (em minutos) caso não haja nada salvo no navegador
const DEFAULTS = { 
    producao: 12, 
    apresentacao: 45, 
    saida: 5, 
    limpeza: 10 
};

// ==========================================
// FUNÇÕES DE CONFIGURAÇÃO E PERSISTÊNCIA
// ==========================================

/**
 * Carrega as configurações salvas no armazenamento local do navegador (LocalStorage).
 * Se for a primeira execução, define os valores numéricos contidos no objeto DEFAULTS.
 */
function loadSettings() {
    document.getElementById('cfg-producao').value = localStorage.getItem('cfg-producao') || DEFAULTS.producao;
    document.getElementById('cfg-apresentacao').value = localStorage.getItem('cfg-apresentacao') || DEFAULTS.apresentacao;
    document.getElementById('cfg-saida').value = localStorage.getItem('cfg-saida') || DEFAULTS.saida;
    document.getElementById('cfg-limpeza').value = localStorage.getItem('cfg-limpeza') || DEFAULTS.limpeza;
    
    // Recupera a imagem de fundo customizada salvada em formato string Base64
    const savedBg = localStorage.getItem('cfg-bg-image');
    if (savedBg) {
        bgImageLayer.style.backgroundImage = `url('${savedBg}')`;
    }
}

/**
 * Lê o arquivo de imagem enviado pelo usuário, converte para Base64 e 
 * aplica instantaneamente como plano de fundo da aplicação, salvando no cache.
 */
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

// ==========================================
// CONTROLES DE FLUXO (PAUSA E EXECUÇÃO)
// ==========================================

/**
 * Alterna o estado de pausa. Interrompe a contagem regressiva visual/lógica 
 * sem resetar os segundos atuais e atualiza os textos de status na tela.
 */
function togglePause() {
    // Só permite pausar se houver um cronômetro ativamente instanciado e rodando
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
        
        // Reconstrói o letreiro em tempo real baseado no estágio em que foi despausado
        if (isOvertime) {
            statusTxt.innerText = "TEMPO ESGOTADO";
        } else if (currentMode === 'APRESENTAÇÃO' && totalSeconds <= 300) {
            statusTxt.innerText = "RETA FINAL";
        } else {
            statusTxt.innerText = currentMode;
        }
    }
}

/**
 * Inicializa um novo ciclo de contagem baseado na etapa selecionada.
 * Limpa intervalos anteriores, redefine cores de fundo e inicia o motor do cronômetro.
 * @param {string} mode - O nome da etapa ('PRODUÇÃO', 'APRESENTAÇÃO', etc.)
 */
function initTimer(mode) {
    clearInterval(countdown);
    currentMode = mode;
    isOvertime = false;
    isPaused = false; // Reseta o estado de pausa ao iniciar um novo ciclo
    
    const btnPause = document.querySelector('.btn-pause');
    if (btnPause) btnPause.innerText = "Pausar (Espaço)";
    
    // Altera classes CSS do corpo para ocultar a interface de inputs e resetar cores antigas
    body.classList.add('hidden-ui', 'counting');
    body.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-orange', 'paused-state');
    
    let configId = '';
    switch(mode) {
        case 'PRODUÇÃO': configId = 'cfg-producao'; break;
        case 'APRESENTAÇÃO': configId = 'cfg-apresentacao'; break;
        case 'SAÍDA QUADRILHA': configId = 'cfg-saida'; break;
        case 'LIMPEZA ARRAIAL': configId = 'cfg-limpeza'; break;
    }
    
    // Captura os minutos configurados no input do HTML, salva no cache e converte para segundos totais
    const mins = document.getElementById(configId).value;
    localStorage.setItem(configId, mins);
    totalSeconds = parseInt(mins) * 60;
    
    statusTxt.innerText = mode;
    
    // Define a identidade de cores padrão de cada etapa do evento
    if (currentMode === 'APRESENTAÇÃO') {
        body.classList.add('bg-success');
    } else if (currentMode === 'SAÍDA QUADRILHA' || currentMode === 'LIMPEZA ARRAIAL') {
        body.classList.add('bg-orange');
    }
    
    statusTxt.style.color = "var(--accent-color)";
    timerTxt.style.color = "var(--accent-color)";
    overtimeLabel.style.visibility = 'hidden';
    
    updateDisplay();
    
    // LOOP PRINCIPAL: Executado a cada 1 segundo (1000ms)
    countdown = setInterval(() => {
        // Se a mesa técnica pausou o cronômetro, ignora o bloco lógico e mantém os valores intactos
        if (isPaused) return;
        
        if (!isOvertime) {
            totalSeconds--;
            
            // Regra especial da Apresentação: Faltando 5 minutos (300 segundos), entra em RETA FINAL (Amarelo)
            if (currentMode === 'APRESENTAÇÃO' && totalSeconds <= 300 && totalSeconds > 0) {
                body.classList.remove('bg-success', 'bg-danger', 'bg-orange');
                body.classList.add('bg-warning');
                statusTxt.innerText = "RETA FINAL";
                statusTxt.style.color = 'var(--warning-color)';
                timerTxt.style.color = 'var(--warning-color)';
            }
            
            // Tratamento para quando o cronômetro chega a zero
            if (totalSeconds <= 0) {
                if (currentMode === 'PRODUÇÃO') {
                    // Quando a produção encerra, engata automaticamente a etapa de Apresentação
                    clearInterval(countdown);
                    body.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-orange');
                    initTimer('APRESENTAÇÃO');
                } else if (currentMode === 'APRESENTAÇÃO') {
                    // Se estourar o tempo da apresentação, ativa o modo Overtime (Contagem progressiva de atraso)
                    isOvertime = true;
                    body.classList.remove('bg-success', 'bg-warning', 'bg-orange');
                    body.classList.add('bg-danger');
                    overtimeLabel.style.visibility = 'visible';
                    statusTxt.innerText = "TEMPO ESGOTADO";
                    statusTxt.style.color = 'var(--danger-color)';
                    timerTxt.style.color = 'var(--danger-color)';
                } else {
                    // Para as outras etapas menores, apenas encerra e limpa o painel
                    stopAll();
                }
            }
        } else {
            // Em modo de tempo esgotado (Overtime), os segundos sobem progressivamente em vez de descer
            totalSeconds++;
        }
        
        updateDisplay();
    }, 1000);
}

// ==========================================
// RECURSOS VISUAIS E INTERFACE DO USUÁRIO
// ==========================================

/**
 * Formata os segundos absolutos em string estruturada no padrão MM:SS 
 * aplicando preenchimento de zeros à esquerda (ex: 05:02).
 */
function updateDisplay() {
    const abs = Math.abs(totalSeconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    timerTxt.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Para completamente qualquer cronômetro em execução, reinicializa todas as flags de estado 
 * e zera o display visual retornando a aplicação ao modo de espera ("PRONTO").
 */
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

/**
 * Remove a classe que esconde o painel de configurações, tornando o rodapé visível.
 */
function showUI() {
    body.classList.remove('hidden-ui');
}

/**
 * Adiciona a classe que esconde o painel de configurações (geralmente disparado ao tirar o mouse do rodapé).
 */
function hideUI() {
    body.classList.add('hidden-ui');
}

/**
 * Gerencia a ativação e desativação do modo nativo de Tela Cheia (Fullscreen) no navegador.
 */
function toggleFS() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ==========================================
// ESCUTAS DE EVENTOS DE TECLADO (ATALHOS)
// ==========================================
document.addEventListener('keydown', (e) => {
    // Atalho tecla ESC: Interrompe e reseta todo o sistema imediatamente
    if (e.key === "Escape") {
        stopAll();
    }
    
    // Atalho Barra de Espaço: Atalho rápido para pausar ou retomar a contagem atual
    if (e.key === " " || e.key === "Spacebar") {
        // Evita o comportamento nativo de rolagem (scroll) da página ao pressionar espaço
        e.preventDefault(); 
        togglePause();
    }
});

// ==========================================
// INICIALIZAÇÃO AUTOMÁTICA
// ==========================================
// Executa o carregamento inicial de dados assim que o script terminar de ser lido
loadSettings();

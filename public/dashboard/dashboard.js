// Configurações
const CONTRACT_ADDRESS = '0xAa494176e662a52648CF127d6A720bDE89929420';
const BSCSCAN_API_KEY = 'YourApiKeyToken'; // Substitua por sua chave se quiser
const UPDATE_INTERVAL = 30000; // 30 segundos

// ABI simplificado do contrato EPI Token
const EPI_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getPrice",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalLiquidity",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getHoldersCount",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }
];

// Variáveis globais
let web3;
let epiContract;
let priceChart;
let priceHistory = [];
let isConnected = false;

// Inicialização quando a página carrega
window.addEventListener('load', async () => {
    try {
        await initWeb3();
        await initContract();
        initChart();
        await updateAllData();
        
        // Atualizar dados periodicamente
        setInterval(updateAllData, UPDATE_INTERVAL);
    } catch (error) {
        console.error("Erro na inicialização:", error);
        updateConnectionStatus(false, "Erro na inicialização");
    }
});

// Inicializar Web3
async function initWeb3() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.ethereum);
            updateConnectionStatus(true);
            
            // Listeners para mudanças
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());
            
        } catch (error) {
            console.error("Usuário negou acesso:", error);
            fallbackToPublicNode();
        }
    } else {
        fallbackToPublicNode();
    }
}

// Fallback para nó público
function fallbackToPublicNode() {
    web3 = new Web3('https://bsc-dataseed.binance.org/');
    updateConnectionStatus(false, "Usando nó público");
}

// Inicializar contrato
async function initContract() {
    epiContract = new web3.eth.Contract(EPI_ABI, CONTRACT_ADDRESS);
}

// Atualizar todos os dados
async function updateAllData() {
    try {
        const [price, liquidity, holders, supply] = await Promise.all([
            epiContract.methods.getPrice().call(),
            epiContract.methods.totalLiquidity().call(),
            epiContract.methods.getHoldersCount().call(),
            epiContract.methods.totalSupply().call()
        ]);
        
        updatePriceData(price);
        updateLiquidityData(liquidity);
        updateHoldersData(holders);
        updateSupplyData(supply);
        updateChartData(price);
        
    } catch (error) {
        console.error("Erro ao atualizar dados:", error);
        updateConnectionStatus(false, "Erro ao atualizar");
    }
}

// Atualizar dados de preço
function updatePriceData(priceWei) {
    const price = web3.utils.fromWei(priceWei, 'ether');
    document.getElementById('epi-price').textContent = parseFloat(price).toFixed(8);
    document.getElementById('price-updated').textContent = getCurrentTime();
    priceHistory.push({ time: new Date(), price: parseFloat(price) });
}

// Atualizar dados de liquidez
function updateLiquidityData(liquidityWei) {
    const liquidity = web3.utils.fromWei(liquidityWei, 'ether');
    document.getElementById('total-liquidity').textContent = parseFloat(liquidity).toFixed(4);
    document.getElementById('liquidity-updated').textContent = getCurrentTime();
}

// Atualizar dados de holders
function updateHoldersData(holders) {
    document.getElementById('holders-count').textContent = holders;
    document.getElementById('holders-updated').textContent = getCurrentTime();
}

// Atualizar dados de supply
function updateSupplyData(supplyWei) {
    const supply = web3.utils.fromWei(supplyWei, 'ether');
    document.getElementById('total-supply').textContent = 
        parseFloat(supply).toLocaleString('pt-BR', {maximumFractionDigits: 2});
}

// Inicializar gráfico
function initChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Preço EPI/BNB',
                data: [],
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Atualizar gráfico
function updateChartData(priceWei) {
    const price = parseFloat(web3.utils.fromWei(priceWei, 'ether'));
    const now = new Date();
    const timeLabel = now.toLocaleTimeString();
    
    // Adicionar novo ponto (limitar a 20 pontos)
    if (priceChart.data.labels.length >= 20) {
        priceChart.data.labels.shift();
        priceChart.data.datasets[0].data.shift();
    }
    
    priceChart.data.labels.push(timeLabel);
    priceChart.data.datasets[0].data.push(price);
    priceChart.update();
}

// Atualizar status de conexão
function updateConnectionStatus(connected, message = "") {
    isConnected = connected;
    const statusElement = document.getElementById('connection-status');
    
    if (connected) {
        statusElement.textContent = '🟢 Conectado';
        statusElement.className = 'connection-status connected';
    } else {
        statusElement.textContent = `🔴 ${message || 'Desconectado'}`;
        statusElement.className = 'connection-status disconnected';
    }
}

// Obter hora atual formatada
function getCurrentTime() {
    return new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
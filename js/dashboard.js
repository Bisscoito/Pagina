// Variáveis globais
let epiContract;
let priceChart;
let isConnected = false;

// Inicialização quando a página carregar
window.addEventListener('load', async () => {
    try {
        await initWeb3();
        await initContract();
        initChart();
        await updateData();
        
        // Atualizar a cada 30 segundos
        setInterval(updateData, 30000);
    } catch (error) {
        console.error("Erro na inicialização:", error);
        updateConnectionStatus(false);
    }
});

// Conectar ao Web3
async function initWeb3() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            window.web3 = new Web3(window.ethereum);
            
            updateConnectionStatus(true);
            
            window.ethereum.on('accountsChanged', () => {
                window.location.reload();
            });
            
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
            
        } catch (error) {
            console.error("Usuário negou acesso à conta:", error);
            fallbackToBSC();
        }
    } else {
        fallbackToBSC();
    }
}

function fallbackToBSC() {
    console.log("Usando Binance Smart Chain como fallback");
    window.web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/'));
    updateConnectionStatus(false, "Usando nó público da BSC");
}

function updateConnectionStatus(connected, message = "") {
    isConnected = connected;
    const statusElement = document.getElementById('connection-status');
    
    if (connected) {
        statusElement.className = "connection-status connected";
        statusElement.innerHTML = "🟢 Conectado à blockchain";
    } else {
        statusElement.className = "connection-status disconnected";
        statusElement.innerHTML = `🔴 ${message || "Desconectado da blockchain"}`;
    }
}

async function initContract() {
    const contractAddress = '0xSEU_ENDERECO_DO_CONTRATO'; // Substitua
    const contractABI = []; // Cole o ABI aqui
    
    if (!contractAddress || contractABI.length === 0) {
        throw new Error("Configure o contrato primeiro");
    }
    
    epiContract = new web3.eth.Contract(contractABI, contractAddress);
}

async function updateData() {
    if (!epiContract) {
        console.error("Contrato não inicializado");
        return;
    }

    try {
        const [price, liquidity, holders] = await Promise.all([
            epiContract.methods.getPrice().call(),
            epiContract.methods.totalLiquidity().call(),
            epiContract.methods.getHoldersCount().call()
        ]);
        
        document.getElementById('epi-price').textContent = `${formatNumber(web3.utils.fromWei(price))} BNB`;
        document.getElementById('total-liquidity').textContent = `${formatNumber(web3.utils.fromWei(liquidity))} BNB`;
        document.getElementById('holders-count').textContent = formatNumber(holders);
        
        updateChart(price);
        
    } catch (error) {
        console.error("Erro ao atualizar dados:", error);
        updateConnectionStatus(false, "Erro ao conectar com o contrato");
    }
}

function formatNumber(value) {
    const num = Number(value);
    if (isNaN(num)) return value;
    
    return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });
}

function initChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Preço EPI (BNB)',
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
                    labels: {
                        color: '#ecf0f1'
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#ecf0f1' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#ecf0f1' },
                    beginAtZero: false
                }
            }
        }
    });
}

function updateChart(newPrice) {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR');
    
    priceChart.data.labels.push(time);
    priceChart.data.datasets[0].data.push(Number(web3.utils.fromWei(newPrice)));
    
    if (priceChart.data.labels.length > 20) {
        priceChart.data.labels.shift();
        priceChart.data.datasets[0].data.shift();
    }
    
    priceChart.update();
}

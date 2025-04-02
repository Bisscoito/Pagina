let epiContract;
let priceChart;

// Inicialização quando a página carregar
window.addEventListener('load', async () => {
  await initWeb3();
  await initContract();
  initChart();
  updateData();
  
  // Atualizar a cada 30 segundos
  setInterval(updateData, 30000);
});

// Conectar ao Web3
async function initWeb3() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      window.web3 = new Web3(window.ethereum);
    } catch (error) {
      console.error("Usuário negou acesso à conta");
      fallbackToInfura();
    }
  } else {
    fallbackToInfura();
  }
}

function fallbackToInfura() {
  console.log("Usando provider Infura como fallback");
  window.web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/'));
}

// Inicializar contrato
async function initContract() {
  // ATUALIZE COM SEU CONTRACT ABI E ENDEREÇO
  const contractAddress = '0xSEU_ENDERECO_DO_CONTRATO';
  const contractABI = []; // Cole o ABI completo aqui
  
  epiContract = new web3.eth.Contract(contractABI, contractAddress);
}

// Atualizar dados do dashboard
async function updateData() {
  try {
    const results = await Promise.all([
      epiContract.methods.getPrice().call(),
      epiContract.methods.totalLiquidity().call(),
      epiContract.methods.getHoldersCount().call()
    ]);
    
    document.getElementById('epi-price').textContent = `${web3.utils.fromWei(results[0])} BNB`;
    document.getElementById('total-liquidity').textContent = `${web3.utils.fromWei(results[1])} BNB`;
    document.getElementById('holders-count').textContent = results[2];
    
    updateChart(results[0]);
    
  } catch (error) {
    console.error("Erro ao atualizar dados:", error);
  }
}

// Configurar gráfico
function initChart() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Preço EPI (BNB)',
        data: [],
        borderColor: '#3498db',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

// Atualizar gráfico
function updateChart(newPrice) {
  const now = new Date();
  const time = now.toLocaleTimeString();
  
  priceChart.data.labels.push(time);
  priceChart.data.datasets[0].data.push(Number(web3.utils.fromWei(newPrice)));
  
  // Manter apenas os últimos 20 pontos
  if (priceChart.data.labels.length > 20) {
    priceChart.data.labels.shift();
    priceChart.data.datasets[0].data.shift();
  }
  
  priceChart.update();
}

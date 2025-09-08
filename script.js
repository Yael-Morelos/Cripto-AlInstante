// Variables globales
let allCryptos = [];
let currentChart = null;

// Mostrar sección
function showSection(id) {
  document.querySelectorAll('section[id]').forEach(sec => {
    sec.classList.remove('active-section');
    sec.classList.add('hidden-section');
  });

  document.getElementById(id).classList.remove('hidden-section');
  document.getElementById(id).classList.add('active-section');

  // Actualizar menú
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`.nav-link[href="#${id}"]`).classList.add('active');
}

// Cargar criptomonedas
async function loadCryptos() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
    const data = await res.json();
    allCryptos = data;
    displayCryptos(data);
    populateCalculatorDropdown(data);
  } catch (error) {
    console.error("Error cargando criptomonedas:", error);
    document.getElementById('cryptoList').innerHTML = '<p>Error al cargar datos.</p>';
  }
}

// Mostrar criptomonedas
function displayCryptos(cryptos) {
  const container = document.getElementById('cryptoList');
  container.innerHTML = '';

  cryptos.forEach(crypto => {
    const changeClass = crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
    const changeSign = crypto.price_change_percentage_24h >= 0 ? '+' : '';

    const card = document.createElement('div');
    card.className = 'crypto-card';
    card.onclick = () => {
      showSection('graficos');
      loadChart(crypto.id, crypto.name);
    };

    card.innerHTML = `
      <h3>
        <img src="${crypto.image}" alt="${crypto.name}">
        ${crypto.name} (${crypto.symbol.toUpperCase()})
      </h3>
      <div class="price">$${crypto.current_price.toLocaleString()}</div>
      <div class="change ${changeClass}">
        ${changeSign}${crypto.price_change_percentage_24h.toFixed(2)}% (24h)
      </div>
    `;
    container.appendChild(card);
  });
}

// Buscador
document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allCryptos.filter(c =>
    c.name.toLowerCase().includes(term) ||
    c.symbol.toLowerCase().includes(term)
  );
  displayCryptos(filtered);
});

// Llenar dropdown de calculadora
function populateCalculatorDropdown(cryptos) {
  const select = document.getElementById('cryptoSelect');
  select.innerHTML = '';

  cryptos.forEach(c => {
    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = `${c.name} (${c.symbol.toUpperCase()})`;
    select.appendChild(option);
  });
}

// Calculadora de ganancias
async function calculateProfit() {
  const cryptoId = document.getElementById('cryptoSelect').value;
  const invested = parseFloat(document.getElementById('amountInvested').value);
  const buyPrice = parseFloat(document.getElementById('buyPrice').value);

  if (!invested || !buyPrice || !cryptoId) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
    const data = await res.json();
    const currentPrice = data[cryptoId].usd;

    const quantity = invested / buyPrice;
    const currentValue = quantity * currentPrice;
    const profit = currentValue - invested;
    const profitPercent = (profit / invested) * 100;

    const resultDiv = document.getElementById('profitResult');
    resultDiv.innerHTML = `
      <strong>Valor actual:</strong> $${currentValue.toFixed(2)}<br>
      <strong>Ganancia:</strong> $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)
    `;
    resultDiv.style.color = profit >= 0 ? '#22c55e' : '#ef4444';
  } catch (error) {
    alert("No se pudo obtener el precio actual.");
  }
}

// Cargar gráfico
async function loadChart(id, name) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=30&interval=daily`);
    const data = await res.json();

    const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString());
    const prices = data.prices.map(p => p[1]);

    if (currentChart) currentChart.destroy();

    const ctx = document.getElementById('priceChart').getContext('2d');
    currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `Precio de ${name} (USD)`,
          data: prices,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: false } }
      }
    });
  } catch (error) {
    document.getElementById('graficos').innerHTML += '<p style="color: red;">Error al cargar el gráfico.</p>';
  }
}

// Modo oscuro
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

// Inicializar
window.onload = () => {
  loadCryptos();
  showSection('mercado'); // Mostrar mercado por defecto
};
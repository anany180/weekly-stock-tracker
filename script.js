// Weekly Stock Tracker - script.js (Version 1.2 - Clean)
let stocks = JSON.parse(localStorage.getItem('stocks')) || [];

// Generate TradingView URL
function getTradingViewUrl(symbol) {
  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
  return `https://in.tradingview.com/symbols/NSE-${cleanSymbol}/`;
}

// Add Stock from Input
function addStockFromInput() {
  let input = document.getElementById('addInput').value.trim();
  if (!input) {
    alert("Please enter a symbol or TradingView link");
    return;
  }

  let symbol = "";

  // Handle TradingView link
  if (input.includes("tradingview.com")) {
    const match = input.match(/NSE-([A-Z0-9]+)/i);
    if (match && match[1]) {
      symbol = match[1] + ".NS";
    }
  } else {
    // Handle direct symbol
    symbol = input.toUpperCase().trim();
    if (!symbol.endsWith('.NS') && !symbol.endsWith('.BO')) {
      symbol += '.NS';
    }
  }

  if (symbol && !stocks.includes(symbol)) {
    stocks.push(symbol);
    localStorage.setItem('stocks', JSON.stringify(stocks));
    document.getElementById('addInput').value = '';
    renderTable();
    alert(`✅ ${symbol} added successfully!`);
  } else if (stocks.includes(symbol)) {
    alert("This stock is already in your list");
  } else {
    alert("Invalid symbol or link. Try something like RELIANCE.NS");
  }
}

// Fetch stock data
async function fetchStockData(symbol) {
  try {
    const quoteRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    const quoteData = await quoteRes.json();
    const price = quoteData.chart.result[0].meta.regularMarketPrice.toFixed(2);

    const weekRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1wk&range=1mo`);
    const weekData = await weekRes.json();
    const closes = weekData.chart.result[0].indicators.quote[0].close;
    
    let weeklyChange = 0;
    if (closes && closes.length >= 2) {
      weeklyChange = ((closes[closes.length-1] - closes[closes.length-2]) / closes[closes.length-2] * 100);
    }

    return { 
      price: price, 
      change: parseFloat(weeklyChange.toFixed(2)) 
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}`, error);
    return { price: 'N/A', change: 0 };
  }
}

// Render Table
async function renderTable() {
  const tbody = document.querySelector('#stockTable tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  for (let symbol of stocks) {
    const data = await fetchStockData(symbol);
    const changeClass = data.change >= 0 ? 'positive' : 'negative';
    const tvUrl = getTradingViewUrl(symbol);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <a href="${tvUrl}" target="_blank" rel="noopener noreferrer" class="symbol-link">
          <strong>${symbol}</strong>
        </a>
      </td>
      <td>₹${data.price}</td>
      <td class="${changeClass}">${data.change}%</td>
      <td><button onclick="removeStock('${symbol}')" class="remove-btn">Remove</button></td>
    `;
    tbody.appendChild(row);
  }
}

function removeStock(symbol) {
  stocks = stocks.filter(s => s !== symbol);
  localStorage.setItem('stocks', JSON.stringify(stocks));
  renderTable();
}

async function refreshAllData() {
  await renderTable();
  alert('✅ Data refreshed successfully!');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
});
// Clear entire watchlist
function clearWatchlist() {
  if (stocks.length === 0) {
    alert("Watchlist is already empty!");
    return;
  }

  if (confirm("⚠️ Are you sure you want to clear the entire watchlist? This cannot be undone.")) {
    stocks = [];
    localStorage.setItem('stocks', JSON.stringify(stocks));
    renderTable();
    alert("✅ Watchlist cleared successfully!");
  }
}

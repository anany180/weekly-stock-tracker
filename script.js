// Clean Version 1.4
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

function getTradingViewUrl(symbol) {
  const clean = symbol.replace('.NS', '').replace('.BO', '');
  return `https://in.tradingview.com/symbols/NSE-${clean}/`;
}

function addStock() {
  let input = document.getElementById('addInput').value.trim();
  let comment = document.getElementById('commentInput').value.trim();

  if (!input) return alert("Please enter symbol or link");

  let symbol = "";
  if (input.includes("tradingview.com")) {
    const match = input.match(/NSE-([A-Z0-9]+)/i);
    if (match) symbol = match[1] + ".NS";
  } else {
    symbol = input.toUpperCase().trim();
    if (!symbol.endsWith('.NS') && !symbol.endsWith('.BO')) symbol += '.NS';
  }

  if (!symbol) return alert("Invalid input");

  if (watchlist.some(item => item.symbol === symbol)) {
    return alert("Stock already exists");
  }

  watchlist.push({ symbol, comment });
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  
  document.getElementById('addInput').value = '';
  document.getElementById('commentInput').value = '';
  renderTable();
}

async function fetchStockData(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    const data = await res.json();
    const price = data.chart.result[0].meta.regularMarketPrice.toFixed(2);

    const weekRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1wk&range=1mo`);
    const weekData = await weekRes.json();
    const closes = weekData.chart.result[0].indicators.quote[0].close;
    let change = 0;
    if (closes?.length >= 2) {
      change = ((closes[closes.length-1] - closes[closes.length-2]) / closes[closes.length-2] * 100);
    }
    return { price, change: parseFloat(change.toFixed(2)) };
  } catch (e) {
    return { price: 'N/A', change: 0 };
  }
}

async function renderTable() {
  const tbody = document.querySelector('#stockTable tbody');
  tbody.innerHTML = '';

  for (let i = 0; i < watchlist.length; i++) {
    const item = watchlist[i];
    const data = await fetchStockData(item.symbol);
    const changeClass = data.change >= 0 ? 'positive' : 'negative';
    const tvUrl = getTradingViewUrl(item.symbol);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><a href="${tvUrl}" target="_blank" class="symbol-link">${item.symbol}</a></td>
      <td><a href="${tvUrl}" target="_blank" class="link-text">${tvUrl}</a></td>
      <td>
        <input type="text" value="${item.comment || ''}" 
               onchange="updateComment(${i}, this.value)" 
               class="comment-input" placeholder="Add comment...">
      </td>
      <td><button onclick="removeStock(${i})" class="remove-btn">Delete</button></td>
    `;
    tbody.appendChild(row);
  }
}

function updateComment(index, value) {
  watchlist[index].comment = value;
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

function removeStock(index) {
  if (confirm("Delete this stock?")) {
    watchlist.splice(index, 1);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderTable();
  }
}

function refreshAllData() {
  renderTable();
}

function clearWatchlist() {
  if (watchlist.length === 0) return alert("Watchlist is empty");
  if (confirm("Clear entire watchlist?")) {
    watchlist = [];
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderTable();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', renderTable);// Weekly Stock Tracker - script.js (Version 1.2 - Clean)
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

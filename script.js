// Weekly Stock Tracker - script.js
let stocks = JSON.parse(localStorage.getItem('stocks')) || [];

// Generate TradingView URL
function getTradingViewUrl(symbol) {
  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
  return `https://in.tradingview.com/symbols/NSE-${cleanSymbol}/`;
}

// Fetch current price and weekly change
async function fetchStockData(symbol) {
  try {
    // Current Price
    const quoteRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    const quoteData = await quoteRes.json();
    const price = quoteData.chart.result[0].meta.regularMarketPrice.toFixed(2);

    // Weekly Change
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
    console.error(`Error fetching data for ${symbol}:`, error);
    return { price: 'N/A', change: 0 };
  }
}

// Render the main table with TradingView links
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

// Remove stock
function removeStock(symbol) {
  stocks = stocks.filter(s => s !== symbol);
  localStorage.setItem('stocks', JSON.stringify(stocks));
  renderTable();
}

// Refresh all data
async function refreshAllData() {
  await renderTable();
  alert('✅ Data refreshed successfully!');
}

// Download Sample CSV (50 stocks)
function downloadSampleCSV() {
  const csvContent = `Symbol
RELIANCE.NS
TCS.NS
HDFCBANK.NS
INFY.NS
ICICIBANK.NS
KOTAKBANK.NS
SBIN.NS
BHARTIARTL.NS
HINDUNILVR.NS
ITC.NS
AXISBANK.NS
LT.NS
SUNPHARMA.NS
ULTRACEMCO.NS
BAJFINANCE.NS
WIPRO.NS
HCLTECH.NS
POWERGRID.NS
NTPC.NS
TATAMOTORS.NS
MARUTI.NS
INDUSINDBK.NS
TECHM.NS
ADANIENT.NS
JSWSTEEL.NS
COALINDIA.NS
TATASTEEL.NS
GRASIM.NS
HEROMOTOCO.NS
DRREDDY.NS
CIPLA.NS
BRITANNIA.NS
EICHERMOT.NS
APOLLOHOSP.NS
DIVISLAB.NS
HDFCLIFE.NS
SBILIFE.NS
BAJAJFINSV.NS
ADANIPORTS.NS
HINDALCO.NS
ONGC.NS
TATACONSUM.NS
BPCL.NS
UPL.NS
IOC.NS
ASIANPAINT.NS
DMART.NS
TRENT.NS
ZOMATO.NS
NYKAA.NS`;

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_50_stocks.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Load CSV file
function loadCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const rows = text.trim().split('\n');
    stocks = rows.slice(1)
                 .map(row => row.trim())
                 .filter(Boolean);
    
    localStorage.setItem('stocks', JSON.stringify(stocks));
    renderTable();
    alert(`✅ Loaded ${stocks.length} stocks successfully!`);
  };
  reader.readAsText(file);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
});
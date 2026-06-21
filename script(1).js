let stocks = [];
let stockDataCache = {};

const tableBody = document.querySelector('#stockTable tbody');
const statusEl = document.getElementById('status');
const countEl = document.getElementById('stockCount');

async function fetchStockData(symbol) {
    if (stockDataCache[symbol] && Date.now() - stockDataCache[symbol].timestamp < 300000) {
        return stockDataCache[symbol].data;
    }

    try {
        // Using Yahoo Finance unofficial API (yfinance-like via public endpoint)
        // Note: For production, use Finnhub or Alpha Vantage with API key
        const encodedSymbol = encodeURIComponent(symbol);
        
        // Current quote
        const quoteRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1d&range=1d`);
        const quoteData = await quoteRes.json();
        
        let currentPrice = 'N/A';
        let weeklyChange = 'N/A';
        
        if (quoteData.chart && quoteData.chart.result && quoteData.chart.result[0]) {
            const result = quoteData.chart.result[0];
            currentPrice = result.meta.regularMarketPrice || result.meta.previousClose;
            
            // Weekly candles
            const weekRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1wk&range=1mo`);
            const weekData = await weekRes.json();
            
            if (weekData.chart && weekData.chart.result && weekData.chart.result[0]) {
                const closes = weekData.chart.result[0].indicators.quote[0].close.filter(c => c !== null);
                if (closes.length >= 2) {
                    const latest = closes[closes.length - 1];
                    const previous = closes[closes.length - 2];
                    weeklyChange = ((latest - previous) / previous * 100).toFixed(2);
                }
            }
        }

        const data = {
            symbol: symbol,
            price: parseFloat(currentPrice).toFixed(2),
            change: weeklyChange,
            timestamp: Date.now()
        };

        stockDataCache[symbol] = { data, timestamp: Date.now() };
        return data;
    } catch (e) {
        console.error(e);
        return { symbol, price: 'N/A', change: 'N/A' };
    }
}

async function renderTable() {
    tableBody.innerHTML = '';
    countEl.textContent = `${stocks.length} stocks loaded`;

    for (let symbol of stocks) {
        const data = await fetchStockData(symbol);
        const row = document.createElement('tr');
        
        const changeClass = data.change > 0 ? 'positive' : (data.change < 0 ? 'negative' : '');
        const changeText = data.change !== 'N/A' ? `${data.change}%` : 'N/A';
        
        row.innerHTML = `
            <td><strong>${symbol}</strong></td>
            <td>${getCompanyName(symbol) || ''}</td>
            <td>₹${data.price}</td>
            <td class="${changeClass}">${changeText}</td>
            <td><button onclick="removeStock('${symbol}')" class="clear-btn" style="padding: 4px 10px; font-size: 0.85rem;">Remove</button></td>
        `;
        tableBody.appendChild(row);
    }
}

function getCompanyName(symbol) {
    // Simple mapping for common NSE stocks - expand as needed
    const names = {
        'RELIANCE.NS': 'Reliance Industries',
        'TCS.NS': 'Tata Consultancy',
        'HDFCBANK.NS': 'HDFC Bank',
        'INFY.NS': 'Infosys',
        // Add more as you like
    };
    return names[symbol] || symbol.replace('.NS', '');
}

function loadCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        statusEl.textContent = 'Please select a CSV file';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.trim().split('\n');
        
        stocks = [];
        for (let i = 0; i < rows.length; i++) {
            let symbol = rows[i].trim().toUpperCase();
            if (symbol && !symbol.startsWith('#') && !symbol.startsWith('//')) {
                if (!symbol.endsWith('.NS') && !symbol.endsWith('.BO')) {
                    symbol += '.NS'; // Default to NSE
                }
                if (!stocks.includes(symbol)) stocks.push(symbol);
            }
        }
        
        localStorage.setItem('weeklyStocks', JSON.stringify(stocks));
        statusEl.textContent = `Loaded ${stocks.length} stocks successfully!`;
        renderTable();
        renderAllCharts();
    };
    reader.readAsText(file);
}

function downloadSampleCSV() {
    const sample = `Symbol
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
LT.NS
AXISBANK.NS
BAJFINANCE.NS
MARUTI.NS
SUNPHARMA.NS
HCLTECH.NS
ASIANPAINT.NS
TITAN.NS
ULTRACEMCO.NS
WIPRO.NS`;
    
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_50_stocks.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function removeStock(symbol) {
    stocks = stocks.filter(s => s !== symbol);
    localStorage.setItem('weeklyStocks', JSON.stringify(stocks));
    renderTable();
    renderAllCharts();
}

function clearAll() {
    if (confirm('Clear all stocks?')) {
        stocks = [];
        localStorage.removeItem('weeklyStocks');
        renderTable();
        document.getElementById('chartsContainer').innerHTML = '';
    }
}

async function refreshAllData() {
    statusEl.textContent = 'Refreshing data...';
    stockDataCache = {}; // Clear cache
    await renderTable();
    statusEl.textContent = 'Data refreshed!';
    renderAllCharts();
}

async function renderAllCharts() {
    const container = document.getElementById('chartsContainer');
    container.innerHTML = '';
    
    for (let symbol of stocks) {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.innerHTML = `
            <h4>${symbol}</h4>
            <canvas id="chart-${symbol.replace('.', '_')}" width="380" height="220"></canvas>
        `;
        container.appendChild(card);
        
        // Fetch weekly data and render chart
        try {
            const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1wk&range=6mo`);
            const data = await res.json();
            
            if (data.chart && data.chart.result) {
                const result = data.chart.result[0];
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;
                
                const labels = timestamps.map(ts => new Date(ts * 1000).toLocaleDateString('en-IN', {month:'short', day:'numeric'}));
                const chartData = closes.filter(c => c !== null);
                
                new Chart(document.getElementById(`chart-${symbol.replace('.', '_')}`), {
                    type: 'line',
                    data: {
                        labels: labels.slice(-chartData.length),
                        datasets: [{
                            label: 'Weekly Close',
                            data: chartData,
                            borderColor: '#1e3a8a',
                            tension: 0.3,
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: false } }
                    }
                });
            }
        } catch (e) {
            console.error('Chart error for', symbol);
        }
    }
}

// Load saved list
stocks = JSON.parse(localStorage.getItem('weeklyStocks')) || [];
renderTable();

// Auto-refresh every 10 minutes
setInterval(() => {
    if (stocks.length > 0) refreshAllData();
}, 600000);
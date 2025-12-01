const usdElement = document.getElementById('usd');

let initialDataLoaded = false;
let finnhub_api_key = '';

let cryptoCardElements = [];
const cryptoSymbols = ['bitcoin', 'ethereum', 'ripple'];
const cryptoDisplayNames = ['BTC', 'ETH', 'XRP'];

let stockCardElements = []; 
let stockSymbols = []; 
let activeCheckboxes = {}; 
let customStockString = ""; 

let morningImages = [];
let nightImages = [];

async function loadApiKey() {
    try {
        const response = await fetch('api_key.json'); 
        if (!response.ok) return null;
        const jsonData = await response.json(); 
   
        if (jsonData && jsonData.api_key && jsonData.api_key.trim().length > 1) {
            finnhub_api_key = jsonData.api_key.trim(); 
            return finnhub_api_key;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

async function fetchImageLists() {
    try {
        const response = await fetch('image-list.json'); 
        if (!response.ok) throw new Error(`image-list.json not found: ${response.status}`);
        
        const data = await response.json();

        if (data.morningImages && data.nightImages) {
            morningImages = data.morningImages; 
            nightImages = data.nightImages; 
            
            if (morningImages.length === 0 && nightImages.length === 0) {
                return false;
            }
            return true;
        } else {
            throw new Error("Invalid image-list.json format.");
        }
    } catch (error) {
        return false;
    }
}

function updateDisplay(target, price, change) {
    let priceEl, changeEl;

    if (target.querySelector) { 
        priceEl = target.querySelector('.price');
        changeEl = target.querySelector('.change');
    } else if (target.element) {
        priceEl = target.element;
        changeEl = target.changeElement;
    }

    if (!priceEl || !changeEl) return;

    priceEl.innerText = `$${price.toLocaleString('en-US')}`;

    const changeVal = typeof change === 'string' ? parseFloat(change.replace('%', '')) : change;
    changeEl.innerText = `${changeVal.toFixed(2)}%`;

    if (changeVal > 0) {
        changeEl.className = 'change increase'; 
    } else if (changeVal < 0) {
        changeEl.className = 'change decrease'; 
    } else {
        changeEl.className = 'change'; 
    }
}

function showErrorMessagesForElement(targetElement) {
    let priceEl, changeEl;
    if (targetElement.querySelector) {
        priceEl = targetElement.querySelector('.price');
        changeEl = targetElement.querySelector('.change');
    } else if (targetElement.element) {
        priceEl = targetElement.element;
        changeEl = targetElement.changeElement;
    }

    if (priceEl) priceEl.innerText = "No Data";
    if (changeEl) {
        changeEl.innerText = ""; 
        changeEl.className = 'change'; 
    }
}

async function changeBackgroundRandomly() {
    const now = new Date();
    const currentHour = now.getHours(); 
    let selectedList;

    if (currentHour >= 6 && currentHour < 18) { 
        selectedList = morningImages;
    } else {
        selectedList = nightImages;
    }

    if (!selectedList || selectedList.length === 0) return;

    const randomIndex = Math.floor(Math.random() * selectedList.length);
    const randomImage = selectedList[randomIndex];

    if (randomImage) {
        document.body.style.backgroundImage = `url('${randomImage}')`;
    }
}

function createCryptoCard(idPrefix, symbol, displayName) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'crypto-card';
    cardDiv.innerHTML = `
        <div class="item">
            <span class="symbol">${displayName}</span>
            <span class="price" id="${idPrefix}">Loading...</span>
            <span class="change">0.00%</span>
        </div>
    `;
    return cardDiv;
}

function createStockCard(symbol) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'crypto-card'; 
    cardDiv.innerHTML = `
        <div class="item">
            <span class="symbol">${symbol}</span>
            <span class="price">Loading...</span>
            <span class="change">0.00%</span>
        </div>
    `;
    return cardDiv;
}

function setupCryptoCarousel() {
    const container = document.querySelector('.crypto-carousel');
    if (!container) return;
    
    container.innerHTML = '';
    cryptoCardElements = [];
    
    const originalCards = cryptoSymbols.map((symbol, index) => {
        const idPrefix = cryptoDisplayNames[index].toLowerCase();
        const card = createCryptoCard(idPrefix, symbol, cryptoDisplayNames[index]);
        container.appendChild(card);
        
        cryptoCardElements.push({
            id: idPrefix,
            element: card.querySelector('.price'),
            changeElement: card.querySelector('.change'),
            symbolElement: card.querySelector('.symbol')
        });
        return card;
    });

    originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true'); 
        container.appendChild(clone);
        
        cryptoCardElements.push({
            id: clone.querySelector('.symbol').innerText.toLowerCase(),
            element: clone.querySelector('.price'),
            changeElement: clone.querySelector('.change'),
            symbolElement: clone.querySelector('.symbol')
        });
    });
}

function setupStockCarousel() {
    const container = document.querySelector('.stock-carousel');
    if (!container) return;
    
    container.innerHTML = '';
    stockCardElements = [];
    
    if (stockSymbols.length === 0) return;

    const originalCards = stockSymbols.map(symbol => {
        const card = createStockCard(symbol);
        container.appendChild(card);
        
        stockCardElements.push({
            id: symbol,
            element: card.querySelector('.price'),
            changeElement: card.querySelector('.change'),
            symbolElement: card.querySelector('.symbol')
        });
        return card;
    });

    originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        container.appendChild(clone);
        
        stockCardElements.push({
            id: clone.querySelector('.symbol').innerText,
            element: clone.querySelector('.price'),
            changeElement: clone.querySelector('.change'),
            symbolElement: clone.querySelector('.symbol')
        });
    });
}

function getCachedData(key, ttlSeconds = 55) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    try {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        if (now - parsed.timestamp < ttlSeconds * 1000) {
            return parsed.data;
        }
    } catch (e) {
        return null;
    }
    return null;
}

function setCachedData(key, data) {
    const payload = {
        timestamp: Date.now(),
        data: data
    };
    localStorage.setItem(key, JSON.stringify(payload));
}

async function fetchCryptoData() {
    const cacheKey = 'crypto_data_cache';
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
        const data = cachedData;
        cryptoSymbols.forEach((symbolKey, index) => {
            if (data[symbolKey]) {
                const price = data[symbolKey].usd;
                const change = data[symbolKey].usd_24h_change;
                
                cryptoCardElements
                    .filter(item => item.id.startsWith(cryptoDisplayNames[index].toLowerCase()))
                    .forEach(card => updateDisplay(card, price, change));
            }
        });
        return; 
    }

    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple&vs_currencies=usd&include_24hr_change=true');
        if (!response.ok) throw new Error(`CoinGecko API Error: ${response.status}`);
        const data = await response.json();
        
        setCachedData(cacheKey, data);

        cryptoSymbols.forEach((symbolKey, index) => {
            if (data[symbolKey]) {
                const price = data[symbolKey].usd;
                const change = data[symbolKey].usd_24h_change;
                
                cryptoCardElements
                    .filter(item => item.id.startsWith(cryptoDisplayNames[index].toLowerCase()))
                    .forEach(card => updateDisplay(card, price, change));
            } else {
                cryptoCardElements
                    .filter(item => item.id.startsWith(cryptoDisplayNames[index].toLowerCase()))
                    .forEach(card => showErrorMessagesForElement(card));
            }
        });
    } catch (error) {
        cryptoCardElements.forEach(card => showErrorMessagesForElement(card));
    }
}

async function fetchNasdaqData() {
    if (!finnhub_api_key) {
        stockCardElements.forEach(card => showErrorMessagesForElement(card));
        return; 
    }

    if (stockSymbols.length === 0) return;

    for (const symbol of stockSymbols) {
        const cacheKey = `stock_${symbol}`;
        const cachedData = getCachedData(cacheKey);

        if (cachedData) {
             stockCardElements
                .filter(card => card.id === symbol)
                .forEach(card => updateDisplay(card, cachedData.price, cachedData.change));
             continue; 
        }

        try {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhub_api_key}`);
            const data = await response.json();

            if (data && data.c != null) {
                const price = data.c;  
                const change = data.dp; 

                setCachedData(cacheKey, { price, change });

                stockCardElements
                    .filter(card => card.id === symbol)
                    .forEach(card => updateDisplay(card, price, change));
            } else {
                stockCardElements
                    .filter(card => card.id === symbol)
                    .forEach(card => showErrorMessagesForElement(card));
            }

            await new Promise(r => setTimeout(r, 300)); 

        } catch (error) {
            console.error(error);
        }
    }
    initialDataLoaded = true;
}

function updateStockList() {
    let combinedList = [];

    for (const [key, isChecked] of Object.entries(activeCheckboxes)) {
        if (isChecked && key.startsWith('stock_')) {
            const symbol = key.replace('stock_', '');
            combinedList.push(symbol);
        }
    }

    if (customStockString && customStockString.trim().length > 0) {
        const customItems = customStockString
            .split(',')
            .map(s => s.trim().toUpperCase())
            .filter(s => s.length > 0);
        
        combinedList = combinedList.concat(customItems);
    }

    combinedList = [...new Set(combinedList)];

    if (combinedList.length > 25) {
        combinedList = combinedList.slice(0, 25);
    }

    if (combinedList.length === 0) {
        combinedList = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN']; 
    }

    stockSymbols = combinedList;
    setupStockCarousel();
    fetchNasdaqData();
}

function livelyPropertyListener(name, val) {
    if (name === "stockScrollSpeed") {
        document.documentElement.style.setProperty('--stock-scroll-speed', val + 's');
        return;
    }
    if (name === "cryptoScrollSpeed") {
        document.documentElement.style.setProperty('--crypto-scroll-speed', val + 's');
        return;
    }

    if (name === "customStockList") {
        customStockString = val;
        updateStockList();
        return;
    }

    if (name.startsWith('stock_')) {
        activeCheckboxes[name] = val;
        updateStockList();
    }
}

async function startFetchingData() {
    await loadApiKey(); 
    const imagesLoaded = await fetchImageLists();   
    
    setupCryptoCarousel();
    
    if (stockSymbols.length === 0) {
        stockSymbols = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN'];
        setupStockCarousel();
    }

    if (imagesLoaded) {
        changeBackgroundRandomly();
        setInterval(changeBackgroundRandomly, 900000); 
    }

    fetchCryptoData(); 
    fetchNasdaqData(); 
    
    setInterval(fetchCryptoData, 60000); 
    setInterval(fetchNasdaqData, 60000); 
   
    setTimeout(() => {
        if (!initialDataLoaded) {
            cryptoCardElements.forEach(card => showErrorMessagesForElement(card));
            stockCardElements.forEach(card => showErrorMessagesForElement(card));
        }
    }, 10000);
}

startFetchingData();
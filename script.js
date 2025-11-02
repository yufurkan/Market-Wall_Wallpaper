const btcElement = document.getElementById('btc');
const ethElement = document.getElementById('eth');
const xrpElement = document.getElementById('xrp');
const usdElement = document.getElementById('usd');
const goldElement = document.getElementById('gold');


let initialDataLoaded = false;

//burayı ileride bir txt den çakeicem herkes kendi apisini oluşurup txt ye atsın
const ALPHA_VANTAGE_API_KEY = '';//burayı vermiyicem 500 api istek sınırı var



async function fetchCryptoData() {
    console.log("Kripto veriler çekiliyor...");
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple&vs_currencies=usd&include_24hr_change=true');
        if (!response.ok) {
            throw new Error(`CoinGecko API hatası: ${response.status}`);
        }
        const data = await response.json();
        initialDataLoaded = true; 

        if (data.bitcoin) {
            updateDisplay(btcElement, data.bitcoin.usd, data.bitcoin.usd_24h_change);
        }
        if (data.ethereum) {
            updateDisplay(ethElement, data.ethereum.usd, data.ethereum.usd_24h_change);
        }
        if (data.ripple) {
            updateDisplay(xrpElement, data.ripple.usd, data.ripple.usd_24h_change);
        }
    } catch (error) {
        console.error("Kripto veri çekme başarısız:", error);
        ShowErrorMessagesForElement(btcElement);
        ShowErrorMessagesForElement(ethElement);
        ShowErrorMessagesForElement(xrpElement);
    }
}

async function fetchMetalData() {
    console.log("Döviz/Maden veriler (Alpha Vantage) çekiliyor...");
    try {
        // --- DOLAR/TL Kuru ---
        const usdResponse = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TRY&apikey=${ALPHA_VANTAGE_API_KEY}`);
        const usdData = await usdResponse.json();


        if (usdData["Error Message"] || usdData["Note"]) {
             throw new Error(`Alpha Vantage Dolar API hatası: ${usdData["Error Message"] || usdData["Note"]}`);
        }

        // --- ALTIN (ONS) Fiyatı ---
        const goldResponse = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`);
        const goldData = await goldResponse.json();

        if (goldData["Error Message"] || goldData["Note"]) {
             throw new Error(`Alpha Vantage Altın API hatası: ${goldData["Error Message"] || goldData["Note"]}`);
        }

        initialDataLoaded = true; 

        // --- Dolar/TL verilerini işle ---
        if (usdData["Realtime Currency Exchange Rate"] && usdData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) {
            const usdPrice = parseFloat(usdData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);


            // Alpha Vantage direkt 24 saatlik değişim vermez.
            // İlerde buraya bir önceki çekim ile farkı koyacağım
            const usdChange = (Math.random() * 2) - 1; // -1% ile +1% arası rastgele değişim

            updateDisplay(usdElement, usdPrice, usdChange);
            usdElement.querySelector('.symbol').innerText = "DOLAR (TL)";
        } else {
            console.warn("Alpha Vantage'den Dolar/TL verisi gelmedi.");
            showErrorMessagesForElement(usdElement);
        }

        // --- Altın ONS verilerini işle ---
        if (goldData["Realtime Currency Exchange Rate"] && goldData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) {
            const goldPrice = parseFloat(goldData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
            const goldChange = (Math.random() * 2) - 1; // Rastgele değişim

            updateDisplay(goldElement, goldPrice, goldChange);
            goldElement.querySelector('.symbol').innerText = "ALTIN (ONS)";
        } else {
            console.warn("Alpha Vantage'den Altın (ONS) verisi gelmedi.");
            showErrorMessagesForElement(goldElement);
        }

    } catch (error) {
        console.error("Döviz/Maden veri çekme başarısız:", error);
        ShowErrorMessagesForElement(usdElement);
        ShowErrorMessagesForElement(goldElement);
    }
}


function updateDisplay(element, price, change) {
    element.querySelector('.price').innerText = `$${price.toLocaleString('en-US')}`;

    const changeElement = element.querySelector('.change');
    changeElement.innerText = `${change.toFixed(2)}%`;

    if (change > 0) {
        changeElement.className = 'change increase'; //yeşil
    } else if (change < 0) {
        changeElement.className = 'change decrease'; //kırmızı
    } else {
        changeElement.className = 'change'; //nötr
    }
}

function ShowErrorMessagesForElement(targetElement) {
 
    targetElement.querySelector('.price').innerText = "Verilere ulaşılamadı";
    targetElement.querySelector('.change').innerText = ""; 
    targetElement.querySelector('.change').className = 'change'; 
}




fetchMetalData(); 
fetchCryptoData();
setInterval(fetchCryptoData,60000)
setInterval(fetchMetalData, 60000); //dakikada bir







/*

function FetchData() {

setTimeout(() => {
    dataLoaded=false
    if (!dataLoaded) { 
  
        ShowErrorMessagesForElement(btcElement);
        ShowErrorMessagesForElement(ethElement);
        ShowErrorMessagesForElement(xrpElement);
        ShowErrorMessagesForElement(usdElement);
        ShowErrorMessagesForElement(goldElement);
    }
}, 5000);//5sn
}

 FetchData();

 */
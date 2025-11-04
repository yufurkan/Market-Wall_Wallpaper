const btcElement = document.getElementById('btc');
const ethElement = document.getElementById('eth');
const xrpElement = document.getElementById('xrp');
const usdElement = document.getElementById('usd');
const goldElement = document.getElementById('gold');

//buraya bool bir liste koyup tüm değerlerin ilk değerlerinin çekilmesini sağlıyıcam
let initialDataLoaded = false;

//burayı ileride bir txt den çakeicem herkes kendi apisini oluşurup txt ye atacak
//txt live serverda gözükmüyo jon aldım
let ALPHA_VANTAGE_API_KEY = '';//burayı vermiyicem 500 api istek sınırı var

async function loadApiKey() {
console.log("API_Key.json okunuyor..."); 
    try {
        const response = await fetch('api_key.json'); 

        if (!response.ok) {
            console.error(`api_key.json dosyası bulunamadı veya erişilemedi: ${response.status} ${response.statusText}`);
            return null;
        }

        const jsonData = await response.json(); 

        if (jsonData && jsonData.api_key && typeof jsonData.api_key === 'string' && jsonData.api_key.trim().length > 1) {
            ALPHA_VANTAGE_API_KEY = jsonData.api_key.trim(); 
            console.log("API Anahtarı başarıyla okundu.");
            return ALPHA_VANTAGE_API_KEY;
        } else {
            console.error("api_key.json dosyası boş veya 'api_key' anahtarı içermiyor.");
            return null;
        }

    } catch (hata) {
        console.error('api_key.json okuma hatası:', hata);
        return null;
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

function showErrorMessagesForElement(targetElement) {
 
    targetElement.querySelector('.price').innerText = "Verilere ulaşılamadı";
    targetElement.querySelector('.change').innerText = ""; 
    targetElement.querySelector('.change').className = 'change'; 
}

function CompareValues(old, neww) {
    var c ;
    var ratio;
    c=neww-old;
    ratio=c/neww;
  return ratio
}


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
        showErrorMessagesForElement(btcElement);
        showErrorMessagesForElement(ethElement); 
        showErrorMessagesForElement(xrpElement);
    }
}

async function fetchMetalData() {
    console.log("Döviz/Maden veriler çekiliyor...");


    if (!ALPHA_VANTAGE_API_KEY) {
        console.error("Alpha Vantage API anahtarı henüz yüklenmedi veya geçersiz.");
        showErrorMessagesForElement(usdElement);
        showErrorMessagesForElement(goldElement);
        return; 
    }

    try {
        // --- DOLAR/TL Kuru ---
        const usdResponse = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TRY&apikey=${ALPHA_VANTAGE_API_KEY}`);
        const usdData = await usdResponse.json();

        if (usdData["Error Message"] || usdData["Note"]) {
             console.error(`Alpha Vantage Dolar API hatası: ${usdData["Error Message"] || usdData["Note"]}`);
             showErrorMessagesForElement(usdElement);
        } else if (usdData["Realtime Currency Exchange Rate"] && usdData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) {
            const usdPrice = parseFloat(usdData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
            const usdChange = (Math.random() * 2) - 1; 
            updateDisplay(usdElement, usdPrice, usdChange);
            usdElement.querySelector('.symbol').innerText = "DOLAR (TL)";
        } else {
            console.warn("Alpha Vantage'den Dolar/TL verisi gelmedi veya format hatalı.");
            showErrorMessagesForElement(usdElement);
        }

        // --- ALTIN (ONS)   ---
        //Burayı tamamlayamadım şimdilik iptal
        const goldResponse = await fetch(``);
        const goldData = await usdResponse.json();


        initialDataLoaded = true; 

    } catch (error) {
        console.error("Döviz/Maden veri çekme başarısız:", error);
        showErrorMessagesForElement(usdElement);
        showErrorMessagesForElement(goldElement);
    }
}

async function startFetchingData() {
    await loadApiKey(); 

    fetchCryptoData(); 
    fetchMetalData(); 
    
    setInterval(fetchCryptoData, 60000); 
    setInterval(fetchMetalData, 60000); 

   
    setTimeout(() => {
        if (!initialDataLoaded) {
            console.log("5 saniye doldu ve veri yüklenemedi. Hata mesajları gösteriliyor.");
            showErrorMessagesForElement(btcElement);
            showErrorMessagesForElement(ethElement);
            showErrorMessagesForElement(xrpElement);
            showErrorMessagesForElement(usdElement);
            showErrorMessagesForElement(goldElement);
        }
    }, 5000); // 5 sn

}

startFetchingData();






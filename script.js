
const usdElement = document.getElementById('usd');
//const goldElement = document.getElementById('gold');


let initialDataLoaded = false;
let cryptoCardElements = [];

//burayi ileride bir txt den çakeicem herkes kendi apisini olusurup txt ye atacak
//txt live serverda gözükmüyo jon aldim
let ALPHA_VANTAGE_API_KEY = '';//burayi vermiyicem 500 api istek siniri var

//sembol ayarlari
const cryptoSymbols = ['bitcoin', 'ethereum', 'ripple'];
const cryptoDisplayNames = ['BTC', 'ETH', 'XRP'];

async function loadApiKey() {
console.log("API_Key.json okunuyor..."); 
    try {
        const response = await fetch('api_key.json'); 

        if (!response.ok) {
            console.error(`api_key.json dosyasi bulunamadi veya erisilemedi: ${response.status} ${response.statusText}`);
            return null;
        }

        const jsonData = await response.json(); 

        if (jsonData && jsonData.api_key && typeof jsonData.api_key === 'string' && jsonData.api_key.trim().length > 1) {
            ALPHA_VANTAGE_API_KEY = jsonData.api_key.trim(); 
            console.log("API Anahtari basariyla okundu.");
            return ALPHA_VANTAGE_API_KEY;
        } else {
            console.error("api_key.json dosyasi bos veya 'api_key' anahtari içermiyor.");
            return null;
        }

    } catch (hata) {
        console.error('api_key.json okuma hatasi:', hata);
        return null;
    }
}

function updateDisplay(cardObject, price, change) {

    cardObject.element.innerText = `$${price.toLocaleString('en-US')}`;

    const changeElement = cardObject.changeElement; 
    changeElement.innerText = `${change.toFixed(2)}%`;

    if (change > 0) {
        changeElement.className = 'change increase'; //yesil
    } else if (change < 0) {
        changeElement.className = 'change decrease'; //kirmizi
    } else {
        changeElement.className = 'change'; //nötr
    }
}

function createCryptoCard(idPrefix, symbol, displayName) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'crypto-card';
    cardDiv.innerHTML = `
        <div class="item">
            <span class="symbol">${displayName}</span>
            <span class="price" id="${idPrefix}">${displayName} Veri Yok</span>
            <span class="change">0.00%</span>
        </div>
    `;
    return cardDiv;
}



function setupCryptoCarousel() {
    const carouselContainer = document.querySelector('.crypto-carousel');
    carouselContainer.innerHTML = ''; //temizle


    const originalCards = cryptoSymbols.map((symbol, index) => {
        const idPrefix = cryptoDisplayNames[index].toLowerCase();
        const card = createCryptoCard(idPrefix, symbol, cryptoDisplayNames[index]);
        carouselContainer.appendChild(card);
        cryptoCardElements.push({
            id: idPrefix,
            element: card.querySelector('.price'),
            changeElement: card.querySelector('.change'),
            symbolElement: card.querySelector('.symbol')
        });
        return card;
    });

    //3 set kart / orijinal + 2 kopya
    const numberOfCopiesForSeamlessLoop = 2; 
    for (let i = 0; i < numberOfCopiesForSeamlessLoop; i++) {
        originalCards.forEach((card, index) => {
            const clonedCard = card.cloneNode(true); 

            //id leri değiştir
            const originalPriceId = cryptoDisplayNames[index].toLowerCase();

            
            clonedCard.querySelector('.price').id = `${originalPriceId}${i + 1 + originalCards.length}`; 
            
            cryptoCardElements.push({
                id: clonedCard.querySelector('.price').id,
                element: clonedCard.querySelector('.price'),
                changeElement: clonedCard.querySelector('.change'),
                symbolElement: clonedCard.querySelector('.symbol')
            });
            carouselContainer.appendChild(clonedCard);
        });
    }

    // Animasyon kaydırma mesafesini hesapla

    const firstCard = originalCards[0]; //ilk kart
    if (firstCard) {
        const cardComputedStyle = getComputedStyle(firstCard);
        const cardWidth = firstCard.offsetWidth; 
        const marginRight = parseFloat(cardComputedStyle.marginRight); // sağ

   
        const totalOriginalWidth = (cardWidth + marginRight) * originalCards.length;
        

        carouselContainer.style.setProperty('--scroll-distance', `-${totalOriginalWidth}px`);
    } else {
        console.warn("Kripto kartları oluşturulamadı, kaydırma mesafesi ayarlanamadı.");
    }
}






function showErrorMessagesForElement(targetElement) {
    
    if (targetElement.querySelector) { 
   
        targetElement.querySelector('.price').innerText = "Verilere ulasilamadi";
        targetElement.querySelector('.change').innerText = ""; 
        targetElement.querySelector('.change').className = 'change'; 
    } else if (targetElement.element) {
  
        targetElement.element.innerText = "Verilere ulasilamadi";
        targetElement.changeElement.innerText = "";
        targetElement.changeElement.className = 'change';
    } else {
      
        console.warn("showErrorMessagesForElement: Geçersiz element alindi.", targetElement);
    }
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
            throw new Error(`CoinGecko API hatasi: ${response.status}`);
        }
        const data = await response.json();
        
 
        cryptoSymbols.forEach((symbolKey, index) => {
            if (data[symbolKey]) {
                const price = data[symbolKey].usd;
                const change = data[symbolKey].usd_24h_change;

           
                cryptoCardElements.filter(item => item.id.startsWith(cryptoDisplayNames[index].toLowerCase())).forEach(card => {
                    card.symbolElement.innerText = cryptoDisplayNames[index]; 
                    updateDisplay(card, price, change); 
                });
            } else {

                cryptoCardElements.filter(item => item.id.startsWith(cryptoDisplayNames[index].toLowerCase())).forEach(card => {
                    showErrorMessagesForElement(card); 
                });
            }
        });
        initialDataLoaded = true; 

    } catch (error) {
        console.error("Kripto veri çekme basarisiz:", error);
        // Tüm kripto kartlarina hata mesaji göster
        cryptoCardElements.forEach(card => showErrorMessagesForElement(card));
    }
}

async function fetchMetalData() {
    console.log("Döviz/Maden veriler çekiliyor...");


    if (!ALPHA_VANTAGE_API_KEY) {
        console.error("Alpha Vantage API anahtari henüz yüklenmedi veya geçersiz.");
        showErrorMessagesForElement(usdElement);
        //showErrorMessagesForElement(goldElement);
        return; 
    }

    try {
        // --- DOLAR/TL Kuru ---
        const usdResponse = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TRY&apikey=${ALPHA_VANTAGE_API_KEY}`);
        const usdData = await usdResponse.json();

        if (usdData["Error Message"] || usdData["Note"]) {
             console.error(`Alpha Vantage Dolar API hatasi: ${usdData["Error Message"] || usdData["Note"]}`);
             showErrorMessagesForElement(usdElement);
        } else if (usdData["Realtime Currency Exchange Rate"] && usdData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) {
            const usdPrice = parseFloat(usdData["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
            const usdChange = (Math.random() * 2) - 1; 
            updateDisplay(usdElement, usdPrice, usdChange);
            usdElement.querySelector('.symbol').innerText = "DOLAR (TL)";
        } else {
            console.warn("Alpha Vantage'den Dolar/TL verisi gelmedi veya format hatali.");
            showErrorMessagesForElement(usdElement);
        }

        // --- ALTIN (ONS)   ---
        //Burayi tamamlayamadim simdilik iptal
        //const goldResponse = await fetch(``);
        //const goldData = await usdResponse.json();


        initialDataLoaded = true; 

    } catch (error) {
        console.error("Döviz/Maden veri çekme basarisiz:", error);
        showErrorMessagesForElement(usdElement);
        //showErrorMessagesForElement(goldElement);
    }
}

async function startFetchingData() {
    await loadApiKey(); 
    setupCryptoCarousel()
    fetchCryptoData(); 
    fetchMetalData(); 
    
    setInterval(fetchCryptoData, 60000); 
    setInterval(fetchMetalData, 60000); 

   
    setTimeout(() => {
    if (!initialDataLoaded) {
        console.log("5 saniye doldu ve veri yüklenemedi. Hata mesajlari gösteriliyor.");
        
 
        cryptoCardElements.forEach(card => {
            showErrorMessagesForElement(card); // card bir obje
        });
       
        showErrorMessagesForElement(usdElement);
        //showErrorMessagesForElement(goldElement); 
    }
}, 5000); // 5 sn

}

startFetchingData();






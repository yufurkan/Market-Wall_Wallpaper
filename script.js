
const usdElement = document.getElementById('usd');
//const goldElement = document.getElementById('gold');


let initialDataLoaded = false;

let cryptoCardElements = [];
const cryptoSymbols = ['bitcoin', 'ethereum', 'ripple'];
const cryptoDisplayNames = ['BTC', 'ETH', 'XRP'];

let stockCardElements = []; 
let stockSymbols = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN']; // Varsayılan liste


let morningImages = [];
let nightImages = [];

//txt live serverda gözükmüyo json aldim
let ALPHA_VANTAGE_API_KEY = '';




async function loadApiKey() {
    console.log("API_Key.json okunuyor..."); 
    try {
        const response = await fetch('api_key.json'); 
        if (!response.ok) return null;
        const jsonData = await response.json(); 

        if (jsonData && jsonData.api_key && typeof jsonData.api_key === 'string' && jsonData.api_key.trim().length > 1) {
            ALPHA_VANTAGE_API_KEY = jsonData.api_key.trim(); 
            console.log("API Anahtari basariyla okundu.");
            return ALPHA_VANTAGE_API_KEY;
        }
        return null;
    } catch (hata) {
        console.error('api_key.json okuma hatasi:', hata);
        return null;
    }
}

async function fetchImageLists() {
    console.log("Yerel 'image-list.json' okunuyor...");
    try {

        const response = await fetch('image-list.json'); 
        
        if (!response.ok) {
            throw new Error(`image-list.json bulunamadı: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.morningImages && data.nightImages) {
            morningImages = data.morningImages; 
            nightImages = data.nightImages; 
            
            if (morningImages.length === 0 && nightImages.length === 0) {
                console.warn("image-list.json boş. 'create-image-list.bat' dosyasını çalıştırdın mı?");
                return false;
            }
            
            console.log(`Yerel listeden ${morningImages.length} sabah, ${nightImages.length} gece resmi bulundu.`);
            return true;
        } else {
            throw new Error("image-list.json formatı hatalı.");
        }

    } catch (error) {
        console.error('Resim listesi çekme hatası:', error);
        return false;
    }
}

function updateDisplay(target, price, change) {
    let priceEl, changeEl;

    if (target.querySelector) { 
        // HTML 
        priceEl = target.querySelector('.price');
        changeEl = target.querySelector('.change');
    } else if (target.element) {
        // Kart Objesi
        priceEl = target.element;
        changeEl = target.changeElement;
    }

    if (!priceEl || !changeEl) return;

    // Fiyat Formatlama
    priceEl.innerText = `$${price.toLocaleString('en-US')}`;


    const changeVal = typeof change === 'string' ? parseFloat(change.replace('%', '')) : change;
    changeEl.innerText = `${changeVal.toFixed(2)}%`;

    // Renk 
    if (changeVal > 0) {
        changeEl.className = 'change increase'; 
    } else if (changeVal < 0) {
        changeEl.className = 'change decrease'; 
    } else {
        changeEl.className = 'change'; 
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
    let priceEl, changeEl;

    if (targetElement.querySelector) {
        priceEl = targetElement.querySelector('.price');
        changeEl = targetElement.querySelector('.change');
    } else if (targetElement.element) {
        priceEl = targetElement.element;
        changeEl = targetElement.changeElement;
    }

    if (priceEl) priceEl.innerText = "Veri Yok";
    if (changeEl) {
        changeEl.innerText = ""; 
        changeEl.className = 'change'; 
    }
}

function CompareValues(old, neww) {
    var c ;
    var ratio;
    c=neww-old;
    ratio=c/neww;
  return ratio
}

async function changeBackgroundRandomly() {
    const now = new Date();
    const currentHour = now.getHours(); 
    
    let selectedList;

    if (currentHour >= 6 && currentHour < 18) { 
        console.log("M");
        selectedList = morningImages;
    } else {
        console.log("N");
        selectedList = nightImages;
    }

    if (!selectedList || selectedList.length === 0) {
        console.error("Resim listesi boş veya hatalı! 'create-image-list.bat' çalıştırıldı mı?");
        return;
    }


    const randomIndex = Math.floor(Math.random() * selectedList.length);
    const randomImage = selectedList[randomIndex];

    if (!randomImage) {
        console.error("Rastgele resim seçilemedi!");
        return;
    }

    console.log(`Arka plan şu olarak ayarlandı: ${randomImage}`);
    document.body.style.backgroundImage = `url('${randomImage}')`;
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
       
        cryptoCardElements.forEach(card => showErrorMessagesForElement(card));
    }
}


async function fetchNasdaqData() {
    console.log("NASDAQ verileri çekiliyor...");

    if (!ALPHA_VANTAGE_API_KEY) {
        console.error("API anahtarı yok.");
        stockCardElements.forEach(card => showErrorMessagesForElement(card));
        return; 
    }

    // Alpha Vantage limiti Dakikada 5 api değişebilir

    const limitedSymbols = stockSymbols.slice(0, 5); 

    for (const symbol of limitedSymbols) {
        try {
            const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
            const data = await response.json();
            const quote = data["Global Quote"];

            if (quote && quote["05. price"]) {
                const price = parseFloat(quote["05. price"]);
                const change = quote["10. change percent"]; 

                // hisseye ait tüm kartları güncelle
                stockCardElements
                    .filter(card => card.id === symbol)
                    .forEach(card => updateDisplay(card, price, change));
            } else {
                console.warn(`Hisse verisi gelmedi: ${symbol}`, data);
                stockCardElements
                    .filter(card => card.id === symbol)
                    .forEach(card => showErrorMessagesForElement(card));
            }
        } catch (error) {
            console.error(`Hisse hatası (${symbol}):`, error);
        }
    }
}


//CANCELLED!!
async function fetchMetalData() {


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
}//CANCELLED!!


function setupStockCarousel() {
    const container = document.querySelector('.stock-carousel');
    
    // Eğer HTML'de bu class yoksa işlemi durdur
    if (!container) return;

    // Önceki içeriği temizle
    // Livelyden ayar değişirse üst üste binmesin
    container.innerHTML = '';
    stockCardElements = []; 



    // Orijinal Kartları Oluştur ---
    const originalCards = stockSymbols.map(symbol => {
        const card = createStockCard(symbol);
        container.appendChild(card); // ekle

        // kartı listesine al 
        stockCardElements.push({
            id: symbol, 
            element: card.querySelector('.price'),
            changeElement: card.querySelector('.change'),
            symbolElement: card.querySelector('.symbol')
        });
        return card;
    });//



    // Klonları Oluştur ---
    const copyCount = 2; 
    
    for (let i = 0; i < copyCount; i++) {
        originalCards.forEach(card => {

            const clonedCard = card.cloneNode(true);
            

            const symbol = card.querySelector('.symbol').innerText;

            stockCardElements.push({
                id: symbol, // ID yine aynı 
                element: clonedCard.querySelector('.price'),
                changeElement: clonedCard.querySelector('.change'),
                symbolElement: clonedCard.querySelector('.symbol')
            });

            container.appendChild(clonedCard); // Klonu ekle
        });
    }


    

    // Animasyon Mesafesini Hesapla ---
    // İlk kartı ölç
    const firstCard = originalCards[0];
    if (firstCard) {
        const style = getComputedStyle(firstCard);
        const width = firstCard.offsetWidth; // Kart genişliği
        const margin = parseFloat(style.marginRight); // Sağ boşluk
        
        // Bir setin toplam genişliği
        const totalWidth = (width + margin) * originalCards.length;
        

        container.style.setProperty('--stock-scroll-distance', `-${totalWidth}px`);
    }
}//setupStockCarousel


function createStockCard(symbol) {

    const cardDiv = document.createElement('div');
    

    cardDiv.className = 'crypto-card'; //crypto clasını ilerde değiştirmeliyim
    
 
    cardDiv.innerHTML = `
        <div class="item">
            <span class="symbol">${symbol}</span>
            <span class="price">Yükleniyor...</span>
            <span class="change">0.00%</span>
        </div>
    `;
    
    return cardDiv;
}



function livelyPropertyListener(name, val) {
    if (name === "stockSymbolList") {
        stockSymbols = val.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
        setupStockCarousel();
        fetchNasdaqData();
    }
    if (name === "stockScrollSpeed") {
        const carousel = document.querySelector('.stock-carousel');
        if(carousel) carousel.style.animationDuration = val + 's';
    }
}



async function startFetchingData() {
    
    await loadApiKey(); 
    const imagesLoaded = await fetchImageLists();   
    setupCryptoCarousel()
    setupStockCarousel()


    if (imagesLoaded) {
        changeBackgroundRandomly();
        setInterval(changeBackgroundRandomly, 900000); // 15 dk
    } else {
        console.error("ERROR Images couldn't load.");
    }




    fetchCryptoData(); 
    fetchNasdaqData();
    //fetchMetalData(); 
    
    setInterval(fetchCryptoData, 60000); 
    setInterval(fetchNasdaqData, 120000);

    //setInterval(fetchMetalData, 60000); 
    //setInterval(changeBackgroundRandomly, 900000); // 15 dk


    setTimeout(() => {
        if (!initialDataLoaded) {
            console.log("Başlangıç verileri yüklenemedi.");
            cryptoCardElements.forEach(card => showErrorMessagesForElement(card));
            stockCardElements.forEach(card => showErrorMessagesForElement(card));
        }
    }, 7000);

}

startFetchingData();






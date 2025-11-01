const btcElement = document.getElementById('btc');
const ethElement = document.getElementById('eth');
const xrpElement = document.getElementById('xrp');
const usdElement = document.getElementById('usd');
const goldElement = document.getElementById('gold');


function ShowErrorMessagesForElement(targetElement) {
 
    targetElement.querySelector('.price').innerText = "Verilere ulaşılamadı";
    targetElement.querySelector('.change').innerText = ""; 
    targetElement.querySelector('.change').className = 'change'; 
}



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
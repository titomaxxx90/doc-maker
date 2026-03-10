let currentUser = null, selectedCountry = 'РК', docType = 'Счет', isGuest = false, activeHistoryTab = 'Счет';

const config = {
    'РК': { name: 'Казахстан', tax: 'БИН/ИИН', cur: 'тенге', flag: '🇰🇿', subunits: 'тиын' },
    'РФ': { name: 'Россия', tax: 'ИНН/КПП', cur: 'руб.', flag: '🇷🇺', subunits: 'коп.' },
    'РБ': { name: 'Беларусь', tax: 'УНП', cur: 'бел. руб.', flag: '🇧🇾', subunits: 'коп.' },
    'КР': { name: 'Кыргызстан', tax: 'ИНН', cur: 'сом', flag: '🇰🇬', subunits: 'тыйын' }
};

// Функция перевода суммы в слова
function numberToWords(amount, country) {
    const val = Math.floor(amount);
    const units = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
    const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
    const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
    
    function convert(n) {
        let str = "";
        if (n >= 100) { str += hundreds[Math.floor(n / 100)] + " "; n %= 100; }
        if (n >= 20) { str += tens[Math.floor(n / 10)] + " "; n %= 10; }
        if (n > 0) { str += units[n] + " "; }
        return str;
    }
    return convert(val) + config[country].cur;
}

function renderCountryBtns() {
    document.getElementById('country-btns').innerHTML = Object.keys(config).map(c => `
        <button onclick="setCountry('${c}')" class="p-2 rounded border flex items-center gap-2 transition ${selectedCountry === c ? 'bg-slate-800 text-white' : 'bg-gray-50'}">
            <span class="text-lg">${config[c].flag}</span>
            <span class="text-[9px] font-bold uppercase">${config[c].name}</span>
        </button>
    `).join('');
}

window.setCountry = (c) => { selectedCountry = c; renderCountryBtns(); renderForm(); updatePreview(); };

function renderForm() {
    const f = config[selectedCountry];
    let staffHtml = `<input type="text" id="p-ceo" placeholder="ФИО Руководителя" class="w-full p-2 border rounded text-xs" oninput="updatePreview()">`;
    if (docType === 'Счет') staffHtml += `<input type="text" id="p-acc" placeholder="ФИО Бухгалтера" class="w-full p-2 border rounded text-xs" oninput="updatePreview()">`;
    document.getElementById('staff-fields').innerHTML = staffHtml;

    document.getElementById('dynamic-form').innerHTML = `
        <h3 class="font-bold text-gray-700 text-[10px] uppercase">Данные Клиента</h3>
        <input type="text" id="c-name" placeholder="Название клиента" class="w-full p-2 border rounded text-xs" oninput="updatePreview()">
        <input type="text" id="c-tax" placeholder="${f.tax} клиента" class="w-full p-2 border rounded text-xs" oninput="updatePreview()">
        <input type="number" id="val-amount" placeholder="Сумма" class="w-full p-2 border rounded text-xs font-bold" oninput="updatePreview()">
        <textarea id="val-desc" placeholder="Описание услуг" class="w-full p-2 border rounded text-xs" oninput="updatePreview()"></textarea>
    `;
}

function updatePreview() {
    const dNum = document.getElementById('doc-number').value || '___';
    const am = document.getElementById('val-amount').value || '0';
    const sumInWords = numberToWords(am, selectedCountry);
    
    let html = (docType === 'Счет') ? `
        <h2 style="text-align: center; font-size: 16pt;">Счет №${dNum}</h2>
        <p><strong>Всего к оплате:</strong> ${sumInWords}</p>
    ` : `<h2 style="text-align: center;">АКТ №${dNum}</h2><p><strong>Сумма:</strong> ${sumInWords}</p>`;
    document.getElementById('doc-render-area').innerHTML = html;
}

window.setDocType = (type) => { docType = type; renderForm(); updatePreview(); };

async function downloadPDF() {
    const element = document.getElementById('doc-render-area');
    html2pdf().from(element).save();
}

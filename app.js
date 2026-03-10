let currentUser = null, selectedCountry = 'РК', docType = 'Счет', isGuest = false, activeHistoryTab = 'Счет';

const config = {
    'РК': { tax: 'БИН/ИИН', cur: 'тенге', flag: '🇰🇿', subunits: 'тиын' },
    'РФ': { tax: 'ИНН/КПП', cur: 'руб.', flag: '🇷🇺', subunits: 'коп.' },
    'РБ': { tax: 'УНП', cur: 'бел. руб.', flag: '🇧🇾', subunits: 'коп.' },
    'КР': { tax: 'ИНН', cur: 'сом', flag: '🇰🇬', subunits: 'тыйын' }
};

// Функция перевода суммы в слова (для РК, РФ, КР, РБ)
function numberToWords(amount, country) {
    const val = Math.floor(amount);
    const sub = Math.round((amount - val) * 100);
    
    // Упрощенная логика прописи для счета
    const units = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
    const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
    const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
    const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

    function convert(n) {
        let str = "";
        if (n >= 100) { str += hundreds[Math.floor(n / 100)] + " "; n %= 100; }
        if (n >= 20) { str += tens[Math.floor(n / 10)] + " "; n %= 10; }
        else if (n >= 10) { str += teens[n - 10] + " "; return str; }
        if (n > 0) { str += units[n] + " "; }
        return str;
    }

    const words = convert(val) + config[country].cur + (sub > 0 ? ` ${sub} ${config[country].subunits}` : " 00 " + config[country].subunits);
    return words.charAt(0).toUpperCase() + words.slice(1);
}

// --- АВТОРИЗАЦИЯ И СТАРТ ---
document.getElementById('guest-btn').onclick = () => { isGuest = true; startApp(); };
document.getElementById('login-btn').onclick = () => handleAuth('login');
document.getElementById('reg-btn').onclick = () => handleAuth('signup');
document.getElementById('logout-btn').onclick = () => location.reload();

async function handleAuth(type) {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    if(!email || password.length < 6) return alert("Введите email и пароль от 6 символов");

    const { data, error } = (type === 'login') 
        ? await db.auth.signInWithPassword({ email, password })
        : await db.auth.signUp({ email, password });

    if (error) alert(error.message);
    else if (type === 'signup') alert("Регистрация успешна!");
    else { currentUser = data.user; isGuest = false; startApp(); }
}

function startApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    document.getElementById('doc-date').valueAsDate = new Date();
    
    if(!isGuest) { document.getElementById('history-box').classList.remove('hidden'); loadHistory(); }
    renderCountryBtns(); renderForm(); updatePreview();
}

// --- ИНТЕРФЕЙС ---
function renderCountryBtns() {
    document.getElementById('country-btns').innerHTML = Object.keys(config).map(c => `
        <button onclick="setCountry('${c}')" class="p-2 rounded border flex flex-col items-center gap-1 transition ${selectedCountry === c ? 'bg-slate-800 text-white' : 'bg-gray-50'}">
            <span class="text-lg">${config[c].flag}</span>
            <span class="text-[9px] font-bold">${c}</span>
        </button>
    `).join('');
}

window.setCountry = (c) => { selectedCountry = c; renderCountryBtns(); renderForm(); updatePreview(); };

window.setDocType = (type) => {
    docType = type;
    document.getElementById('btn-inv').className = type === 'Счет' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs uppercase';
    document.getElementById('btn-avr').className = type === 'АВР' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs uppercase';
    renderForm(); updatePreview();
};

function renderForm() {
    const f = config[selectedCountry];
    let staffHtml = `<input type="text" id="p-ceo" placeholder="ФИО Руководителя" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">`;
    if (docType === 'Счет') {
        staffHtml += `<input type="text" id="p-acc" placeholder="ФИО Бухгалтера" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">`;
    }
    document.getElementById('staff-fields').innerHTML = staffHtml;

    document.getElementById('dynamic-form').innerHTML = `
        <h3 class="font-bold text-gray-700 text-[10px] uppercase">Данные Клиента</h3>
        <input type="text" id="c-name" placeholder="Название клиента" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        <input type="text" id="c-tax" placeholder="${f.tax} клиента" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        <input type="number" id="val-amount" placeholder="Сумма" class="w-full p-2 border rounded text-xs font-bold outline-none" oninput="updatePreview()">
        <textarea id="val-desc" rows="3" placeholder="Описание услуг" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()"></textarea>
    `;
}

function updatePreview() {
    const dNum = document.getElementById('doc-number').value || '___';
    const dDateVal = document.getElementById('doc-date').value;
    const dDate = dDateVal ? new Date(dDateVal).toLocaleDateString() : '___';
    
    const pCeo = document.getElementById('p-ceo')?.value || '____________';
    const pAcc = document.getElementById('p-acc')?.value || '____________';
    const am = document.getElementById('val-amount')?.value || '0';
    const sumInWords = numberToWords(am, selectedCountry);

    let html = '';
    if (docType === 'Счет') {
        html = `
            <div style="font-size: 11pt;">
                <h2 style="text-align: center; font-weight: bold; font-size: 16pt; margin-bottom: 20px;">Счет на оплату №${dNum} от ${dDate}</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead><tr style="background: #f0f0f0;"><th class="border-black">Наименование</th><th class="border-black">Сумма</th></tr></thead>
                    <tbody><tr><td class="border-black" style="padding: 10px;">${document.getElementById('val-desc')?.value || ''}</td><td class="border-black text-right" style="padding: 10px;">${am}</td></tr></tbody>
                </table>
                <p><strong>Всего к оплате:</strong> ${sumInWords}</p>
                <div style="margin-top: 50px;">
                    <p>Руководитель: ________________ / ${pCeo} /</p><br>
                    <p>Бухгалтер: ________________ / ${pAcc} /</p>
                </div>
            </div>
        `;
    } else {
        html = `
            <div style="font-size: 11pt;">
                <h2 style="text-align: center; font-weight: bold; font-size: 14pt;">АКТ ВЫПОЛНЕННЫХ РАБОТ</h2>
                <p style="text-align: center;">№${dNum} от ${dDate}</p>
                <p><strong>Сумма:</strong> ${sumInWords}</p>
            </div>
        `;
    }
    document.getElementById('doc-render-area').innerHTML = html;
}

// --- ИСТОРИЯ ---
window.switchHistoryTab = (type) => {
    activeHistoryTab = type;
    loadHistory();
};

async function loadHistory() {
    if (!currentUser) return;
    const { data } = await db.from('invoices').select('*').eq('user_id', currentUser.id).eq('document_type', activeHistoryTab).order('created_at', { ascending: false });
    const cont = document.getElementById('history-list');
    cont.innerHTML = data ? data.map(i => `
        <div onclick='restoreFromHistory(${JSON.stringify(i)})' class="p-2 border rounded bg-gray-50 cursor-pointer hover:bg-blue-50">
            <div class="flex justify-between text-[9px] font-bold text-blue-600"><span>№${i.doc_number}</span><span>${i.amount}</span></div>
            <div class="text-[10px] truncate">${i.client_name}</div>
        </div>`).join('') : '<div class="text-center text-xs text-gray-300">Нет данных</div>';
}

window.restoreFromHistory = (i) => {
    selectedCountry = i.country; docType = i.document_type;
    renderCountryBtns(); renderForm();
    document.getElementById('doc-number').value = i.doc_number || '';
    document.getElementById('c-name').value = i.client_name || '';
    document.getElementById('val-amount').value = i.amount || 0;
    updatePreview();
};

async function downloadPDF() {
    if(!isGuest) await saveToDB();
    const element = document.getElementById('doc-render-area');
    html2pdf().from(element).set({ margin: 10, filename: `Doc.pdf`, html2canvas: { scale: 3 } }).save();
}

async function saveToDB() {
    if (isGuest) return;
    const payload = {
        user_id: currentUser.id,
        country: selectedCountry,
        document_type: docType,
        doc_number: document.getElementById('doc-number').value,
        amount: parseFloat(document.getElementById('val-amount').value) || 0
    };
    await db.from('invoices').insert([payload]);
    loadHistory();
}

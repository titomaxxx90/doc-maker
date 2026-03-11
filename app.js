let currentUser = null, selectedCountry = 'РК', docType = 'Счет', isGuest = false, activeHistoryTab = 'Счет';
window.currentHistoryData = [];
let docItems = [{ code: '1', name: '', qty: 1, unit: 'шт', price: 0 }];

const config = {
    'РК': { name: 'Казахстан', tax: 'БИН/ИИН', cur: 'KZT', flag: '🇰🇿', subunits: 'тиын', curText: 'тенге' },
    'РФ': { name: 'Россия', tax: 'ИНН/КПП', cur: 'RUB', flag: '🇷🇺', subunits: 'коп.', curText: 'рублей' },
    'РБ': { name: 'Беларусь', tax: 'УНП', cur: 'BYN', flag: '🇧🇾', subunits: 'коп.', curText: 'бел. рублей' },
    'КР': { name: 'Кыргызстан', tax: 'ИНН', cur: 'KGS', flag: '🇰🇬', subunits: 'тыйын', curText: 'сомов' }
};

window.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        currentUser = session.user;
        document.getElementById('user-display').innerText = currentUser.email;
        document.getElementById('user-display').classList.remove('hidden');
        document.getElementById('auto-save-hint').classList.remove('hidden');
        startApp();
    }
});

function numberToWords(amount, country) {
    const val = Math.floor(amount);
    const sub = Math.round((amount - val) * 100);
    const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const onesFem = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

    function getForm(n, forms) {
        n = Math.abs(n) % 100; let n1 = n % 10;
        if (n > 10 && n < 20) return forms[2];
        if (n1 > 1 && n1 < 5) return forms[1];
        if (n1 === 1) return forms[0];
        return forms[2];
    }
    function parseGroup(n, isFemale, forms) {
        let r = ''; let h = Math.floor(n / 100); let t = Math.floor((n % 100) / 10); let u = n % 10;
        if (h > 0) r += hundreds[h] + ' ';
        if (t === 1) r += teens[u] + ' ';
        else { if (t > 1) r += tens[t] + ' '; if (u > 0) r += (isFemale ? onesFem[u] : ones[u]) + ' '; }
        if (n > 0 && forms) r += getForm(n, forms) + ' ';
        return r;
    }
    if (val === 0) return `Ноль ${config[country].curText} 00 ${config[country].subunits}`;
    let m = Math.floor(val / 1000000), th = Math.floor((val % 1000000) / 1000), rem = val % 1000;
    let str = '';
    if (m > 0) str += parseGroup(m, false, ['миллион', 'миллиона', 'миллионов']);
    if (th > 0) str += parseGroup(th, true, ['тысяча', 'тысячи', 'тысяч']);
    str += parseGroup(rem, false, null);
    str = str.trim() + ' ' + config[country].curText;
    const subStr = sub < 10 ? '0'+sub : sub;
    const res = str.charAt(0).toUpperCase() + str.slice(1) + ` ${subStr} ${config[country].subunits}`;
    return res;
}

document.getElementById('guest-btn').onclick = () => { isGuest = true; startApp(); };
document.getElementById('login-btn').onclick = () => handleAuth('login');
document.getElementById('reg-btn').onclick = () => document.getElementById('reg-modal').classList.remove('hidden');
document.getElementById('submit-reg-btn').onclick = () => handleAuth('signup');
document.getElementById('logout-btn').onclick = async () => { await db.auth.signOut(); location.reload(); };

async function handleAuth(type) {
    const email = document.getElementById(type === 'login' ? 'email-input' : 'reg-email').value;
    const password = document.getElementById(type === 'login' ? 'password-input' : 'reg-password').value;
    const { error } = (type === 'login') ? await db.auth.signInWithPassword({ email, password }) : await db.auth.signUp({ email, password });
    if (error) alert(error.message); else location.reload();
}

function startApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('doc-date').valueAsDate = new Date();
    if(!isGuest) { document.getElementById('history-box').classList.remove('hidden'); loadHistory(); }
    renderCountryBtns(); renderItemsInputs(); updatePreview();
}

function renderCountryBtns() {
    document.getElementById('country-btns').innerHTML = Object.keys(config).map(c => `
        <button onclick="setCountry('${c}')" class="p-2 rounded border flex flex-col items-center gap-1 transition ${selectedCountry === c ? 'bg-slate-800 text-white' : 'bg-gray-50 hover:bg-gray-100'}">
            <span class="text-xl">${config[c].flag}</span>
            <span class="text-[9px] font-bold uppercase text-center">${config[c].name}</span>
        </button>
    `).join('');
}

window.setCountry = (c) => { selectedCountry = c; renderCountryBtns(); updatePreview(); };
window.setDocType = (type) => {
    docType = type;
    document.getElementById('btn-inv').className = type === 'Счет' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs uppercase';
    document.getElementById('btn-avr').className = type === 'АВР' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs uppercase';
    updatePreview();
};

window.addItem = () => { docItems.push({ code: (docItems.length + 1).toString(), name: '', qty: 1, unit: 'шт', price: 0 }); renderItemsInputs(); updatePreview(); };
window.removeItem = (index) => { if (docItems.length > 1) docItems.splice(index, 1); renderItemsInputs(); updatePreview(); };
window.updateItem = (index, field, value) => { docItems[index][field] = (field === 'qty' || field === 'price') ? parseFloat(value) || 0 : value; updatePreview(); };

function renderItemsInputs() {
    const cont = document.getElementById('items-container');
    cont.innerHTML = docItems.map((item, i) => `
        <div class="flex gap-1 items-center bg-gray-50 p-2 rounded border">
            <input type="text" value="${item.name}" oninput="updateItem(${i}, 'name', this.value)" placeholder="Название услуги/товара" class="flex-1 p-1 border rounded text-xs outline-none">
            <input type="number" value="${item.qty}" oninput="updateItem(${i}, 'qty', this.value)" class="w-12 p-1 border rounded text-xs text-center">
            <input type="text" value="${item.unit}" oninput="updateItem(${i}, 'unit', this.value)" class="w-10 p-1 border rounded text-xs text-center">
            <input type="number" value="${item.price}" oninput="updateItem(${i}, 'price', this.value)" class="w-20 p-1 border rounded text-xs text-right">
            <button onclick="removeItem(${i})" class="text-red-500 px-2 text-xs">✕</button>
        </div>
    `).join('');
}

function updatePreview() {
    const v = (id) => document.getElementById(id)?.value || '';
    const dNum = v('doc-number') || '___';
    const dDate = v('doc-date') ? new Date(v('doc-date')).toLocaleDateString('ru-RU') : '___';
    let total = 0;
    
    const rows = docItems.map((it, i) => {
        const s = it.qty * it.price; total += s;
        return `<tr><td style="border:1px solid #000;padding:4px;text-align:center">${i+1}</td><td style="border:1px solid #000;padding:4px">${it.name}</td><td style="border:1px solid #000;padding:4px;text-align:center">${it.qty}</td><td style="border:1px solid #000;padding:4px;text-align:center">${it.unit}</td><td style="border:1px solid #000;padding:4px;text-align:right">${it.price.toFixed(2)}</td><td style="border:1px solid #000;padding:4px;text-align:right">${s.toFixed(2)}</td></tr>`;
    }).join('');

    let html = '';
    if (docType === 'Счет') {
        html = `
            <div style="font-family:Arial;font-size:10pt;">
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #000">
                    <tr><td style="border:1px solid #000;padding:5px">Поставщик: <b>${v('p-name')}</b><br>${config[selectedCountry].tax}: ${v('p-tax')}</td><td style="border:1px solid #000;padding:5px">ИИК: ${v('p-iik')}<br>БИК: ${v('p-bik')}</td></tr>
                </table>
                <h2 style="text-align:center">Счет на оплату №${dNum} от ${dDate}</h2>
                <p><b>Покупатель:</b> ${v('c-name')}, ${v('c-tax')}</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
                    <tr style="background:#eee;font-weight:bold"><td style="border:1px solid #000;padding:4px">№</td><td style="border:1px solid #000;padding:4px">Наименование</td><td style="border:1px solid #000;padding:4px">Кол-во</td><td style="border:1px solid #000;padding:4px">Ед.</td><td style="border:1px solid #000;padding:4px">Цена</td><td style="border:1px solid #000;padding:4px">Сумма</td></tr>
                    ${rows}
                </table>
                <div style="text-align:right;font-weight:bold">Итого: ${total.toFixed(2)} ${config[selectedCountry].cur}</div>
                <p>Всего к оплате: ${numberToWords(total, selectedCountry)}</p>
                <div style="margin-top:30px">Руководитель: ___________ / ${v('p-ceo')}</div>
            </div>`;
    } else {
        let header = (selectedCountry === 'РК') ? `<div style="text-align:right;font-size:7pt">Приложение 50 к приказу МФ РК №562<br>Форма Р-1</div>` : `<div style="height:20px"></div>`;
        html = `
            <div style="font-family:Arial;font-size:9pt">
                ${header}
                <h3 style="text-align:center;text-transform:uppercase">Акт выполненных работ №${dNum} от ${dDate}</h3>
                <p><b>Исполнитель:</b> ${v('p-name')}, ${v('p-tax')}</p>
                <p><b>Заказчик:</b> ${v('c-name')}, ${v('c-tax')}</p>
                <table style="width:100%;border-collapse:collapse;margin-top:10px">
                    <tr style="background:#eee;text-align:center;font-weight:bold"><td style="border:1px solid #000">№</td><td style="border:1px solid #000">Наименование работ</td><td style="border:1px solid #000">Кол-во</td><td style="border:1px solid #000">Цена</td><td style="border:1px solid #000">Сумма</td></tr>
                    ${rows}
                </table>
                <p style="text-align:right;font-weight:bold;margin-top:5px">Итого к оплате: ${total.toFixed(2)} ${config[selectedCountry].cur}</p>
                <div style="display:flex;justify-content:space-between;margin-top:50px">
                    <div style="width:45%">От Исполнителя:<br><br>__________ / ${v('p-ceo')}</div>
                    <div style="width:45%">От Заказчика:<br><br>__________ / </div>
                </div>
            </div>`;
    }
    document.getElementById('doc-render-area').innerHTML = html;
}

async function loadHistory() {
    if (!currentUser) return;
    const { data, error } = await db.from('invoices').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (error) return;
    window.currentHistoryData = data;
    const items = data.filter(d => d.document_type === activeHistoryTab);
    document.getElementById('count-inv').innerText = data.filter(d => d.document_type === 'Счет').length;
    document.getElementById('count-avr').innerText = data.filter(d => d.document_type === 'АВР').length;
    
    const cont = document.getElementById('history-list');
    cont.innerHTML = items.length > 0 ? items.map(i => `
        <div class="p-2 border rounded bg-gray-50 hover:bg-blue-50 relative group cursor-pointer" onclick="restoreById('${i.id}')">
            <div class="flex justify-between font-bold text-[9px] text-blue-600"><span>№${i.doc_number || 'б/н'}</span><span>${(i.amount || 0).toFixed(2)}</span></div>
            <div class="text-[10px] truncate text-gray-600">${i.client_name || 'Без имени'}</div>
            <button onclick="event.stopPropagation(); deleteItem('${i.id}')" class="absolute right-1 top-1 text-red-300 hover:text-red-600 hidden group-hover:block">✕</button>
        </div>
    `).join('') : '<div class="text-center py-4 text-gray-300 text-[10px]">История пуста</div>';
}

window.deleteItem = async (id) => {
    if(!confirm("Удалить этот документ из истории?")) return;
    const { error } = await db.from('invoices').delete().eq('id', id);
    if (error) alert("Ошибка при удалении: " + error.message); else loadHistory();
};

window.switchHistoryTab = (type) => {
    activeHistoryTab = type;
    document.getElementById('tab-h-inv').className = type === 'Счет' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 border-r shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400 border-r';
    document.getElementById('tab-h-avr').className = type === 'АВР' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400';
    loadHistory();
};

window.restoreById = (id) => {
    const i = window.currentHistoryData.find(d => d.id === id);
    if (!i) return;
    const s = (id, v) => { const el = document.getElementById(id); if(el) el.value = v || ''; };
    selectedCountry = i.country; docType = i.document_type; docItems = i.items || [];
    s('doc-number', i.doc_number); s('doc-date', i.doc_date);
    s('p-name', i.provider_name); s('p-tax', i.provider_tax_id);
    s('p-address', i.p_address); s('p-iik', i.p_iik); s('p-bik', i.p_bik);
    s('p-kbe', i.p_kbe); s('p-knp', i.p_knp); s('p-ceo', i.provider_ceo);
    s('c-name', i.client_name); s('c-tax', i.client_tax_id);
    s('c-address', i.c_address); s('c-contract', i.c_contract);
    renderCountryBtns(); renderItemsInputs(); updatePreview();
};

async function downloadPDF() {
    if(!isGuest && currentUser) await saveToDB();
    const element = document.getElementById('doc-render-area');
    html2pdf().from(element).set({ margin: 10, filename: 'Document.pdf', html2canvas: { scale: 2 } }).save();
}

async function saveToDB() {
    if (isGuest || !currentUser) return;
    const gV = (id) => document.getElementById(id)?.value || '';
    const payload = {
        user_id: currentUser.id, country: selectedCountry, document_type: docType,
        doc_number: gV('doc-number'), doc_date: gV('doc-date'),
        provider_name: gV('p-name'), provider_tax_id: gV('p-tax'),
        p_address: gV('p-address'), p_iik: gV('p-iik'), p_bik: gV('p-bik'),
        p_kbe: gV('p-kbe'), p_knp: gV('p-knp'), provider_ceo: gV('p-ceo'),
        client_name: gV('c-name'), client_tax_id: gV('c-tax'),
        c_address: gV('c-address'), c_contract: gV('c-contract'),
        amount: docItems.reduce((acc, it) => acc + (it.qty * it.price), 0),
        items: docItems
    };
    const { error } = await db.from('invoices').insert([payload]);
    if (error) {
        console.error("Save error:", error);
        if (error.code === '23502') alert("Ошибка: База требует заполнить поле " + error.details);
    } else { loadHistory(); }
}

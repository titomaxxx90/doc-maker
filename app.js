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
    const finalStr = `${str} ${subStr} ${config[country].subunits}`;
    return finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
}

document.getElementById('guest-btn').onclick = () => { isGuest = true; startApp(); };
document.getElementById('login-btn').onclick = () => handleAuth('login');
document.getElementById('reg-btn').onclick = () => document.getElementById('reg-modal').classList.remove('hidden');
window.closeRegModal = () => document.getElementById('reg-modal').classList.add('hidden');
document.getElementById('submit-reg-btn').onclick = () => handleAuth('signup');
document.getElementById('logout-btn').onclick = async () => { await db.auth.signOut(); location.reload(); };

async function handleAuth(type) {
    let email, password;
    if (type === 'login') {
        email = document.getElementById('email-input').value;
        password = document.getElementById('password-input').value;
    } else {
        email = document.getElementById('reg-email').value;
        password = document.getElementById('reg-password').value;
    }
    if(!email || password.length < 6) return alert("Минимум 6 символов");
    const { data, error } = (type === 'login') ? await db.auth.signInWithPassword({ email, password }) : await db.auth.signUp({ email, password });
    if (error) alert(error.message);
    else if (type === 'signup') { alert("Успешно! Войдите в аккаунт."); closeRegModal(); }
    else { location.reload(); }
}

function startApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    document.getElementById('doc-date').valueAsDate = new Date();
    if(!isGuest) { document.getElementById('history-box').classList.remove('hidden'); loadHistory(); }
    renderCountryBtns(); renderForm(); renderItemsInputs(); updatePreview();
}

function renderCountryBtns() {
    document.getElementById('country-btns').innerHTML = Object.keys(config).map(c => `
        <button onclick="setCountry('${c}')" class="p-2 rounded border flex items-center gap-2 transition ${selectedCountry === c ? 'bg-slate-800 text-white' : 'bg-gray-50 hover:bg-gray-200'}">
            <span class="text-xl">${config[c].flag}</span>
            <span class="text-[10px] font-bold uppercase truncate">${config[c].name}</span>
        </button>
    `).join('');
}

window.setCountry = (c) => { selectedCountry = c; renderCountryBtns(); updatePreview(); };
window.setDocType = (type) => {
    docType = type;
    document.getElementById('btn-inv').className = type === 'Счет' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs uppercase';
    document.getElementById('btn-avr').className = type === 'АВР' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs uppercase';
    renderForm(); updatePreview();
};

function renderForm() {
    let staffHtml = '';
    if (docType === 'Счет') {
        staffHtml = `
            <input type="text" id="p-ceo" placeholder="Директор (ФИО)" class="w-full p-2 border rounded text-xs mb-2 outline-none" oninput="updatePreview()">
            <input type="text" id="p-accountant" placeholder="Бухгалтер (ФИО)" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        `;
    } else {
        staffHtml = `
            <input type="text" id="p-ceo-role" placeholder="Должность Исполнителя" class="w-full p-2 border rounded text-xs mb-2 outline-none" oninput="updatePreview()">
            <input type="text" id="p-ceo" placeholder="ФИО Исполнителя" class="w-full p-2 border rounded text-xs mb-2 outline-none" oninput="updatePreview()">
            <hr class="my-2">
            <input type="text" id="c-ceo-role" placeholder="Должность Заказчика" class="w-full p-2 border rounded text-xs mb-2 outline-none" oninput="updatePreview()">
            <input type="text" id="c-ceo" placeholder="ФИО Заказчика" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        `;
    }
    document.getElementById('staff-fields').innerHTML = staffHtml;
}

window.toggleNds = () => {
    const isChecked = document.getElementById('include-nds').checked;
    document.getElementById('nds-rate').classList.toggle('hidden', !isChecked);
    document.getElementById('nds-label').classList.toggle('hidden', !isChecked);
    updatePreview();
};

window.addItem = () => { docItems.push({ code: (docItems.length + 1).toString(), name: '', qty: 1, unit: 'шт', price: 0 }); renderItemsInputs(); updatePreview(); };
window.removeItem = (index) => { if (docItems.length > 1) docItems.splice(index, 1); renderItemsInputs(); updatePreview(); };
window.updateItem = (index, field, value) => { docItems[index][field] = field === 'qty' || field === 'price' ? parseFloat(value) || 0 : value; updatePreview(); };

function renderItemsInputs() {
    const cont = document.getElementById('items-container');
    cont.innerHTML = docItems.map((item, i) => `
        <div class="flex gap-1 items-center bg-gray-50 p-2 rounded border">
            <input type="text" value="${item.name}" oninput="updateItem(${i}, 'name', this.value)" placeholder="Название" class="flex-1 p-1 border rounded text-xs outline-none">
            <input type="number" value="${item.qty}" oninput="updateItem(${i}, 'qty', this.value)" class="w-12 p-1 border rounded text-xs outline-none text-center">
            <input type="text" value="${item.unit}" oninput="updateItem(${i}, 'unit', this.value)" class="w-10 p-1 border rounded text-xs outline-none text-center">
            <input type="number" value="${item.price}" oninput="updateItem(${i}, 'price', this.value)" class="w-20 p-1 border rounded text-xs outline-none text-right">
            <button onclick="removeItem(${i})" class="text-red-500 px-2 text-xs">✕</button>
        </div>
    `).join('');
}

function updatePreview() {
    const val = (id) => document.getElementById(id)?.value || '';
    const dNum = val('doc-number') || '___';
    const dDate = val('doc-date') ? new Date(val('doc-date')).toLocaleDateString('ru-RU') : '___';
    let total = 0;
    const itemsRows = docItems.map((it, i) => {
        const s = it.qty * it.price; total += s;
        return `<tr><td style="border:1px solid #000;padding:4px;text-align:center">${i+1}</td><td style="border:1px solid #000;padding:4px;text-align:center">${it.code}</td><td style="border:1px solid #000;padding:4px">${it.name}</td><td style="border:1px solid #000;padding:4px;text-align:center">${it.qty}</td><td style="border:1px solid #000;padding:4px;text-align:center">${it.unit}</td><td style="border:1px solid #000;padding:4px;text-align:right">${it.price.toFixed(2)}</td><td style="border:1px solid #000;padding:4px;text-align:right">${s.toFixed(2)}</td></tr>`;
    }).join('');

    const hasNds = document.getElementById('include-nds')?.checked;
    const ndsR = parseFloat(val('nds-rate')) || 0;
    const ndsSum = hasNds ? (total * ndsR / (100 + ndsR)).toFixed(2) : '0.00';

    let html = '';
    if (docType === 'Счет') {
        html = `
            <div style="font-family:Arial;font-size:10pt;line-height:1.2">
                <div style="text-align:center;font-size:8pt;margin-bottom:15px">Внимание! Оплата данного счета означает согласие с условиями поставки товара.</div>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #000">
                    <tr><td rowspan="2" style="border:1px solid #000;padding:5px">Бенефициар: <b>${val('p-name')}</b><br>${config[selectedCountry].tax}: ${val('p-tax')}</td><td style="border:1px solid #000;padding:2px;background:#eee;text-align:center">ИИК</td><td style="border:1px solid #000;padding:2px;background:#eee;text-align:center">Кбе</td></tr>
                    <tr><td style="border:1px solid #000;padding:5px;text-align:center"><b>${val('p-iik')}</b></td><td style="border:1px solid #000;padding:5px;text-align:center"><b>${val('p-kbe')}</b></td></tr>
                    <tr><td style="border:1px solid #000;padding:5px">Банк: ${val('p-bank')}</td><td style="border:1px solid #000;padding:2px;background:#eee;text-align:center">БИК</td><td style="border:1px solid #000;padding:2px;background:#eee;text-align:center">КНП</td></tr>
                    <tr><td style="border:1px solid #000"></td><td style="border:1px solid #000;padding:5px;text-align:center">${val('p-bik')}</td><td style="border:1px solid #000;padding:5px;text-align:center">${val('p-knp')}</td></tr>
                </table>
                <h2 style="border-bottom:2px solid #000;margin-bottom:10px">Счет №${dNum} от ${dDate}</h2>
                <p><b>Поставщик:</b> ${val('p-name')}, ${val('p-address')}</p>
                <p><b>Покупатель:</b> ${val('c-name')}, ИИН/БИН: ${val('c-tax')}, ${val('c-address')}</p>
                <p><b>Договор:</b> ${val('c-contract')}</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
                    <tr style="font-weight:bold;background:#eee"><td style="border:1px solid #000;padding:4px">№</td><td style="border:1px solid #000;padding:4px">Код</td><td style="border:1px solid #000;padding:4px">Наименование</td><td style="border:1px solid #000;padding:4px">Кол-во</td><td style="border:1px solid #000;padding:4px">Ед.</td><td style="border:1px solid #000;padding:4px">Цена</td><td style="border:1px solid #000;padding:4px">Сумма</td></tr>
                    ${itemsRows}
                </table>
                <div style="text-align:right"><b>Итого: ${total.toFixed(2)}</b><br><b>НДС: ${ndsSum}</b></div>
                <p>Всего к оплате: <b>${numberToWords(total, selectedCountry)}</b></p>
                <div style="margin-top:40px">Директор __________ (${val('p-ceo')}) &nbsp;&nbsp;&nbsp; Бухгалтер __________ (${val('p-accountant')})</div>
            </div>
        `;
    } else {
        // Убрали шапку Приложение 50 для всех, кроме Казахстана
        let header = (selectedCountry === 'РК') ? `<div style="text-align:right;font-size:7pt">Приложение 50 к приказу МФ РК №562<br>Форма Р-1</div>` : `<div style="height:20px"></div>`;
        html = `
            <div style="font-family:Arial;font-size:8pt">
                ${header}
                <table style="width:100%;margin-bottom:10px">
                    <tr><td>Заказчик: <b>${val('c-name')}</b>, ${val('c-address')}</td><td style="text-align:right">БИН: ${val('c-tax')}</td></tr>
                    <tr><td>Исполнитель: <b>${val('p-name')}</b>, ${val('p-address')}</td><td style="text-align:right">БИН: ${val('p-tax')}</td></tr>
                </table>
                <h3 style="text-align:center">АКТ ВЫПОЛНЕННЫХ РАБОТ №${dNum} от ${dDate}</h3>
                <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
                    <tr style="font-weight:bold;text-align:center"><td style="border:1px solid #000;padding:2px">№</td><td style="border:1px solid #000;padding:2px">Наименование работ</td><td style="border:1px solid #000;padding:2px">Ед.</td><td style="border:1px solid #000;padding:2px">Кол-во</td><td style="border:1px solid #000;padding:2px">Цена</td><td style="border:1px solid #000;padding:2px">Стоимость</td></tr>
                    ${docItems.map((it, i) => `<tr><td style="border:1px solid #000;text-align:center">${i+1}</td><td style="border:1px solid #000;padding:2px">${it.name}</td><td style="border:1px solid #000;text-align:center">${it.unit}</td><td style="border:1px solid #000;text-align:center">${it.qty}</td><td style="border:1px solid #000;text-align:right">${it.price.toFixed(2)}</td><td style="border:1px solid #000;text-align:right">${(it.qty*it.price).toFixed(2)}</td></tr>`).join('')}
                    <tr><td colspan="5" style="text-align:right;padding:2px">Итого:</td><td style="border:1px solid #000;text-align:right;font-weight:bold">${total.toFixed(2)}</td></tr>
                </table>
                <table style="width:100%;margin-top:40px">
                    <tr><td>Сдал (Исполнитель):<br>${val('p-ceo-role')}<br><br>__________ / ${val('p-ceo')}</td><td>Принял (Заказчик):<br>${val('c-ceo-role')}<br><br>__________ / ${val('c-ceo')}</td></tr>
                </table>
            </div>
        `;
    }
    document.getElementById('doc-render-area').innerHTML = html;
}

window.switchHistoryTab = (type) => {
    activeHistoryTab = type;
    document.getElementById('tab-h-inv').className = type === 'Счет' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 border-r shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400 border-r hover:text-gray-600';
    document.getElementById('tab-h-avr').className = type === 'АВР' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400 hover:text-gray-600';
    loadHistory();
};

async function loadHistory() {
    if (!currentUser) return;
    const { data, error } = await db.from('invoices').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (error) return console.error(error);
    window.currentHistoryData = data;
    const items = data.filter(d => d.document_type === activeHistoryTab);
    document.getElementById('count-inv').innerText = data.filter(d => d.document_type === 'Счет').length;
    document.getElementById('count-avr').innerText = data.filter(d => d.document_type === 'АВР').length;
    const cont = document.getElementById('history-list');
    if (items.length > 0) {
        cont.innerHTML = items.map(i => `
            <div class="p-2 border rounded bg-gray-50 hover:bg-blue-50 relative group">
                <div class="cursor-pointer" onclick="restoreById('${i.id}')">
                    <div class="flex justify-between font-bold text-[9px] text-blue-600 pr-4"><span>№${i.doc_number || 'б/н'}</span><span>${i.amount.toFixed(2)}</span></div>
                    <div class="text-[10px] truncate text-gray-600">${i.client_name || 'Без имени'}</div>
                </div>
                <button onclick="event.stopPropagation(); deleteItem('${i.id}')" class="absolute right-1 top-1 text-red-400 hover:text-red-600 hidden group-hover:block">✕</button>
            </div>
        `).join('');
    } else { cont.innerHTML = `<div class="text-center py-4 text-gray-300 text-[10px]">Пусто</div>`; }
}

window.restoreById = (id) => {
    const i = window.currentHistoryData.find(d => d.id === id);
    if (!i) return;
    selectedCountry = i.country; docType = i.document_type; docItems = i.items || [];
    renderCountryBtns(); renderForm(); renderItemsInputs();
    const set = (id, v) => { if(document.getElementById(id)) document.getElementById(id).value = v || ''; };
    set('doc-number', i.doc_number); set('doc-date', i.doc_date); set('p-name', i.provider_name);
    set('p-tax', i.provider_tax_id); set('p-address', i.p_address); set('p-bank', i.provider_bank);
    set('p-iik', i.p_iik); set('p-bik', i.p_bik); set('p-kbe', i.p_kbe); set('p-knp', i.p_knp);
    set('p-ceo', i.provider_ceo); set('p-accountant', i.p_accountant); set('c-name', i.client_name);
    set('c-tax', i.client_tax_id); set('c-address', i.c_address); set('c-contract', i.c_contract);
    set('p-ceo-role', i.p_ceo_role); set('c-ceo-role', i.c_ceo_role); set('c-ceo', i.c_ceo);
    if(document.getElementById('include-nds')) { document.getElementById('include-nds').checked = i.include_nds; toggleNds(); }
    updatePreview();
};

window.deleteItem = async (id) => {
    if(!confirm("Удалить?")) return;
    const { error } = await db.from('invoices').delete().eq('id', id);
    if (error) alert("Ошибка удаления: " + error.message);
    else loadHistory();
};

async function downloadPDF() {
    if(!isGuest && currentUser) await saveToDB();
    const element = document.getElementById('doc-render-area');
    html2pdf().from(element).set({ margin: [10, 5, 10, 5], filename: `Document.pdf`, html2canvas: { scale: 3 } }).save();
}

async function saveToDB() {
    const val = (id) => document.getElementById(id)?.value || '';
    const payload = {
        user_id: currentUser.id, country: selectedCountry, document_type: docType,
        doc_number: val('doc-number'), doc_date: val('doc-date'), provider_name: val('p-name'),
        provider_tax_id: val('p-tax'), p_address: val('p-address'), provider_bank: val('p-bank'),
        p_iik: val('p-iik'), p_bik: val('p-bik'), p_kbe: val('p-kbe'), p_knp: val('p-knp'),
        provider_ceo: val('p-ceo'), p_accountant: val('p-accountant'), p_ceo_role: val('p-ceo-role'),
        include_nds: document.getElementById('include-nds')?.checked || false,
        nds_rate: parseFloat(val('nds-rate')) || 0, client_name: val('c-name'),
        client_tax_id: val('c-tax'), c_address: val('c-address'), c_contract: val('c-contract'),
        c_ceo: val('c-ceo'), c_ceo_role: val('c-ceo-role'),
        amount: docItems.reduce((acc, it) => acc + (it.qty * it.price), 0),
        items: docItems
    };
    const { error } = await db.from('invoices').insert([payload]);
    if (error) {
        console.error("DB Error:", error);
        alert("ОШИБКА БАЗЫ: " + error.message + "\nКод: " + error.code);
    } else { loadHistory(); }
}

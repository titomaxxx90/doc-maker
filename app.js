let currentUser = null, selectedCountry = 'РК', docType = 'Счет', isGuest = false, activeHistoryTab = 'Счет';

// Массив для хранения позиций в счете
let docItems = [{ code: '1', name: '', qty: 1, unit: 'шт', price: 0 }];

const config = {
    'РК': { name: 'Казахстан', tax: 'БИН/ИИН', cur: 'KZT', flag: '🇰🇿', subunits: 'тиын', curText: 'тенге' },
    'РФ': { name: 'Россия', tax: 'ИНН/КПП', cur: 'RUB', flag: '🇷🇺', subunits: 'коп.', curText: 'рублей' },
    'РБ': { name: 'Беларусь', tax: 'УНП', cur: 'BYN', flag: '🇧🇾', subunits: 'коп.', curText: 'бел. рублей' },
    'КР': { name: 'Кыргызстан', tax: 'ИНН', cur: 'KGS', flag: '🇰🇬', subunits: 'тыйын', curText: 'сомов' }
};

// --- ВОССТАНОВЛЕНИЕ СЕССИИ ПРИ ОБНОВЛЕНИИ СТРАНИЦЫ ---
window.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        currentUser = session.user;
        isGuest = false;
        document.getElementById('user-display').innerText = currentUser.email;
        document.getElementById('user-display').classList.remove('hidden');
        document.getElementById('auto-save-hint').classList.remove('hidden');
        startApp();
    }
});

// --- СУММА ПРОПИСЬЮ ---
function numberToWords(amount, country) {
    const val = Math.floor(amount);
    const sub = Math.round((amount - val) * 100);
    
    const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const onesFem = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

    function getForm(n, forms) {
        n = Math.abs(n) % 100;
        let n1 = n % 10;
        if (n > 10 && n < 20) return forms[2];
        if (n1 > 1 && n1 < 5) return forms[1];
        if (n1 === 1) return forms[0];
        return forms[2];
    }

    function parseGroup(n, isFemale, forms) {
        let r = '';
        let h = Math.floor(n / 100);
        let t = Math.floor((n % 100) / 10);
        let u = n % 10;
        if (h > 0) r += hundreds[h] + ' ';
        if (t === 1) r += teens[u] + ' ';
        else {
            if (t > 1) r += tens[t] + ' ';
            if (u > 0) r += (isFemale ? onesFem[u] : ones[u]) + ' ';
        }
        if (n > 0 && forms) r += getForm(n, forms) + ' ';
        return r;
    }

    if (val === 0) return `Ноль ${config[country].curText} 00 ${config[country].subunits}`;

    let m = Math.floor(val / 1000000);
    let th = Math.floor((val % 1000000) / 1000);
    let rem = val % 1000;

    let str = '';
    if (m > 0) str += parseGroup(m, false, ['миллион', 'миллиона', 'миллионов']);
    if (th > 0) str += parseGroup(th, true, ['тысяча', 'тысячи', 'тысяч']);
    str += parseGroup(rem, false, null);

    str = str.trim() + ' ' + config[country].curText;
    const subStr = sub < 10 ? '0'+sub : sub;
    const finalStr = `${str} ${subStr} ${config[country].subunits}`;
    
    return finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
}

// --- АВТОРИЗАЦИЯ И СТАРТ ---
document.getElementById('guest-btn').onclick = () => { isGuest = true; startApp(); };
document.getElementById('login-btn').onclick = () => handleAuth('login');

// Всплывающее окно регистрации
document.getElementById('reg-btn').onclick = () => document.getElementById('reg-modal').classList.remove('hidden');
window.closeRegModal = () => document.getElementById('reg-modal').classList.add('hidden');
document.getElementById('submit-reg-btn').onclick = () => handleAuth('signup');

document.getElementById('logout-btn').onclick = async () => {
    await db.auth.signOut();
    location.reload();
};

async function handleAuth(type) {
    let email, password;
    if (type === 'login') {
        email = document.getElementById('email-input').value;
        password = document.getElementById('password-input').value;
    } else {
        email = document.getElementById('reg-email').value;
        password = document.getElementById('reg-password').value;
    }

    if(!email || password.length < 6) return alert("Введите email и пароль от 6 символов");

    const { data, error } = (type === 'login') 
        ? await db.auth.signInWithPassword({ email, password })
        : await db.auth.signUp({ email, password });

    if (error) {
        alert(error.message);
    } else if (type === 'signup') {
        alert("Регистрация успешна! Теперь вы можете войти.");
        closeRegModal();
    } else { 
        currentUser = data.user; 
        isGuest = false; 
        
        // Показываем email и подсказку
        document.getElementById('user-display').innerText = currentUser.email;
        document.getElementById('user-display').classList.remove('hidden');
        document.getElementById('auto-save-hint').classList.remove('hidden');
        
        startApp(); 
    }
}

function startApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    document.getElementById('doc-date').valueAsDate = new Date();
    
    if(!isGuest) { document.getElementById('history-box').classList.remove('hidden'); loadHistory(); }
    renderCountryBtns(); 
    renderForm(); 
    renderItemsInputs();
    updatePreview();
}

// --- ИНТЕРФЕЙС ---
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
    let staffHtml = `<input type="text" id="p-ceo" placeholder="ФИО Исполнителя / Руководителя" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">`;
    document.getElementById('staff-fields').innerHTML = staffHtml;
}

// --- УПРАВЛЕНИЕ ТОВАРАМИ ---
window.addItem = () => {
    docItems.push({ code: (docItems.length + 1).toString(), name: '', qty: 1, unit: 'шт', price: 0 });
    renderItemsInputs();
    updatePreview();
};

window.removeItem = (index) => {
    if (docItems.length > 1) docItems.splice(index, 1);
    renderItemsInputs();
    updatePreview();
};

window.updateItem = (index, field, value) => {
    docItems[index][field] = field === 'qty' || field === 'price' ? parseFloat(value) || 0 : value;
    updatePreview();
};

function renderItemsInputs() {
    const cont = document.getElementById('items-container');
    cont.innerHTML = docItems.map((item, i) => `
        <div class="flex gap-1 items-center bg-gray-50 p-2 rounded border">
            <input type="text" value="${item.name}" oninput="updateItem(${i}, 'name', this.value)" placeholder="Название" class="flex-1 p-1 border rounded text-xs outline-none">
            <input type="number" value="${item.qty}" oninput="updateItem(${i}, 'qty', this.value)" placeholder="Кол-во" class="w-12 p-1 border rounded text-xs outline-none text-center">
            <input type="text" value="${item.unit}" oninput="updateItem(${i}, 'unit', this.value)" placeholder="Ед." class="w-10 p-1 border rounded text-xs outline-none text-center">
            <input type="number" value="${item.price}" oninput="updateItem(${i}, 'price', this.value)" placeholder="Цена" class="w-20 p-1 border rounded text-xs outline-none text-right">
            <button onclick="removeItem(${i})" class="text-red-500 px-2 text-xs font-bold hover:text-red-700">✕</button>
        </div>
    `).join('');
}

// --- ПРЕДПРОСМОТР (ТОЧНАЯ КОПИЯ ШАБЛОНА) ---
function updatePreview() {
    const val = (id) => document.getElementById(id)?.value || '';
    const dNum = val('doc-number') || '___';
    const dDateVal = val('doc-date');
    const dDate = dDateVal ? new Date(dDateVal).toLocaleDateString('ru-RU') : '___';
    
    // Подсчет итогов
    let totalAmount = 0;
    const itemsHtml = docItems.map((it, index) => {
        const sum = it.qty * it.price;
        totalAmount += sum;
        return `
            <tr>
                <td style="border: 1px solid black; padding: 4px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid black; padding: 4px; text-align: center;">${it.code || (index+1)}</td>
                <td style="border: 1px solid black; padding: 4px;">${it.name || '&nbsp;'}</td>
                <td style="border: 1px solid black; padding: 4px; text-align: center;">${it.qty}</td>
                <td style="border: 1px solid black; padding: 4px; text-align: center;">${it.unit}</td>
                <td style="border: 1px solid black; padding: 4px; text-align: right;">${it.price.toFixed(2)}</td>
                <td style="border: 1px solid black; padding: 4px; text-align: right;">${sum.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    let html = '';
    if (docType === 'Счет') {
        html = `
            <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #000; line-height: 1.3;">
                <div style="text-align: center; font-size: 8pt; margin-bottom: 20px;">
                    Внимание! Оплата данного счета означает согласие с условиями поставки товара.<br>
                    Уведомление об оплате обязательно, в противном случае не гарантируется наличие<br>
                    товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика,<br>
                    самовывозом, при наличии доверенности и документов удостоверяющих личность.
                </div>
                
                <div style="font-weight: bold; margin-bottom: 2px;">Образец платежного поручения</div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid black; text-align: center;">
                    <tr>
                        <td style="border: 1px solid black; text-align: left; padding: 6px; vertical-align: top;" rowspan="2" width="50%">
                            Бенефициар:<br><strong>${val('p-name')}</strong><br><br>${config[selectedCountry].tax}: ${val('p-tax')}
                        </td>
                        <td style="border: 1px solid black; font-weight: bold; padding: 4px; background: #fafafa;">ИИК</td>
                        <td style="border: 1px solid black; font-weight: bold; padding: 4px; background: #fafafa;">Кбе</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; font-weight: bold; padding: 6px;">${val('p-iik')}</td>
                        <td style="border: 1px solid black; font-weight: bold; padding: 6px;">${val('p-kbe')}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; text-align: left; padding: 6px;">
                            Банк бенефициара:<br>${val('p-bank')}
                        </td>
                        <td style="border: 1px solid black; font-weight: bold; padding: 4px; background: #fafafa;">БИК<br><span style="font-weight:normal; display:block; margin-top:5px;">${val('p-bik')}</span></td>
                        <td style="border: 1px solid black; font-weight: bold; padding: 4px; background: #fafafa;">Код назначения платежа<br><span style="font-weight:normal; display:block; margin-top:5px;">${val('p-knp')}</span></td>
                    </tr>
                </table>

                <h2 style="font-size: 16pt; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 15px;">
                    Счет на оплату №${dNum} от ${dDate}
                </h2>

                <table style="width: 100%; margin-bottom: 15px;">
                    <tr><td style="width: 100px; vertical-align: top;">Поставщик:</td><td style="font-weight: bold;">${val('p-name')}${val('p-address') ? ', ' + val('p-address') : ''}</td></tr>
                    <tr><td style="vertical-align: top; padding-top: 15px;">Покупатель:</td><td style="font-weight: bold; padding-top: 15px;">ИИН/БИН: ${val('c-tax')}, ${val('c-name')}${val('c-address') ? ', ' + val('c-address') : ''}</td></tr>
                    <tr><td style="vertical-align: top; padding-top: 15px;">Договор:</td><td style="padding-top: 15px;">${val('c-contract')}</td></tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid black; padding: 4px; font-weight: bold;">№</th>
                            <th style="border: 1px solid black; padding: 4px; font-weight: bold;">Код</th>
                            <th style="border: 1px solid black; padding: 4px; font-weight: bold;">Наименование</th>
                            <th style="border: 1px solid black; padding: 4px; font-weight: bold;">Кол-во</th>
                            <th style="border: 1px solid black; padding: 4px; font-weight: bold;">Ед.</th>
                            <th style="border: 1px solid black; padding: 4px; font-weight: bold;">Цена</th>
                            <th style="border: 1px solid black; padding: 4px; font-weight: bold;">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="text-align: right; margin-bottom: 15px; padding-right: 5px;">
                    <div style="font-weight: bold; margin-bottom: 4px;">Итого: <span style="display:inline-block; width: 120px; text-align:right;">${totalAmount.toFixed(2)}</span></div>
                    <div style="font-weight: bold;">В том числе НДС: <span style="display:inline-block; width: 120px; text-align:right;">0.00</span></div>
                </div>

                <div style="margin-bottom: 10px;">
                    Всего наименований ${docItems.length}, на сумму ${totalAmount.toFixed(2)} ${config[selectedCountry].cur.toUpperCase()}<br>
                    <strong>Всего к оплате: ${numberToWords(totalAmount, selectedCountry)}</strong>
                </div>
                
                <div style="border-bottom: 3px solid black; margin-bottom: 20px;"></div>

                <div>
                    Исполнитель <span style="display:inline-block; width: 300px; border-bottom: 1px solid black; margin-left: 15px;">${val('p-ceo')}</span> //
                </div>
            </div>
        `;
    } else {
        html = `
            <div style="font-family: Arial, sans-serif; font-size: 11pt;">
                <h2 style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px;">АКТ ВЫПОЛНЕННЫХ РАБОТ №${dNum} от ${dDate}</h2>
                <p><strong>Исполнитель:</strong> ${val('p-name')}</p>
                <p><strong>Заказчик:</strong> ${val('c-name')}</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
                    <thead><tr><th style="border: 1px solid black;">№</th><th style="border: 1px solid black;">Наименование</th><th style="border: 1px solid black;">Сумма</th></tr></thead>
                    <tbody>
                        ${docItems.map((it, i) => `<tr><td style="border: 1px solid black; text-align:center;">${i+1}</td><td style="border: 1px solid black;">${it.name}</td><td style="border: 1px solid black; text-align:right;">${(it.qty * it.price).toFixed(2)}</td></tr>`).join('')}
                    </tbody>
                </table>
                <p><strong>Всего к оплате: ${numberToWords(totalAmount, selectedCountry)}</strong></p>
                <p style="margin-top:40px;">Подписи сторон: ______________ / ______________</p>
            </div>
        `;
    }
    document.getElementById('doc-render-area').innerHTML = html;
}

// --- ИСТОРИЯ (ПОДТЯЖКА ИЗ БАЗЫ) ---
window.switchHistoryTab = (type) => {
    activeHistoryTab = type;
    document.getElementById('tab-h-inv').className = type === 'Счет' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 border-r shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400 border-r hover:text-gray-600';
    document.getElementById('tab-h-avr').className = type === 'АВР' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400 hover:text-gray-600';
    loadHistory();
};

async function loadHistory() {
    if (!currentUser) return;
    const { data } = await db.from('invoices').select('*').eq('user_id', currentUser.id).eq('document_type', activeHistoryTab).order('created_at', { ascending: false });
    const cont = document.getElementById('history-list');
    if (data && data.length > 0) {
        cont.innerHTML = data.map(i => `
            <div onclick='restoreFromHistory(${JSON.stringify(i)})' class="p-2 border rounded bg-gray-50 hover:bg-blue-50 cursor-pointer transition">
                <div class="flex justify-between font-bold text-[9px] text-blue-600">
                    <span>№${i.doc_number || 'б/н'} от ${i.doc_date ? new Date(i.doc_date).toLocaleDateString() : ''}</span>
                    <span>${i.amount ? i.amount.toFixed(2) : 0} ${config[i.country]?.cur || ''}</span>
                </div>
                <div class="text-[10px] truncate text-gray-600">${i.client_name || 'Без имени'}</div>
            </div>
        `).join('');
    } else {
        cont.innerHTML = `<div class="text-center py-6 text-gray-300 text-xs">Нет данных</div>`;
    }
}

window.restoreFromHistory = (i) => {
    selectedCountry = i.country;
    docType = i.document_type;
    
    if (i.items && Array.isArray(i.items)) {
        docItems = i.items;
    } else {
        docItems = [{ code: '1', name: i.description || '', qty: 1, unit: 'шт', price: i.amount || 0 }];
    }

    renderCountryBtns();
    renderForm();
    renderItemsInputs();
    
    const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).value = val || ''; }
    
    setVal('doc-number', i.doc_number); setVal('doc-date', i.doc_date);
    setVal('p-name', i.provider_name); setVal('p-tax', i.provider_tax_id);
    setVal('p-address', i.p_address); setVal('p-bank', i.provider_bank);
    setVal('p-iik', i.p_iik); setVal('p-bik', i.p_bik);
    setVal('p-kbe', i.p_kbe); setVal('p-knp', i.p_knp);
    setVal('p-ceo', i.provider_ceo);
    
    setVal('c-name', i.client_name); setVal('c-tax', i.client_tax_id);
    setVal('c-address', i.c_address); setVal('c-contract', i.c_contract);
    
    updatePreview();
};

async function downloadPDF() {
    // Ждем окончания автосохранения перед конвертацией, если юзер авторизован
    if(!isGuest && currentUser) {
        await saveToDB();
    }
    const element = document.getElementById('doc-render-area');
    html2pdf().from(element).set({ margin: [10, 5, 10, 5], filename: `Document.pdf`, html2canvas: { scale: 3 } }).save();
}

async function saveToDB() {
    if (isGuest || !currentUser) return;
    
    let totalAmount = docItems.reduce((acc, it) => acc + (it.qty * it.price), 0);
    const val = (id) => document.getElementById(id)?.value || '';

    const payload = {
        user_id: currentUser.id,
        country: selectedCountry,
        document_type: docType,
        doc_number: val('doc-number'),
        doc_date: val('doc-date'),
        provider_name: val('p-name'),
        provider_tax_id: val('p-tax'),
        p_address: val('p-address'),
        provider_bank: val('p-bank'),
        p_iik: val('p-iik'),
        p_bik: val('p-bik'),
        p_kbe: val('p-kbe'),
        p_knp: val('p-knp'),
        provider_ceo: val('p-ceo'),
        client_name: val('c-name'),
        client_tax_id: val('c-tax'),
        c_address: val('c-address'),
        c_contract: val('c-contract'),
        amount: totalAmount,
        items: docItems
    };
    
    await db.from('invoices').insert([payload]);
    loadHistory(); // Обновляем историю сразу после сохранения
}

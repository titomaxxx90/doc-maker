let currentUser = null, selectedCountry = 'РК', docType = 'Счет', isGuest = false, activeHistoryTab = 'Счет';

const config = {
    'РК': { tax: 'БИН/ИИН', cur: 'тенге', flag: '🇰🇿' },
    'РФ': { tax: 'ИНН/КПП', cur: 'руб.', flag: '🇷🇺' },
    'РБ': { tax: 'УНП', cur: 'бел. руб.', flag: '🇧🇾' },
    'КР': { tax: 'ИНН', cur: 'сом', flag: '🇰🇬' }
};

// --- АВТОРИЗАЦИЯ ---
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
    else if (type === 'signup') alert("Регистрация успешна! Теперь вы можете войти.");
    else { currentUser = data.user; isGuest = false; startApp(); }
}

function startApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    
    // По умолчанию ставим только дату
    document.getElementById('doc-date').valueAsDate = new Date();
    
    if(!isGuest) { 
        document.getElementById('history-box').classList.remove('hidden'); 
        loadHistory(); 
    }
    
    renderCountryBtns();
    renderForm();
    updatePreview();
}

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
    renderForm(); 
    updatePreview();
};

function renderForm() {
    const f = config[selectedCountry];
    
    // Руководство (чистые поля)
    let staffHtml = `<input type="text" id="p-ceo" placeholder="ФИО Руководителя" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">`;
    if (docType === 'Счет') {
        staffHtml += `<input type="text" id="p-acc" placeholder="ФИО Бухгалтера" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">`;
    }
    document.getElementById('staff-fields').innerHTML = staffHtml;

    // Данные клиента (чистые поля)
    document.getElementById('dynamic-form').innerHTML = `
        <h3 class="font-bold text-gray-700 text-[10px] uppercase tracking-wider">Данные Клиента</h3>
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
    
    const pn = document.getElementById('p-name').value || '________________';
    const pt = document.getElementById('p-tax').value || '________________';
    const pb = document.getElementById('p-bank').value || '________________';
    const pCeo = document.getElementById('p-ceo')?.value || '________________';
    const pAcc = document.getElementById('p-acc')?.value || '________________';

    const cn = document.getElementById('c-name')?.value || '________________';
    const ct = document.getElementById('c-tax')?.value || '________________';
    const am = document.getElementById('val-amount')?.value || '0';
    const ds = document.getElementById('val-desc')?.value || '________________';
    const f = config[selectedCountry];

    let html = '';
    if (docType === 'Счет') {
        html = `
            <div style="font-size: 11pt;">
                <div style="border: 1px solid black; padding: 10px; margin-bottom: 25px;"><strong>Реквизиты банка поставщика:</strong><br>${pb}</div>
                <h2 style="text-align: center; font-weight: bold; font-size: 16pt; border-bottom: 2px solid black; padding-bottom: 5px; margin-bottom: 20px;">Счет на оплату №${dNum} от ${dDate}</h2>
                <div style="margin-bottom: 20px;">
                    <p><strong>Поставщик:</strong> ${pn}, ${f.tax}: ${pt}</p>
                    <p><strong>Покупатель:</strong> ${cn}, ${f.tax}: ${ct}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead><tr style="background: #f0f0f0;"><th class="border-black">№</th><th class="border-black">Наименование услуг</th><th class="border-black">Сумма</th></tr></thead>
                    <tbody><tr><td class="border-black text-center">1</td><td class="border-black" style="padding: 10px;">${ds}</td><td class="border-black text-right" style="padding: 10px;">${am}</td></tr></tbody>
                </table>
                <p style="text-align: right; font-weight: bold;">ИТОГО К ОПЛАТЕ: ${am} ${f.cur}</p>
                <div style="margin-top: 50px;">
                    <p>Руководитель: ________________ / ${pCeo} /</p><br>
                    <p>Бухгалтер: ________________ / ${pAcc} /</p>
                </div>
            </div>
        `;
    } else {
        html = `
            <div style="font-size: 11pt;">
                <h2 style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 5px;">АКТ ВЫПОЛНЕННЫХ РАБОТ</h2>
                <p style="text-align: center; margin-bottom: 25px;">№${dNum} от ${dDate}</p>
                <div style="border-top: 1px solid black; padding-top: 10px; margin-bottom: 20px;">
                    <p><strong>Исполнитель:</strong> ${pn}</p>
                    <p><strong>Заказчик:</strong> ${cn}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <tr style="background: #f0f0f0;"><th class="border-black">Описание работ</th><th class="border-black" style="width: 100px;">Сумма</th></tr>
                    <tr><td class="border-black" style="padding: 10px;">${ds}</td><td class="border-black text-right" style="padding: 10px;">${am}</td></tr>
                </table>
                <p style="font-style: italic; font-size: 10pt;">Услуги выполнены полностью. Заказчик претензий не имеет.</p>
                <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                    <div style="width: 45%; border-top: 1px solid black;"><strong>Исполнитель:</strong><br>${pCeo}</div>
                    <div style="width: 45%; border-top: 1px solid black;"><strong>Заказчик:</strong><br>${cn}</div>
                </div>
            </div>
        `;
    }
    document.getElementById('doc-render-area').innerHTML = html;
}

// --- ИСТОРИЯ ---
window.switchHistoryTab = (type) => {
    activeHistoryTab = type;
    document.getElementById('tab-h-inv').className = type === 'Счет' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 border-r shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400 border-r';
    document.getElementById('tab-h-avr').className = type === 'АВР' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400';
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
                    <span>№${i.doc_number || 'б/н'} от ${i.doc_date || ''}</span>
                    <span>${i.amount}</span>
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
    renderCountryBtns();
    renderForm();
    
    document.getElementById('doc-number').value = i.doc_number || '';
    document.getElementById('doc-date').value = i.doc_date || '';
    document.getElementById('p-name').value = i.provider_name || '';
    document.getElementById('p-tax').value = i.provider_tax_id || '';
    document.getElementById('p-bank').value = i.provider_bank || '';
    document.getElementById('p-ceo').value = i.provider_ceo || '';
    if(document.getElementById('p-acc')) document.getElementById('p-acc').value = i.provider_acc || '';
    
    document.getElementById('c-name').value = i.client_name || '';
    document.getElementById('c-tax').value = i.client_tax_id || '';
    document.getElementById('val-amount').value = i.amount || 0;
    document.getElementById('val-desc').value = i.description || '';
    
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
        doc_date: document.getElementById('doc-date').value,
        provider_name: document.getElementById('p-name').value,
        provider_tax_id: document.getElementById('p-tax').value,
        provider_bank: document.getElementById('p-bank').value,
        provider_ceo: document.getElementById('p-ceo').value,
        provider_acc: document.getElementById('p-acc')?.value || '',
        client_name: document.getElementById('c-name').value,
        client_tax_id: document.getElementById('c-tax').value,
        amount: parseFloat(document.getElementById('val-amount').value) || 0,
        description: document.getElementById('val-desc').value
    };
    await db.from('invoices').insert([payload]);
    loadHistory();
}

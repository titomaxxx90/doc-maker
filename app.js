let currentUser = null, selectedCountry = 'РК', docType = 'Счет', isGuest = false, activeHistoryTab = 'Счет';

const config = {
    'РК': { tax: 'БИН/ИИН', bank: 'ИИК', cur: 'тенге', flag: '🇰🇿' },
    'РФ': { tax: 'ИНН/КПП', bank: 'Р/С', cur: 'руб.', flag: '🇷🇺' },
    'РБ': { tax: 'УНП', bank: 'IBAN', cur: 'бел. руб.', flag: '🇧🇾' },
    'КР': { tax: 'ИНН', bank: 'Р/С', cur: 'сом', flag: '🇰🇬' }
};

// --- AUTH ---
document.getElementById('guest-btn').onclick = () => { isGuest = true; startApp(); };
document.getElementById('login-btn').onclick = () => handleAuth('login');
document.getElementById('reg-btn').onclick = () => handleAuth('signup');
document.getElementById('logout-btn').onclick = () => location.reload();

async function handleAuth(type) {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    if(!email || password.length < 6) return alert("Введите почту и пароль (от 6 символов)");

    const { data, error } = (type === 'login') 
        ? await db.auth.signInWithPassword({ email, password })
        : await db.auth.signUp({ email, password });

    if (error) alert(error.message);
    else if (type === 'signup') alert("Регистрация прошла успешно! Войдите в аккаунт.");
    else { currentUser = data.user; isGuest = false; startApp(); }
}

function startApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    
    if(!isGuest) { 
        document.getElementById('history-box').classList.remove('hidden'); 
        loadHistory(); 
    }
    
    document.getElementById('doc-date').valueAsDate = new Date();
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
    document.getElementById('btn-inv').className = type === 'Счет' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs transition' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs transition';
    document.getElementById('btn-avr').className = type === 'АВР' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs transition' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs transition';
    
    // При смене типа просто чистим поля клиента (предзаполнение убрано)
    renderForm();
    updatePreview();
};

function renderForm() {
    const f = config[selectedCountry];
    
    // Руководство (поля пустые при инициализации)
    let staffHtml = `<input type="text" id="p-ceo" placeholder="ФИО Руководителя" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">`;
    if (docType === 'Счет') {
        staffHtml += `<input type="text" id="p-acc" placeholder="ФИО Бухгалтера" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">`;
    }
    document.getElementById('staff-fields').innerHTML = staffHtml;

    // Клиент
    document.getElementById('dynamic-form').innerHTML = `
        <h3 class="font-bold text-gray-700 text-sm">Данные Клиента</h3>
        <input type="text" id="c-name" placeholder="Название организации" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        <input type="text" id="c-tax" placeholder="${f.tax} клиента" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        <input type="number" id="val-amount" placeholder="Сумма" class="w-full p-2 border rounded text-xs font-bold outline-none" oninput="updatePreview()">
        <textarea id="val-desc" rows="3" placeholder="Описание услуг" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()"></textarea>
    `;
}

function updatePreview() {
    const dNum = document.getElementById('doc-number').value || '___';
    const dDateValue = document.getElementById('doc-date').value;
    const dDate = dDateValue ? new Date(dDateValue).toLocaleDateString() : '___';
    
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
                <div style="border: 1px solid black; padding: 10px; margin-bottom: 25px;"><strong>Реквизиты поставщика:</strong><br>${pb}</div>
                <h2 style="text-align: center; font-weight: bold; font-size: 16pt; border-bottom: 2px solid black; padding-bottom: 5px; margin-bottom: 20px;">Счет на оплату №${dNum} от ${dDate}</h2>
                <div style="margin-bottom: 20px;">
                    <p><strong>Поставщик:</strong> ${pn}, ${f.tax}: ${pt}</p>
                    <p><strong>Покупатель:</strong> ${cn}, ${f.tax}: ${ct}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead><tr style="background: #f0f0f0;"><th class="border-black">№</th><th class="border-black">Наименование</th><th class="border-black">Сумма</th></tr></thead>
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

// --- ИСТОРИЯ ПО ВКЛАДКАМ ---
window.switchHistoryTab = (type) => {
    activeHistoryTab = type;
    document.getElementById('tab-h-inv').className = type === 'Счет' ? 'flex-1 py-2 text-[10px] font-bold border-r bg-white shadow-inner' : 'flex-1 py-2 text-[10px] font-bold border-r bg-gray-100 text-gray-400';
    document.getElementById('tab-h-avr').className = type === 'АВР' ? 'flex-1 py-2 text-[10px] font-bold bg-white shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400';
    loadHistory();
};

async function loadHistory() {
    if (!currentUser) return;
    const { data } = await db.from('invoices')
        .select('*')
        .eq('document_type', activeHistoryTab)
        .order('created_at', { ascending: false })
        .limit(10);

    const cont = document.getElementById('history-list');
    if (data && data.length > 0) {
        cont.innerHTML = data.map(i => `
            <div onclick='restoreHistory(${JSON.stringify(i)})' class="p-2 border rounded bg-gray-50 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group">
                <span class="truncate pr-2">${i.client_name || 'Без имени'}</span>
                <span class="font-bold text-blue-600 group-hover:scale-110 transition">${i.amount}</span>
            </div>
        `).join('');
    } else {
        cont.innerHTML = `<div class="text-center py-4 text-gray-300">Пусто</div>`;
    }
}

window.restoreHistory = (i) => {
    selectedCountry = i.country;
    docType = i.document_type;
    renderCountryBtns();
    renderForm();
    
    // Заполняем только при клике из истории
    document.getElementById('p-name').value = i.provider_name || '';
    document.getElementById('p-tax').value = i.provider_tax_id || '';
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
    const payload = {
        user_id: currentUser.id,
        country: selectedCountry,
        document_type: docType,
        client_name: document.getElementById('c-name').value,
        amount: parseFloat(document.getElementById('val-amount').value) || 0,
        provider_name: document.getElementById('p-name').value,
        provider_tax_id: document.getElementById('p-tax').value
    };
    await db.from('invoices').insert([payload]);
    loadHistory();
}

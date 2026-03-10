let currentUser = null, selectedCountry = 'РК', docType = 'Счет', isGuest = false;

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
    if(!email || password.length < 6) return alert("Введите корректный email и пароль (мин. 6 символов)");

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
    
    if(!isGuest) { document.getElementById('history-box').classList.remove('hidden'); loadHistory(); }
    
    // Загрузка сохраненных реквизитов
    document.getElementById('p-name').value = localStorage.getItem('p_name') || '';
    document.getElementById('p-tax').value = localStorage.getItem('p_tax') || '';
    document.getElementById('p-bank').value = localStorage.getItem('p_bank') || '';
    document.getElementById('doc-date').valueAsDate = new Date();

    renderCountryBtns();
    renderForm();
    updatePreview();
}

function renderCountryBtns() {
    document.getElementById('country-btns').innerHTML = Object.keys(config).map(c => `
        <button onclick="setCountry('${c}')" class="p-2 rounded border flex flex-col items-center gap-1 transition ${selectedCountry === c ? 'bg-slate-800 text-white shadow-inner' : 'bg-gray-50 hover:bg-gray-200'}">
            <span class="text-lg">${config[c].flag}</span>
            <span class="text-[9px] font-bold">${c}</span>
        </button>
    `).join('');
}

window.setCountry = (c) => { selectedCountry = c; renderCountryBtns(); renderForm(); updatePreview(); };

window.setDocType = (type) => {
    docType = type;
    document.getElementById('btn-inv').className = type === 'Счет' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase transition' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs uppercase transition';
    document.getElementById('btn-avr').className = type === 'АВР' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase transition' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs uppercase transition';
    renderForm(); // Перерисовываем форму при смене типа
    updatePreview();
};

function renderForm() {
    const f = config[selectedCountry];
    
    // Поля руководителей
    let staffHtml = `<input type="text" id="p-ceo" placeholder="ФИО Руководителя" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">`;
    if (docType === 'Счет') {
        staffHtml += `<input type="text" id="p-acc" placeholder="ФИО Бухгалтера" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">`;
    }
    document.getElementById('staff-fields').innerHTML = staffHtml;

    // Поля клиента
    document.getElementById('dynamic-form').innerHTML = `
        <h3 class="font-bold text-gray-700 text-sm">Данные Клиента</h3>
        <input type="text" id="c-name" placeholder="Название организации" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        <input type="text" id="c-tax" placeholder="${f.tax} клиента" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        <input type="number" id="val-amount" placeholder="Итоговая сумма" class="w-full p-2 border rounded text-xs font-bold outline-none" oninput="updatePreview()">
        <textarea id="val-desc" rows="3" placeholder="Описание услуг" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()"></textarea>
    `;

    // Загрузка сохраненных имен
    document.getElementById('p-ceo').value = localStorage.getItem('p_ceo') || '';
    if(document.getElementById('p-acc')) document.getElementById('p-acc').value = localStorage.getItem('p_acc') || '';
}

function updatePreview() {
    const dNum = document.getElementById('doc-number').value || '___';
    const dDateValue = document.getElementById('doc-date').value;
    const dDate = dDateValue ? new Date(dDateValue).toLocaleDateString() : '___';
    
    const pn = document.getElementById('p-name').value || 'Наименование компании';
    const pt = document.getElementById('p-tax').value || 'БИН/ИНН';
    const pb = document.getElementById('p-bank').value || 'Реквизиты банка';
    const pCeo = document.getElementById('p-ceo')?.value || '________________';
    const pAcc = document.getElementById('p-acc')?.value || '________________';

    const cn = document.getElementById('c-name')?.value || 'Наименование Клиента';
    const ct = document.getElementById('c-tax')?.value || 'БИН/ИНН Клиента';
    const am = document.getElementById('val-amount')?.value || '0';
    const ds = document.getElementById('val-desc')?.value || 'Наименование работ или услуг';
    const f = config[selectedCountry];

    localStorage.setItem('p_name', pn);
    localStorage.setItem('p_tax', pt);
    localStorage.setItem('p_bank', pb);
    localStorage.setItem('p_ceo', pCeo);
    if(pAcc !== '________________') localStorage.setItem('p_acc', pAcc);

    let html = '';
    if (docType === 'Счет') {
        html = `
            <div style="font-size: 11pt;">
                <div style="border: 1px solid black; padding: 10px; margin-bottom: 25px;">
                    <strong>Реквизиты поставщика:</strong><br>${pb}
                </div>
                <h2 style="text-align: center; font-weight: bold; font-size: 16pt; border-bottom: 2px solid black; padding-bottom: 5px; margin-bottom: 20px;">
                    Счет на оплату №${dNum} от ${dDate}
                </h2>
                <div style="margin-bottom: 20px;">
                    <p><strong>Поставщик:</strong> ${pn}, ${f.tax}: ${pt}</p>
                    <p><strong>Покупатель:</strong> ${cn}, ${f.tax}: ${ct}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead><tr style="background: #f0f0f0;"><th class="border-black">№</th><th class="border-black">Наименование</th><th class="border-black">Сумма</th></tr></thead>
                    <tbody><tr><td class="border-black text-center">1</td><td class="border-black" style="padding: 10px;">${ds}</td><td class="border-black text-right" style="padding: 10px;">${am}</td></tr></tbody>
                </table>
                <p style="text-align: right; font-weight: bold; font-size: 12pt;">ИТОГО К ОПЛАТЕ: ${am} ${f.cur}</p>
                <div style="margin-top: 60px;">
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
                <p style="font-style: italic; font-size: 10pt;">Вышеуказанные услуги выполнены полностью. Заказчик претензий не имеет.</p>
                <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                    <div style="width: 45%; border-top: 1px solid black;"><strong>Исполнитель:</strong><br>${pCeo}</div>
                    <div style="width: 45%; border-top: 1px solid black;"><strong>Заказчик:</strong><br>${cn}</div>
                </div>
            </div>
        `;
    }
    document.getElementById('doc-render-area').innerHTML = html;
}

async function downloadPDF() {
    if(!isGuest) await saveToDB();
    const element = document.getElementById('doc-render-area');
    const opt = { margin: 10, filename: `${docType}_${document.getElementById('doc-number').value}.pdf`, html2canvas: { scale: 3 } };
    html2pdf().from(element).set(opt).save();
}

async function saveToDB() {
    try {
        const payload = {
            user_id: currentUser.id,
            country: selectedCountry,
            client_name: document.getElementById('c-name').value,
            amount: parseFloat(document.getElementById('val-amount').value) || 0,
            document_type: docType,
            provider_name: document.getElementById('p-name').value
        };
        await db.from('invoices').insert([payload]);
        loadHistory();
    } catch(e) { console.log("DB save skipped"); }
}

async function loadHistory() {
    const { data } = await db.from('invoices').select('*').order('created_at', { ascending: false }).limit(5);
    const cont = document.getElementById('history-list');
    if (data && data.length > 0) {
        cont.innerHTML = data.map(i => `
            <div class="p-1 border-b flex justify-between gap-2">
                <span class="truncate">📄 ${i.document_type}: ${i.client_name}</span>
                <span class="font-bold">${i.amount}</span>
            </div>
        `).join('');
    } else {
        cont.innerText = "История пока пуста";
    }
}

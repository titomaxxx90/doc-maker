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
    
    // Загрузка сохраненных реквизитов поставщика
    document.getElementById('p-name').value = localStorage.getItem('p_name') || '';
    document.getElementById('p-tax').value = localStorage.getItem('p_tax') || '';
    document.getElementById('p-bank').value = localStorage.getItem('p_bank') || '';
    
    // Установка сегодняшней даты по умолчанию
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
    updatePreview();
};

function renderForm() {
    const f = config[selectedCountry];
    document.getElementById('dynamic-form').innerHTML = `
        <h3 class="font-bold text-gray-700 text-sm">Данные Клиента</h3>
        <input type="text" id="c-name" placeholder="Название организации" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        <input type="text" id="c-tax" placeholder="${f.tax} клиента" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        <input type="number" id="val-amount" placeholder="Итоговая сумма" class="w-full p-2 border rounded text-xs font-bold outline-none" oninput="updatePreview()">
        <textarea id="val-desc" rows="3" placeholder="За какие услуги/товары оплата?" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()"></textarea>
    `;
}

function updatePreview() {
    const dNum = document.getElementById('doc-number').value || '___';
    const dDateValue = document.getElementById('doc-date').value;
    const dDate = dDateValue ? new Date(dDateValue).toLocaleDateString() : '___';
    
    const pn = document.getElementById('p-name').value || 'ИП / ТОО (Ваше название)';
    const pt = document.getElementById('p-tax').value || 'БИН/ИНН';
    const pb = document.getElementById('p-bank').value || 'Банк и номер счета';
    const cn = document.getElementById('c-name')?.value || 'Название Клиента';
    const ct = document.getElementById('c-tax')?.value || 'БИН/ИНН Клиента';
    const am = document.getElementById('val-amount')?.value || '0';
    const ds = document.getElementById('val-desc')?.value || 'Наименование выполненных работ или услуг';
    const f = config[selectedCountry];

    localStorage.setItem('p_name', pn);
    localStorage.setItem('p_tax', pt);
    localStorage.setItem('p_bank', pb);

    let html = '';
    if (docType === 'Счет') {
        html = `
            <div style="font-size: 11pt;">
                <div style="border: 1px solid black; padding: 10px; margin-bottom: 25px;">
                    <strong>Банковские реквизиты поставщика:</strong><br>${pb}
                </div>
                <h2 style="text-align: center; font-weight: bold; font-size: 16pt; border-bottom: 2px solid black; padding-bottom: 5px; margin-bottom: 20px;">
                    Счет на оплату №${dNum} от ${dDate}
                </h2>
                <div style="margin-bottom: 20px;">
                    <p><strong>Поставщик:</strong> ${pn}, ${f.tax}: ${pt}</p>
                    <p><strong>Покупатель:</strong> ${cn}, ${f.tax}: ${ct}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th class="border-black" style="width: 30px;">№</th>
                            <th class="border-black">Наименование товара или услуги</th>
                            <th class="border-black" style="width: 100px;">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border-black" style="text-align: center;">1</td>
                            <td class="border-black" style="padding: 8px;">${ds}</td>
                            <td class="border-black" style="text-align: right; padding: 8px;">${am}</td>
                        </tr>
                    </tbody>
                </table>
                <p style="text-align: right; font-weight: bold; font-size: 12pt;">ИТОГО К ОПЛАТЕ: ${am} ${f.cur}</p>
                <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                    <div>Руководитель: ________________ / ${pn}</div>
                    <div>Бухгалтер: ________________</div>
                </div>
            </div>
        `;
    } else {
        html = `
            <div style="font-size: 11pt;">
                <h2 style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 5px;">АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)</h2>
                <p style="text-align: center; margin-bottom: 25px;">№${dNum} от ${dDate}</p>
                <div style="border-top: 1px solid black; padding-top: 10px; margin-bottom: 20px;">
                    <p><strong>Исполнитель:</strong> ${pn}</p>
                    <p><strong>Заказчик:</strong> ${cn}</p>
                </div>
                <p style="margin-bottom: 15px;">Настоящий Акт составлен о том, что Исполнитель оказал, а Заказчик принял следующие услуги:</p>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <tr style="background: #f0f0f0;">
                        <th class="border-black">Описание работ</th><th class="border-black" style="width: 100px;">Сумма</th>
                    </tr>
                    <tr>
                        <td class="border-black" style="padding: 10px;">${ds}</td><td class="border-black" style="text-align: right; padding: 10px;">${am}</td>
                    </tr>
                </table>
                <p style="font-style: italic; font-size: 10pt;">Вышеуказанные услуги выполнены полностью и в срок. Заказчик претензий по качеству и объему не имеет.</p>
                <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                    <div style="width: 45%; border-top: 1px solid black; padding-top: 5px;"><strong>Исполнитель</strong></div>
                    <div style="width: 45%; border-top: 1px solid black; padding-top: 5px;"><strong>Заказчик</strong></div>
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
}

async function loadHistory() {
    const { data } = await db.from('invoices').select('*').order('created_at', { ascending: false }).limit(5);
    const cont = document.getElementById('history-list');
    if (data) {
        cont.innerHTML = data.map(i => `
            <div class="text-[10px] p-2 border rounded bg-gray-50 flex justify-between">
                <span><b>${i.document_type}</b>: ${i.client_name}</span>
                <span class="font-bold">${i.amount}</span>
            </div>
        `).join('');
    }
}

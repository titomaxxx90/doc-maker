let currentUser = null;
let selectedCountry = 'РК';
let docType = 'Счет';
let isGuest = false;

const config = {
    'РК': { tax: 'БИН/ИИН', bank: 'ИИК (IBAN)', extra: 'КБЕ', cur: 'тенге' },
    'РФ': { tax: 'ИНН', bank: 'Р/С', extra: 'БИК', cur: 'руб.' },
    'РБ': { tax: 'УНП', bank: 'IBAN', extra: 'Код банка', cur: 'бел. руб.' },
    'КР': { tax: 'ИНН', bank: 'Р/С', extra: 'БИК', cur: 'сом' }
};

// 1. Инициализация входа
document.getElementById('guest-btn').onclick = () => { isGuest = true; startApp(); };

document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    if(!email || !password) return alert("Введите данные");

    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
        const reg = await db.auth.signUp({ email, password });
        if (reg.error) alert(reg.error.message); else alert("Аккаунт создан! Войдите еще раз.");
    } else {
        currentUser = data.user;
        isGuest = false;
        startApp();
    }
};

document.getElementById('logout-btn').onclick = () => location.reload();

// 2. Запуск приложения
function startApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    
    if (!isGuest) {
        document.getElementById('history-box').classList.remove('hidden');
        loadHistory();
    }
    
    // Загрузка сохраненного поставщика
    document.getElementById('p-name').value = localStorage.getItem('p_name') || '';
    document.getElementById('p-tax').value = localStorage.getItem('p_tax') || '';

    renderCountryBtns();
    renderForm();
    updatePreview();
}

function renderCountryBtns() {
    const cont = document.getElementById('country-btns');
    cont.innerHTML = Object.keys(config).map(c => `
        <button onclick="setCountry('${c}')" class="p-2 rounded border text-xs font-bold ${selectedCountry === c ? 'bg-slate-800 text-white' : 'bg-gray-50'}">${c}</button>
    `).join('');
}

window.setCountry = (c) => { selectedCountry = c; renderCountryBtns(); renderForm(); updatePreview(); };

window.setDocType = (type) => {
    docType = type;
    document.getElementById('type-inv').className = type === 'Счет' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-sm';
    document.getElementById('type-avr').className = type === 'АВР' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-sm';
    updatePreview();
};

function renderForm() {
    const f = config[selectedCountry];
    document.getElementById('dynamic-form').innerHTML = `
        <h3 class="font-bold text-gray-700 border-b pb-2">Данные Клиента</h3>
        <input type="text" id="c-name" placeholder="Наименование клиента" class="w-full p-2 border rounded-lg text-sm" oninput="updatePreview()">
        <input type="text" id="c-tax" placeholder="${f.tax} клиента" class="w-full p-2 border rounded-lg text-sm" oninput="updatePreview()">
        <input type="text" id="c-bank" placeholder="${f.bank} клиента" class="w-full p-2 border rounded-lg text-sm" oninput="updatePreview()">
        <input type="number" id="val-amount" placeholder="Сумма" class="w-full p-2 border rounded-lg text-sm font-bold" oninput="updatePreview()">
        <textarea id="val-desc" placeholder="Назначение платежа / Список услуг" class="w-full p-2 border rounded-lg text-sm" oninput="updatePreview()"></textarea>
    `;
}

// 3. Генерация дизайна
function updatePreview() {
    const pn = document.getElementById('p-name').value || '________________';
    const pt = document.getElementById('p-tax').value || '________________';
    const cn = document.getElementById('c-name')?.value || '________________';
    const ct = document.getElementById('c-tax')?.value || '________________';
    const cb = document.getElementById('c-bank')?.value || '________________';
    const am = document.getElementById('val-amount')?.value || '0';
    const ds = document.getElementById('val-desc')?.value || 'Консультационные услуги';
    const f = config[selectedCountry];

    localStorage.setItem('p_name', pn);
    localStorage.setItem('p_tax', pt);

    document.getElementById('doc-render-area').innerHTML = `
        <div id="printable-doc" style="font-family: Arial; color: black; line-height: 1.2;">
            <div style="text-align: center; border-bottom: 2px solid black; margin-bottom: 20px; padding-bottom: 10px;">
                <h1 style="font-size: 18px; font-weight: bold;">${docType.toUpperCase()} №___ от ${new Date().toLocaleDateString()}</h1>
            </div>
            
            <table style="width: 100%; margin-bottom: 20px; font-size: 13px;">
                <tr><td style="width: 120px;"><strong>Поставщик:</strong></td><td>${pn}, ${f.tax}: ${pt}</td></tr>
                <tr><td><strong>Покупатель:</strong></td><td>${cn}, ${f.tax}: ${ct}, ${f.bank}: ${cb}</td></tr>
            </table>

            <table class="doc-table" style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f0f0f0;">
                    <th>№</th><th>Наименование работ, услуг</th><th>Сумма (${f.cur})</th>
                </tr>
                <tr>
                    <td style="text-align: center;">1</td><td>${ds}</td><td style="text-align: right;">${am}</td>
                </tr>
            </table>

            <div style="text-align: right; margin-top: 15px; font-size: 16px;">
                <strong>ИТОГО: ${am} ${f.cur}</strong>
            </div>

            <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 13px;">
                <div>Поставщик: ________________ / ${pn}</div>
                <div>Получил: ________________ / ${cn}</div>
            </div>
        </div>
    `;
}

// 4. Экспорт и Сохранение
async function downloadPDF() {
    if(!isGuest) await saveToDB();
    const element = document.getElementById('printable-doc');
    html2pdf().from(element).set({ margin: 10, filename: `${docType}.pdf` }).save();
}

async function downloadXLSX() {
    if(!isGuest) await saveToDB();
    const data = [
        [docType, "Дата", new Date().toLocaleDateString()],
        ["Поставщик", document.getElementById('p-name').value],
        ["Клиент", document.getElementById('c-name').value],
        ["Сумма", document.getElementById('val-amount').value, config[selectedCountry].cur]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Document");
    XLSX.writeFile(wb, `${docType}.xlsx`);
}

async function saveToDB() {
    const payload = {
        user_id: currentUser.id,
        country: selectedCountry,
        client_name: document.getElementById('c-name').value,
        tax_id: document.getElementById('c-tax').value,
        amount: parseFloat(document.getElementById('val-amount').value) || 0,
        document_type: docType,
        provider_name: document.getElementById('p-name').value,
        provider_tax_id: document.getElementById('p-tax').value
    };
    await db.from('invoices').insert([payload]);
    loadHistory();
}

async function loadHistory() {
    const { data } = await db.from('invoices').select('*').order('created_at', { ascending: false }).limit(5);
    const cont = document.getElementById('history-list');
    if (data && data.length > 0) {
        cont.innerHTML = data.map(i => `
            <div onclick='restoreHistory(${JSON.stringify(i)})' class="p-2 border rounded bg-gray-50 hover:bg-blue-50 cursor-pointer">
                <b>${i.document_type}</b>: ${i.client_name} (${i.amount})
            </div>
        `).join('');
    } else {
        cont.innerText = "История пуста";
    }
}

window.restoreHistory = (i) => {
    selectedCountry = i.country;
    docType = i.document_type;
    renderForm();
    document.getElementById('c-name').value = i.client_name;
    document.getElementById('c-tax').value = i.tax_id;
    document.getElementById('val-amount').value = i.amount;
    updatePreview();
};

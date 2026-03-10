// app.js
let currentUser = null;
let selectedCountry = 'РК';
let docType = 'Счет'; // 'Счет' или 'АВР'

const config = {
    'РК': { tax: 'БИН/ИИН', bank: 'ИИК (IBAN)', extra: 'КБЕ', cur: 'тенге', name: 'Казахстан' },
    'РФ': { tax: 'ИНН/КПП', bank: 'Р/С', extra: 'БИК', cur: 'руб.', name: 'Россия' },
    'РБ': { tax: 'УНП', bank: 'IBAN', extra: 'Код банка', cur: 'бел. руб.', name: 'Беларусь' },
    'КР': { tax: 'ИНН', bank: 'Р/С', extra: 'БИК', cur: 'сом', name: 'Кыргызстан' }
};

// --- AUTH LOGIC ---
document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
        const reg = await db.auth.signUp({ email, password }); // Авто-регистрация для удобства
        if (reg.error) alert(reg.error.message); else alert("Аккаунт создан! Войдите еще раз.");
    } else {
        currentUser = data.user;
        initApp();
    }
};

function initApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('user-email').innerText = currentUser.email;
    renderCountryBtns();
    renderForm();
    loadHistory();
}

// --- UI LOGIC ---
function renderCountryBtns() {
    const cont = document.getElementById('country-btns');
    cont.innerHTML = Object.keys(config).map(c => `
        <button onclick="changeCountry('${c}')" class="p-2 rounded border text-xs font-bold ${selectedCountry === c ? 'bg-slate-800 text-white' : 'bg-gray-50'}">${c}</button>
    `).join('');
}

function setDocType(type) {
    docType = type;
    document.getElementById('btn-type-inv').className = type === 'Счет' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-bold';
    document.getElementById('btn-type-avr').className = type === 'АВР' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-bold';
    updatePreview();
}

function changeCountry(c) {
    selectedCountry = c;
    renderCountryBtns();
    renderForm();
    updatePreview();
}

function renderForm() {
    const f = config[selectedCountry];
    const cont = document.getElementById('dynamic-form');
    cont.innerHTML = `
        <h3 class="font-bold mb-3 text-gray-700">3. Данные клиента</h3>
        <input type="text" id="c-name" placeholder="Клиент" class="w-full p-2 mb-2 border rounded-lg text-sm" oninput="updatePreview()">
        <input type="text" id="c-tax" placeholder="${f.tax}" class="w-full p-2 mb-2 border rounded-lg text-sm" oninput="updatePreview()">
        <input type="text" id="c-bank" placeholder="${f.bank}" class="w-full p-2 mb-2 border rounded-lg text-sm" oninput="updatePreview()">
        <input type="number" id="val-amount" placeholder="Сумма" class="w-full p-2 mb-2 border rounded-lg text-sm font-bold" oninput="updatePreview()">
        <textarea id="val-desc" placeholder="Предмет договора" class="w-full p-2 border rounded-lg text-sm" oninput="updatePreview()"></textarea>
    `;
}

// --- GENERATION & PREVIEW ---
function updatePreview() {
    const pName = document.getElementById('p-name').value || 'ИП Иванов И.И.';
    const pTax = document.getElementById('p-tax').value || '1234567890';
    const cName = document.getElementById('c-name')?.value || 'ТОО "Покупатель"';
    const amount = document.getElementById('val-amount')?.value || '0';
    const desc = document.getElementById('val-desc')?.value || 'За разработку ПО';
    const f = config[selectedCountry];

    const html = `
        <div id="pdf-area" style="font-family: 'Arial', sans-serif; color: #000; font-size: 12px;">
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px;">
                <h1 style="font-size: 18px; font-weight: bold; margin: 0;">${docType === 'Счет' ? 'СЧЕТ НА ОПЛАТУ' : 'АКТ ВЫПОЛНЕННЫХ РАБОТ'} №___ от ${new Date().toLocaleDateString()}</h1>
            </div>
            <table style="width: 100%; margin-bottom: 20px;">
                <tr><td style="width: 100px; vertical-align: top;"><strong>Исполнитель:</strong></td><td>${pName}, ${f.tax}: ${pTax}</td></tr>
                <tr><td style="vertical-align: top;"><strong>Заказчик:</strong></td><td>${cName}</td></tr>
            </table>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background: #eee;">
                    <th style="border: 1px solid #000; padding: 5px;">Наименование работ/услуг</th>
                    <th style="border: 1px solid #000; padding: 5px; width: 100px;">Сумма (${f.cur})</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px;">${desc}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">${amount}</td>
                </tr>
            </table>
            <div style="text-align: right; font-weight: bold; font-size: 14px;">ИТОГО К ОПЛАТЕ: ${amount} ${f.cur}</div>
            <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                <div>_________________ / ${pName}</div>
                <div>_________________ / ${cName}</div>
            </div>
        </div>
    `;
    document.getElementById('document-preview').innerHTML = html;
}

// --- ACTIONS ---
async function saveToDB() {
    const payload = {
        user_id: currentUser.id,
        country: selectedCountry,
        client_name: document.getElementById('c-name').value,
        tax_id: document.getElementById('c-tax').value,
        amount: parseFloat(document.getElementById('val-amount').value) || 0,
        document_type: docType,
        provider_name: document.getElementById('p-name').value,
        provider_tax_id: document.getElementById('p-tax').value,
        document_data: { desc: document.getElementById('val-desc').value }
    };
    await db.from('invoices').insert([payload]);
    loadHistory();
}

async function loadHistory() {
    const { data } = await db.from('invoices').select('*').order('created_at', { ascending: false }).limit(5);
    const cont = document.getElementById('history-list');
    if (data) {
        cont.innerHTML = data.map(i => `
            <div class="p-2 border rounded bg-gray-50 cursor-pointer hover:bg-blue-50" onclick="restoreFromHistory(${JSON.stringify(i).replace(/"/g, '&quot;')})">
                <b>${i.document_type}</b>: ${i.client_name} - ${i.amount}
            </div>
        `).join('');
    }
}

window.restoreFromHistory = (item) => {
    selectedCountry = item.country;
    docType = item.document_type;
    renderForm();
    document.getElementById('p-name').value = item.provider_name || '';
    document.getElementById('p-tax').value = item.provider_tax_id || '';
    document.getElementById('c-name').value = item.client_name;
    document.getElementById('c-tax').value = item.tax_id;
    document.getElementById('val-amount').value = item.amount;
    document.getElementById('val-desc').value = item.document_data?.desc || '';
    updatePreview();
};

async function downloadPDF() {
    await saveToDB();
    const element = document.getElementById('pdf-area');
    html2pdf().from(element).save(`${docType}_${Date.now()}.pdf`);
}

async function downloadExcel() {
    await saveToDB();
    const data = [
        [docType, "Дата", new Date().toLocaleDateString()],
        ["Поставщик", document.getElementById('p-name').value],
        ["Клиент", document.getElementById('c-name').value],
        ["Предмет", document.getElementById('val-desc').value],
        ["Сумма", document.getElementById('val-amount').value, config[selectedCountry].cur]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doc");
    XLSX.writeFile(wb, `${docType}.xlsx`);
}

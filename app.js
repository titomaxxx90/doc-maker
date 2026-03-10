// app.js — Логика приложения Doc-Maker.site
// Кодировка: UTF-8

// --- 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let currentUser = null;
let selectedCountry = 'РК'; // По умолчанию Казахстан

// Настройки полей для разных стран
const countrySettings = {
    'РК': { taxLabel: 'БИН/ИИН', bankLabel: 'ИИК (IBAN)', extraLabel: 'КБЕ', currency: 'тенге' },
    'РФ': { taxLabel: 'ИНН/КПП', bankLabel: 'Расчетный счет', extraLabel: 'БИК', currency: 'рублей' },
    'РБ': { taxLabel: 'УНП', bankLabel: 'IBAN', extraLabel: 'Код банка', currency: 'бел. руб.' },
    'КР': { taxLabel: 'ИНН', bankLabel: 'Расчетный счет', extraLabel: 'БИК', currency: 'сом' }
};

// --- 2. АВТОРИЗАЦИЯ ---

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const authMessage = document.getElementById('auth-message');

// Функция регистрации
document.getElementById('register-btn').onclick = async () => {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;

    if (!email || !password) return showMessage('Заполните все поля', 'red');

    const { data, error } = await db.auth.signUp({ email, password });
    
    if (error) {
        showMessage('Ошибка: ' + error.message, 'red');
    } else {
        showMessage('Аккаунт создан! Теперь нажмите "Войти"', 'green');
    }
};

// Функция входа
document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;

    const { data, error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
        showMessage('Ошибка входа: ' + error.message, 'red');
    } else {
        currentUser = data.user;
        startApp();
    }
};

function showMessage(text, color) {
    authMessage.innerText = text;
    authMessage.style.color = color;
    authMessage.classList.remove('hidden');
}

// Выход
document.getElementById('logout-btn').onclick = async () => {
    await db.auth.signOut();
    location.reload();
};

// --- 3. ИНТЕРФЕЙС ПРИЛОЖЕНИЯ ---

function startApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('user-email').innerText = currentUser.email;
    renderForm();
    updatePreview(); // Показать пустой шаблон сразу
}

function renderForm() {
    const area = document.getElementById('dynamic-form-area');
    const s = countrySettings[selectedCountry];

    area.innerHTML = `
        <div class="flex flex-wrap gap-2 mb-6">
            ${['РК', 'РФ', 'РБ', 'КР'].map(c => `
                <button onclick="changeCountry('${c}')" class="flex-1 py-2 rounded-md font-bold transition ${selectedCountry === c ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}">
                    ${c}
                </button>
            `).join('')}
        </div>
        
        <div class="space-y-3">
            <input type="text" id="f-client" placeholder="Наименование организации клиента" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <div class="grid grid-cols-2 gap-3">
                <input type="text" id="f-taxid" placeholder="${s.taxLabel}" class="w-full p-3 border rounded-lg outline-none">
                <input type="text" id="f-extra" placeholder="${s.extraLabel}" class="w-full p-3 border rounded-lg outline-none">
            </div>
            <input type="text" id="f-bank" placeholder="${s.bankLabel}" class="w-full p-3 border rounded-lg outline-none">
            <input type="number" id="f-amount" placeholder="Сумма к оплате" class="w-full p-3 border rounded-lg outline-none font-bold text-blue-700">
            <textarea id="f-desc" rows="3" placeholder="За что оплата (услуги/товары)" class="w-full p-3 border rounded-lg outline-none"></textarea>
            
            <button onclick="updatePreview()" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold shadow-lg transition transform active:scale-95">
                Обновить предпросмотр
            </button>
        </div>
    `;
}

window.changeCountry = (c) => {
    selectedCountry = c;
    renderForm();
    updatePreview();
};

// --- 4. ШАБЛОН И ЭКСПОРТ ---

function updatePreview() {
    const client = document.getElementById('f-client')?.value || '[Название клиента]';
    const amount = document.getElementById('f-amount')?.value || '0.00';
    const taxId = document.getElementById('f-taxid')?.value || '___';
    const desc = document.getElementById('f-desc')?.value || 'Консультационные услуги';
    const s = countrySettings[selectedCountry];

    const preview = document.getElementById('document-preview');
    
    // Современный чистый шаблон счета
    preview.innerHTML = `
        <div id="invoice-render" style="padding: 20px; color: #000; line-height: 1.5;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px;">
                <h1 style="font-size: 20px; text-transform: uppercase;">Счет на оплату №${Math.floor(Math.random() * 1000)}</h1>
                <p>Дата: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="margin-top: 20px;">
                <p><strong>Поставщик:</strong> Пользователь системы Doc-Maker (${currentUser.email})</p>
                <p><strong>Покупатель:</strong> ${client} (${s.taxLabel}: ${taxId})</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                <thead>
                    <tr style="background: #f4f4f4;">
                        <th style="border: 1px solid #000; padding: 10px; text-align: left;">Описание услуг</th>
                        <th style="border: 1px solid #000; padding: 10px; text-align: right; width: 120px;">Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #000; padding: 10px;">${desc}</td>
                        <td style="border: 1px solid #000; padding: 10px; text-align: right;">${amount}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 20px; text-align: right;">
                <p style="font-size: 18px;"><strong>ИТОГО К ОПЛАТЕ: ${amount} ${s.currency}</strong></p>
            </div>

            <div style="margin-top: 50px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px;">
                <p>Банковские реквизиты: ${s.bankLabel} ${document.getElementById('f-bank')?.value || '___'}</p>
                <p>Страна юрисдикции: ${selectedCountry}</p>
            </div>
        </div>
    `;
}

// Экспорт PDF
document.getElementById('export-pdf-btn').onclick = () => {
    const element = document.getElementById('invoice-render');
    const opt = {
        margin: 10,
        filename: `Invoice_${selectedCountry}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
};

// Экспорт Excel
document.getElementById('export-excel-btn').onclick = () => {
    const client = document.getElementById('f-client').value;
    const amount = document.getElementById('f-amount').value;
    
    const ws_data = [
        ["СЧЕТ НА ОПЛАТУ", "", ""],
        ["Дата", new Date().toLocaleDateString(), ""],
        ["Клиент", client, ""],
        ["Сумма", amount, countrySettings[selectedCountry].currency],
        ["Описание", document.getElementById('f-desc').value, ""]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");
    XLSX.writeFile(wb, `DocMaker_Export.xlsx`);
};

// Сохранение в Supabase
document.getElementById('save-db-btn').onclick = async () => {
    const btn = document.getElementById('save-db-btn');
    btn.innerText = "Сохранение...";
    
    const { error } = await db.from('invoices').insert([{
        user_id: currentUser.id,
        country: selectedCountry,
        client_name: document.getElementById('f-client').value,
        tax_id: document.getElementById('f-taxid').value,
        amount: parseFloat(document.getElementById('f-amount').value),
        document_type: 'Счет'
    }]);

    btn.innerText = "В историю";
    if (error) alert("Ошибка БД: " + error.message);
    else alert("Документ успешно сохранен в базе!");
};
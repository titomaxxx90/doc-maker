let currentUser = null, selectedCountry = 'РК', docType = 'Счет', isGuest = false;

const config = {
    'РК': { tax: 'БИН/ИИН', bank: 'ИИК', cur: 'тенге', label: 'Казахстан' },
    'РФ': { tax: 'ИНН/КПП', bank: 'Р/С', cur: 'руб.', label: 'Россия' },
    'РБ': { tax: 'УНП', bank: 'IBAN', cur: 'бел. руб.', label: 'Беларусь' },
    'КР': { tax: 'ИНН', bank: 'Р/С', cur: 'сом', label: 'Кыргызстан' }
};

// --- AUTH ---
document.getElementById('guest-btn').onclick = () => { isGuest = true; startApp(); };
document.getElementById('login-btn').onclick = () => handleAuth('login');
document.getElementById('reg-btn').onclick = () => handleAuth('signup');
document.getElementById('logout-btn').onclick = () => location.reload();

async function handleAuth(type) {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    if(!email || password.length < 6) return alert("Email и пароль (мин. 6 знаков) обязательны");

    const { data, error } = (type === 'login') 
        ? await db.auth.signInWithPassword({ email, password })
        : await db.auth.signUp({ email, password });

    if (error) alert(error.message);
    else if (type === 'signup') alert("Регистрация успешна! Теперь войдите.");
    else { currentUser = data.user; isGuest = false; startApp(); }
}

// --- APP CORE ---
function startApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    
    if(!isGuest) { document.getElementById('history-box').classList.remove('hidden'); loadHistory(); }
    
    document.getElementById('p-name').value = localStorage.getItem('p_name') || '';
    document.getElementById('p-tax').value = localStorage.getItem('p_tax') || '';
    document.getElementById('p-bank').value = localStorage.getItem('p_bank') || '';

    renderCountryBtns();
    renderForm();
    updatePreview();
}

function renderCountryBtns() {
    document.getElementById('country-btns').innerHTML = Object.keys(config).map(c => `
        <button onclick="setCountry('${c}')" class="p-1 rounded border text-[10px] font-bold ${selectedCountry === c ? 'bg-slate-800 text-white' : 'bg-gray-50'}">${c}</button>
    `).join('');
}

window.setCountry = (c) => { selectedCountry = c; renderCountryBtns(); renderForm(); updatePreview(); };

window.setDocType = (type) => {
    docType = type;
    document.getElementById('btn-inv').className = type === 'Счет' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs';
    document.getElementById('btn-avr').className = type === 'АВР' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs' : 'flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs';
    updatePreview();
};

function renderForm() {
    const f = config[selectedCountry];
    document.getElementById('dynamic-form').innerHTML = `
        <h3 class="font-bold text-gray-700 text-sm">Данные Клиента</h3>
        <input type="text" id="c-name" placeholder="Наименование организации" class="w-full p-2 border rounded text-xs" oninput="updatePreview()">
        <input type="text" id="c-tax" placeholder="${f.tax} клиента" class="w-full p-2 border rounded text-xs" oninput="updatePreview()">
        <input type="number" id="val-amount" placeholder="Сумма" class="w-full p-2 border rounded text-xs font-bold" oninput="updatePreview()">
        <textarea id="val-desc" rows="3" placeholder="Описание услуг" class="w-full p-2 border rounded text-xs" oninput="updatePreview()"></textarea>
    `;
}

// --- PROFESSIONAL TEMPLATES ---
function updatePreview() {
    const pName = document.getElementById('p-name').value || 'ИП Иванов И.И.';
    const pTax = document.getElementById('p-tax').value || '123456789012';
    const pBank = document.getElementById('p-bank').value || 'АО "Банк", ИИК: KZ000...';
    const cName = document.getElementById('c-name')?.value || 'ТОО "Заказчик"';
    const cTax = document.getElementById('c-tax')?.value || '987654321098';
    const amount = document.getElementById('val-amount')?.value || '0';
    const desc = document.getElementById('val-desc')?.value || 'Информационные услуги';
    const f = config[selectedCountry];

    localStorage.setItem('p_name', pName);
    localStorage.setItem('p_tax', pTax);
    localStorage.setItem('p_bank', pBank);

    let template = '';

    if (docType === 'Счет') {
        template = `
            <div style="font-size: 11pt;">
                <div style="border: 1px solid black; padding: 5px; margin-bottom: 20px; font-size: 10pt;">
                    <strong>Банк Поставщика:</strong> ${pBank}
                </div>
                <h2 style="text-align: center; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 5px;">
                    Счет на оплату №${Math.floor(Date.now()/100000)} от ${new Date().toLocaleDateString()}
                </h2>
                <div style="margin: 20px 0;">
                    <p><strong>Поставщик:</strong> ${pName}, ${f.tax}: ${pTax}</p>
                    <p><strong>Покупатель:</strong> ${cName}, ${f.tax}: ${cTax}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background: #eee;">
                            <th class="border-black">№</th><th class="border-black">Наименование товара/услуги</th><th class="border-black">Кол-во</th><th class="border-black">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border-black text-center">1</td><td class="border-black">${desc}</td><td class="border-black text-center">1</td><td class="border-black text-right">${amount}</td>
                        </tr>
                    </tbody>
                </table>
                <p style="text-align: right; font-weight: bold; margin-top: 10px;">ИТОГО К ОПЛАТЕ: ${amount} ${f.cur}</p>
                <div style="margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px;">
                    Руководитель: ________________ / ${pName} / <br><br> Бухгалтер: ________________
                </div>
            </div>
        `;
    } else {
        template = `
            <div style="font-size: 11pt;">
                <h2 style="text-align: center; font-weight: bold;">АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)</h2>
                <p style="text-align: center;">от ${new Date().toLocaleDateString()}</p>
                <div style="margin: 20px 0; border-top: 1px solid black; padding-top: 10px;">
                    <p><strong>Исполнитель:</strong> ${pName}</p>
                    <p><strong>Заказчик:</strong> ${cName}</p>
                </div>
                <p>Мы, нижеподписавшиеся, составили настоящий Акт о том, что Исполнителем были оказаны следующие услуги:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #eee;">
                        <th class="border-black">Наименование работ</th><th class="border-black">Сумма</th>
                    </tr>
                    <tr>
                        <td class="border-black">${desc}</td><td class="border-black text-right">${amount}</td>
                    </tr>
                </table>
                <p>Вышеуказанные услуги выполнены полностью и в срок. Заказчик претензий по объему, качеству и срокам оказания услуг не имеет.</p>
                <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                    <div style="width: 45%;"><strong>Исполнитель:</strong><br><br>________________ / ${pName}</div>
                    <div style="width: 45%;"><strong>Заказчик:</strong><br><br>________________ / ${cName}</div>
                </div>
            </div>
        `;
    }
    document.getElementById('doc-render-area').innerHTML = template;
}

// --- EXPORT ---
async function downloadPDF() {
    if(!isGuest) await saveToDB();
    const element = document.getElementById('doc-render-area');
    html2pdf().from(element).set({ margin: 10, filename: `${docType}.pdf`, html2canvas: { scale: 2 } }).save();
}

async function downloadXLSX() {
    if(!isGuest) await saveToDB();
    const data = [
        ["ДОКУМЕНТ", docType], ["ДАТА", new Date().toLocaleDateString()],
        ["ПОСТАВЩИК", document.getElementById('p-name').value],
        ["КЛИЕНТ", document.getElementById('c-name').value],
        ["УСЛУГА", document.getElementById('val-desc').value],
        ["ИТОГО", document.getElementById('val-amount').value, config[selectedCountry].cur]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doc");
    XLSX.writeFile(wb, `${docType}.xlsx`);
}

async function saveToDB() {
    const payload = {
        user_id: currentUser.id, country: selectedCountry,
        client_name: document.getElementById('c-name').value,
        amount: parseFloat(document.getElementById('val-amount').value) || 0,
        document_type: docType, provider_name: document.getElementById('p-name').value
    };
    await db.from('invoices').insert([payload]);
    loadHistory();
}

async function loadHistory() {
    const { data } = await db.from('invoices').select('*').order('created_at', { ascending: false }).limit(5);
    const cont = document.getElementById('history-list');
    if (data && data.length > 0) {
        cont.innerHTML = data.map(i => `
            <div class="text-[9px] p-1 border rounded bg-gray-50 mb-1">
                ${i.document_type}: ${i.client_name} (${i.amount})
            </div>
        `).join('');
    }
}

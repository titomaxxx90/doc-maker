let currentUser = null, selectedCountry = 'РК', docType = 'Счет', isGuest = false, activeHistoryTab = 'Счет';
let docItems = [{ code: '1', name: '', qty: 1, unit: 'шт', price: 0 }];

const config = {
    'РК': { name: 'Казахстан', tax: 'БИН/ИИН', cur: 'KZT', flag: '🇰🇿', subunits: 'тиын', curText: 'тенге' },
    'РФ': { name: 'Россия', tax: 'ИНН/КПП', cur: 'RUB', flag: '🇷🇺', subunits: 'коп.', curText: 'рублей' },
    'РБ': { name: 'Беларусь', tax: 'УНП', cur: 'BYN', flag: '🇧🇾', subunits: 'коп.', curText: 'бел. рублей' },
    'КР': { name: 'Кыргызстан', tax: 'ИНН', cur: 'KGS', flag: '🇰🇬', subunits: 'тыйын', curText: 'сомов' }
};

// ---------- ПРОВЕРКА СЕССИИ ПРИ ЗАГРУЗКЕ ----------
(async function initAuth() {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        isGuest = false;
        startApp();
    }
})();

// ---------- НДС ----------
window.toggleNds = function() {
    const ndsCheck = document.getElementById('include-nds');
    const ndsRate = document.getElementById('nds-rate');
    const ndsLabel = document.getElementById('nds-label');
    if (ndsCheck.checked) {
        ndsRate.classList.remove('hidden');
        ndsLabel.classList.remove('hidden');
    } else {
        ndsRate.classList.add('hidden');
        ndsLabel.classList.add('hidden');
    }
    updatePreview();
};

// ---------- АВТОРИЗАЦИЯ ----------
document.getElementById('guest-btn').onclick = () => { isGuest = true; startApp(); };
document.getElementById('login-btn').onclick = () => handleLogin();
document.getElementById('logout-btn').onclick = () => handleLogout();

// Модальное окно регистрации
window.openRegModal = function() {
    document.getElementById('reg-modal').classList.remove('hidden');
};
window.closeRegModal = function() {
    document.getElementById('reg-modal').classList.add('hidden');
};
window.submitRegistration = async function() {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    if (!email || password.length < 6) return alert("Введите email и пароль от 6 символов");
    const { error } = await db.auth.signUp({ email, password });
    if (error) alert(error.message);
    else {
        alert("Регистрация успешна! Теперь можете войти.");
        closeRegModal();
    }
};
document.getElementById('submit-reg-btn').onclick = submitRegistration;
document.getElementById('reg-btn').onclick = openRegModal;

async function handleLogin() {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    if (!email || password.length < 6) return alert("Введите email и пароль от 6 символов");
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
        currentUser = data.user;
        isGuest = false;
        startApp();
    }
}

async function handleLogout() {
    await db.auth.signOut();
    currentUser = null;
    isGuest = false;
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('logout-btn').classList.add('hidden');
    document.getElementById('user-display').classList.add('hidden');
    document.getElementById('email-input').value = '';
    document.getElementById('password-input').value = '';
}

// ---------- ЗАПУСК ПРИЛОЖЕНИЯ ----------
function startApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    document.getElementById('doc-date').valueAsDate = new Date();

    if (!isGuest) {
        document.getElementById('history-box').classList.remove('hidden');
        document.getElementById('auto-save-hint').classList.remove('hidden');
        const userDisplay = document.getElementById('user-display');
        userDisplay.classList.remove('hidden');
        userDisplay.innerText = currentUser.email;
        loadHistory();
        updateHistoryCounts();
    } else {
        document.getElementById('user-display').classList.add('hidden');
    }

    renderCountryBtns();
    renderForm();
    renderItemsInputs();
    updatePreview();
}

// ---------- ИНТЕРФЕЙС ----------
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
    
    // Показываем или скрываем банковские поля в зависимости от типа документа
    const bankFields = document.getElementById('bank-fields');
    if (bankFields) {
        if (type === 'Счет') {
            bankFields.classList.remove('hidden');
        } else {
            bankFields.classList.add('hidden');
        }
    }
    
    renderForm();
    updatePreview();
};

function renderForm() {
    let staffHtml = '';
    if (docType === 'Счет') {
        staffHtml = `
            <input type="text" id="p-ceo" placeholder="ФИО Директора" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
            <input type="text" id="p-accountant" placeholder="ФИО Бухгалтера" class="w-full p-2 border rounded text-xs outline-none mt-2" oninput="updatePreview()">
        `;
    } else {
        staffHtml = `
            <input type="text" id="p-ceo-role" placeholder="Должность Исполнителя" class="w-full p-2 border rounded text-xs outline-none mb-2" oninput="updatePreview()">
            <input type="text" id="p-ceo" placeholder="ФИО Исполнителя" class="w-full p-2 border rounded text-xs outline-none mb-2" oninput="updatePreview()">
            <hr class="my-2">
            <input type="text" id="c-ceo-role" placeholder="Должность Заказчика" class="w-full p-2 border rounded text-xs outline-none mb-2" oninput="updatePreview()">
            <input type="text" id="c-ceo" placeholder="ФИО Заказчика" class="w-full p-2 border rounded text-xs outline-none" oninput="updatePreview()">
        `;
    }
    document.getElementById('staff-fields').innerHTML = staffHtml;
}

// ---------- ТОВАРЫ ----------
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

// ---------- ПРЕДПРОСМОТР ----------
function numberToWords(amount, country) {
    // ... (функция без изменений, сохранена из исходного кода)
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

function updatePreview() {
    const val = (id) => document.getElementById(id)?.value || '';
    const dNum = val('doc-number') || '___';
    const dDateVal = val('doc-date');
    const dDate = dDateVal ? new Date(dDateVal).toLocaleDateString('ru-RU') : '___';
    
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

    const ndsChecked = document.getElementById('include-nds')?.checked || false;
    let ndsRate = parseFloat(document.getElementById('nds-rate')?.value) || 0;
    if (ndsRate < 0) ndsRate = 0;
    const ndsAmount = ndsChecked ? totalAmount * ndsRate / 100 : 0;

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
                    <div style="font-weight: bold;">В том числе НДС: <span style="display:inline-block; width: 120px; text-align:right;">${ndsAmount.toFixed(2)}</span></div>
                </div>

                <div style="margin-bottom: 10px;">
                    Всего наименований ${docItems.length}, на сумму ${totalAmount.toFixed(2)} ${config[selectedCountry].cur.toUpperCase()}<br>
                    <strong>Всего к оплате: ${numberToWords(totalAmount, selectedCountry)}</strong>
                </div>
                
                <div style="border-bottom: 3px solid black; margin-bottom: 20px;"></div>

                <div>
                    Директор <span style="display:inline-block; width: 300px; border-bottom: 1px solid black; margin-left: 15px;">${val('p-ceo')}</span> //<br>
                    Бухгалтер <span style="display:inline-block; width: 300px; border-bottom: 1px solid black; margin-left: 15px;">${val('p-accountant')}</span> //
                </div>
            </div>
        `;
    } else {
        let totalItemsQty = docItems.reduce((acc, it) => acc + it.qty, 0);
        const headerKZ = (selectedCountry === 'РК') ? `
            <div style="text-align: right; margin-bottom: 10px;">
                Приложение 50<br>к приказу Министра финансов<br>Республики Казахстан<br>от 20 декабря 2012 года № 562<br><br>
                <div style="font-weight: normal; margin-top: 5px;">Форма Р-1</div>
            </div>
        ` : '';

        html = `
            <div style="font-family: Arial, sans-serif; font-size: 8pt; color: #000; line-height: 1.2;">
                ${headerKZ}
                <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 15px;">
                    <tr>
                        <td style="width: 70%; vertical-align: bottom;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="width: 15%; padding-bottom: 5px;">Заказчик</td>
                                    <td style="border-bottom: 1px solid black; text-align: center; font-weight: bold;">
                                        ${val('c-name')}${val('c-address') ? ', ' + val('c-address') : ''}
                                    </td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td style="text-align: center; font-size: 6pt;">полное наименование, адрес, данные о средствах связи</td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 5px; padding-top: 10px;">Исполнитель</td>
                                    <td style="border-bottom: 1px solid black; text-align: center; font-weight: bold; padding-top: 10px;">
                                        ${val('p-name')}${val('p-address') ? ', ' + val('p-address') : ''}
                                    </td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td style="text-align: center; font-size: 6pt;">полное наименование, адрес, данные о средствах связи</td>
                                </tr>
                            </table>
                        </td>
                        <td style="width: 30%; vertical-align: top; padding-left: 20px;">
                            <div style="text-align: center; margin-bottom: 2px;">ИИН/БИН</div>
                            <div style="border: 1px solid black; text-align: center; padding: 5px; margin-bottom: 15px;">${val('c-tax')}</div>
                            <div style="border: 1px solid black; text-align: center; padding: 5px;">${val('p-tax')}</div>
                        </td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 5px;">
                    <tr>
                        <td style="width: 15%;">Договор (контракт)</td>
                        <td style="border-bottom: 1px solid black; width: 45%;">${val('c-contract') || 'Без договора'}</td>
                        <td style="width: 40%; text-align: right;">
                            <table style="border-collapse: collapse; float: right; text-align: center;">
                                <tr>
                                    <td style="border: 1px solid black; padding: 2px 10px;">Номер<br>документа</td>
                                    <td style="border: 1px solid black; padding: 2px 10px;">Дата<br>составления</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid black; padding: 2px 10px; font-weight: bold;">${dNum}</td>
                                    <td style="border: 1px solid black; padding: 2px 10px; font-weight: bold;">${dDate}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <div style="text-align: center; font-weight: bold; font-size: 10pt; margin-bottom: 10px; padding-right: 180px;">
                    АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 8pt; text-align: center; border: 1px solid black; margin-bottom: 15px;">
                    <thead>
                        <tr>
                            <td style="border: 1px solid black; padding: 4px;" rowspan="2">Номер<br>по<br>порядку</td>
                            <td style="border: 1px solid black; padding: 4px;" rowspan="2">Наименование работ (услуг) (в разрезе их<br>подвидов в соответствии с технической<br>спецификацией, заданием, графиком выполнения<br>работ (услуг) при их наличии)</td>
                            <td style="border: 1px solid black; padding: 4px;" rowspan="2">Дата выполнения<br>работ (оказания<br>услуг)</td>
                            <td style="border: 1px solid black; padding: 4px;" rowspan="2">Сведения об отчете о научных<br>исследованиях, маркетинговых,<br>консультационных и прочих услугах<br>(дата, номер, количество страниц)<br>(при их наличии)</td>
                            <td style="border: 1px solid black; padding: 4px;" rowspan="2">Единица<br>измерения</td>
                            <td style="border: 1px solid black; padding: 4px;" colspan="3">Выполнено работ (оказано услуг)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid black; padding: 4px;">количество</td>
                            <td style="border: 1px solid black; padding: 4px;">цена за единицу</td>
                            <td style="border: 1px solid black; padding: 4px;">стоимость</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid black; padding: 2px;">1</td>
                            <td style="border: 1px solid black; padding: 2px;">2</td>
                            <td style="border: 1px solid black; padding: 2px;">3</td>
                            <td style="border: 1px solid black; padding: 2px;">4</td>
                            <td style="border: 1px solid black; padding: 2px;">5</td>
                            <td style="border: 1px solid black; padding: 2px;">6</td>
                            <td style="border: 1px solid black; padding: 2px;">7</td>
                            <td style="border: 1px solid black; padding: 2px;">8</td>
                        </tr>
                    </thead>
                    <tbody>
                        ${docItems.map((it, i) => `
                            <tr>
                                <td style="border: 1px solid black; padding: 4px;">${i+1}</td>
                                <td style="border: 1px solid black; padding: 4px; text-align: left;">${it.name}</td>
                                <td style="border: 1px solid black; padding: 4px;">${dDate}</td>
                                <td style="border: 1px solid black; padding: 4px;"></td>
                                <td style="border: 1px solid black; padding: 4px;">${it.unit}</td>
                                <td style="border: 1px solid black; padding: 4px;">${it.qty}</td>
                                <td style="border: 1px solid black; padding: 4px; text-align: right;">${it.price.toFixed(2)}</td>
                                <td style="border: 1px solid black; padding: 4px; text-align: right;">${(it.qty * it.price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="5" style="text-align: right; padding: 4px; border: none;">Итого</td>
                            <td style="border: 1px solid black; padding: 4px;">${totalItemsQty}</td>
                            <td style="border: 1px solid black; padding: 4px; text-align: center;">x</td>
                            <td style="border: 1px solid black; padding: 4px; text-align: right;">${totalAmount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="font-size: 8pt; margin-bottom: 15px;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="width: 320px;">Сведения об использовании запасов, полученных от заказчика</td>
                            <td style="border-bottom: 1px solid black;"></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td style="text-align: center; font-size: 6pt;">наименование, количество, стоимость</td>
                        </tr>
                    </table>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 630px;">Приложение: Перечень документации, в том числе отчет(ы) о маркетинговых, научных исследованиях, консультационных и прочих услугах (обязательны при его<br>(их) наличии) на <span style="display:inline-block; width: 50px; border-bottom: 1px solid black;"></span> страниц</td>
                            <td style="border-bottom: 1px solid black; vertical-align: bottom;"></td>
                        </tr>
                    </table>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-top: 30px;">
                    <tr>
                        <td style="width: 15%;">Сдал (Исполнитель)</td>
                        <td style="width: 15%; border-bottom: 1px solid black; text-align: center;">${val('p-ceo-role') || ''}</td>
                        <td style="width: 2%; text-align: center;">/</td>
                        <td style="width: 15%; border-bottom: 1px solid black;"></td>
                        <td style="width: 2%; text-align: center;">/</td>
                        <td style="width: 15%; border-bottom: 1px solid black; text-align: center;">${val('p-ceo') || ''}</td>
                        <td style="width: 5%;"></td>
                        
                        <td style="width: 12%;">Принял (Заказчик)</td>
                        <td style="width: 15%; border-bottom: 1px solid black; text-align: center;">${val('c-ceo-role') || ''}</td>
                        <td style="width: 2%; text-align: center;">/</td>
                        <td style="width: 15%; border-bottom: 1px solid black;"></td>
                        <td style="width: 2%; text-align: center;">/</td>
                        <td style="width: 15%; border-bottom: 1px solid black; text-align: center;">${val('c-ceo') || ''}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td style="text-align: center; font-size: 6pt; padding-top: 2px;">должность</td>
                        <td></td>
                        <td style="text-align: center; font-size: 6pt; padding-top: 2px;">подпись</td>
                        <td></td>
                        <td style="text-align: center; font-size: 6pt; padding-top: 2px;">расшифровка подписи</td>
                        <td></td>
                        <td></td>
                        <td style="text-align: center; font-size: 6pt; padding-top: 2px;">должность</td>
                        <td></td>
                        <td style="text-align: center; font-size: 6pt; padding-top: 2px;">подпись</td>
                        <td></td>
                        <td style="text-align: center; font-size: 6pt; padding-top: 2px;">расшифровка подписи</td>
                    </tr>
                </table>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-top: 15px;">
                    <tr>
                        <td style="width: 50%;"><strong>М.П.</strong></td>
                        <td style="width: 25%; text-align: right; padding-right: 10px;">Дата подписания (принятия) работ (услуг)</td>
                        <td style="width: 25%; border-bottom: 1px solid black; text-align: center;">${dDate}</td>
                    </tr>
                    <tr>
                        <td style="padding-top: 15px;"><strong>М.П.</strong></td>
                        <td></td>
                        <td></td>
                    </tr>
                </table>
            </div>
        `;
    }
    document.getElementById('doc-render-area').innerHTML = html;
}

// ---------- ИСТОРИЯ ----------
window.switchHistoryTab = (type) => {
    activeHistoryTab = type;
    document.getElementById('tab-h-inv').className = type === 'Счет' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 border-r shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400 border-r hover:text-gray-600';
    document.getElementById('tab-h-avr').className = type === 'АВР' ? 'flex-1 py-2 text-[10px] font-bold bg-white text-blue-600 shadow-inner' : 'flex-1 py-2 text-[10px] font-bold bg-gray-100 text-gray-400 hover:text-gray-600';
    loadHistory();
};

async function loadHistory() {
    if (!currentUser) return;
    const { data, error } = await db
        .from('invoices')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('document_type', activeHistoryTab)
        .order('created_at', { ascending: false });

    const cont = document.getElementById('history-list');
    if (error) {
        console.error(error);
        cont.innerHTML = `<div class="text-center py-6 text-red-300 text-xs">Ошибка загрузки</div>`;
        return;
    }

    if (data && data.length > 0) {
        cont.innerHTML = data.map(i => {
            const dateStr = i.doc_date ? new Date(i.doc_date).toLocaleDateString('ru-RU') : 'дата не указана';
            return `
                <div onclick='restoreFromHistory(${JSON.stringify(i)})' class="relative p-2 border rounded bg-gray-50 hover:bg-blue-50 cursor-pointer transition group">
                    <div class="flex justify-between font-bold text-[9px] text-blue-600">
                        <span>№${i.doc_number || 'б/н'}</span>
                        <span>от ${dateStr}</span>
                    </div>
                    <button onclick="event.stopPropagation(); deleteHistoryItem('${i.id}')" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">✕</button>
                </div>
            `;
        }).join('');
    } else {
        cont.innerHTML = `<div class="text-center py-6 text-gray-300 text-xs">Нет документов</div>`;
    }
    updateHistoryCounts();
}

async function updateHistoryCounts() {
    if (!currentUser) return;
    const { count: invCount } = await db.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('document_type', 'Счет');
    const { count: avrCount } = await db.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('document_type', 'АВР');
    document.getElementById('count-inv').innerText = invCount || 0;
    document.getElementById('count-avr').innerText = avrCount || 0;
}

window.deleteHistoryItem = async (id) => {
    if (!currentUser || !confirm('Удалить документ из истории?')) return;
    const { error } = await db.from('invoices').delete().eq('id', id).eq('user_id', currentUser.id);
    if (error) console.error(error);
    else {
        loadHistory();
        updateHistoryCounts();
    }
};

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
    
    const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).value = val || ''; };
    
    setVal('doc-number', i.doc_number);
    setVal('doc-date', i.doc_date);
    setVal('p-name', i.provider_name);
    setVal('p-tax', i.provider_tax_id);
    setVal('p-address', i.p_address);
    setVal('p-bank', i.provider_bank);
    setVal('p-iik', i.p_iik);
    setVal('p-bik', i.p_bik);
    setVal('p-kbe', i.p_kbe);
    setVal('p-knp', i.p_knp);
    setVal('p-ceo', i.provider_ceo);
    setVal('p-accountant', i.provider_accountant || '');
    setVal('c-name', i.client_name);
    setVal('c-tax', i.client_tax_id);
    setVal('c-address', i.c_address);
    setVal('c-contract', i.c_contract);
    
    // Для АВР дополнительные поля
    setVal('p-ceo-role', i.p_ceo_role || '');
    setVal('c-ceo-role', i.c_ceo_role || '');
    setVal('c-ceo', i.c_ceo || '');

    updatePreview();
};

// ---------- СОХРАНЕНИЕ И PDF ----------
async function downloadPDF() {
    if (!isGuest) await saveToDB();
    const element = document.getElementById('doc-render-area');
    html2pdf().from(element).set({ margin: [10, 5, 10, 5], filename: `Document.pdf`, html2canvas: { scale: 3 } }).save();
}

async function saveToDB() {
    if (isGuest || !currentUser) return;

    const totalAmount = docItems.reduce((acc, it) => acc + (it.qty * it.price), 0);
    const val = (id) => document.getElementById(id)?.value || '';

    // Генерация номера, если пусто
    let docNumber = val('doc-number').trim();
    if (docNumber === '') {
        const prefix = docType === 'Счет' ? 'СЧ' : 'АКТ';
        const now = new Date();
        const dateStr = now.toISOString().slice(2,10).replace(/-/g, ''); // YYMMDD
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        docNumber = `${prefix}-${dateStr}-${random}`;
    }

    // Дата, если не заполнена
    let docDate = val('doc-date');
    if (!docDate) {
        const today = new Date();
        docDate = today.toISOString().split('T')[0];
    }

    // Создаём описание из первой позиции
    const description = docItems.length > 0 && docItems[0].name 
        ? docItems[0].name 
        : 'Документ без названия';

    const payload = {
        user_id: currentUser.id,
        country: selectedCountry,
        document_type: docType,
        doc_number: docNumber,
        doc_date: docDate,
        description: description,
        provider_name: val('p-name'),
        provider_tax_id: val('p-tax'),
        p_address: val('p-address'),
        provider_bank: val('p-bank'),
        p_iik: val('p-iik'),
        p_bik: val('p-bik'),
        p_kbe: val('p-kbe'),
        p_knp: val('p-knp'),
        provider_ceo: val('p-ceo'),
        provider_accountant: val('p-accountant'),
        client_name: val('c-name'),
        client_tax_id: val('c-tax'),
        c_address: val('c-address'),
        c_contract: val('c-contract'),
        amount: totalAmount,
        items: docItems,
        // Поля для АВР
        p_ceo_role: val('p-ceo-role'),
        c_ceo_role: val('c-ceo-role'),
        c_ceo: val('c-ceo'),
        // Добавляем tax_id, так как в таблице оно NOT NULL
        tax_id: val('p-tax') || val('c-tax') || ''
    };

    try {
        const { error } = await db.from('invoices').insert([payload]);
        if (error) {
            console.error("Ошибка сохранения в базу данных:", error);
            alert("Ошибка при сохранении: " + error.message);
        } else {
            console.log("Документ сохранён");
            // Принудительно обновляем историю после успешного сохранения
            switchHistoryTab(docType);
        }
    } catch (err) {
        console.error("Исключение при сохранении:", err);
        alert("Ошибка соединения с базой данных");
    }
}

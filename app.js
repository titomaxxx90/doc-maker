let selectedCountry = 'РК', docType = 'Счет', isGuest = false;

const forms = {
    'РК': { tax: 'БИН', bank: 'ИИК', extra: 'КБЕ' },
    'РФ': { tax: 'ИНН', bank: 'Р/С', extra: 'БИК' },
    'РБ': { tax: 'УНП', bank: 'IBAN', extra: 'Код банка' },
    'КР': { tax: 'ИНН', bank: 'Р/С', extra: 'БИК' }
};

// Инициализация
document.getElementById('guest-btn').onclick = () => { initApp(true); };
document.getElementById('logout-btn').onclick = () => { location.reload(); };

function initApp(guest) {
    isGuest = guest;
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-menu').classList.remove('hidden');
    document.getElementById('user-email').innerText = guest ? "Гость" : "Пользователь";
    renderControls();
    renderForm();
    updatePreview();
}

function renderControls() {
    document.getElementById('country-btns').innerHTML = Object.keys(forms).map(c => 
        `<button class="px-2 py-1 border text-sm ${selectedCountry === c ? 'bg-blue-800 text-white' : 'bg-gray-100'}" onclick="changeCountry('${c}')">${c}</button>`
    ).join('');
}

window.changeCountry = (c) => { selectedCountry = c; renderControls(); renderForm(); updatePreview(); };

function renderForm() {
    const f = forms[selectedCountry];
    document.getElementById('dynamic-form').innerHTML = `
        <input type="text" id="c-name" placeholder="Клиент" class="w-full p-2 border rounded" oninput="updatePreview()">
        <input type="text" id="c-tax" placeholder="${f.tax}" class="w-full p-2 border rounded" oninput="updatePreview()">
        <input type="text" id="c-bank" placeholder="${f.bank}" class="w-full p-2 border rounded" oninput="updatePreview()">
        <input type="number" id="c-amount" placeholder="Сумма" class="w-full p-2 border rounded" oninput="updatePreview()">
    `;
}

function updatePreview() {
    document.getElementById('doc-preview').innerHTML = `
        <h2 class="text-2xl font-bold">${docType} (${selectedCountry})</h2>
        <p>Клиент: ${document.getElementById('c-name')?.value || '-'}</p>
        <p>Сумма: ${document.getElementById('c-amount')?.value || '0'}</p>
    `;
}

document.getElementById('btn-xlsx').onclick = () => {
    const data = [["Тип", "Клиент", "Сумма"], [docType, document.getElementById('c-name').value, document.getElementById('c-amount').value]];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doc");
    XLSX.writeFile(wb, "Document.xlsx");
};

document.getElementById('btn-pdf').onclick = () => {
    html2pdf().from(document.getElementById('doc-preview')).save();
};

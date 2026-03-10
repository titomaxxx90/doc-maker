let selectedCountry = 'РК';
let docType = 'Счет';

const countryData = {
    'РК': { tax: 'БИН/ИИН', bank: 'ИИК', extra: 'КБЕ' },
    'РФ': { tax: 'ИНН', bank: 'Р/С', extra: 'БИК' },
    'РБ': { tax: 'УНП', bank: 'IBAN', extra: 'Код банка' },
    'КР': { tax: 'ИНН', bank: 'Р/С', extra: 'БИК' }
};

document.addEventListener('DOMContentLoaded', () => {
    // Делегирование событий для кнопок
    document.getElementById('type-btns').addEventListener('click', (e) => {
        if (e.target.classList.contains('type-btn')) {
            docType = e.target.dataset.type;
            document.querySelectorAll('.type-btn').forEach(b => {
                b.className = b.dataset.type === docType ? 'type-btn flex-1 py-2 bg-blue-600 text-white rounded font-bold' : 'type-btn flex-1 py-2 bg-gray-200 rounded font-bold';
            });
            updatePreview();
        }
    });
});

function renderCountryBtns() {
    document.getElementById('country-btns').innerHTML = Object.keys(countryData).map(c => 
        `<button class="px-3 py-1 border rounded text-sm ${selectedCountry === c ? 'bg-blue-800 text-white' : 'bg-gray-100'}" onclick="changeCountry('${c}')">${c}</button>`
    ).join('');
}

window.changeCountry = (c) => {
    selectedCountry = c;
    renderCountryBtns();
    renderForm();
    updatePreview();
};

function renderForm() {
    const f = countryData[selectedCountry];
    document.getElementById('dynamic-form').innerHTML = `
        <input type="text" id="p-name" placeholder="Ваш поставщик" class="w-full p-2 border rounded" oninput="updatePreview()">
        <input type="text" id="p-tax" placeholder="${f.tax}" class="w-full p-2 border rounded" oninput="updatePreview()">
        <hr>
        <input type="text" id="c-name" placeholder="Клиент" class="w-full p-2 border rounded" oninput="updatePreview()">
        <input type="text" id="c-bank" placeholder="${f.bank}" class="w-full p-2 border rounded" oninput="updatePreview()">
        <input type="number" id="c-amount" placeholder="Сумма" class="w-full p-2 border rounded" oninput="updatePreview()">
    `;
    document.getElementById('p-name').value = localStorage.getItem('p-name') || '';
    document.getElementById('p-tax').value = localStorage.getItem('p-tax') || '';
}

function updatePreview() {
    const pName = document.getElementById('p-name')?.value;
    localStorage.setItem('p-name', pName);
    localStorage.setItem('p-tax', document.getElementById('p-tax')?.value);
    
    document.getElementById('document-preview').innerHTML = `
        <h2 class="text-2xl font-bold border-b">${docType} (Страна: ${selectedCountry})</h2>
        <p>Исполнитель: ${pName || '---'}</p>
        <p>Сумма: ${document.getElementById('c-amount')?.value || '0'}</p>
    `;
}

// Запуск приложения
document.getElementById('login-btn').onclick = () => {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    renderCountryBtns();
    renderForm();
    updatePreview();
};

// Экспорт
document.getElementById('btn-pdf').onclick = () => {
    html2pdf().from(document.getElementById('document-preview')).save();
};

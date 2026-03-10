let state = { country: 'РК', type: 'Счет' };

// Рендер кнопок стран
function renderCountries() {
    const list = ['РК', 'РФ', 'РБ', 'КР'];
    document.getElementById('country-btns').innerHTML = list.map(c => 
        `<button onclick="setCountry('${c}')" class="px-3 py-1 border ${state.country === c ? 'bg-black text-white' : ''}">${c}</button>`
    ).join('');
}

window.setCountry = (c) => { state.country = c; renderCountries(); renderForm(); renderPreview(); };
window.setDoc = (t) => { state.type = t; renderPreview(); };

function renderForm() {
    document.getElementById('form-fields').innerHTML = `
        <input type="text" id="client" placeholder="Клиент" class="w-full border p-2" oninput="renderPreview()">
        <input type="text" id="tax" placeholder="Налоговый ID" class="w-full border p-2" oninput="renderPreview()">
        <input type="number" id="sum" placeholder="Сумма" class="w-full border p-2" oninput="renderPreview()">
    `;
}

function renderPreview() {
    const client = document.getElementById('client')?.value || 'Клиент';
    const sum = document.getElementById('sum')?.value || '0';
    
    // Дизайн шаблона по стандартам (таблица с рамками)
    document.getElementById('doc-preview').innerHTML = `
        <div style="border: 2px solid #000; padding: 20px; font-family: serif;">
            <h1 style="text-align: center; border-bottom: 1px solid #000;">${state.type} (Страна: ${state.country})</h1>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr><td style="border: 1px solid #000; padding: 10px;">Покупатель: ${client}</td></tr>
                <tr><td style="border: 1px solid #000; padding: 10px;">Сумма: ${sum}</td></tr>
            </table>
            <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                <span>Исполнитель _________</span>
                <span>Заказчик _________</span>
            </div>
        </div>
    `;
    document.getElementById('preview-box').classList.remove('hidden');
}

// Запуск Гостя
document.getElementById('guest-btn').onclick = () => {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('app-box').classList.remove('hidden');
    document.getElementById('preview-box').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    renderCountries();
    renderForm();
    renderPreview();
};

document.getElementById('logout-btn').onclick = () => location.reload();

function downloadPDF() { html2pdf().from(document.getElementById('doc-preview')).save(); }
function downloadExcel() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["Тип", "Клиент", "Сумма"], [state.type, document.getElementById('client').value, document.getElementById('sum').value]]);
    XLSX.utils.book_append_sheet(wb, ws, "Doc");
    XLSX.writeFile(wb, "doc.xlsx");
}

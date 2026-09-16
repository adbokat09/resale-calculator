// Ініціалізація Telegram Mini App
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Елементи вводу
const purchasePriceInput = document.getElementById('purchasePrice');
const deliveryInput = document.getElementById('delivery');
const quantityInput = document.getElementById('quantity');
const salePriceInput = document.getElementById('salePrice');
const commissionInput = document.getElementById('commission');

// Елементи виводу
const totalCostsEl = document.getElementById('totalCosts');
const unitCostEl = document.getElementById('unitCost');
const unitCommissionEl = document.getElementById('unitCommission');
const unitProfitEl = document.getElementById('unitProfit');
const totalProfitEl = document.getElementById('totalProfit');
const profitabilityEl = document.getElementById('profitability');

// Форматування чисел (гроші)
function formatMoney(value) {
    if (!isFinite(value)) return '0 грн';
    return value.toLocaleString('uk-UA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }) + ' грн';
}

function formatPercent(value) {
    if (!isFinite(value)) return '0%';
    return value.toLocaleString('uk-UA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }) + '%';
}

// Підсвічування прибутку/збитку кольором
function setProfitColor(el, value) {
    el.style.color = value < 0 ? '#e74c3c' : (value > 0 ? '#27ae60' : '#222');
}

function calculate() {
    // Зчитуємо значення, підставляючи 0, якщо поле порожнє
    const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
    const delivery = parseFloat(deliveryInput.value) || 0;
    const quantity = parseFloat(quantityInput.value) || 0;
    const salePrice = parseFloat(salePriceInput.value) || 0;
    const commission = parseFloat(commissionInput.value) || 0;

    // Загальні витрати на всю партію
    const totalCosts = purchasePrice * quantity + delivery;

    // Собівартість одного товару (якщо кількість > 0)
    const unitCost = quantity > 0 ? totalCosts / quantity : 0;

    // Комісія маркетплейсу з одного товару
    const unitCommission = salePrice * (commission / 100);

    // Прибуток з одного товару
    const unitProfit = salePrice - unitCost - unitCommission;

    // Загальний прибуток по всій партії
    const totalProfit = unitProfit * quantity;

    // Рентабельність (прибуток відносно собівартості)
    const profitability = unitCost > 0 ? (unitProfit / unitCost) * 100 : 0;

    // Виводимо результати
    totalCostsEl.textContent = formatMoney(totalCosts);
    unitCostEl.textContent = formatMoney(unitCost);
    unitCommissionEl.textContent = formatMoney(unitCommission);
    unitProfitEl.textContent = formatMoney(unitProfit);
    totalProfitEl.textContent = formatMoney(totalProfit);
    profitabilityEl.textContent = formatPercent(profitability);

    // Кольорове виділення прибутку/збитку
    setProfitColor(unitProfitEl, unitProfit);
    setProfitColor(totalProfitEl, totalProfit);
    setProfitColor(profitabilityEl, profitability);
}

// Перерахунок при кожній зміні будь-якого поля
[purchasePriceInput, deliveryInput, quantityInput, salePriceInput, commissionInput]
    .forEach(input => input.addEventListener('input', calculate));

// Початковий розрахунок при завантаженні сторінки
calculate();
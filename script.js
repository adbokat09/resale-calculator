// Ініціалізація Telegram Mini App
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Повзунки
const quantitySlider = document.getElementById('quantitySlider');
const purchasePriceSlider = document.getElementById('purchasePriceSlider');
const deliverySlider = document.getElementById('deliverySlider');
const salePriceSlider = document.getElementById('salePriceSlider');
const commissionSlider = document.getElementById('commissionSlider');

// Підписи поточних значень повзунків
const quantityValueEl = document.getElementById('quantityValue');
const purchasePriceValueEl = document.getElementById('purchasePriceValue');
const deliveryValueEl = document.getElementById('deliveryValue');
const salePriceValueEl = document.getElementById('salePriceValue');
const commissionValueEl = document.getElementById('commissionValue');

// Розрахункові поля
const totalCostsEl = document.getElementById('totalCosts');
const revenueEl = document.getElementById('revenue');
const unitCostEl = document.getElementById('unitCost');
const unitCommissionEl = document.getElementById('unitCommission');
const totalProfitEl = document.getElementById('totalProfit');
const profitabilityEl = document.getElementById('profitability');

const saveBtn = document.getElementById('saveBtn');
const statusMsg = document.getElementById('statusMsg');

let currentResult = null;

// Форматування без знаку (для звичайних рядків)
function formatMoneyPlain(value) {
    if (!isFinite(value)) return '0 грн';
    return Math.round(value).toLocaleString('uk-UA') + ' грн';
}

// Форматування зі знаком +/- (для підсумкового блоку)
function formatMoneySigned(value) {
    if (!isFinite(value)) return '0 грн';
    const rounded = Math.round(value);
    const sign = rounded > 0 ? '+' : '';
    return sign + rounded.toLocaleString('uk-UA') + ' грн';
}

function formatPercent(value) {
    if (!isFinite(value)) return '0%';
    return Math.round(value) + '%';
}

function calculate() {
    const quantity = parseFloat(quantitySlider.value) || 0;
    const purchasePrice = parseFloat(purchasePriceSlider.value) || 0;
    const delivery = parseFloat(deliverySlider.value) || 0;
    const salePrice = parseFloat(salePriceSlider.value) || 0;
    const commission = parseFloat(commissionSlider.value) || 0;

    // Оновлюємо підписи поточних значень над кожним повзунком
    quantityValueEl.textContent = quantity + ' шт.';
    purchasePriceValueEl.textContent = purchasePrice.toLocaleString('uk-UA') + ' грн';
    deliveryValueEl.textContent = delivery.toLocaleString('uk-UA') + ' грн';
    salePriceValueEl.textContent = salePrice.toLocaleString('uk-UA') + ' грн';
    commissionValueEl.textContent = commission + '%';

    const totalCosts = purchasePrice * quantity + delivery;
    const revenue = salePrice * quantity;
    const unitCost = quantity > 0 ? totalCosts / quantity : 0;
    const unitCommission = salePrice * (commission / 100);
    const unitProfit = salePrice - unitCost - unitCommission;
    const totalProfit = unitProfit * quantity;
    const profitability = unitCost > 0 ? (unitProfit / unitCost) * 100 : 0;

    totalCostsEl.textContent = formatMoneyPlain(totalCosts);
    revenueEl.textContent = formatMoneyPlain(revenue);
    unitCostEl.textContent = formatMoneyPlain(unitCost);
    unitCommissionEl.textContent = formatMoneyPlain(unitCommission);

    totalProfitEl.textContent = formatMoneySigned(totalProfit);
    totalProfitEl.style.color = totalProfit < 0 ? 'var(--red)' : 'var(--green)';

    profitabilityEl.textContent = formatPercent(profitability);

    // Значення для відправки в бот при збереженні
    currentResult = {
        purchasePrice,
        delivery,
        quantity,
        salePrice,
        commission,
        totalCosts: Math.round(totalCosts * 100) / 100,
        revenue: Math.round(revenue * 100) / 100,
        unitCost: Math.round(unitCost * 100) / 100,
        unitCommission: Math.round(unitCommission * 100) / 100,
        unitProfit: Math.round(unitProfit * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        profitability: Math.round(profitability * 100) / 100,
    };
}

function showStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.className = 'status-msg ' + type;
    setTimeout(() => {
        statusMsg.textContent = '';
        statusMsg.className = 'status-msg';
    }, 3000);
}

saveBtn.addEventListener('click', () => {
    if (!currentResult || currentResult.quantity <= 0) {
        showStatus('Встановіть кількість товарів перед збереженням', 'error');
        return;
    }

    if (!tg) {
        console.log('Дані для відправки в бот:', currentResult);
        showStatus('Відкрийте застосунок через Telegram, щоб зберегти', 'error');
        return;
    }

    tg.sendData(JSON.stringify(currentResult));
});

[quantitySlider, purchasePriceSlider, deliverySlider, salePriceSlider, commissionSlider]
    .forEach(slider => slider.addEventListener('input', calculate));

calculate();
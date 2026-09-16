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

// Поля ручного вводу числа
const quantityInput = document.getElementById('quantityInput');
const purchasePriceInput = document.getElementById('purchasePriceInput');
const deliveryInput = document.getElementById('deliveryInput');
const salePriceInput = document.getElementById('salePriceInput');
const commissionInput = document.getElementById('commissionInput');

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

// Пари "повзунок <-> поле вводу", які мають бути синхронізовані
const pairs = [
    { slider: quantitySlider, input: quantityInput, minAllowed: 1 },
    { slider: purchasePriceSlider, input: purchasePriceInput, minAllowed: 0 },
    { slider: deliverySlider, input: deliveryInput, minAllowed: 0 },
    { slider: salePriceSlider, input: salePriceInput, minAllowed: 0 },
    { slider: commissionSlider, input: commissionInput, minAllowed: 0 },
];

function formatMoneyPlain(value) {
    if (!isFinite(value)) return '0 грн';
    return Math.round(value).toLocaleString('uk-UA') + ' грн';
}

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

// Рух повзунка -> оновлюємо число в полі вводу
function syncFromSlider(pair) {
    pair.input.value = pair.slider.value;
    calculate();
}

// Ручний ввід числа -> оновлюємо повзунок.
// Якщо вписане значення більше за поточний максимум повзунка — розширюємо шкалу,
// щоб бігунок міг відобразити це значення.
function syncFromInput(pair) {
    let val = parseFloat(pair.input.value);

    if (isNaN(val)) {
        val = parseFloat(pair.slider.value);
    }
    if (val < pair.minAllowed) {
        val = pair.minAllowed;
    }
    if (val > parseFloat(pair.slider.max)) {
        pair.slider.max = val;
    }

    pair.input.value = val;
    pair.slider.value = val;
    calculate();
}

function calculate() {
    const quantity = parseFloat(quantitySlider.value) || 0;
    const purchasePrice = parseFloat(purchasePriceSlider.value) || 0;
    const delivery = parseFloat(deliverySlider.value) || 0;
    const salePrice = parseFloat(salePriceSlider.value) || 0;
    const commission = parseFloat(commissionSlider.value) || 0;

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

// Прив'язуємо події до кожної пари повзунок/поле вводу
pairs.forEach(pair => {
    // Повзунок рухається "наживо" — реагуємо одразу
    pair.slider.addEventListener('input', () => syncFromSlider(pair));

    // Число вводиться вручну — застосовуємо, коли користувач завершив ввід
    // (натиснув Enter або забрав фокус з поля)
    pair.input.addEventListener('change', () => syncFromInput(pair));
    pair.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            pair.input.blur();
        }
    });
});

calculate();
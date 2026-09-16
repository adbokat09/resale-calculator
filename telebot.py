"""
Telegram-бот "Калькулятор перепродажу" з Mini App та історією розрахунків.

Встановлення:
    pip install python-telegram-bot==21.4

Запуск:
    python bot.py

Перед запуском заповніть BOT_TOKEN та WEBAPP_URL нижче.
"""

import json
import os
from datetime import datetime

from telegram import (
    Update,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# ==================== НАЛАШТУВАННЯ ====================

# Токен від @BotFather (команда /newbot)
BOT_TOKEN = "8699856135:AAEChrisPGE4RfMaDYq9Ds-2xY1u1rj2HLg"

# Посилання на ваш index.html, розміщений на HTTPS-хостингу.
# Telegram НЕ дозволяє відкривати Mini App по звичайному http:// або localhost —
# потрібен саме https:// (наприклад, GitHub Pages, Vercel, Netlify, Render тощо).
WEBAPP_URL = "https://adbokat09.github.io/resale-calculator/"

# Файл, у якому зберігається історія всіх користувачів
HISTORY_FILE = "history.json"

# Скільки останніх розрахунків тримати на одного користувача
MAX_RECORDS_PER_USER = 50

# Тексти кнопок
BTN_CALC = "🧮 Відкрити калькулятор"
BTN_HISTORY = "📊 Моя історія"
BTN_CLEAR = "🗑 Очистити історію"

# ==================== РОБОТА З ФАЙЛОМ ІСТОРІЇ ====================


def load_history() -> dict:
    """Зчитує весь файл історії. Повертає {} якщо файлу ще немає."""
    if not os.path.exists(HISTORY_FILE):
        return {}
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def save_history(data: dict) -> None:
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def add_record(user_id: int, record: dict) -> None:
    """Додає новий розрахунок в історію конкретного користувача."""
    data = load_history()
    key = str(user_id)

    if key not in data:
        data[key] = []

    record = dict(record)  # копія, щоб не мутувати оригінал
    record["date"] = datetime.now().strftime("%d.%m.%Y %H:%M")

    data[key].append(record)
    data[key] = data[key][-MAX_RECORDS_PER_USER:]  # тримаємо тільки останні N

    save_history(data)


def get_user_history(user_id: int) -> list:
    data = load_history()
    return data.get(str(user_id), [])


def clear_user_history(user_id: int) -> None:
    data = load_history()
    data[str(user_id)] = []
    save_history(data)


# ==================== КЛАВІАТУРА ====================


def main_keyboard() -> ReplyKeyboardMarkup:
    keyboard = [
        [KeyboardButton(BTN_CALC, web_app=WebAppInfo(url=WEBAPP_URL))],
        [KeyboardButton(BTN_HISTORY), KeyboardButton(BTN_CLEAR)],
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)


# ==================== ХЕНДЛЕРИ ====================


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Привіт! Це калькулятор перепродажу для OLX.\n\n"
        "1. Натисни «🧮 Відкрити калькулятор»\n"
        "2. Заповни поля — результат порахується автоматично\n"
        "3. Натисни «Зберегти в історію» у застосунку\n\n"
        "Переглянути збережені розрахунки можна кнопкою «📊 Моя історія».",
        reply_markup=main_keyboard(),
    )


async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Спрацьовує, коли Mini App викликає tg.sendData(...)."""
    user = update.effective_user
    raw = update.message.web_app_data.data

    try:
        record = json.loads(raw)
    except json.JSONDecodeError:
        await update.message.reply_text("⚠️ Не вдалося зчитати дані з калькулятора.")
        return

    add_record(user.id, record)

    text = (
        "✅ Розрахунок збережено в історію!\n\n"
        f"Закупівля: {record.get('purchasePrice', '—')} грн × {record.get('quantity', '—')} шт\n"
        f"Доставка партії: {record.get('delivery', '—')} грн\n"
        f"Ціна продажу: {record.get('salePrice', '—')} грн/шт\n"
        f"Комісія: {record.get('commission', '—')}%\n\n"
        f"Прибуток за партію: {record.get('totalProfit', '—')} грн\n"
        f"Рентабельність: {record.get('profitability', '—')}%"
    )
    await update.message.reply_text(text, reply_markup=main_keyboard())


async def show_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    records = get_user_history(user_id)

    if not records:
        await update.message.reply_text(
            "У тебе поки немає збережених розрахунків.\n"
            "Відкрий калькулятор і натисни «Зберегти в історію»."
        )
        return

    lines = ["📊 Твоя історія (останні 10 записів):\n"]
    for i, r in enumerate(records[-10:], start=1):
        lines.append(
            f"{i}. {r.get('date', '')}\n"
            f"   Закупівля: {r.get('purchasePrice', '—')} грн × {r.get('quantity', '—')} шт\n"
            f"   Продаж: {r.get('salePrice', '—')} грн/шт, комісія {r.get('commission', '—')}%\n"
            f"   Прибуток за партію: {r.get('totalProfit', '—')} грн "
            f"(рентабельність {r.get('profitability', '—')}%)\n"
        )

    await update.message.reply_text("\n".join(lines))


async def clear_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    clear_user_history(user_id)
    await update.message.reply_text("🗑 Історію очищено.", reply_markup=main_keyboard())


def main():
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))
    app.add_handler(MessageHandler(filters.Text([BTN_HISTORY]), show_history))
    app.add_handler(MessageHandler(filters.Text([BTN_CLEAR]), clear_history))

    print("Бот запущено. Натисніть Ctrl+C для зупинки.")
    app.run_polling()


if __name__ == "__main__":
    main()
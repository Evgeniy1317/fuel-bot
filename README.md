# Заправься умно / Alimentează-te inteligent

Telegram-бот — персональный ассистент экономии на бензине для **Приднестровья** и **Молдовы**.

Пользователь один раз проходит короткий онбординг (язык, регион, авто, расход, км/день, какие цены смотреть). Дальше бот считает экономию, шлёт живые алерты о цене и ведёт топливный бюджет. Подписка — **Telegram Stars**, первая неделя бесплатно.

Это каркас MVP: слои, типы и TODO, без полной бизнес-логики.

## Стек

- Node.js 20+ / TypeScript
- [grammY](https://grammy.dev)
- PostgreSQL + Prisma (подойдёт и Supabase как хостинг БД)
- node-cron — фоновые задачи
- Живые алерты: `channel_post` из Telegram-каналов сразу в момент публикации

## Структура

```
src/
  index.ts                 # точка входа: бот + кроны
  bot.ts                   # сборка grammY
  config/                  # env, константы
  lib/prisma.ts
  types/                   # общие типы
  bot/
    context.ts
    i18n.ts                # ru / ro
    locales/
    keyboards.ts
    handlers/              # команды и колбэки
    middlewares/
  services/                # бизнес-логика (пока скелет)
    savings.ts             # расчёт экономии под авто
    budget.ts              # прогноз трат на месяц
    alerts.ts              # рассылка структурированных алертов
    news-ingest.ts         # новость → цена → алерт сразу
    price-extractor.ts     # достаёт цифры, не копирует пост
    price-provider.ts      # официальные API MD/PMR
    subscription.ts        # триал + Stars
    guarantee.ts           # мягкая «гарантия», без жёсткой правды
    leaderboard.ts
    onboarding.ts
  repositories/            # Prisma
  jobs/                    # API-поллинг, сайты, гарантия, дневной снимок
prisma/
  schema.prisma
  seed.ts                  # регионы ПМР / MD
```

## Как запустить

1. Скопируй `.env.example` в `.env` и заполни `BOT_TOKEN`, `DATABASE_URL`.
2. Подними PostgreSQL (локально или connection string из Supabase).
3. Установи зависимости и примени схему:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Для live-алертов из Telegram-каналов добавь бота **админом** в каналы и перечисли их id в `NEWS_CHANNEL_IDS`.

## Онбординг (короткий)

1. Язык: русский / română  
2. Регион: Приднестровье или Молдова  
3. Марка и модель  
4. Бензин или газ (+ марка бензина, если бензин)  
5. Расход л/100 км  
6. Километры в день  
7. Какие цены смотреть в алертах (мультивыбор)

## Что сознательно не дописано

- Извлечение цены из текста новости (`price-extractor`)
- Официальные API Молдовы и ПМР (`price-provider`)
- Парсинг сайтов (`NEWS_SITE_URLS`)
- Формула «сэкономлено» для рейтинга
- Порог «прогноз сбылся / нет» — пользователю промах не озвучиваем, только открываем месяц

Дальше модули можно разбирать по одному.

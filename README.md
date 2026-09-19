# Заправься умно / Alimentează-te inteligent

Telegram-бот в чате — без сайта и без графиков. Пользователь один раз проходит короткий онбординг, соглашается на **3 дня бесплатно**, дальше бот сам пишет в этот же чат: когда лучше заправиться сегодня, какой бюджет на месяц, сколько выходит под его авто.

Подписка — Telegram Stars.

## Откуда цены

- **Молдова, факт:** официальный JSON [ANRE e-Carburanți](https://api.ecarburanti.anre.md/public/) — без HTML.
- **Молдова, «завтра»:** потолок ANRE с [anre.md](https://anre.md) (редко, раз в 30 мин) + канал `@anre_md`.
- **ПМР, факт:** прайс [Шерифа](https://sheriff.md/activities/nefteprodukty/ceny_po_regionam/) — один GET раз в 30 мин, пауза, ETag, на 403/429 отлеживаем 6 часов.
- **ПМР, «завтра»:** посты `@pridnestrovec` («завтра / подорожает») и мягкий намёк, если Молдова уже объявила рост.

Парсить всё подряд не будем — так проще словить бан по IP.

## Стек

- Node.js 20+ / TypeScript / grammY
- PostgreSQL + Prisma
- node-cron

## Запуск

```bash
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Нужны `BOT_TOKEN`, `ADMIN_TELEGRAM_IDS`, `DATABASE_URL` и `DIRECT_URL` (Supabase).

Админу в личку с ботом приходят уведомления: кто взял триал и кто оплатил Stars. Цифры: команда `/stats`.

## Supabase

1. New project.
2. Settings → Database → Connect.
3. В `.env`:
   - `DATABASE_URL` — Session pooler, порт **6543**, в конец `?pgbouncer=true`
   - `DIRECT_URL` — Direct, порт **5432** (для миграций)
4. Пароль проекта подставь вместо `PASSWORD`.

Потом:

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## Онбординг

Язык → ПМР или Молдова → авто → бензин/газ → расход → км/день → какие цены смотреть → **согласие на 3 дня**.

Потом бот молчит, пока нечего сказать, и пишет в чат, когда есть смысл заправиться сегодня.

## Хостинг (не Vercel)

Бот — постоянный процесс: опрос Telegram + кроны. **Vercel / Netlify не подходят** (серверлесс гаснет через секунды).

Нужен сервис с всегда включённым Node: **Railway** или Render. База остаётся на Supabase.

### Railway

1. Останови локальный `npm run dev` (два процесса с одним токеном конфликтуют).
2. Запушь репозиторий на GitHub.
3. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
4. Variables — те же, что в `.env` (не загружай сам файл `.env`):
   - `BOT_TOKEN`
   - `ADMIN_TELEGRAM_IDS`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `TRIAL_DAYS=3`
   - `SUBSCRIPTION_STARS=100`
   - `SUBSCRIPTION_TITLE`
   - `SUBSCRIPTION_PAYLOAD`
   - `TZ=Europe/Chisinau`
   - `TELEGRAM_PREVIEW_CHANNELS=pridnestrovec,anre_md`
   - `NODE_ENV=production`
5. Deploy. В логах должно быть `fuel-bot started`.
6. Проверка: `/start` в Telegram, когда компьютер выключен.

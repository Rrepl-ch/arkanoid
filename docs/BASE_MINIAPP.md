# Base Mini App — Чеклист публикации

По [Migrate an Existing App](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps).

## Уже сделано

| Шаг | Статус |
|-----|--------|
| **MiniApp SDK** | Установлен `@farcaster/miniapp-sdk` |
| **Показ приложения** | В `App.tsx` в `useEffect` вызывается `sdk.actions.ready()` |
| **Манифест** | Файл `public/.well-known/farcaster.json` заполнен под Arkanoid (интерфейс на английском) |
| **Embed-мета** | В `index.html` есть `<meta name="fc:miniapp" ...>` с кнопкой Play, именем, url и splash |

## Что нужно сделать

### 1. Подставить свои URL

Везде, где указано `https://your-app.com`, заменить на реальный URL приложения (например `https://arkanoid.vercel.app`):

- **Манифест:** `public/.well-known/farcaster.json` — поля `homeUrl`, `iconUrl`, `splashImageUrl`, `webhookUrl`, `screenshotUrls`, `heroImageUrl`, `ogImageUrl`
- **index.html:** в мета `fc:miniapp` — поле `url`, а для `imageUrl` и `splashImageUrl` использовать **абсолютные** URL (например `https://your-app.com/embed.png`)

### 2. Добавить реальные ресурсы

- **icon.png** — иконка приложения (манифест и мета)
- **splash.png** — заставка при запуске
- **embed.png** — картинка для превью в эмбеде (мета)
- **og.png** — Open Graph / герой-картинка
- **s1.png, s2.png, s3.png** — скриншоты для карточки в сторе

Класть в `public/`, чтобы раздавались по адресам вида `https://ваш-домен.com/icon.png` и т.д.

### 3. Account association (нужно для публикации)

1. Задеплоить приложение так, чтобы по адресу `https://ваш-домен.com/.well-known/farcaster.json` отдавался актуальный манифест.
2. Открыть [Base Build → Account association](https://www.base.dev/preview?tab=account).
3. Ввести **App URL** (ваш домен), нажать Submit, затем **Verify**.
4. Скопировать сгенерированные `header`, `payload` и `signature` в `public/.well-known/farcaster.json` в блок `accountAssociation`.

### 4. По желанию: webhook

Если бэкенда нет, можно не использовать `webhookUrl` или оставить заглушку; при необходимости указать рабочий URL или простой «пинг»-эндпоинт.

### 5. Превью и публикация

1. **Превью:** [Base Build Preview](https://www.base.dev/preview) — вставить URL приложения, проверить эмбед, запуск и вкладку Metadata.
2. **Публикация:** в приложении Base создать пост с URL приложения, чтобы отправить мини-приложение на модерацию.

---

## Ончейн-активность (добавить позже)

Планируется добавить **ончейн-активность** (взаимодействие с Base). Возможные варианты:

- **Лидерборд в ончейне** — сохранять рекорды или «лучший уровень» в транзакции или через небольшой контракт на Base.
- **Sign-in / кошелёк** — через Mini App SDK (например `SignIn` или wallet provider) подключать кошелёк пользователя; дальше, например, минт NFT или запись счёта в ончейн.
- **Вебхук + бэкенд** — по окончании игры вызывать ваш бэкенд; бэкенд отправляет транзакцию на Base (запись в контракт или через API Base).

Когда определитесь с форматом (например «сохранять счёт на Base», «подключение кошелька», «минт NFT за победу»), можно будет описать шаги и правки в коде в этом документе.

# Base Mini App — Чеклист публикации

По [Migrate an Existing App](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps).

## Уже сделано

| Шаг | Статус |
|-----|--------|
| **MiniApp SDK** | Установлен `@farcaster/miniapp-sdk` |
| **Показ приложения** | В `MiniAppProvider` вызывается `sdk.actions.ready()` при запуске в Base |
| **Манифест** | Роут `app/.well-known/farcaster.json/route.ts` — URL берётся из `NEXT_PUBLIC_URL` или из запроса |
| **Embed-мета** | В `app/layout.tsx` мета `fc:miniapp` с URL из `NEXT_PUBLIC_URL` |
| **Один деплой** | На Vercel задай `NEXT_PUBLIC_URL=https://твой-домен.vercel.app` — манифест и мета подставят его автоматически |

## Подключение кошелька — что нужно для работы

Кошелёк в приложении работает через **провайдер хоста**: [Mini App SDK](https://miniapps.farcaster.xyz/docs/guides/wallets) вызывает `sdk.wallet.getEthereumProvider()`, и провайдер даёт сам клиент (Base app или поддерживаемый Farcaster-клиент).

### Что обязательно

1. **Приложение открыто как Mini App**  
   Пользователь должен зайти в приложение **из приложения Base** (или другого клиента с поддержкой Mini Apps), а не просто открыть ссылку в обычном браузере. В браузере по прямой ссылке провайдер кошелька не внедряется, и подключение не сработает.

2. **Никаких своих API ключей не нужно**  
   Провайдер, `eth_requestAccounts` и подпись запросов обеспечивает хост. В коде не нужны ключи или секреты для самого факта подключения кошелька.

3. **У пользователя есть кошелёк в клиенте**  
   В приложении Base (или в клиенте) у пользователя должен быть доступен кошелёк (встроенный Base/Coinbase или подключённый внешний). Если кошелька нет, хост может предложить его создать/подключить.

### Как проверить

- Задеплой приложение и открой его **через Base app** (пост, каталог мини-приложений или [Base Build Preview](https://www.base.dev/preview) с запуском в контексте Base).
- На экране «Connect wallet» нажми Coinbase (или WalletConnect, если хост это поддерживает); должен запроситься доступ к аккаунту и после подтверждения появиться адрес.

### Если подключение не работает

- Убедись, что открываешь приложение именно как Mini App (из Base app / Preview), а не в отдельной вкладке браузера.
- В коде при необходимости можно проверять поддержку: `sdk.getCapabilities()` и наличие `wallet.getEthereumProvider` перед вызовом подключения.

## Выгрузка на Base (кратко)

1. **Задеплой** приложение на Vercel и запомни URL (например `https://arkanoid.vercel.app`).
2. **В настройках Vercel → Environment Variables** задай:
   - `NEXT_PUBLIC_URL` = твой URL (например `https://твой-проект.vercel.app`)
   - для Account association потом добавь: `FARCASTER_ACCOUNT_HEADER`, `FARCASTER_ACCOUNT_PAYLOAD`, `FARCASTER_ACCOUNT_SIGNATURE` (см. шаг 5).
3. Пересобери/задеплой (автодеплой из Git подхватит переменные).
4. **Добавь картинки** в `public/`: `icon.png`, `splash.png`, `embed.png`, `og.png`, `s1.png`, `s2.png`, `s3.png` (см. ниже).
5. **Account association:** [Base Build → Account association](https://www.base.dev/preview?tab=account) — введи App URL, Submit → Verify, скопируй `header`, `payload`, `signature`. В Vercel добавь переменные `FARCASTER_ACCOUNT_HEADER`, `FARCASTER_ACCOUNT_PAYLOAD`, `FARCASTER_ACCOUNT_SIGNATURE` (или вставь в `public/.well-known/farcaster.json` и оставь роут читать оттуда — сейчас роут берёт их из env).
6. **Превью:** [Base Build Preview](https://www.base.dev/preview) — проверь эмбед и запуск.
7. **Публикация:** в приложении Base создай пост с URL приложения.

## Что нужно сделать вручную

### 1. Добавить реальные ресурсы

- **icon.png** — иконка приложения (манифест и мета)
- **splash.png** — заставка при запуске
- **embed.png** — картинка для превью в эмбеде (мета)
- **og.png** — Open Graph / герой-картинка
- **s1.png, s2.png, s3.png** — скриншоты для карточки в сторе

Класть в `public/`, чтобы по адресам вида `https://ваш-домен.com/icon.png` отдавались нужные файлы.

### 2. Account association (нужно для публикации)

1. Убедиться, что по адресу `https://ваш-домен.com/.well-known/farcaster.json` отдаётся манифест (роут подставляет URL из `NEXT_PUBLIC_URL`).
2. Открыть [Base Build → Account association](https://www.base.dev/preview?tab=account).
3. Ввести **App URL** (ваш домен), нажать Submit, затем **Verify**.
4. Скопировать сгенерированные `header`, `payload` и `signature` в переменные Vercel: `FARCASTER_ACCOUNT_HEADER`, `FARCASTER_ACCOUNT_PAYLOAD`, `FARCASTER_ACCOUNT_SIGNATURE` — роут манифеста подставит их в ответ. Пересобрать/задеплоить.

### 3. По желанию: webhook

Если бэкенда нет, можно не использовать `webhookUrl` или оставить заглушку; при необходимости указать рабочий URL или простой «пинг»-эндпоинт.

### 4. Превью и публикация

1. **Превью:** [Base Build Preview](https://www.base.dev/preview) — вставить URL приложения, проверить эмбед, запуск и вкладку Metadata.
2. **Публикация:** в приложении Base создать пост с URL приложения, чтобы отправить мини-приложение на модерацию.

---

## Ончейн-активность (добавить позже)

Планируется добавить **ончейн-активность** (взаимодействие с Base). Возможные варианты:

- **Лидерборд в ончейне** — сохранять рекорды или «лучший уровень» в транзакции или через небольшой контракт на Base.
- **Sign-in / кошелёк** — через Mini App SDK (например `SignIn` или wallet provider) подключать кошелёк пользователя; дальше, например, минт NFT или запись счёта в ончейн.
- **Вебхук + бэкенд** — по окончании игры вызывать ваш бэкенд; бэкенд отправляет транзакцию на Base (запись в контракт или через API Base).

Когда определитесь с форматом (например «сохранять счёт на Base», «подключение кошелька», «минт NFT за победу»), можно будет описать шаги и правки в коде в этом документе.

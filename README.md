# Arkanoid — Base Mini App

Ретро-игра «Арканоид» (шарик, плитка, кирпичи, бусты) для [Base Mini App](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps).

## Языки в проекте

- **Интерфейс сайта** (меню, кнопки, подсказки, надписи в игре) — **только на английском**.
- **Инструкции, документация, комментарии в коде** — **на русском**.

## Запуск

```bash
cd retro-mini-app
npm install
npm run dev
```

Сборка: `npm run build`. Превью продакшена: `npm run preview`.

## Публикация в Base Mini App

Подробный чеклист: [docs/BASE_MINIAPP.md](docs/BASE_MINIAPP.md).

Кратко:

1. Разместить приложение на своём домене (например Vercel/Netlify).
2. Обновить в проекте:
   - `index.html` — meta `fc:miniapp` с вашим `url`, абсолютными `imageUrl` и `splashImageUrl`.
   - `public/.well-known/farcaster.json` — поля `homeUrl`, `iconUrl`, `splashImageUrl`, `webhookUrl`, `screenshotUrls`, `heroImageUrl`, `ogImageUrl` на ваш домен.
3. В [Base Build → Account association](https://www.base.dev/preview?tab=account) получить `header`, `payload`, `signature` и вставить их в `public/.well-known/farcaster.json`.
4. Проверить в [Preview](https://www.base.dev/preview), затем опубликовать, создав пост в Base app с URL приложения.

## Стек

- React 18, TypeScript, Vite
- [@farcaster/miniapp-sdk](https://www.npmjs.com/package/@farcaster/miniapp-sdk) — вызов `sdk.actions.ready()` при загрузке

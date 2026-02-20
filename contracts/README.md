# Контракты Arkanoid Mini App

Три смарт-контракта для Base: шары, игры, чекин.

**Деплой через Remix (в браузере):** см. [REMIX_DEPLOY.md](REMIX_DEPLOY.md).

| Контракт          | Назначение                                      |
|-------------------|--------------------------------------------------|
| **ArkanoidBalls** | Минт шаров: 0–8 бесплатно, 9–11 за ETH          |
| **ArkanoidGames** | Минт доступа к Minesweeper и Space Shooter (бесплатно) |
| **ArkanoidCheckIn** | Чекин раз в день (без оплаты), бонус к очкам за каждые 5 дней |

---

## Что нужно для деплоя

1. **Foundry** (forge, cast):
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```
2. **Приватный ключ** кошелька с ETH на Base (для газа и, при желании, верификации).
3. **Сеть**: Base Mainnet или Base Sepolia (тестнет).

---

## Деплой (Foundry)

Из **корня репозитория** (где лежит `foundry.toml`):

### 1. Сборка

```bash
forge build
```

### 2. Деплой каждого контракта

Подставь свой приватный ключ в переменную (или используй `.env` и `source .env`):

**Base Mainnet:**

```bash
# Переменная с приватным ключом (без 0x)
export PRIVATE_KEY=твой_приватный_ключ_64_символа

# ArkanoidBalls (шары: бесплатные + Emerald/Ruby/Gold за ETH). Замени 0xТВОЙ_АДРЕС на кошелёк для приёма платежей.
forge create --rpc-url https://mainnet.base.org --private-key $PRIVATE_KEY contracts/ArkanoidBalls.sol:ArkanoidBalls --constructor-args 0xТВОЙ_АДРЕС

# ArkanoidGames (Minesweeper, Space Shooter — бесплатный минт)
forge create --rpc-url https://mainnet.base.org --private-key $PRIVATE_KEY contracts/ArkanoidGames.sol:ArkanoidGames

# ArkanoidCheckIn (чекин раз в день, без оплаты)
forge create --rpc-url https://mainnet.base.org --private-key $PRIVATE_KEY contracts/ArkanoidCheckIn.sol:ArkanoidCheckIn
```

**Base Sepolia (тестнет):**

```bash
export PRIVATE_KEY=...

forge create --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY contracts/ArkanoidBalls.sol:ArkanoidBalls --constructor-args 0xТВОЙ_АДРЕС
forge create --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY contracts/ArkanoidGames.sol:ArkanoidGames
forge create --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY contracts/ArkanoidCheckIn.sol:ArkanoidCheckIn
```

После каждой команды в выводе будет строка вида:
`Deployed to: 0x...` — это адрес контракта.

### 3. (Опционально) Верификация на Basescan

Чтобы контракт был верифицирован и читаем на basescan.org:

```bash
# Mainnet (нужен API key с basescan.org для --verify)
forge create --rpc-url https://mainnet.base.org --private-key $PRIVATE_KEY \
  contracts/ArkanoidBalls.sol:ArkanoidBalls --constructor-args 0xТВОЙ_АДРЕС --verify --etherscan-api-key $BASESCAN_API_KEY
```

Аналогично для ArkanoidGames и ArkanoidCheckIn. Для Base Sepolia используй `--chain-id 84532` и API key для Base Sepolia в блокэксплорере.

---

## Куда вставить адреса в приложении

В **корне проекта** создай или отредактируй файл **`.env`** (он не коммитится в git). Подставь полученные адреса:

```env
# Адреса контрактов (после деплоя)
VITE_ARKANOID_BALLS_ADDRESS=0x...   # адрес из forge create ArkanoidBalls
VITE_ARKANOID_GAMES_ADDRESS=0x...   # адрес из forge create ArkanoidGames
VITE_ARKANOID_CHECKIN_ADDRESS=0x...  # адрес из forge create ArkanoidCheckIn
```

Пример (подставь свои):

```env
VITE_ARKANOID_BALLS_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
VITE_ARKANOID_GAMES_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12
VITE_ARKANOID_CHECKIN_ADDRESS=0xfedcba0987654321fedcba0987654321fedcba09
```

После сохранения `.env` пересобери приложение:

```bash
npm run build
```

При запуске через `npm run dev` переменные из `.env` подхватываются автоматически.

---

## Где в коде используются адреса

| Переменная окружения           | Файл в приложении              | Для чего |
|-------------------------------|--------------------------------|----------|
| `VITE_ARKANOID_BALLS_ADDRESS` | `src/contracts/arkanoidBalls.ts` | Минт шаров (BallSelect) |
| `VITE_ARKANOID_GAMES_ADDRESS` | `src/contracts/arkanoidGames.ts` | Минт игр Minesweeper / Space Shooter (GameSelect) |
| `VITE_ARKANOID_CHECKIN_ADDRESS` | `src/contracts/arkanoidCheckIn.ts` | Чекин раз в день (Menu) |

Если переменная не задана или пустая, соответствующий контракт в UI не вызывается (шары/игры — локальный минт или сообщение «contract not configured», чекин — только локальный счётчик).

---

## Кратко по контрактам

### ArkanoidBalls
- Конструктор принимает **`_treasury`** (address) — адрес, на который приходят все платежи за платные шары. Укажи его при деплое в Remix или в `forge create` (см. ниже).
- `mint(uint8 ballType)` — ballType 0–8 бесплатно, 9–11 с оплатой (0.00025 / 0.0005 / 0.001 ETH). Один минт каждого типа на кошелёк.
- ETH за платные шары отправляется на **treasury** (адрес, указанный при деплое).

### ArkanoidGames
- `mintMinesweeper()`, `mintSpaceShooter()` — бесплатно, по одному разу на кошелёк.

### ArkanoidCheckIn
- `checkIn()` — раз в сутки (UTC), без оплаты. За каждые 5 дней чекина — бонус к очкам +0.2 (5→1.2x, 10→1.4x и т.д.).

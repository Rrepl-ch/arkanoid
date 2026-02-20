# Деплой контрактов через Remix

Пошаговая инструкция: деплой **ArkanoidBalls**, **ArkanoidGames** и **ArkanoidCheckIn** в сеть Base через [Remix IDE](https://remix.ethereum.org).

---

## 1. Открой Remix

Перейди на **https://remix.ethereum.org**.

---

## 2. Добавь контракты в проект

В левой панели (File Explorer) открой папку **`contracts`** (или создай её).

Создай три файла и вставь в них код из репозитория:

| Файл в Remix | Копировать из проекта |
|--------------|------------------------|
| `contracts/ArkanoidBalls.sol`   | `contracts/ArkanoidBalls.sol`   |
| `contracts/ArkanoidGames.sol`   | `contracts/ArkanoidGames.sol`   |
| `contracts/ArkanoidCheckIn.sol` | `contracts/ArkanoidCheckIn.sol` |

Как добавить файл в Remix:
- ПКМ по папке **contracts** → **New File** → введи имя, например `ArkanoidBalls.sol`.
- Открой файл и вставь весь код из соответствующего `.sol` файла в твоём проекте.

---

## 3. Компиляция

1. Открой вкладку **Solidity Compiler** (иконка с буквой **S** слева).
2. Выбери **Compiler** версию **0.8.19** (или совместимую: 0.8.19–0.8.28).
3. Нажми **Compile ArkanoidBalls.sol** (или выбери нужный контракт в выпадающем списке и нажми **Compile**).
4. Повтори компиляцию для **ArkanoidGames.sol** и **ArkanoidCheckIn.sol**.

Убедись, что внизу нет красных ошибок.

---

## 4. Подключение к Base

### Вариант A: MetaMask + Base

1. Установи [MetaMask](https://metamask.io), если ещё нет.
2. Добавь сеть **Base** в MetaMask:
   - Сеть → Добавить сеть → Добавить сеть вручную.
   - **Base Mainnet:**  
     - Network name: `Base Mainnet`  
     - RPC URL: `https://mainnet.base.org`  
     - Chain ID: `8453`  
     - Currency: `ETH`  
     - Block explorer: `https://basescan.org`
   - Либо **Base Sepolia** (тестнет):  
     - RPC URL: `https://sepolia.base.org`  
     - Chain ID: `84532`  
     - Explorer: `https://sepolia.basescan.org`
3. Пополни кошелёк: для mainnet — ETH на Base; для Sepolia — бесплатный ETH с [фаунетов Base](https://www.coinbase.com/faucets/base-sepolia-faucet).

### В Remix

1. Открой вкладку **Deploy & run transactions** (иконка с паровозиком/эфиром слева).
2. В блоке **Environment** выбери **Injected Provider - MetaMask**.
3. Подключи кошелёк, когда MetaMask запросит.
4. В выпадающем списке сети убедись, что выбрана **Base** (Chain ID 8453 или 84532 для Sepolia).

---

## 5. Деплой каждого контракта

У всех трёх контрактов **нет аргументов конструктора** — в Remix ничего вводить не нужно.

### ArkanoidBalls

1. В выпадающем списке **Contract** выбери **ArkanoidBalls**.
2. Нажми **Deploy**.
3. Подтверди транзакцию в MetaMask.
4. После успешного деплоя в Remix под кнопкой **Deploy** появится контракт; скопируй его **адрес** (под надписью контракта, иконка копирования).

Сохрани адрес — понадобится для `.env` как `VITE_ARKANOID_BALLS_ADDRESS`.

### ArkanoidGames

1. Выбери контракт **ArkanoidGames**.
2. Нажми **Deploy**, подтверди в MetaMask.
3. Скопируй адрес задеплоенного контракта → `VITE_ARKANOID_GAMES_ADDRESS`.

### ArkanoidCheckIn

1. Выбери контракт **ArkanoidCheckIn**.
2. Нажми **Deploy**, подтверди в MetaMask.
3. Скопируй адрес → `VITE_ARKANOID_CHECKIN_ADDRESS`.

---

## 6. Вставь адреса в приложение

В **корне проекта** открой или создай файл **`.env`** и добавь (подставь свои адреса из Remix):

```env
VITE_ARKANOID_BALLS_ADDRESS=0x...
VITE_ARKANOID_GAMES_ADDRESS=0x...
VITE_ARKANOID_CHECKIN_ADDRESS=0x...
```

Пример:

```env
VITE_ARKANOID_BALLS_ADDRESS=0x1234567890AbCdEf1234567890aBcDeF12345678
VITE_ARKANOID_GAMES_ADDRESS=0xAbCdEf1234567890AbCdEf1234567890AbCdEf12
VITE_ARKANOID_CHECKIN_ADDRESS=0xFedCba0987654321FeDcBa0987654321FeDcBa09
```

Сохрани файл и пересобери приложение:

```bash
npm run build
```

Готово: контракты задеплоены через Remix, адреса прописаны в `.env`.

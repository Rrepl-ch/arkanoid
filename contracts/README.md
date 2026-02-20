# Arkanoid Check-in contract

Смарт-контракт для чекинов: раз в день игрок может вызвать `checkIn()`. За каждые 5 дней чекина начисляется бонус к очкам +0.2 (суммируется).

## Логика

- **checkIn()** — можно вызвать не чаще раза в сутки (по UTC). Увеличивает `totalCheckInDays` на 1.
- **Бонус к очкам:** за каждые 5 дней чекина игрок получает +0.2 к множителю:
  - 5 дней → множитель 1.2 (очки × 1.2)
  - 10 дней → 1.4
  - 15 дней → 1.6 и т.д.

## View-функции

- `getScoreBonusBp(user)` — бонус в basis points (20 = 0.2). Итог: `displayScore = rawScore * (100 + getScoreBonusBp(user)) / 100`
- `getBonusUnits(user)` — количество «блоков по 5 дней» (каждый даёт +0.2)
- `hasCheckedInToday(user)` — уже чекинился сегодня

## Деплой (Base)

Компиляция (Foundry или Hardhat):

```bash
# Foundry
forge build

# Деплой на Base Mainnet
forge create --rpc-url https://mainnet.base.org --private-key $PRIVATE_KEY contracts/ArkanoidCheckIn.sol:ArkanoidCheckIn --verify
```

После деплоя подставить адрес контракта в приложение и вызвать `checkIn()` через кошелёк (например Base Wallet / Mini App SDK).

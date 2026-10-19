[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt — совместимая с Ethereum сеть с доказательством доли для сообщества LazyingArt. Нативная монета LazyArtCoin (LAC) используется для комиссий и делегирования валидаторам. Fun/D предоставляет творческие гранты с полным предварительным финансированием и выплатами по времени.

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## Использование LazyArt

Создайте кошелёк в MetaMask и сохраните резервную копию. Подключившись к LazyArt, можно отправлять LAC, делегировать, получать вознаграждения из комиссий и развёртывать Solidity-контракты. Кран выдаёт 100 LAC один раз на адрес из фонда 100 000 LAC. Активных валидаторов не более 32; вывод делегации занимает 24 часа. Вознаграждения зависят от сетевых комиссий и комиссии валидатора.

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## Сборка и тесты

Нужны Node.js 20.19+ или 22.12+, npm и Python 3. Команды компилируют контракты, выполняют изолированные тесты и собирают портал, без развёртывания и расходов. Для подключения к действующей сети используйте руководство и проверьте опубликованный genesis. Сценарии начальной настройки создают новую сеть и не должны заменять каталог существующего узла.

```sh
npm ci
npm test
npm run build:web
```

## Реализация и состояние

Консенсус основан на неизменённом Cosmos EVM v0.7.3, стейкинге Cosmos SDK и CometBFT. В репозитории находятся сетевые инструменты, портал, нативный кран, Fun/D и кандидат Ethereum v2: ограниченная эмиссия, управление с задержкой, бюджеты казначейства, гранты, подписанные заявки и эскроу заданий роботов и агентов.

Нативный LAC и LAC в Ethereum — разные активы. Ethereum v2 и миграционные эскроу с кворумом подписей представлены исходным кодом и ещё не развёрнуты в Ethereum. Миграция выдаёт заранее внесённые резервы, не копируя балансы. Тесты проверяют учёт, защиту от повторов и лимиты переводов. Активация требует двух развёртываний и определённого бюджета. Пилотная сеть не обещает фиксированной доходности. Существующие балансы Ethereum сохраняются.

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## Поддержка проекта

Взносы поддерживают разработку. Они не покупают токены и не обещают вознаграждений.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Цитирование

При использовании программы в исследованиях цитируйте этот репозиторий. [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```

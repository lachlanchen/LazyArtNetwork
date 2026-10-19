[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt 是面向 LazyingArt 社群、相容以太坊的權益證明網路。原生 LazyArtCoin（LAC）用於支付網路費用和委託驗證者。Fun/D 為創作者提供全額預存、按時間釋放的資助。

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## 使用 LazyArt

在 MetaMask 建立並備份錢包，連接 LazyArt 後即可傳送 LAC、委託驗證者、領取手續費獎勵或部署 Solidity 合約。網站提供有限額度的水龍頭：總計 100,000 LAC，每個地址限領 100 LAC。活躍驗證者最多 32 個，解除質押需要 24 小時。獎勵取決於網路手續費和驗證者佣金。

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## 建置與測試

需要 Node.js 20.19+ 或 22.12+、npm 和 Python 3。以下命令編譯合約、執行隔離測試並建置網站，不會部署合約或花費資金。加入現有網路時，請依照節點指南操作並核對公開的創世檔案。引導腳本會建立全新網路，不能用來覆寫現有節點目錄。

```sh
npm ci
npm test
npm run build:web
```

## 實作與狀態

共識採用未修改的 Cosmos EVM v0.7.3、Cosmos SDK 質押模組和 CometBFT。本倉庫包含網路工具、錢包網站、原生水龍頭及 Fun/D 合約，以及以太坊 v2 候選程式碼：受限增發、延時治理、金庫預算、資助、簽名領取及機器人與智慧代理任務託管。

原生 LAC 與以太坊 LAC 是不同資產。以太坊 v2 與多方簽名遷移託管目前是原始碼候選，尚未部署至以太坊。遷移透過釋放預存儲備完成，不會憑空複製餘額。現有測試涵蓋合約記帳、重放防護及轉帳限額；上線需要成對部署及明確的額度分配。網路處於社群試運行階段，不承諾固定收益。既有以太坊餘額保持不變。

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## 支持專案

捐助用於持續開發，不代表購買代幣，也不承諾獎勵。

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## 引用

如果在研究中使用本軟體，請引用此倉庫。 [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```

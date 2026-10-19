[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt 是面向 LazyingArt 社区、兼容以太坊的权益证明网络。原生 LazyArtCoin（LAC）用于支付网络费用和委托验证者。Fun/D 为创作者提供全额预存、按时间释放的资助。

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## 使用 LazyArt

在 MetaMask 创建并备份钱包，连接 LazyArt 后即可发送 LAC、委托验证者、领取手续费奖励或部署 Solidity 合约。网站提供有限额度的水龙头：总计 100,000 LAC，每个地址限领 100 LAC。活跃验证者最多 32 个，解除质押需要 24 小时。奖励取决于网络手续费和验证者佣金。

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## 构建与测试

需要 Node.js 20.19+ 或 22.12+、npm 和 Python 3。以下命令编译合约、运行隔离测试并构建网站，不会部署合约或花费资金。加入现有网络时，请按照节点指南操作并核对公开的创世文件。引导脚本会创建全新网络，不能用来覆盖现有节点目录。

```sh
npm ci
npm test
npm run build:web
```

## 实现与状态

共识采用未修改的 Cosmos EVM v0.7.3、Cosmos SDK 质押模块和 CometBFT。本仓库包含网络工具、钱包网站、原生水龙头和 Fun/D 合约，以及以太坊 v2 候选代码：受限增发、延时治理、金库预算、资助、签名领取及机器人和智能体任务托管。

原生 LAC 与以太坊 LAC 是不同资产。以太坊 v2 和多方签名迁移托管目前是源代码候选，尚未部署到以太坊。迁移通过释放预存储备完成，不会凭空复制余额。现有测试覆盖合约记账、重放防护和转账限额；上线需要成对部署及明确的额度分配。网络处于社区试运行阶段，不承诺固定收益。已有以太坊余额保持不变。

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## 支持项目

捐助用于持续开发，不代表购买代币，也不承诺奖励。

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## 引用

如果在研究中使用本软件，请引用此仓库。 [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```

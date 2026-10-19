[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt は LazyingArt コミュニティのための、Ethereum と互換性のあるプルーフ・オブ・ステークネットワークです。ネイティブ通貨 LazyArtCoin（LAC）は手数料の支払いとバリデーターへの委任に使えます。Fun/D は全額を預託し、時間に応じて支給するクリエイター助成です。

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## LazyArt を使う

MetaMask でウォレットを作成してバックアップし、LazyArt に接続すると、送金、委任、手数料報酬の受け取り、Solidity コントラクトのデプロイができます。フォーセットは総額 100,000 LAC、各アドレス一度限り 100 LAC です。稼働バリデーターは最大 32、解除には 24 時間かかります。報酬は手数料とバリデーターのコミッションに依存します。

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## ビルドとテスト

Node.js 20.19+ または 22.12+、npm、Python 3 が必要です。以下はコンパイル、隔離テスト、サイトのビルドのみで、デプロイや資金の使用は行いません。既存ネットワークへの参加はノードガイドに従い、公開ジェネシスを確認してください。初期構築スクリプトは別の新規ネットワークを作るもので、既存ノードの上書きには使えません。

```sh
npm ci
npm test
npm run build:web
```

## 実装と現在の状態

コンセンサスは未改変の Cosmos EVM v0.7.3、Cosmos SDK ステーキング、CometBFT を使用します。ネットワークツール、ウォレットサイト、ネイティブフォーセット、Fun/D、Ethereum v2 候補を収録しています。v2 は発行上限、遅延ガバナンス、金庫予算、助成、署名付き請求、ロボット・エージェントのタスクエスクローを備えます。

ネイティブ LAC と Ethereum LAC は別資産です。Ethereum v2 と定足数署名による移行エスクローはソース候補で、Ethereum には未デプロイです。移行は預託準備金を払い出し、残高を複製しません。テストは会計、リプレイ防止、送金上限を対象とします。稼働には両側のデプロイと配分の確定が必要です。コミュニティの試行ネットワークであり、固定利回りは約束しません。既存の Ethereum 残高は変わりません。

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## 開発を支援

支援は継続開発に充てられます。トークンの購入や報酬の約束ではありません。

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## 引用

研究で本ソフトウェアを利用する場合は、このリポジトリを引用してください。 [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```

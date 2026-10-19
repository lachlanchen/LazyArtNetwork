[English](README.md) · [العربية](i18n/README.ar.md) · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [Tiếng Việt](i18n/README.vi.md) · [中文 (简体)](i18n/README.zh-Hans.md) · [中文（繁體）](i18n/README.zh-Hant.md) · [Deutsch](i18n/README.de.md) · [Русский](i18n/README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt is an Ethereum-compatible proof-of-stake network for the LazyingArt community. Its native LazyArtCoin (LAC) pays network fees and supports validator delegation. Fun/D provides fully funded, time-based grants for creators.

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](docs/OPERATIONS.md)

## Use LazyArt

Create and back up a wallet in MetaMask, connect it to LazyArt, then send LAC, delegate to a validator, withdraw fee rewards or deploy a Solidity contract. The portal includes a finite faucet: 100 LAC per address from a 100,000-LAC allocation. The active validator set has up to 32 members; unstaking takes 24 hours. Rewards depend on network fees and validator commission.

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## Build and test

Node.js 20.19+ or 22.12+, npm and Python 3 are required. These commands compile contracts, run isolated tests and build the portal; they do not deploy or spend funds. To join the existing network, follow the node guide and verify the published genesis. Bootstrap scripts create a separate fresh network and must not replace an existing node home.

```sh
npm ci
npm test
npm run build:web
```

## Implementation and status

Consensus uses unmodified Cosmos EVM v0.7.3 with Cosmos SDK staking and CometBFT. This repository contains network tooling, the wallet portal, native faucet and Fun/D contracts, and the Ethereum v2 candidate: capped issuance, delayed governance, treasury budgets, grants, signed claims and robot/agent task escrow.

Native LAC and Ethereum LAC are distinct assets. The Ethereum v2 and quorum-attested migration escrows are source candidates, not deployed Ethereum contracts. Migration releases prefunded reserves rather than minting balances. Current tests cover contract accounting, replay protection and transfer limits; live activation requires paired deployments and a defined allocation. The network is a community pilot; no fixed return is promised. Existing Ethereum balances remain unchanged.

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](pos/) · [Ethereum v2](contracts-v2/) · [LICENSE](LICENSE) · [NOTICE](NOTICE)

## Support

Contributions support continued development. They do not purchase tokens or promise rewards.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Citation

If you use this software in research, cite this repository. [CITATION.cff](CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```

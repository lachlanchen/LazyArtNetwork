[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt는 LazyingArt 커뮤니티를 위한 이더리움 호환 지분증명 네트워크입니다. 네이티브 LazyArtCoin(LAC)으로 네트워크 수수료를 내고 검증자에게 위임할 수 있습니다. Fun/D는 자금을 전액 예치한 뒤 시간에 따라 창작자에게 지급하는 지원 계약입니다.

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## LazyArt 사용

MetaMask에서 지갑을 만들고 백업한 뒤 LazyArt에 연결하세요. LAC 전송, 검증자 위임, 수수료 보상 인출, Solidity 계약 배포가 가능합니다. 수도꼭지는 총 100,000 LAC 중 주소당 한 번 100 LAC를 지급합니다. 활성 검증자는 최대 32명이며 위임 해제에는 24시간이 걸립니다. 보상은 네트워크 수수료와 검증자 커미션에 따라 달라집니다.

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## 빌드와 테스트

Node.js 20.19+ 또는 22.12+, npm, Python 3가 필요합니다. 아래 명령은 계약 컴파일, 격리된 테스트, 사이트 빌드만 수행하며 배포하거나 자금을 사용하지 않습니다. 기존 네트워크에 참여하려면 노드 안내에 따라 공개 제네시스를 확인하세요. 초기화 스크립트는 별도의 새 네트워크를 만들므로 기존 노드 디렉터리를 덮어쓰면 안 됩니다.

```sh
npm ci
npm test
npm run build:web
```

## 구현 및 상태

합의에는 수정하지 않은 Cosmos EVM v0.7.3, Cosmos SDK 스테이킹, CometBFT를 사용합니다. 네트워크 도구, 지갑 사이트, 네이티브 수도꼭지, Fun/D 및 이더리움 v2 후보 코드가 포함됩니다. v2는 발행 상한, 지연 거버넌스, 금고 예산, 지원금, 서명된 청구, 로봇·에이전트 작업 에스크로를 제공합니다.

네이티브 LAC와 이더리움 LAC는 서로 다른 자산입니다. 이더리움 v2와 정족수 서명 기반 이전 에스크로는 소스 후보이며 이더리움에 배포되지 않았습니다. 이전은 미리 예치한 준비금을 지급하며 잔액을 복제하지 않습니다. 테스트는 회계, 재사용 방지, 전송 한도를 검증합니다. 가동에는 양쪽 배포와 배정량 확정이 필요합니다. 커뮤니티 시범 네트워크로 고정 수익을 약속하지 않습니다. 기존 이더리움 잔액은 그대로 유지됩니다.

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## 프로젝트 후원

후원금은 지속적인 개발에 사용됩니다. 토큰 구매나 보상 약속이 아닙니다.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## 인용

연구에서 이 소프트웨어를 사용한다면 이 저장소를 인용해 주세요. [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```

[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt es una red de prueba de participación compatible con Ethereum para la comunidad LazyingArt. Su moneda nativa, LazyArtCoin (LAC), paga las comisiones y permite delegar en validadores. Fun/D ofrece ayudas a creadores con fondos depositados íntegramente y entregados con el tiempo.

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## Usar LazyArt

Crea y respalda una cartera en MetaMask y conéctala a LazyArt para enviar LAC, delegar, retirar recompensas de comisiones o desplegar contratos Solidity. El grifo entrega 100 LAC una vez por dirección, de un fondo de 100.000 LAC. Hay hasta 32 validadores activos; retirar la delegación requiere 24 horas. Las recompensas dependen de las comisiones de red y del validador.

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## Compilar y probar

Se requieren Node.js 20.19+ o 22.12+, npm y Python 3. Estos comandos compilan contratos, ejecutan pruebas aisladas y construyen el portal; no despliegan ni gastan fondos. Para unirte a la red existente, sigue la guía y verifica el génesis publicado. Los scripts iniciales crean otra red nueva y no deben reemplazar el directorio de un nodo existente.

```sh
npm ci
npm test
npm run build:web
```

## Implementación y estado

El consenso utiliza Cosmos EVM v0.7.3 sin modificaciones, staking de Cosmos SDK y CometBFT. El repositorio incluye herramientas, portal, grifo nativo, Fun/D y el candidato Ethereum v2: emisión limitada, gobernanza con demora, presupuestos de tesorería, ayudas, reclamaciones firmadas y depósito en garantía para tareas de robots y agentes.

LAC nativo y LAC en Ethereum son activos distintos. Ethereum v2 y los depósitos de migración con cuórum son candidatos de código fuente, aún no desplegados en Ethereum. La migración libera reservas prefinanciadas, sin duplicar saldos. Las pruebas cubren contabilidad, repetición y límites de transferencia. La activación exige ambos despliegues y una asignación definida. Esta red piloto comunitaria no promete rentabilidad fija. Los saldos actuales de Ethereum no cambian.

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## Apoyar el proyecto

Las contribuciones sostienen el desarrollo. No compran tokens ni prometen recompensas.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Cita

Si utilizas este software en investigación, cita este repositorio. [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```

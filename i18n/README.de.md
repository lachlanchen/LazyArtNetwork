[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt ist ein Ethereum-kompatibles Proof-of-Stake-Netzwerk für die LazyingArt-Community. Die native Währung LazyArtCoin (LAC) bezahlt Gebühren und kann an Validatoren delegiert werden. Fun/D ermöglicht vollständig vorfinanzierte Förderungen, die über einen festgelegten Zeitraum ausgezahlt werden.

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## LazyArt nutzen

Erstelle und sichere eine Wallet in MetaMask. Nach der Verbindung mit LazyArt kannst du LAC senden, delegieren, Gebührenbelohnungen abheben und Solidity-Verträge bereitstellen. Der Faucet verteilt einmalig 100 LAC je Adresse aus einem Budget von 100.000 LAC. Bis zu 32 Validatoren sind aktiv; die Entbindung dauert 24 Stunden. Belohnungen hängen von Netzwerkgebühren und Validatorprovision ab.

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## Bauen und testen

Benötigt werden Node.js 20.19+ oder 22.12+, npm und Python 3. Die Befehle kompilieren Verträge, führen isolierte Tests aus und bauen das Portal; sie stellen nichts bereit und geben kein Geld aus. Für das bestehende Netzwerk folge der Knotenanleitung und prüfe die veröffentlichte Genesis. Bootstrap-Skripte erzeugen ein neues Netzwerk und dürfen kein vorhandenes Knotenverzeichnis ersetzen.

```sh
npm ci
npm test
npm run build:web
```

## Implementierung und Stand

Der Konsens verwendet unverändertes Cosmos EVM v0.7.3, Cosmos-SDK-Staking und CometBFT. Enthalten sind Netzwerkwerkzeuge, Portal, nativer Faucet, Fun/D und der Ethereum-v2-Kandidat: begrenzte Ausgabe, verzögerte Governance, Treasury-Budgets, Förderungen, signierte Ansprüche und Auftrags-Treuhand für Roboter und Agenten.

Nativer LAC und Ethereum-LAC sind getrennte Vermögenswerte. Ethereum v2 und die durch ein Signaturquorum bestätigten Migrationstreuhandverträge sind Quellcode-Kandidaten, noch nicht auf Ethereum bereitgestellt. Migration gibt vorfinanzierte Reserven frei und dupliziert keine Guthaben. Tests decken Buchführung, Wiederholungen und Transfergrenzen ab. Aktivierung erfordert beide Bereitstellungen und eine definierte Zuteilung. Das Community-Pilotnetz verspricht keine feste Rendite. Bestehende Ethereum-Guthaben bleiben unverändert.

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## Projekt unterstützen

Beiträge unterstützen die Weiterentwicklung. Sie kaufen keine Token und begründen keinen Belohnungsanspruch.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Zitieren

Wenn du diese Software in der Forschung verwendest, zitiere das Repository. [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```

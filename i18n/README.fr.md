[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt est un réseau à preuve d’enjeu compatible avec Ethereum, destiné à la communauté LazyingArt. Sa monnaie native, LazyArtCoin (LAC), règle les frais et permet de déléguer aux validateurs. Fun/D finance des créateurs par des subventions entièrement provisionnées, versées dans le temps.

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## Utiliser LazyArt

Créez et sauvegardez un portefeuille dans MetaMask, puis connectez-le à LazyArt pour envoyer des LAC, déléguer, retirer les récompenses de frais ou déployer un contrat Solidity. Le robinet distribue une fois 100 LAC par adresse, sur une enveloppe de 100 000 LAC. Le réseau accepte jusqu’à 32 validateurs actifs ; le déblocage prend 24 heures. Les récompenses dépendent des frais et de la commission du validateur.

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## Compiler et tester

Node.js 20.19+ ou 22.12+, npm et Python 3 sont nécessaires. Ces commandes compilent les contrats, exécutent des tests isolés et construisent le site, sans déploiement ni dépense. Pour rejoindre le réseau existant, suivez le guide et vérifiez le fichier genesis publié. Les scripts d’amorçage créent un réseau neuf et ne doivent pas remplacer un répertoire de nœud existant.

```sh
npm ci
npm test
npm run build:web
```

## Implémentation et état

Le consensus utilise Cosmos EVM v0.7.3 sans modification, le staking Cosmos SDK et CometBFT. Le dépôt contient les outils réseau, le portail, le robinet natif, Fun/D et la version candidate Ethereum v2 : émission plafonnée, gouvernance différée, budgets de trésorerie, subventions, demandes signées et séquestre de tâches pour robots et agents.

Le LAC natif et le LAC Ethereum sont distincts. Ethereum v2 et les séquestres de migration à quorum sont des candidats source, non déployés sur Ethereum. La migration libère des réserves préfinancées sans dupliquer les soldes. Les tests couvrent la comptabilité, les rejeux et les plafonds. L’activation nécessite les deux déploiements et une allocation définie. Ce réseau communautaire pilote ne promet aucun rendement fixe. Les soldes Ethereum existants restent inchangés.

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## Soutenir le projet

Les contributions financent le développement. Elles n’achètent pas de jetons et ne donnent droit à aucune récompense.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Citation

Si vous utilisez ce logiciel en recherche, citez ce dépôt. [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```

# Source provenance

Initial public extraction: LazyingArtCoin commit 2e92b3b, 19 October 2026.
The public checkout contains only network/contract/portal source and public genesis, not the companion account database, signing material, runtime releases or store artifacts. Package imports and operator home paths are portable in this checkout. `server.cjs` is the standalone native portal entry point; legacy QBFT services are not required.

The optional account proxy speaks only to a separately provisioned local profile service. Shared LazyingArt identity is operated independently; wallet creation, transfers, staking and Solidity use do not require a community account. Existing token balances and app credits are not combined by login.

The reference consensus client is fetched from its pinned upstream source. Changes to native chain software follow the chain's coordinated upgrade process, distinct from replacing a website or a contract module.

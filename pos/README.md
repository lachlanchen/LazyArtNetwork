# LazyArt community network

[Open the wallet](https://lac.lazying.art/) · [Run a node](https://lac.lazying.art/pos/node-guide)

LazyArt is an independent Ethereum-compatible proof-of-stake network. Its native
currency, LazyArtCoin (LAC), pays for transfers and contract execution and can be
delegated to validators. Fun/D is a creator-support application on the network.

The wallet supports public-address sign-in, a finite native-LAC faucet, transfers,
delegation, fee-reward withdrawal, unstaking, validator registration, transaction
lookup, and fully prefunded Fun/D grants. Wallet keys and recovery phrases stay
in the user's wallet. Optional LazyingArt profile sign-in uses a separate account adapter; wallet ownership remains verified by a wallet signature.

## Network settings

| Setting | Value |
| --- | --- |
| Network name | LazyArt |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| Public Ethereum JSON-RPC | `https://lac.lazying.art/rpc-pos` |
| Native coin | LazyArtCoin / LAC / 18 decimals |
| Base denomination | `alac` |
| Initial supply | 1,000,000 LAC |
| Inflation | Zero |
| Active validator limit | 32, selected by bonded stake |
| Unbonding period | 24 hours |
| Nominal bootstrap block interval | About 8 seconds |
| Faucet allocation | 100,000 LAC; 100 per address, once |

Validator admission uses the chain's staking module, without an invitation list.
The web form requires at least 10 LAC self-delegation and sets 5% commission,
a 20% commission ceiling and a maximum daily change of one percentage point.
Delegators may participate without running a node. Downtime and double-signing
can reduce stake; pending unbondings remain subject to applicable slashing rules.

Rewards come from transaction fees, after validator commission and the protocol's
2% community allocation. No fixed yield, monetary value or external backing is
promised. A minimum gas-price floor of 1,000,000 alac per gas applies; transaction
costs also depend on execution and the chain's fee market.

Four bootstrap validators each hold 100,000 LAC of bonded stake, including a
396,000-LAC delegation from the freshly generated native treasury. The entire
100,000-LAC faucet budget would represent at most 20% of bonded voting power while
that bootstrap reserve remains bonded. Per-address claims are not proof of unique
people. Treasury concentration and the shared bootstrap host remain material
limitations.

## Use a wallet or run a node

Create and back up a wallet in MetaMask, then open the portal and choose
**Connect wallet**. On mobile, use MetaMask's browser. Confirm the LazyArt chain
ID and native LAC before signing a transaction. The sign-in message creates a
website session and grants no spending permission.

The public node guide includes a Linux x86-64 client, public genesis, checksums,
licences and a local peer helper. Python 3 and Node.js 20 or later are required.
Downloads declare an exact length and digest and support resumable byte ranges.
The helper generates fresh node keys locally and refuses to overwrite an existing
home. Keep the consensus key private and never run it on two active nodes.

The default peer route uses the HTTPS gateway, disables peer exchange and inbound
connections, and binds local RPC ports to localhost. It currently supports up to
16 simultaneous bootstrap connections. Operators can configure native CometBFT
peer networking separately. Gateway interruptions can delay sync and signing;
long-term availability across independent operators has not been qualified.

## Contracts and asset boundaries

The native faucet is prefunded with exactly 100,000 LAC. It cannot mint coins or
pay an address twice. Fun/D grants commit a fixed native amount to a beneficiary,
vest linearly for up to ten years, and cannot be cancelled by their creator.
Anyone can release vested funds to the beneficiary. Only the beneficiary can
nominate a successor, who must accept. The portal checks deployed grant bytecode
before showing or releasing a grant.

Native LAC, Ethereum LAC, app-earned points and purchased app credits are distinct
assets. There is no automatic conversion or migration between them. The earlier
QBFT networks and their operated two-way bridge remain at
[/playground](https://lac.lazying.art/playground); that bridge does not connect
to this proof-of-stake chain. The separate Ethereum LAC v2 contract candidate is
not deployed on Ethereum.

## Implementation and verification

The client is unmodified Cosmos EVM v0.7.3, commit
`c3ae9067a7eadcdea55a5192226916deb44c71c4`, using Cosmos SDK staking, distribution
and slashing with CometBFT consensus. `build.sh` pins the source and builds the
reference client with LazyArt name metadata. `network.json` records the network
parameters. Consensus controls staking; website database entries do not create
validator voting power.

Qualification on 19 October 2026 covered native transfers, one-time faucet claims,
delegation, actual fee-reward withdrawal, an unstaking request, Fun/D deployment
and release, wallet-session rejection cases, and public browser interactions.
A separately keyed node using the published HTTPS peer route entered the active
set and signed canonical block 446. It was then undelegated and stopped after
leaving the active set. The full 24-hour unbonding maturity was not yet observed.
Browser automation used a synthetic EIP-1193 wallet with real native transactions;
it is not evidence of a manual MetaMask extension test.

This is an operational community pilot, not an audited production network.
Bootstrap validators currently share one workstation, and the public gateway is
another availability dependency. The qualification proves the exercised flows,
not Ethereum- or Solana-scale decentralisation, security or capacity.

### Development checks

From the repository root, install the locked dependencies and run:

```sh
npm ci
npm test
npm run build:web
```

Live qualification is documented separately from the isolated tests. No private fixture keys or automatic live qualification runner are included here.

`prepare.py` is a fresh-network bootstrap tool and refuses an existing state
folder. Never delete live state to rerun it. Keys, mutable state, compiled clients,
node packages and private receipts remain outside Git. `package-node-kit.py`
exports an explicit public-file allowlist with no wallet or consensus secrets.

References: [Cosmos EVM](https://evm.cosmos.network/),
[pinned source](https://github.com/cosmos/evm/tree/v0.7.3),
[SDK staking](https://docs.cosmos.network/main/build/modules/staking),
[SDK distribution](https://docs.cosmos.network/main/build/modules/distribution).

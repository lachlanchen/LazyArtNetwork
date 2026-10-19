# Join the existing network

Use https://lac.lazying.art/pos/node-guide for the current Linux x86-64 node kit, published archive checksum and initialization commands. This repository's network/genesis.json and network/network.json identify the existing chain. Never substitute a newly generated genesis when joining it.

The client is built from the pinned upstream commit using `bash pos/build.sh`; install Go first (the script selects Go 1.25.9). Keep private wallet and consensus keys outside Git. The node-kit helper initializes fresh local keys and refuses an existing home. Only its public consensus key is entered on the staking page.

## Source layout

- `pos/`: native network configuration, source build, node kit, wallet/staking service and funded native contracts.
- `network/`: existing public genesis and checksums.
- `contracts-v2/`: Ethereum v2 monetary core, governance, treasury, grants, claims, task escrow and migration candidate.
- `lab/`: bounded RPC and static-file transport shared by the standalone portal.

`npm ci && npm test && npm run build:web` performs local synthetic tests and builds the portal. It does not deploy or spend funds. `npm start` starts the portal on loopback port 18888 and expects an explicitly provisioned local node on RPC 19745 / REST 19717 and its native-only faucet deployment record. Put a TLS ingress in front of it to host publicly. Optional profile login uses a separately provisioned account sidecar; wallet use does not require it.

The `prepare.py`, `services.py`, `deploy.cjs` and `bootstrap-reserve.cjs` files document the bootstrap sequence and refuse conflicting state. They create or operate a NEW network, not a node joining the existing genesis. Do not run them on an existing node home. Review chain identity and parameters before creating a separate network. No deployment runs during install or tests.

## Asset identities

Native LAC: LazyArt chain 20261020, Cosmos chain lazyart-20261020-1, 18 decimals, base denom alac. Current Ethereum LAC: 0x56E140d1ce7bFf0a7B83E5a778829111f069326E. These are separate balances. The earlier QBFT companion tokens tLACP/wtLACP are separate playground assets, not native LAC.

The Ethereum v2 candidate is not deployed. Its migration escrow has no mint authority: a remote deposit can release only prefunded destination reserves after quorum attestation. Source finality, paired addresses, amounts, signer policy and finite budgets must be qualified before activation. Migration is not enabled by installing this repository. See contracts-v2/README.md.

## Verification

The original native deployment qualified transfers, faucet claims, staking, fee rewards, unstaking requests, Fun/D grants and an independently keyed validator signing a canonical block. Public source tests are synthetic and do not reproduce a live deployment. The 24-hour unbonding completion was not observed in the initial qualification. Test results do not constitute an external audit.

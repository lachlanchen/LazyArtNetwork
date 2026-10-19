# LazyArtCoin v2 — Ethereum contract candidate

LazyArtCoin v2 is a separate ERC-20 token intended for Ethereum, with the display
name **LazyArtCoin** and ticker **LAC**. Asset identity includes chain ID and contract
address. It does not modify, rename or migrate the existing Ethereum token.

The implementation is a release candidate with automated tests, not an audited
mainnet release. No Ethereum transaction has been sent and no production wallet
credential is used by this package.

## Modules

| Contract | Authority and behavior |
| --- | --- |
| `LazyArtCoinV2` | ERC-20, EIP-2612 permits, holder/allowance-authorised burning. Immutable lifetime, exact rolling 365-day and per-epoch gross issuance limits. Initial supply counts against all limits. Burns never restore allowance. Only delayed governance can mint, only to the fixed treasury. Guardian can stop minting; only governance can resume or rotate the guardian. No transfer freeze, tax, rebase, confiscation or proxy. |
| `LazyArtGovernance` | Self-administered timelock with fixed delay. No deployer administrator, zero-address/open executor or replaceable administrative root. Deploy separate routine and slower module-change controllers. Proposer/executor roles can be rotated through the timelock; their custody must be qualified before deployment. |
| `TreasuryVault` | Prefunded named budgets reserve backing, bind operator and recipient, and enforce per-period and lifetime spend limits and expiry. No unlimited module approvals or arbitrary calls. Only unreserved balances can be recovered by governance. |
| `FunDGrantVault` | Fully prefunded, irrevocable linear grants, up to 3650 days. Permanent grant IDs and reservation accounting. Anyone can release vested amounts only to the beneficiary. Beneficiary-controlled nomination and acceptance support wallet rotation; administrators cannot redirect commitments. Lost beneficiary keys have no administrative recovery override. |
| `CommunityClaimVault` | Finite prefunded campaigns; EIP-712 receipts bind campaign, signer epoch, claim, recipient, amount, evidence commitment, deadline, chain and contract. EOA and ERC-1271 signers. Delayed signer rotation invalidates previous-epoch receipts without resetting claim tombstones. No minting or withdrawal. |
| `TaskEscrow` | Requester-funded work for people, robots or agents. Worker key, receiving wallet, independent verifier and arbiter have distinct roles. Acceptance, submission, review, challenge, arbitration and deadline settlement are explicit. An agreed timeout split avoids indefinite arbitration lockup. Pausing new tasks does not block existing settlements. |
| `LazyArtModuleRegistry` | Slower governance can publish, replace or retire module addresses with increasing versions and code hashes. Discovery does not confer mint, treasury, delegatecall or spending authority. Existing contracts and commitments remain in place. |

The monetary core is immutable. Extensibility comes from replacing bounded modules
and directing new budgets to them, while outstanding obligations remain in their
original vaults. This preserves the issuance envelope; it is not an unrestricted
proxy-upgrade promise.

Token transfers are exact, non-rebasing and fee-free at the contract level.
Ethereum network gas fees still apply. The contracts cannot guarantee token price,
creator purchasing power, work truthfulness, unique-human eligibility or investment
returns. Verifier/attestor security and independent governance custody matter.

## Verification and preparation

Uses the existing pinned local toolchain: solc 0.8.26, OpenZeppelin 5.4.0, optimizer 200,
EVM Cancun. The playground's original London-era contracts remain separately built
with the Paris target; these packages must not be interchanged.

```sh
node contracts-v2/compile.cjs
node node_modules/hardhat/internal/cli/cli.js --config contracts-v2/hardhat.config.cjs \
  test --no-compile contracts-v2/test/suite.cjs
cd ../..
node contracts-v2/prepare.cjs
```

The isolated suite covers monetary limits and rolling-window boundaries, an
independent 70-step issuance model, permit replay, timelock bypass attempts,
budget overbooking, failed-transfer rollback, funded grant recovery, signer
rotation, ERC-1271, task disputes and timeout outcomes. It uses synthetic accounts,
not live RPCs or production keys. Automated tests are not an independent audit.

`prepare.cjs` compiles an offline inventory with source/bytecode hashes, ABI,
constructor schema, runtime-size checks and unset decision fields. Generated files
remain private under `.private/v2/`.

Complete a private copy of `decisions.template.json` before constructing a real
plan. Supply and budget fields are decimal strings in whole-token units. No
production economic values or signer addresses are silently defaulted.

```sh
node contracts-v2/plan.cjs /path/to/completed-private-decisions.json
```

The planner creates eight unsigned CREATE records with deterministic addresses:
routine governance, slower governance, treasury, token, module registry, Fun/D,
claims and task escrow. It makes no network call and cannot sign or broadcast.
The deployer nonce, multisig custody, gas/fee preview, independent review and fork
simulation must be verified before approving the exact transactions. Source
verification follows deployment. No irreversible transaction has a rollback.

## Migration and the playground

An Ethereum migration bridge is not part of this candidate's authority. ERC-20
interfaces, explicit asset IDs and the versioned registry allow a separately
reviewed migration adapter later. Existing LAC holders cannot be migrated by a
balance snapshot alone; backing and replay/finality protections need their own
review. There is no automatic points conversion or old-token debit.

The active bridge at lac.lazying.art connects two independent **playground chain
states** on the same workstation. It uses a trusted operated relay and isolated
`tLACP` / `wtLACP` assets. It supplies no collateral or authority to these Ethereum
contracts and must not be repurposed as a mainnet bridge.

## Native LAC migration corridor

`NetworkMigrationEscrow` adds a fixed-asset, prefunded corridor between the
Ethereum token and native LAC. Neither endpoint can mint. Deposits emit a nonce,
sender, recipient, amount and exact destination. A destination release requires a
majority quorum of distinct, ordered attestor signatures over the source event,
transaction hash, signer epoch, expiry and destination EIP-712 domain.

Message IDs remain consumed across signer rotations. Each endpoint has immutable
per-transfer, daily and lifetime inbound/outbound limits. Governance pairs the
remote endpoint once, rotates signers and activates the corridor through its
existing delay. A guardian can pause; only governance resumes. Outbound retirement
is irreversible while inbound claims remain possible. There is no administrative
withdrawal of the reserved asset.

The native reserve must be allocated explicitly; the existing native supply and
Ethereum balances are not automatically combined or rebased. The corridor does
not create a claim on every native LAC or retire a token held by another person.
A later migration can move app defaults and new issuance while existing holders
retain their balances and the supported redemption path.

Nine isolated escrow tests exercise native and ERC20 settlement, replay across
rotation, wrong domains/recipients, source and expiry checks, daily bounds,
retirement and pause authority. Ethereum v2 remains undeployed; these contracts
and tests do not claim a live Ethereum bridge. Finalized-event verification,
attestor custody, reserve amounts and paired deployments must be qualified before
activation. Existing ETH and LAC are not used by compilation or tests.

#!/usr/bin/env python3
"""Export only binary, public genesis/config, public helper source and licenses."""
from pathlib import Path
import json,hashlib,shutil,tarfile,html
ROOT=Path(__file__).resolve().parent.parent
state=ROOT/'.private/pos/network'
release=json.loads((ROOT/'.private/pos/bootstrap/build-release.json').read_text())
public=json.loads((state/'public.json').read_text())
out=ROOT/'.private/pos/node-kit';out.mkdir(mode=0o700,exist_ok=True)
metadata={k:public[k] for k in ['chainId','cosmosChainId','genesisSha256','binarySha256']};metadata['nominalBlockSeconds']=8;metadata['nativeCurrency']={'name':'LazyArtCoin','symbol':'LAC','decimals':18};metadata['peer']=public['nodeIds'][0];metadata['sourceCommit']=release['sourceCommit'];metadata['upstream']='https://github.com/cosmos/evm/tree/v0.7.3'
(out/'network.json').write_text(json.dumps(metadata,indent=2)+'\n')
for source,target in [(Path(release['binary']),'lazyartd'),(state/'node1/config/genesis.json','genesis.json'),(ROOT/'pos/node-helper.py','node-helper.py'),(ROOT/'pos/peer-forward.cjs','peer-forward.cjs'),(Path.home()/'.local/share/lazyart-pos/source/cosmos-evm-v0.7.3/LICENSE','LICENSE-cosmos-evm'),(Path.home()/'.local/share/lazyart-pos/source/cosmos-evm-v0.7.3/NOTICE','NOTICE-cosmos-evm')]:shutil.copyfile(source,out/target)
(out/'lazyartd').chmod(0o755)
readme='''# Join LazyArt

This Linux x86-64 kit contains the pinned Cosmos EVM reference client, the public
genesis and a local HTTPS peer transport. Python3 and Node.js 20+ are required.
Native LAC is specific to this community pilot, with no external asset backing.

1. Verify the published archive checksum before extracting it.
2. Run `python3 node-helper.py init --home "$HOME/.lazyart" --name "My node"`.
   It refuses to overwrite an existing home and generates fresh keys locally.
3. Keep `config/priv_validator_key.json` private and backed up. Never run two
   processes/machines with the same consensus key: double-signing is slashable.
4. Run `python3 node-helper.py run --home "$HOME/.lazyart"` and keep it running.
   This starts only its own client and helper, with a per-home exclusive lock.
5. Check `curl http://127.0.0.1:26657/status`: wait until `catching_up` is false
   and the latest height matches the website. Initial history sync takes time.
6. Copy the PUBLIC key printed by `python3 node-helper.py public-key --home
   "$HOME/.lazyart"`. Connect your wallet at https://lac.lazying.art/stake.
   Submit that public key in Become a validator and self-delegate at least 10 LAC.
7. Registration is permissionless; the 32-validator active set follows stake.
   A healthy active node signs blocks. Fees provide rewards; no yield is promised.
   The web form uses 5% commission, 20% maximum and 1 percentage point/day maximum
   change. Delegations unbond after 24 hours; downtime and double-signing can slash.

Your wallet key controls stake; the node's separate consensus key signs blocks.
Neither private key goes into the website or the peer transport helper.

The helper binds only to localhost and uses https://lac.lazying.art to reach the
bootstrap peer. Bootstrap services currently share one workstation. The pilot's
public transport supports up to 16 simultaneous bootstrap connections; it does not promise network availability.
The default helper disables peer exchange and inbound connections to keep its
public-gateway route explicit. Operators with a public server may independently
configure native CometBFT P2P listen/external addresses, inbound limits and peer
exchange, then exchange peer IDs. Do not expose RPC/admin ports.

Transfers, staking and Solidity deployment use LAC for gas. Ethereum LAC, old
playground tokens and app-earned points are distinct assets; there is no automatic
migration or exchange. No recovery phrase or existing Ethereum key is included.

The client is Cosmos EVM v0.7.3, source commit
c3ae9067a7eadcdea55a5192226916deb44c71c4. Consensus code is unmodified; build name
metadata says LazyArt. Source and build instructions are in the LazyingArtCoin
repository's pos/ directory. See LICENSE-cosmos-evm, NOTICE-cosmos-evm and upstream dependency
licenses. The client includes open-source dependencies under their own licenses.
'''
(out/'README.md').write_text(readme)
public_dir=ROOT/'pos/public';public_dir.mkdir(exist_ok=True)
allowed=['lazyartd','genesis.json','network.json','node-helper.py','peer-forward.cjs','README.md','LICENSE-cosmos-evm','NOTICE-cosmos-evm']
archive=public_dir/'node-kit.tar.gz'
with tarfile.open(archive,'w:gz') as t:
 for name in allowed:t.add(out/name,arcname='lazyart-node/'+name,recursive=False)
for name in ['genesis.json','network.json','peer-forward.cjs']:shutil.copyfile(out/name,public_dir/name)
checksum=hashlib.sha256(archive.read_bytes()).hexdigest()
css=next((ROOT/'pos/web/dist/assets').glob('*.css')).name
guide=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Run a LazyArt node</title><link rel="stylesheet" href="/assets/{css}"></head><body><header><a class="brand" href="/">LazyArt</a><a href="/stake">Wallet &amp; staking →</a></header><main><section class="hero"><p class="eyebrow">JOIN THE NETWORK</p><h1>Run your own node.</h1><p>Use the Linux x86-64 kit to follow LazyArt blocks and, if you choose, register as a validator. Python 3 and Node.js 20 or later are required.</p><div class="actions"><a class="button" href="/pos/node-kit.tar.gz">Download node kit</a></div><p class="caption">Archive SHA-256</p><pre>{checksum}</pre></section><section><h2>1. Create a node</h2><p>Extract the archive, open its directory in a terminal and initialize a new node home. The helper refuses to overwrite existing data.</p><pre>tar -xzf node-kit.tar.gz
cd lazyart-node
python3 node-helper.py init --home "$HOME/.lazyart" --name "My node"
python3 node-helper.py run --home "$HOME/.lazyart"</pre><p>Keep the process running. Back up <code>config/priv_validator_key.json</code> privately. Never run two nodes with the same consensus key: double-signing can be penalised.</p></section><section><h2>2. Wait for sync</h2><pre>curl http://127.0.0.1:26657/status</pre><p>Wait for <code>catching_up: false</code>, then compare the latest height with the wallet page. It should be within a few blocks. An initial sync may take time.</p></section><section><h2>3. Register and stake</h2><pre>python3 node-helper.py public-key --home "$HOME/.lazyart"</pre><p>Copy only the public key. Connect your wallet on the staking page, enter a validator name and self-delegate at least 10 LAC. Keep some LAC available for fees.</p><div class="actions"><a class="button secondary" href="/stake#join">Register your validator →</a></div><p class="caption">Your wallet controls your stake. The node’s separate consensus key signs blocks. Neither private key belongs in the website.</p></section><section><h2>Know the operating rules</h2><ul><li>The active set contains up to 32 validators, selected by bonded stake.</li><li>Rewards come from transaction fees. There is no guaranteed yield or external backing.</li><li>The registration form sets 5% commission, a 20% ceiling and a maximum increase of one percentage point per day.</li><li>Unstaking takes 24 hours. Downtime and double-signing can reduce staked balances.</li><li>The current bootstrap block interval is about eight seconds. The public gateway supports up to 16 simultaneous bootstrap connections.</li><li>Bootstrap validators currently share one workstation. This remains a community pilot.</li></ul><p>Operators with a public server can configure native CometBFT peer addresses and connect directly to other operators. Keep RPC and administration ports private. The included helper binds locally and uses the existing HTTPS gateway.</p></section><section><h2>Build with LAC</h2><p>Transfers, staking and Solidity deployments use this network’s native LazyArtCoin (LAC). Ethereum LAC, earlier playground tokens and app-earned points are separate assets, with no automatic conversion.</p><p class="caption">Client: Cosmos EVM v0.7.3, source commit c3ae9067a7eadcdea55a5192226916deb44c71c4. The archive includes its licence, attribution and public genesis. Reproducible build instructions are in the repository’s pos/ directory.</p></section><footer><a href="/stake">Back to LazyArt</a><a href="https://github.com/cosmos/evm/tree/v0.7.3">Client source ↗</a></footer></main></body></html>'''
(public_dir/'node-guide').write_text(guide)
(ROOT/'.private/pos/node-kit-receipt.json').write_text(json.dumps({'sha256':checksum,'bytes':archive.stat().st_size,'files':allowed,'metadata':metadata},indent=2))
print('Public node kit:',archive.stat().st_size,'bytes',checksum)

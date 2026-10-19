#!/usr/bin/env python3
"""Create a fresh, disjoint PoS genesis. Never resets existing state or uses dev seeds."""
from pathlib import Path
import json, os, subprocess, hashlib, shutil, re

REPO = Path(__file__).resolve().parent.parent
FINAL = REPO / '.private/pos/network'
STATE = REPO / '.private/pos/network-preparing'
BIN = Path(json.loads((REPO / '.private/pos/bootstrap/build-release.json').read_text())['binary'])
CFG = json.loads((REPO / 'pos/network.json').read_text())
CHAIN = CFG['cosmosChainId']
UNIT = 10**18

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    path.write_text(value if isinstance(value, str) else json.dumps(value, indent=2)+'\n')
    path.chmod(0o600)

def run(home, *args, private_output=None):
    result = subprocess.run([str(BIN), *map(str, args), '--home', str(home)], capture_output=True, text=True)
    if private_output:
        write(private_output, result.stdout)
    if result.returncode:
        # Key commands may return mnemonic material; never print their output.
        if args[0] == 'keys': raise RuntimeError('Private key operation failed; inspect protected state')
        raise RuntimeError(result.stderr[-2000:])
    return result.stdout

def toml_set(text, section, key, value):
    start=0
    if section:
        m=re.search(r'^\['+re.escape(section)+r'\]\s*$',text,re.M)
        if not m: raise ValueError('Missing TOML section '+section)
        start=m.end()
    end=text.find('\n[',start)
    if end<0:end=len(text)
    part=text[start:end]
    part,count=re.subn(r'^'+re.escape(key)+r'\s*=.*$',key+' = '+value,part,flags=re.M)
    if count!=1: raise ValueError('Missing/duplicate TOML key '+section+'.'+key)
    return text[:start]+part+text[end:]

def main():
    if STATE.exists() or FINAL.exists(): raise RuntimeError('Existing PoS state preserved; inspect any partial preparation before retrying')
    if not BIN.is_file():raise RuntimeError('Build the pinned client first')
    os.umask(0o077)
    STATE.mkdir(parents=True,mode=0o700)
    homes=[];owners=[]
    for i in range(CFG['genesis']['bootstrapValidators']):
        home=STATE/f'node{i+1}';homes.append(home)
        run(home,'init',f'LazyArt {i+1}','--chain-id',CHAIN)
        info=json.loads(run(home,'keys','add','validator','--keyring-backend','test','--algo','eth_secp256k1','--output','json',private_output=home/'owner-backup.json'))
        owners.append(info['address'])
    # Separate fresh faucet and treasury wallets, generated locally. Output is private.
    out=subprocess.check_output(['node',str(REPO/'pos/wallets.cjs'),str(STATE)],text=True)
    public=json.loads(out)
    home=homes[0];g=json.loads((home/'config/genesis.json').read_text())
    def denom(x):
        if isinstance(x,dict):return {k:denom(v) for k,v in x.items()}
        if isinstance(x,list):return [denom(v) for v in x]
        return 'alac' if x in ('stake','atest') else x
    g=denom(g);app=g['app_state'];p=CFG['genesis']
    app['staking']['params'].update(bond_denom='alac',unbonding_time=str(p['unbondingSeconds'])+'s',max_validators=p['maxValidators'],min_commission_rate='0.050000000000000000')
    app['mint']['minter']['inflation']='0.000000000000000000'
    app['mint']['params'].update(mint_denom='alac',inflation_rate_change='0.000000000000000000',inflation_max='0.000000000000000000',inflation_min='0.000000000000000000')
    app['bank']['denom_metadata']=[{'description':'LazyArt native gas and staking currency','denom_units':[{'denom':'alac','exponent':0,'aliases':[]},{'denom':'lac','exponent':18,'aliases':[]}],'base':'alac','display':'lac','name':'LazyArtCoin','symbol':'LAC','uri':'','uri_hash':''}]
    app['evm']['params']['evm_denom']='alac'
    app['evm']['params']['active_static_precompiles']=['0x0000000000000000000000000000000000000100','0x0000000000000000000000000000000000000400']+[f'0x{n:040x}' for n in range(0x800,0x808)]
    app['erc20']['native_precompiles']=['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']
    app['erc20']['token_pairs']=[{'contract_owner':1,'erc20_address':'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE','denom':'alac','enabled':True}]
    app['feemarket']['params']['min_gas_price']=p['minimumGasPriceBaseUnits']+'.000000000000000000'
    app['distribution']['params']['community_tax']='0.020000000000000000'
    app['slashing']['params'].update(signed_blocks_window='1000',min_signed_per_window='0.500000000000000000',downtime_jail_duration='600s',slash_fraction_double_sign='0.050000000000000000',slash_fraction_downtime='0.001000000000000000')
    g['consensus']['params']['block']['max_gas']='10000000'
    write(home/'config/genesis.json',g)
    initial_each=int(p['bootstrapStakeEachWhole'])+int(p['bootstrapLiquidEachWhole'])
    for address in owners:run(home,'genesis','add-genesis-account',address,str(initial_each*UNIT)+'alac')
    run(home,'genesis','add-genesis-account',public['faucetCosmos'],str((int(p['faucetBudgetWhole'])+int(p['faucetGasReserveWhole']))*UNIT)+'alac')
    run(home,'genesis','add-genesis-account',public['treasuryCosmos'],str(int(p['treasuryWhole'])*UNIT)+'alac')
    total=initial_each*len(owners)+int(p['faucetBudgetWhole'])+int(p['faucetGasReserveWhole'])+int(p['treasuryWhole'])
    assert total==int(p['totalWhole'])
    for target in homes[1:]:shutil.copyfile(home/'config/genesis.json',target/'config/genesis.json')
    for i,target in enumerate(homes):
        run(target,'genesis','gentx','validator',str(int(p['bootstrapStakeEachWhole'])*UNIT)+'alac','--keyring-backend','test','--chain-id',CHAIN,'--gas-prices',p['minimumGasPriceBaseUnits']+'alac','--commission-rate','0.05','--commission-max-rate','0.20','--commission-max-change-rate','0.01','--min-self-delegation',str(10*UNIT),'--ip','127.0.0.1','--p2p-port',str(19656+i*10))
    for target in homes[1:]:
        for f in (target/'config/gentx').glob('*.json'):shutil.copyfile(f,home/'config/gentx'/f.name)
    run(home,'genesis','collect-gentxs');run(home,'genesis','validate-genesis')
    ids=[run(h,'comet','show-node-id').strip() for h in homes]
    for i,target in enumerate(homes):
        if i:shutil.copyfile(home/'config/genesis.json',target/'config/genesis.json')
        t=(target/'config/config.toml').read_text()
        for section,key,value in [('rpc','pprof_laddr','""'),('mempool','type','"app"'),('rpc','laddr',f'"tcp://127.0.0.1:{19657+i*10}"'),('p2p','laddr',f'"tcp://127.0.0.1:{19656+i*10}"'),('p2p','persistent_peers',json.dumps(','.join(f'{id}@127.0.0.1:{19656+j*10}' for j,id in enumerate(ids) if i!=j))),('p2p','allow_duplicate_ip','true'),('p2p','addr_book_strict','false'),('consensus','timeout_commit','"8s"'),('consensus','timeout_propose','"6s"'),('consensus','timeout_prevote','"2s"'),('consensus','timeout_precommit','"2s"')]:t=toml_set(t,section,key,value)
        write(target/'config/config.toml',t)
        t=(target/'config/app.toml').read_text()
        for section,key,value in [('', 'minimum-gas-prices','"0alac"'),('api','enable','true' if i==0 else 'false'),('api','address',f'"tcp://127.0.0.1:{19717+i}"'),('grpc','enable','true' if i==0 else 'false'),('grpc','address',f'"127.0.0.1:{19790+i}"'),('json-rpc','enable','true' if i==0 else 'false'),('json-rpc','address',f'"127.0.0.1:{19745+i}"'),('json-rpc','ws-address',f'"127.0.0.1:{19845+i}"'),('json-rpc','api','"eth,net,web3"'),('evm','evm-chain-id',str(CFG['evmChainId'])),('evm','min-tip','0')]:t=toml_set(t,section,key,value)
        write(target/'config/app.toml',t)
    digest=hashlib.sha256((home/'config/genesis.json').read_bytes()).hexdigest()
    write(STATE/'public.json',{'schema':1,'chainId':CFG['evmChainId'],'cosmosChainId':CHAIN,'genesisSha256':digest,'binarySha256':hashlib.sha256(BIN.read_bytes()).hexdigest(),'nodeIds':ids,'validatorOwners':owners,**public,'nativePrecompile':'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'})
    STATE.rename(FINAL)
    print('Fresh four-validator PoS genesis prepared; private keys retained only in protected state')

if __name__=='__main__':main()

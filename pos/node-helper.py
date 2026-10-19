#!/usr/bin/env python3
"""Start one independent node with locally generated keys and a pinned public genesis."""
from pathlib import Path
import argparse,hashlib,json,os,signal,subprocess,socket,sys,time

ROOT=Path(__file__).resolve().parent

def set_toml(text,section,key,value):
    import re
    start=0
    if section:
        m=re.search(r'^\['+re.escape(section)+r'\]\s*$',text,re.M)
        if not m:raise RuntimeError('Missing section '+section)
        start=m.end()
    end=text.find('\n[',start)
    if end<0:end=len(text)
    part,count=re.subn(r'^'+re.escape(key)+r'\s*=.*$',key+' = '+value,text[start:end],flags=re.M)
    if count!=1:raise RuntimeError('Missing/duplicate setting '+section+'.'+key)
    return text[:start]+part+text[end:]

def main():
    p=argparse.ArgumentParser();p.add_argument('action',choices=['init','run','public-key']);p.add_argument('--home',type=Path,default=Path.home()/'.lazyart');p.add_argument('--name',default='Community node');p.add_argument('--p2p-port',type=int,default=26656);p.add_argument('--rpc-port',type=int,default=26657);p.add_argument('--eth-port',type=int,default=8545);p.add_argument('--bridge-port',type=int,default=26659);args=p.parse_args()
    os.umask(0o077);home=args.home.expanduser().resolve();binary=ROOT/'lazyartd';manifest=json.loads((ROOT/'network.json').read_text());genesis=ROOT/'genesis.json'
    for file,digest in [(binary,manifest['binarySha256']),(genesis,manifest['genesisSha256'])]:
        if hashlib.sha256(file.read_bytes()).hexdigest()!=digest:raise RuntimeError('Checksum mismatch: '+file.name)
    if args.action=='init':
        if home.exists():raise RuntimeError('Existing node home is preserved; choose a new directory')
        subprocess.run([str(binary),'init',args.name,'--chain-id',manifest['cosmosChainId'],'--home',str(home)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        (home/'config/genesis.json').write_bytes(genesis.read_bytes())
        t=(home/'config/config.toml').read_text()
        for section,key,value in [('rpc','pprof_laddr','""'),('mempool','type','"app"'),('rpc','laddr',f'"tcp://127.0.0.1:{args.rpc_port}"'),('p2p','laddr',f'"tcp://127.0.0.1:{args.p2p_port}"'),('p2p','persistent_peers',json.dumps(manifest['peer']+'@127.0.0.1:'+str(args.bridge_port))),('p2p','pex','false'),('p2p','max_num_inbound_peers','0'),('p2p','allow_duplicate_ip','true'),('p2p','addr_book_strict','false'),('consensus','timeout_commit','"8s"'),('consensus','timeout_propose','"6s"'),('consensus','timeout_prevote','"2s"'),('consensus','timeout_precommit','"2s"')]:t=set_toml(t,section,key,value)
        (home/'config/config.toml').write_text(t)
        t=(home/'config/app.toml').read_text()
        for section,key,value in [('', 'minimum-gas-prices','"0alac"'),('api','enable','false'),('grpc','enable','false'),('json-rpc','enable','true'),('json-rpc','address',f'"127.0.0.1:{args.eth_port}"'),('json-rpc','ws-address',f'"127.0.0.1:{args.eth_port+1}"'),('json-rpc','api','"eth,net,web3"'),('evm','evm-chain-id',str(manifest['chainId'])),('evm','min-tip','0')]:t=set_toml(t,section,key,value)
        (home/'config/app.toml').write_text(t)
        (home/'join.json').write_text(json.dumps({'bridgePort':args.bridge_port,'p2pPort':args.p2p_port,'rpcPort':args.rpc_port,'ethPort':args.eth_port,'genesisSha256':manifest['genesisSha256']}))
        print('Created fresh node keys locally. Keep config/priv_validator_key.json private; never copy it to a second running node.')
    if args.action in ('init','public-key'):
        result=json.loads(subprocess.check_output([str(binary),'comet','show-validator','--home',str(home)],text=True));print('Consensus PUBLIC key:',result.get('key') or result.get('value'));return
    if not (home/'join.json').exists():raise RuntimeError('Initialize this node first')
    settings=json.loads((home/'join.json').read_text())
    if settings['genesisSha256']!=manifest['genesisSha256'] or hashlib.sha256((home/'config/genesis.json').read_bytes()).hexdigest()!=manifest['genesisSha256']:raise RuntimeError('Existing genesis differs; do not reset your node')
    import fcntl
    lock=(home/'runtime.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    for port in [settings['bridgePort'],settings['p2pPort'],settings['rpcPort'],settings['ethPort'],settings['ethPort']+1]:
        with socket.socket() as s:s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(('127.0.0.1',port))
    env={**os.environ,'LAZYART_PEER_PORT':str(settings['bridgePort']),'GOMAXPROCS':'2','GOMEMLIMIT':'1GiB'}
    children=[]
    def stop(*_):
        for child in children:
            if child.poll() is None:child.terminate()
    signal.signal(signal.SIGTERM,stop);signal.signal(signal.SIGINT,stop)
    try:
        children.append(subprocess.Popen(['node',str(ROOT/'peer-forward.cjs')],env=env))
        children.append(subprocess.Popen([str(binary),'start','--home',str(home),'--chain-id',manifest['cosmosChainId'],'--evm.evm-chain-id',str(manifest['chainId']),'--log_level','warn'],env=env))
        while all(c.poll() is None for c in children):time.sleep(1)
    finally:
        stop()
        for child in children:
            try:child.wait(timeout=45)
            except subprocess.TimeoutExpired:child.kill();child.wait()

if __name__=='__main__':main()

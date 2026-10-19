#!/usr/bin/env python3
"""Install/start only the four owned native-PoS services, with per-node locks."""
from pathlib import Path
import subprocess,sys,json,socket
ROOT=Path(__file__).resolve().parent.parent
STATE=ROOT/'.private/pos/network'
BIN=Path(json.loads((ROOT/'.private/pos/bootstrap/build-release.json').read_text())['binary'])
UNITS=Path.home()/'.config/systemd/user'

def main():
    action=sys.argv[1]
    names=[f'lazyart-pos-{i}.service' for i in range(1,5)]
    if action=='install':
        assert (STATE/'public.json').exists()
        for i in range(4):
            for port in [19656+i*10,19657+i*10]+([19717,19790,19745,19845] if i==0 else []):
                with socket.socket() as s:s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(('127.0.0.1',port))
        for i,name in enumerate(names):
            home=STATE/f'node{i+1}';p=UNITS/name
            if p.exists():raise RuntimeError('Existing service preserved: '+name)
            p.write_text(f'''[Unit]
Description=LazyArt native PoS validator {i+1}
After=network-online.target
[Service]
Type=simple
UMask=0077
Environment=GOMAXPROCS=1
Environment=GOMEMLIMIT=768MiB
ExecStart=/usr/bin/flock --no-fork -n {home}/runtime.lock {BIN} start --home {home} --chain-id lazyart-20261020-1 --evm.evm-chain-id 20261020 --log_level warn
Restart=on-failure
RestartSec=8
TimeoutStopSec=60
MemoryMax=2G
CPUQuota=100%
TasksMax=256
NoNewPrivileges=true
PrivateTmp=true
[Install]
WantedBy=default.target
''');p.chmod(0o600)
        subprocess.run(['systemctl','--user','daemon-reload'],check=True)
    elif action=='start':subprocess.run(['systemctl','--user','enable','--now',*names],check=True)
    elif action=='status':subprocess.run(['systemctl','--user','is-active',*names],check=True)
    else:raise ValueError('Use install, start or status')
if __name__=='__main__':main()

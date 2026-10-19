#!/usr/bin/env bash
set -euo pipefail
# Reuse the shared Go module/toolchain cache; serialize this project build.
repo_root=$(cd "$(dirname "$0")/.." && pwd)
pos_root=${LAZYART_POS_ROOT:-${HOME}/.local/share/lazyart-pos}
source_root="$pos_root/source/cosmos-evm-v0.7.3"
expected=c3ae9067a7eadcdea55a5192226916deb44c71c4
mkdir -p "$pos_root/source" "$repo_root/.private/pos/bootstrap"
exec 9>"$repo_root/.private/pos/build.lock"
flock -n 9 || { echo 'An owned build is already running' >&2; exit 1; }
if [ ! -d "$source_root/.git" ]; then git clone --depth 1 --branch v0.7.3 https://github.com/cosmos/evm.git "$source_root"; fi
[ "$(git -C "$source_root" rev-parse HEAD)" = "$expected" ]
[ -z "$(git -C "$source_root" status --porcelain)" ]
go_bootstrap=${GO_BOOTSTRAP:-go}
cd "$source_root/evmd"
GOTOOLCHAIN=go1.25.9 GOMAXPROCS=2 GOCACHE="${HOME}/.cache/lazyart-pos/go-build" nice -n 10 "$go_bootstrap" build -p 2 -trimpath -tags netgo -ldflags "-s -w -X github.com/cosmos/cosmos-sdk/version.Name=LazyArt -X github.com/cosmos/cosmos-sdk/version.AppName=lazyartd -X github.com/cosmos/cosmos-sdk/version.Version=0.7.3-lazyart.1 -X github.com/cosmos/cosmos-sdk/version.Commit=$expected" -o "$pos_root/lazyartd" ./cmd/evmd
sha256sum "$pos_root/lazyartd"
python3 - "$repo_root" "$pos_root" <<'PY'
from pathlib import Path
import hashlib,json,shutil,sys
repo,root=map(Path,sys.argv[1:]);binary=root/'lazyartd';digest=hashlib.sha256(binary.read_bytes()).hexdigest();release=root/'releases'/digest[:16];release.mkdir(parents=True,exist_ok=True,mode=0o700)
target=release/'lazyartd'
if target.exists():assert hashlib.sha256(target.read_bytes()).hexdigest()==digest
else:shutil.copyfile(binary,target);target.chmod(0o755)
record=repo/'.private/pos/bootstrap/build-release.json';record.write_text(json.dumps({'binary':str(target),'sha256':digest,'sourceCommit':'c3ae9067a7eadcdea55a5192226916deb44c71c4','upstream':'cosmos/evm v0.7.3'},indent=2));record.chmod(0o600)
print('Frozen native client:',target)
PY

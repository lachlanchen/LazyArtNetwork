const fs=require('node:fs'),path=require('node:path');
const solc=require('solc');
const sources=Object.fromEntries(fs.readdirSync(path.join(__dirname,'contracts')).filter(f=>f.endsWith('.sol')).map(f=>[f,{content:fs.readFileSync(path.join(__dirname,'contracts',f),'utf8')}]));
const input={language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','storageLayout']}}}};
const output=JSON.parse(solc.compile(JSON.stringify(input),{import:p=>{try{return{contents:fs.readFileSync(path.join(__dirname,'../node_modules',p),'utf8')}}catch{return{error:'Missing pinned dependency '+p}}}}));
for(const e of output.errors||[]){if(e.severity==='error')throw Error(e.formattedMessage);console.warn(e.formattedMessage);}
const dir=path.join(__dirname,'../.private/v2');fs.mkdirSync(dir,{recursive:true,mode:0o700});
fs.writeFileSync(path.join(dir,'contracts.json'),JSON.stringify({compiler:solc.version(),contracts:Object.assign({},...Object.values(output.contracts))},null,2),{mode:0o600});
fs.writeFileSync(path.join(dir,'compiler-input.json'),JSON.stringify(input,null,2),{mode:0o600});
console.log('Compiled LazyArtCoin v2 candidates; no wallet, RPC, deployment or broadcast.');

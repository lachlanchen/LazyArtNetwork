// Offline candidate inventory. Does not open an RPC or read any signing credential.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
cp.execFileSync(process.execPath,[path.join(__dirname,'compile.cjs')],{stdio:'inherit'});
const root=path.resolve(__dirname,'..'),dir=path.join(root,'.private/v2');
const compiled=JSON.parse(fs.readFileSync(path.join(dir,'contracts.json'))),decisions=JSON.parse(fs.readFileSync(path.join(__dirname,'decisions.template.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const names=['LazyArtCoinV2','LazyArtGovernance','TreasuryVault','LazyArtModuleRegistry','FunDGrantVault','CommunityClaimVault','TaskEscrow'];
const contracts=names.map(name=>{const a=compiled.contracts[name],runtime=Buffer.from(a.evm.deployedBytecode.object,'hex');if(runtime.length>24576)throw Error('Runtime bytecode limit exceeded: '+name);return{name,constructor:a.abi.find(x=>x.type==='constructor'),abi:a.abi,creation_bytecode_bytes:a.evm.bytecode.object.length/2,creation_bytecode_sha256:sha(Buffer.from(a.evm.bytecode.object,'hex')),runtime_template_bytes:runtime.length,runtime_template_sha256:sha(runtime),immutable_values_require_deployment_patch:true};});
const sources=fs.readdirSync(path.join(__dirname,'contracts')).filter(x=>x.endsWith('.sol')).sort().map(file=>({file:'contracts-v2/contracts/'+file,sha256:sha(fs.readFileSync(path.join(__dirname,'contracts',file)))}));
const missing=[];function walk(v,p=''){for(const[k,value]of Object.entries(v)){const key=p?p+'.'+k:k;if(value===null)missing.push(key);else if(typeof value==='object'&&!Array.isArray(value))walk(value,key);}}walk(decisions);
const result={schema_version:1,created_at:new Date().toISOString(),implementation:'candidate implemented; automated qualification only',production_deployed:false,ready_for_mainnet_broadcast:false,broadcast_enabled:false,compiler:compiled.compiler,openzeppelin:require('@openzeppelin/contracts/package.json').version,evm:'cancun',optimizer_runs:200,contracts,sources,unresolved_decisions:missing,existing_ethereum_LAC_unchanged:true,existing_eth_spent:'0',custody:'No production key accessed'};
fs.writeFileSync(path.join(dir,'readiness.json'),JSON.stringify(result,null,2),{mode:0o600});fs.writeFileSync(path.join(dir,'decisions.json'),JSON.stringify(decisions,null,2),{mode:0o600});
console.log(JSON.stringify({contracts:contracts.map(x=>x.name),unresolved_decisions:missing,ready_for_mainnet_broadcast:false},null,2));

const fs=require('node:fs'),path=require('node:path');const solc=require('solc');
const sources={};for(const name of fs.readdirSync(path.join(__dirname,'contracts')).filter(x=>x.endsWith('.sol')))sources[name]={content:fs.readFileSync(path.join(__dirname,'contracts',name),'utf8')};
const input={language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences']}}}};
const output=JSON.parse(solc.compile(JSON.stringify(input)));for(const e of output.errors||[])if(e.severity==='error')throw Error(e.formattedMessage);
const contracts=Object.assign({},...Object.values(output.contracts));fs.mkdirSync(path.resolve(__dirname,'../.private/pos'),{recursive:true,mode:0o700});fs.writeFileSync(path.resolve(__dirname,'../.private/pos/contracts.json'),JSON.stringify({compiler:solc.version(),contracts}),{mode:0o600});console.log('Compiled community faucet and native Fun/D grant');

fs.writeFileSync(path.join(__dirname,'web/fund-artifact.json'),JSON.stringify({abi:contracts.FunD.abi,bytecode:'0x'+contracts.FunD.evm.bytecode.object,runtime:'0x'+contracts.FunD.evm.deployedBytecode.object,immutableReferences:contracts.FunD.evm.deployedBytecode.immutableReferences}));

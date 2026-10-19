// Deploy only the finite native allocation on the fresh, isolated LazyArt chain.
// Existing Ethereum keys, contracts and playground keys are never loaded.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{ethers}=require('ethers');
const root=path.resolve(__dirname,'../.private/pos');
const write=(name,value)=>{const p=path.join(root,name),tmp=p+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n',{mode:0o600});fs.renameSync(tmp,p);};
(async()=>{
 const pub=JSON.parse(fs.readFileSync(path.join(root,'network/public.json')));
 const p=new ethers.JsonRpcProvider('http://127.0.0.1:19745',undefined,{batchMaxCount:1,cacheTimeout:-1});p.pollingInterval=1000;
 assert.equal(Number(await p.send('eth_chainId',[])),20261020);
 const status=await(await fetch('http://127.0.0.1:19657/status')).json();
 assert.equal(status.result.node_info.network,'lazyart-20261020-1');assert.equal(status.result.sync_info.catching_up,false);
 const supply=await(await fetch('http://127.0.0.1:19717/cosmos/bank/v1beta1/supply/by_denom?denom=alac')).json();
 assert.equal(supply.amount.amount,ethers.parseEther('1000000').toString());
 const a=JSON.parse(fs.readFileSync(path.join(root,'contracts.json'))).contracts.CommunityFaucet;
 const signer=new ethers.Wallet(fs.readFileSync(path.join(root,'network/faucet.key'),'utf8').trim(),p);
 assert.equal(signer.address,pub.faucet);
 const journal=path.join(root,'faucet-deployment.json');let record;
 if(fs.existsSync(journal))record=JSON.parse(fs.readFileSync(journal));
 else{
  assert.equal(await p.getTransactionCount(signer.address),0,'Fresh native distributor must have nonce zero');
  assert.equal(await p.getBalance(signer.address),ethers.parseEther('100100'));
  const tx=await new ethers.ContractFactory(a.abi,a.evm.bytecode.object,signer).getDeployTransaction(signer.address,{value:ethers.parseEther('100000'),gasLimit:1000000});
  const raw=await signer.signTransaction(await signer.populateTransaction(tx));const decoded=ethers.Transaction.from(raw);
  record={chainId:20261020,address:ethers.getCreateAddress({from:signer.address,nonce:0}),hash:decoded.hash,raw,distributor:signer.address};
  write('faucet-deployment.json',record);
 }
 assert.equal(record.distributor,signer.address);assert.equal(record.chainId,20261020);
 let receipt=await p.getTransactionReceipt(record.hash);
 if(!receipt){if(!await p.getTransaction(record.hash))await p.broadcastTransaction(record.raw);receipt=await p.waitForTransaction(record.hash,1,60000);}
 assert.equal(receipt?.status,1);assert.equal(receipt.contractAddress,record.address);
 const c=new ethers.Contract(record.address,a.abi,p),code=await p.getCode(record.address);
 assert.notEqual(code,'0x');assert.equal(await c.distributor(),signer.address);assert.equal(await c.AWARD(),ethers.parseEther('100'));assert.equal(await c.BUDGET(),ethers.parseEther('100000'));
 const distributed=await c.distributed();assert.equal(await p.getBalance(record.address)+distributed,ethers.parseEther('100000'));
 write('deployment.json',{schema:1,chainId:20261020,cosmosChainId:'lazyart-20261020-1',qualified:true,qualification:'local consensus, supply and finite-faucet identity; public participation separately qualified',faucet:record.address,distributor:signer.address,transactionHash:record.hash,codeHash:ethers.keccak256(code),genesisSha256:pub.genesisSha256,peer:pub.nodeIds[0]});
 console.log(JSON.stringify({chainId:20261020,faucet:record.address,transactionHash:record.hash,distributed:ethers.formatEther(distributed)}));p.destroy();
})().catch(e=>{console.error(e.shortMessage||e.message);process.exit(1);});

// Delegate a bounded, newly issued native reserve. Never opens an Ethereum wallet.
// The finite free allocation alone must not acquire a blocking consensus share.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{ethers}=require('ethers');const root=path.resolve(__dirname,'../.private/pos');
const p=new ethers.JsonRpcProvider('http://127.0.0.1:19745',undefined,{batchMaxCount:1,cacheTimeout:-1});p.pollingInterval=1000;
const file=path.join(root,'bootstrap-reserve.json');const record=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{schema:1,chainId:20261020,eachWhole:'99000',totalWhole:'396000',transactions:{}};
const save=()=>fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n',{mode:0o600});
(async()=>{
 assert.equal(Number(await p.send('eth_chainId',[])),20261020);
 const pub=JSON.parse(fs.readFileSync(path.join(root,'network/public.json'))),genesis=JSON.parse(fs.readFileSync(path.join(root,'network/node1/config/genesis.json')));
 assert.equal(genesis.chain_id,'lazyart-20261020-1');
 const operators=genesis.app_state.genutil.gen_txs.map(t=>t.body.messages[0].validator_address);assert.equal(new Set(operators).size,4);
 const w=new ethers.Wallet(fs.readFileSync(path.join(root,'network/treasury.key'),'utf8').trim(),p);assert.equal(w.address,pub.treasury);
 if(!Object.keys(record.transactions).length){assert.equal(await p.getTransactionCount(w.address),0);assert.equal(await p.getBalance(w.address),ethers.parseEther('895500'));}
 const c=new ethers.Contract('0x0000000000000000000000000000000000000800',['function delegate(address,string,uint256) returns(bool)'],w);
 for(const operator of operators){
  let entry=record.transactions[operator];
  if(!entry){const raw=await w.signTransaction(await w.populateTransaction(await c.delegate.populateTransaction(w.address,operator,ethers.parseEther('99000'))));const tx=ethers.Transaction.from(raw);assert.equal(tx.chainId,20261020n);entry={hash:tx.hash,raw};record.transactions[operator]=entry;save();}
  let r=await p.getTransactionReceipt(entry.hash);if(!r){if(!await p.getTransaction(entry.hash))await p.broadcastTransaction(entry.raw);r=await p.waitForTransaction(entry.hash,1,60000);}assert.equal(r?.status,1);delete entry.raw;entry.block=r.blockNumber;save();
 }
 const response=await fetch('http://127.0.0.1:19717/cosmos/staking/v1beta1/delegations/'+pub.treasuryCosmos);assert.equal(response.status,200);const d=await response.json();
 for(const operator of operators)assert.equal(d.delegation_responses.find(x=>x.delegation.validator_address===operator).balance.amount,ethers.parseEther('99000').toString());
 record.treasury=w.address;record.genesisSha256=pub.genesisSha256;record.verifiedAt=new Date().toISOString();record.bootstrapBondedMinimumWhole='400000';record.faucetMaximumWhole='100000';record.freeAllocationMaximumVotingShare='20% while the bootstrap reserve remains bonded';save();console.log('396,000 newly issued native LAC delegated across the four bootstrap validators; existing Ethereum assets untouched.');
})().catch(e=>{console.error(e.shortMessage||e.message);process.exitCode=1;}).finally(()=>p.destroy());

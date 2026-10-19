const test=require('node:test'),assert=require('node:assert/strict');
const {ethers}=require('ethers');
const {verifyEvent,ABI}=require('../migration/verify-event.cjs');
const iface=new ethers.Interface(ABI),zero=ethers.ZeroAddress;
function fixture(change={}){
 const source={chainId:1,bridge:'0x1111111111111111111111111111111111111111',asset:'0x3333333333333333333333333333333333333333',genesisHash:ethers.id('genesis1'),bridgeCodeHash:ethers.keccak256('0x6000')};
 const destination={chainId:20261020,bridge:'0x2222222222222222222222222222222222222222',asset:zero,genesisHash:ethers.id('genesis2'),bridgeCodeHash:ethers.keccak256('0x6000')};
 const transactionHash=ethers.id('deposit'),recipient='0x4444444444444444444444444444444444444444';
 const event=iface.encodeEventLog(iface.getEvent('Deposited'),[1,recipient,recipient,100,destination.chainId,destination.bridge]);
 const receipt={status:1,hash:transactionHash,blockNumber:10,blockHash:ethers.id('block10'),logs:[{index:3,address:source.bridge,removed:false,...event}]};
 const make=(local,remote)=>({getNetwork:async()=>({chainId:BigInt(local.chainId)}),getCode:async()=>'0x6000',getTransactionReceipt:async()=>receipt,getBlock:async n=>n===0?{hash:local.genesisHash}:n==='finalized'?{number:change.unfinalized?9:11}:{hash:change.reorg?ethers.id('other'):receipt.blockHash},call:async tx=>{
  const parsed=iface.parseTransaction(tx);const values={asset:change.assetMismatch?zero:local.asset,remoteBridge:remote.bridge,remoteChain:remote.chainId,enabled:true,paused:false,signerEpoch:1,liquidity:change.empty?0:1000,perTransferCap:200,lifetimeInboundCap:10000,totalReleased:0,dailyCap:1000,dailyReleased:0,processed:!!change.processed};return iface.encodeFunctionResult(parsed.name,[values[parsed.name]]);
 }});
 if(change.wrongLog)receipt.logs[0].address=recipient;
 return {source,destination,sourceProvider:make(source,destination),destinationProvider:make(destination,source),transactionHash,logIndex:3,now:1790000000};
}
test('prepares exact unsigned recipient-bound proof from finalized pinned source',async()=>{const r=await verifyEvent(fixture());assert.equal(r.transfer.amount,'100');assert.equal(r.transfer.sourceChain,1);assert.equal(r.domain.chainId,20261020);assert.equal(r.sourceFinalizedHeight,11);assert.equal(r.broadcast,false);assert.deepEqual(r.signatures,[]);});
for(const [change,message] of [[{unfinalized:true},/finalized/],[{reorg:true},/canonical/],[{wrongLog:true},/Wrong source/],[{assetMismatch:true},/Asset mismatch/],[{processed:true},/already settled/],[{empty:true},/capacity/]])test('rejects '+Object.keys(change)[0],async()=>{await assert.rejects(verifyEvent(fixture(change)),message);});

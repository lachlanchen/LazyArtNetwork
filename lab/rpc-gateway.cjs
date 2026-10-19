// Public playground RPC: signed transactions only, fixed chain, bounded work.
// No accounts, signing, state overrides, consensus administration or mainnet upstream.
const {ethers}=require('ethers');
const HASH=/^0x[0-9a-fA-F]{64}$/,HEX=/^0x(?:[0-9a-fA-F]{2})*$/,Q=/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/;
const MAX_GAS=8000000n,MAX_DATA=49152;
function invalid(message){throw Object.assign(Error(message),{rpcCode:-32602});}
function quantity(v,max=(1n<<256n)-1n){if(typeof v!=='string'||!Q.test(v)||BigInt(v)>max)invalid('Invalid quantity');return v;}
function block(v){if(!['latest','pending','earliest','safe','finalized'].includes(v))quantity(v,BigInt(Number.MAX_SAFE_INTEGER));return v;}
function address(v){if(!ethers.isAddress(v))invalid('Invalid address');return ethers.getAddress(v);}
function data(v){if(typeof v!=='string'||!HEX.test(v)||v.length>2+MAX_DATA*2)invalid('Invalid or oversized data');return v;}
function txCall(q,chainId){if(!q||Array.isArray(q)||typeof q!=='object')invalid('Invalid call');const out={};for(const k of Object.keys(q)){
 if(['from','to'].includes(k))out[k]=address(q[k]);
 else if(['data','input'].includes(k))out[k]=data(q[k]);
 else if(['value','gasPrice','maxFeePerGas','maxPriorityFeePerGas'].includes(k))out[k]=quantity(q[k]);
 else if(k==='gas')out.gas=quantity(q.gas,MAX_GAS);
 else if(k==='type')out.type=quantity(q.type,2n);
 else if(k==='nonce')out.nonce=quantity(q.nonce,BigInt(Number.MAX_SAFE_INTEGER));
 else if(k==='chainId'){quantity(q.chainId);if(BigInt(q.chainId)!==BigInt(chainId))invalid('Wrong call chain');out.chainId=q.chainId;}
 else if(k==='accessList'){
  if(!Array.isArray(q.accessList)||q.accessList.length>32)invalid('Invalid access list');
  out.accessList=q.accessList.map(v=>{if(!v||Object.keys(v).sort().join(',')!=='address,storageKeys'||!Array.isArray(v.storageKeys)||v.storageKeys.length>32||v.storageKeys.some(x=>!HASH.test(x)))invalid('Invalid access list entry');return{address:address(v.address),storageKeys:v.storageKeys};});
 }
 else invalid('Unsupported call field');
 }if(out.data&&out.input&&out.data!==out.input)invalid('Conflicting call data');out.gas??=ethers.toQuantity(MAX_GAS);return out;}
function createGateway(provider,chainId){
 if(![31337,20261018,20261019,20261020].includes(Number(chainId)))throw Error('Playground chains only');
 let window=0,reads=0,writes=0;
 return async function dispatch(b){
 const response={jsonrpc:'2.0',id:b?.id??null};
 try{
  if(!b||Array.isArray(b)||b.jsonrpc!=='2.0'||!['string','number'].includes(typeof b.id)||!Array.isArray(b.params)||b.params.length>3)invalid('Invalid JSON-RPC envelope');
  const now=Math.floor(Date.now()/60000);if(window!==now){window=now;reads=0;writes=0;}if(++reads>1800)throw Object.assign(Error('Playground request limit reached'),{rpcCode:-32005});
  const p=b.params,m=b.method;let params;
  function count(n){if(p.length!==n)invalid('Unexpected parameter count');}
  switch(m){
   case 'eth_chainId':case 'net_version':case 'eth_blockNumber':case 'eth_gasPrice':case 'eth_maxPriorityFeePerGas':case 'eth_syncing': count(0);params=[];break;
   case 'eth_getBalance':case 'eth_getCode':case 'eth_getTransactionCount':count(2);params=[address(p[0]),block(p[1])];break;
   case 'eth_getStorageAt':count(3);params=[address(p[0]),quantity(p[1]),block(p[2])];break;
   case 'eth_call':count(2);params=[txCall(p[0],chainId),block(p[1])];break;
   case 'eth_estimateGas':if(p.length<1||p.length>2)invalid('Invalid estimate');params=[txCall(p[0],chainId),...(p.length===2?[block(p[1])]:[])];break;
   case 'eth_getBlockByNumber':count(2);if(typeof p[1]!=='boolean')invalid('Invalid block mode');params=[block(p[0]),p[1]];break;
   case 'eth_getBlockByHash':count(2);if(!HASH.test(p[0])||typeof p[1]!=='boolean')invalid('Invalid block');params=p;break;
   case 'eth_getTransactionReceipt':case 'eth_getTransactionByHash':count(1);if(!HASH.test(p[0]))invalid('Invalid transaction hash');params=p;break;
   case 'eth_feeHistory':count(3);quantity(p[0],20n);block(p[1]);if(!Array.isArray(p[2])||p[2].length>5||p[2].some((v,i)=>!Number.isFinite(v)||v<0||v>100||(i&&v<p[2][i-1])))invalid('Invalid reward percentiles');params=p;break;
   case 'eth_getLogs':{
    count(1);const q=p[0];if(!q||Array.isArray(q)||Object.keys(q).some(k=>!['address','fromBlock','toBlock','topics'].includes(k)))invalid('Invalid log filter');
    const addresses=Array.isArray(q.address)?q.address:[q.address];if(!addresses.length||addresses.length>5)invalid('Specify up to five contracts');
    const latest=BigInt(await provider.send('eth_blockNumber',[]));const from=q.fromBlock==='latest'?latest:BigInt(quantity(q.fromBlock,latest));const to=q.toBlock==='latest'?latest:BigInt(quantity(q.toBlock,latest));
    if(to<from||to-from>999n)invalid('Log range is limited to 1000 blocks');
    if(q.topics!==undefined&&(!Array.isArray(q.topics)||q.topics.length>4||q.topics.some(t=>t!==null&&(!HASH.test(t)&&(!Array.isArray(t)||t.length>5||t.some(x=>!HASH.test(x)))))))invalid('Invalid topics');
    params=[{address:addresses.map(address),fromBlock:ethers.toQuantity(from),toBlock:ethers.toQuantity(to),...(q.topics?{topics:q.topics}:{})}];break;
   }
   case 'eth_sendRawTransaction':{
    count(1);data(p[0]);let tx;try{tx=ethers.Transaction.from(p[0]);}catch{invalid('Invalid signed transaction');}
    if(!tx.isSigned()||!tx.from||tx.chainId!==BigInt(chainId)||![0,1,2].includes(tx.type)||tx.gasLimit===0n||tx.gasLimit>MAX_GAS)invalid('Signed playground transaction with matching chain ID and bounded gas required');
    if(++writes>60)throw Object.assign(Error('Transaction limit reached; retry shortly'),{rpcCode:-32005});params=p;break;
   }
   default:return{...response,error:{code:-32601,message:'Method is not available on the playground gateway'}};
  }
  if(BigInt(await provider.send('eth_chainId',[]))!==BigInt(chainId))throw Error('Chain identity mismatch');
  return{...response,result:await provider.send(m,params)};
 }catch(e){
  const nested=String(e?.info?.error?.message||e?.error?.message||'');
  const known=['insufficient funds','nonce too low','already known','replacement transaction underpriced','execution reverted','intrinsic gas too low'].find(x=>nested.toLowerCase().includes(x));
  return{...response,error:{code:e.rpcCode||-32000,message:e.rpcCode?e.message:known||'Playground request failed; check transaction status before retrying'}};
 }
 };
}
module.exports={createGateway,MAX_GAS};

// Read-only attestation preparation. No private-key loading, signature or broadcast.
const {ethers}=require('ethers');
const ABI=[
 'event Deposited(uint256 indexed nonce,address indexed sender,address indexed recipient,uint256 amount,uint256 destinationChain,address destinationBridge)',
 'function asset() view returns(address)','function remoteChain() view returns(uint256)',
 'function remoteBridge() view returns(address)','function enabled() view returns(bool)',
 'function paused() view returns(bool)','function signerEpoch() view returns(uint256)',
 'function liquidity() view returns(uint256)','function perTransferCap() view returns(uint256)',
 'function lifetimeInboundCap() view returns(uint256)','function totalReleased() view returns(uint256)',
 'function dailyCap() view returns(uint256)','function dailyReleased(uint256) view returns(uint256)',
 'function processed(bytes32) view returns(bool)'];
const types={Transfer:[['sourceChain','uint256'],['sourceBridge','address'],['nonce','uint256'],['sender','address'],['recipient','address'],['amount','uint256'],['transactionHash','bytes32'],['logIndex','uint256'],['signerEpoch','uint256'],['deadline','uint256']].map(([name,type])=>({name,type}))};
function requireValue(ok,message){if(!ok)throw Error(message);}
function validateEndpoint(e){requireValue(e&&Number.isSafeInteger(e.chainId)&&e.chainId>0,'Invalid chain ID');for(const k of ['bridge','asset'])requireValue(ethers.isAddress(e[k]),'Invalid '+k);for(const k of ['genesisHash','bridgeCodeHash'])requireValue(/^0x[0-9a-f]{64}$/.test(e[k]),'Pin '+k);requireValue(e.bridge!==ethers.ZeroAddress,'Bridge not deployed');}
async function qualify(provider,e){validateEndpoint(e);requireValue(Number((await provider.getNetwork()).chainId)===e.chainId,'Chain mismatch');const genesis=await provider.getBlock(0);requireValue(genesis?.hash.toLowerCase()===e.genesisHash,'Genesis mismatch');requireValue(ethers.keccak256(await provider.getCode(e.bridge))===e.bridgeCodeHash,'Contract code mismatch');}
async function verifyEvent({source,destination,sourceProvider,destinationProvider,transactionHash,logIndex,now=Math.floor(Date.now()/1000)}){
 validateEndpoint(source);validateEndpoint(destination);requireValue(source.chainId!==destination.chainId,'Distinct chains required');
 requireValue(/^0x[0-9a-fA-F]{64}$/.test(transactionHash)&&Number.isSafeInteger(logIndex)&&logIndex>=0,'Exact source transaction/log required');
 await Promise.all([qualify(sourceProvider,source),qualify(destinationProvider,destination)]);
 const receipt=await sourceProvider.getTransactionReceipt(transactionHash);
 requireValue(receipt?.status===1&&receipt.hash.toLowerCase()===transactionHash.toLowerCase(),'Source transaction not confirmed');
 const [canonical,finalized]=await Promise.all([sourceProvider.getBlock(receipt.blockNumber),sourceProvider.getBlock('finalized')]);
 requireValue(canonical?.hash===receipt.blockHash&&finalized&&finalized.number>=receipt.blockNumber,'Source event not canonical and finalized');
 const log=receipt.logs.find(l=>l.index===logIndex);requireValue(log&&!log.removed&&log.address.toLowerCase()===source.bridge.toLowerCase(),'Wrong source event');
 const parsed=new ethers.Interface(ABI).parseLog(log);requireValue(parsed?.name==='Deposited','Wrong event type');const a=parsed.args;
 requireValue(a.destinationChain===BigInt(destination.chainId)&&a.destinationBridge.toLowerCase()===destination.bridge.toLowerCase(),'Wrong destination');
 requireValue(a.nonce>0n&&a.amount>0n&&a.recipient!==ethers.ZeroAddress,'Invalid deposit');
 const origin=new ethers.Contract(source.bridge,ABI,sourceProvider),target=new ethers.Contract(destination.bridge,ABI,destinationProvider);
 const [srcAsset,srcRemote,srcChain,asset,remote,remoteChain,enabled,paused,epoch,liquidity,limit,cap,released,daily,dayUsed]=await Promise.all([
  origin.asset(),origin.remoteBridge(),origin.remoteChain(),target.asset(),target.remoteBridge(),target.remoteChain(),target.enabled(),target.paused(),target.signerEpoch(),target.liquidity(),target.perTransferCap(),target.lifetimeInboundCap(),target.totalReleased(),target.dailyCap(),target.dailyReleased(Math.floor(now/86400))]);
 requireValue(srcAsset.toLowerCase()===source.asset.toLowerCase()&&asset.toLowerCase()===destination.asset.toLowerCase(),'Asset mismatch');
 requireValue(srcRemote.toLowerCase()===destination.bridge.toLowerCase()&&srcChain===BigInt(destination.chainId)&&remote.toLowerCase()===source.bridge.toLowerCase()&&remoteChain===BigInt(source.chainId),'Pair mismatch');
 requireValue(enabled&&!paused,'Destination unavailable');
 requireValue(a.amount<=liquidity&&a.amount<=limit&&released+a.amount<=cap&&dayUsed+a.amount<=daily,'Destination capacity unavailable');
 const messageId=ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['uint256','address','uint256'],[source.chainId,source.bridge,a.nonce]));
 requireValue(!await target.processed(messageId),'Source deposit already settled');
 const transfer={sourceChain:source.chainId,sourceBridge:source.bridge,nonce:a.nonce.toString(),sender:a.sender,recipient:a.recipient,amount:a.amount.toString(),transactionHash,logIndex,signerEpoch:epoch.toString(),deadline:now+1800};
 const domain={name:'LazyArt Network Migration',version:'1',chainId:destination.chainId,verifyingContract:destination.bridge};
 return {schema:1,operation:'unsigned-migration-attestation',messageId,sourceBlock:receipt.blockNumber,sourceBlockHash:receipt.blockHash,sourceFinalizedHeight:finalized.number,domain,types,transfer,digest:ethers.TypedDataEncoder.hash(domain,types,transfer),signatures:[],broadcast:false};
}
module.exports={verifyEvent,types,ABI};
if(require.main===module){
 const fs=require('node:fs');let providers=[];
 (async()=>{const [configPath,transactionHash,index]=process.argv.slice(2);requireValue(configPath&&transactionHash&&/^\d+$/.test(index),'Usage: node verify-event.cjs CONFIG SOURCE_TX LOG_INDEX');const c=JSON.parse(fs.readFileSync(configPath));const make=e=>{const u=new URL(e.rpc);requireValue(u.protocol==='https:'||(u.protocol==='http:'&&u.hostname==='127.0.0.1'),'HTTPS or explicit loopback RPC required');const request=new ethers.FetchRequest(u.href);request.timeout=10000;const p=new ethers.JsonRpcProvider(request,undefined,{batchMaxCount:1,cacheTimeout:-1});providers.push(p);return p;};console.log(JSON.stringify(await verifyEvent({source:c.source,destination:c.destination,sourceProvider:make(c.source),destinationProvider:make(c.destination),transactionHash,logIndex:Number(index)}),null,2));})().catch(()=>{console.error('Attestation not prepared: reconcile the pinned deployment, finalized source event and destination capacity. No signing or broadcast occurred.');process.exitCode=1;}).finally(()=>providers.forEach(p=>p.destroy()));
}

// Native-LAC wallet API. Consensus/staking lives in the chain, never this service.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const{ethers}=require('ethers');
const{createGateway}=require('../lab/rpc-gateway.cjs');
const{bech32}=require('./wallets.cjs');const{createPeerTransport}=require('./peer-transport.cjs');
function createPosService({origin,publicMode}){
 const root=path.resolve(__dirname,'../.private/pos'),config=require('./network.json');
 const provider=new ethers.JsonRpcProvider('http://127.0.0.1:19745',undefined,{batchMaxCount:1});provider.pollingInterval=1000;
 const gateway=createGateway(provider,20261020),peers=createPeerTransport();
 const challenges=new Map(),sessions=new Map(),attempts=new Map();let queue=Promise.resolve(),faucet,faucetSigner;
 const fail=(m,s=400)=>{throw Object.assign(Error(m),{status:s});};
 const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')));
 function prune(){const now=Date.now();for(const map of [challenges,sessions,attempts])for(const[k,v]of map)if(v.expires<=now)map.delete(k);}
 function session(req){prune();const s=sessions.get(cookies(req).pos_session);if(!s)fail('Connect and sign in with your wallet',401);return s;}
 function deployment(){const p=path.join(root,'deployment.json');if(!fs.existsSync(p))fail('Proof-of-stake network is not ready',503);const d=JSON.parse(fs.readFileSync(p));if(d.chainId!==20261020||d.cosmosChainId!==config.cosmosChainId||!d.qualified)fail('Proof-of-stake network is being qualified',503);return d;}
 async function check(){const d=deployment();if(Number(await provider.send('eth_chainId',[]))!==20261020)fail('Network identity mismatch',503);return d;}
 async function api(suffix){const response=await fetch('http://127.0.0.1:19717'+suffix,{signal:AbortSignal.timeout(7000)});if(!response.ok)fail('Network query unavailable',503);return response.json();}
 async function account(wallet){if(!wallet)return null;const addr=bech32(wallet);const[balance,delegations,unbonding,rewards]=await Promise.all([provider.getBalance(wallet),api('/cosmos/staking/v1beta1/delegations/'+addr),api('/cosmos/staking/v1beta1/delegators/'+addr+'/unbonding_delegations'),api('/cosmos/distribution/v1beta1/delegators/'+addr+'/rewards')]);return{address:wallet,cosmosAddress:addr,balance:ethers.formatEther(balance),delegations:delegations.delegation_responses||[],unbonding:unbonding.unbonding_responses||[],rewards:rewards.rewards||[],totalRewards:rewards.total||[]};}
 async function getFaucet(){const d=await check();if(!faucet){const key=fs.readFileSync(path.join(root,'network/faucet.key'),'utf8').trim();const signer=new ethers.NonceManager(new ethers.Wallet(key,provider));if(await signer.getAddress()!==d.distributor)fail('Faucet identity mismatch',503);faucetSigner=signer;faucet=new ethers.Contract(d.faucet,['function claimed(address) view returns(bool)','function distributed() view returns(uint256)','function claimFor(address)'],signer);}return faucet;}
 async function state(req){const d=await check();let wallet;try{wallet=session(req).wallet;}catch{}
  const[height,list,user,f]=await Promise.all([provider.send('eth_blockNumber',[]),api('/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=100'),account(wallet),getFaucet()]);
  const validators=list.validators||[];for(const entry of user?.delegations||[]){const address=entry.delegation.validator_address;if(!validators.some(v=>v.operator_address===address)){const item=await api('/cosmos/staking/v1beta1/validators/'+address);if(item.validator)validators.push(item.validator);}}
  return{network:config.name,chainId:20261020,cosmosChainId:config.cosmosChainId,nativeCurrency:config.nativeCurrency,block:Number(height),account:user,validators,faucet:d.faucet,claimed:wallet?await f.claimed(wallet):false,distributed:ethers.formatEther(await f.distributed()),award:'100',budget:'100000',inflation:'0',unbondingSeconds:86400,maxValidators:32,peer:d.peer,nodeKit:d.nodeKit||null,genesisSha256:d.genesisSha256,scope:config.scope};
 }
 async function handle(req,res,read,reply){
  const route=new URL(req.url,origin).pathname;
  if(route==='/rpc-pos'){
   if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'content-type'});res.end();return true;}
   if(req.method!=='POST')fail('Not found',404);await check();const b=await read(req,131072,true);
   if(Array.isArray(b)&&(!b.length||b.length>10))fail('Up to ten requests per batch');
   const results=[];if(Array.isArray(b))for(const item of b)results.push(await gateway(item));
   reply(res,200,Array.isArray(b)?results:await gateway(b),{'Access-Control-Allow-Origin':'*'});return true;
  }
  if(!route.startsWith('/api/pos/'))return false;
  await check();
  if(route.startsWith('/api/pos/peer/')){
   if(req.method!=='POST'||!/^application\/json(?:;|$)/.test(req.headers['content-type']||''))fail('JSON POST required',400);
   const action=route.slice('/api/pos/peer/'.length);if(action==='stream'){await peers.stream(await read(req,65536),res);return true;}if(!['open','read','write','close'].includes(action))fail('Not found',404);
   reply(res,200,await peers.dispatch(action,await read(req,65536)));return true;
  }
  if(route==='/api/pos/state'&&req.method==='GET'){reply(res,200,await state(req));return true;}
  if(req.method!=='POST')fail('Not found',404);
  if(req.headers.origin!==origin||!/^application\/json(?:;|$)/.test(req.headers['content-type']||''))fail('Origin or content type rejected',403);
  const b=await read(req);const secure=publicMode?'; Secure':'';
  if(route==='/api/pos/challenge'){
   prune();if(challenges.size>=1000)fail('Sign-in capacity reached',429);
   if(Object.keys(b).length!==1||!ethers.isAddress(b.wallet))fail('Public wallet address required');
   const wallet=ethers.getAddress(b.wallet),nonce=crypto.randomBytes(16).toString('hex'),binding=crypto.randomBytes(24).toString('hex'),expires=Date.now()+300000;
   const message=`${new URL(origin).host} wants you to sign in with your Ethereum account:\n${wallet}\n\nSign in to LazyArt. This grants no spending permission.\n\nURI: ${origin}/stake\nVersion: 1\nChain ID: 20261020\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(expires).toISOString()}`;
   challenges.set(nonce,{wallet,message,binding,expires});reply(res,200,{nonce,message},{'Set-Cookie':`pos_binding=${binding}; HttpOnly; SameSite=Strict; Path=/api/pos; Max-Age=300${secure}`});return true;
  }
  if(route==='/api/pos/verify'){
   prune();const c=challenges.get(b.nonce);if(Object.keys(b).sort().join(',')!=='nonce,signature'||!c||c.binding!==cookies(req).pos_binding)fail('Expired sign-in',401);challenges.delete(b.nonce);
   let recovered;try{recovered=ethers.verifyMessage(c.message,b.signature);}catch{fail('Invalid signature',401);}if(recovered!==c.wallet)fail('Wrong wallet',401);
   if(sessions.size>=1000)fail('Sign-in capacity reached',429);sessions.delete(cookies(req).pos_session);const id=crypto.randomBytes(32).toString('hex');sessions.set(id,{wallet:c.wallet,expires:Date.now()+3600000});reply(res,200,{authenticated:true},{'Set-Cookie':[`pos_session=${id}; HttpOnly; SameSite=Strict; Path=/api/pos; Max-Age=3600${secure}`,`pos_binding=; HttpOnly; SameSite=Strict; Path=/api/pos; Max-Age=0${secure}`]});return true;
  }
  if(route==='/api/pos/logout'){sessions.delete(cookies(req).pos_session);reply(res,200,{signedOut:true},{'Set-Cookie':`pos_session=; HttpOnly; SameSite=Strict; Path=/api/pos; Max-Age=0${secure}`});return true;}
  if(route==='/api/pos/claim'){
   const s=session(req);if(Object.keys(b).length)fail('Recipient comes from the signed-in wallet');
   const action=queue.then(async()=>{if(session(req)!==s)fail('Wallet session changed',401);const f=await getFaucet();if(await f.claimed(s.wallet))return{alreadyClaimed:true};if(attempts.has(s.wallet))fail('Refresh before retrying this claim',429);attempts.set(s.wallet,{expires:Date.now()+60000});try{const tx=await f.claimFor(s.wallet,{gasLimit:200000});await tx.wait(1,30000);return{transactionHash:tx.hash};}catch(e){faucetSigner.reset();throw e;}});queue=action.catch(()=>{});reply(res,200,{...await action,...await state(req)});return true;
  }
  fail('Not found',404);
 }
 return{handle,close(){peers.close();provider.destroy();}};
}
module.exports={createPosService};

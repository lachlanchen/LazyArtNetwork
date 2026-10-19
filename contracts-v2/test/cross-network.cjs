// Isolated two-chain settlement proof. All currency and signers are disposable.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {ethers}=require('ethers');
const {verifyEvent}=require('../migration/verify-event.cjs');
const root=path.resolve(__dirname,'../..'),artifacts=JSON.parse(fs.readFileSync(path.join(root,'.private/v2/contracts.json'))).contracts;
const hardhat=require.resolve('hardhat/internal/cli/cli.js');
const children=[],providers=[];let directory;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function port(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const value=s.address().port;await new Promise(r=>s.close(r));return value;}
async function network(chainId){
 const listen=await port(),config=path.join(directory,chainId+'.cjs');fs.writeFileSync(config,`module.exports={networks:{hardhat:{chainId:${chainId}}}};`);
 const log=fs.openSync(path.join(directory,chainId+'.log'),'w',0o600);
 const child=spawn(process.execPath,[hardhat,'--config',config,'node','--hostname','127.0.0.1','--port',String(listen)],{cwd:root,stdio:['ignore',log,log]});fs.closeSync(log);children.push(child);
 const request=new ethers.FetchRequest('http://127.0.0.1:'+listen);request.timeout=3000;
 const provider=new ethers.JsonRpcProvider(request,undefined,{batchMaxCount:1,cacheTimeout:-1});providers.push(provider);
 let ready=false;for(let n=0;n<60;n++){if(child.exitCode!==null)throw Error('Disposable node stopped: '+fs.readFileSync(path.join(directory,chainId+'.log'),'utf8').split('\n').slice(0,6).join(' '));try{ready=Number(await provider.send('eth_chainId',[]))===chainId;if(ready)break;}catch{}await delay(100);}
 assert(ready,'Local chain starts');return {provider,chainId,owner:await provider.getSigner(0),recipient:await provider.getSigner(1)};
}
async function deploy(chain,name,args){const a=artifacts[name];const c=await new ethers.ContractFactory(a.abi,a.evm.bytecode.object,chain.owner).deploy(...args);await c.waitForDeployment();return c;}
let sequence=0;
async function govern(chain,contract,method,args=[]){const data=contract.interface.encodeFunctionData(method,args),salt=ethers.id('fixture-'+(++sequence));await(await chain.gov.schedule(contract.target,0,data,ethers.ZeroHash,salt,30)).wait();await chain.provider.send('evm_increaseTime',[31]);await chain.provider.send('evm_mine',[]);await(await chain.gov.execute(contract.target,0,data,ethers.ZeroHash,salt)).wait();}
async function pin(chain){return{chainId:chain.chainId,bridge:chain.bridge.target,asset:chain.token?.target||ethers.ZeroAddress,genesisHash:(await chain.provider.getBlock(0)).hash.toLowerCase(),bridgeCodeHash:ethers.keccak256(await chain.provider.getCode(chain.bridge.target))};}
(async()=>{
 directory=fs.mkdtempSync(path.join(os.tmpdir(),'lazyart-migration-'));fs.chmodSync(directory,0o700);
 const eth=await network(31338),native=await network(31339),signers=[ethers.Wallet.createRandom(),ethers.Wallet.createRandom(),ethers.Wallet.createRandom()].sort((a,b)=>a.address.toLowerCase().localeCompare(b.address.toLowerCase()));
 for(const c of [eth,native])c.gov=await deploy(c,'LazyArtGovernance',[30,[await c.owner.getAddress()],[await c.owner.getAddress()]]);
 const units=ethers.parseEther;
 eth.token=await deploy(eth,'LazyArtCoinV2',[await eth.owner.getAddress(),eth.gov.target,await eth.owner.getAddress(),units('1000'),[units('10000'),units('5000'),units('5000'),units('5000'),3600]]);
 for(const [c,other]of [[eth,native],[native,eth]])c.bridge=await deploy(c,'NetworkMigrationEscrow',[c.token?.target||ethers.ZeroAddress,c.gov.target,await c.owner.getAddress(),other.chainId,units('1000'),units('10000'),units('100000'),units('100000')]);
 for(const [c,other]of [[eth,native],[native,eth]]){await govern(c,c.bridge,'pair',[other.bridge.target]);await govern(c,c.bridge,'setSigners',[signers.map(s=>s.address),2]);await govern(c,c.bridge,'activate');}
 await(await native.bridge.fund(units('200'),{value:units('200')})).wait();
 const source=await pin(eth),destination=await pin(native);
 async function settle(from,to,fromPin,toPin,receipt){const log=receipt.logs.find(l=>l.address.toLowerCase()===from.bridge.target.toLowerCase()&&l.topics[0]===from.bridge.interface.getEvent('Deposited').topicHash);assert(log);
  const now=(await to.provider.getBlock('latest')).timestamp;
  const proof=await verifyEvent({source:fromPin,destination:toPin,sourceProvider:from.provider,destinationProvider:to.provider,transactionHash:receipt.hash,logIndex:log.index,now});
  assert.equal(proof.broadcast,false);assert.equal(proof.signatures.length,0);
  const signatures=await Promise.all(signers.slice(0,2).map(s=>s.signTypedData(proof.domain,proof.types,proof.transfer)));
  await(await to.bridge.release(proof.transfer,signatures)).wait();
  await assert.rejects(()=>verifyEvent({source:fromPin,destination:toPin,sourceProvider:from.provider,destinationProvider:to.provider,transactionHash:receipt.hash,logIndex:log.index,now}),/already settled/);
  return proof.messageId;
 }
 const receiver=await native.recipient.getAddress(),before=await native.provider.getBalance(receiver);
 await(await eth.token.approve(eth.bridge.target,units('100'))).wait();
 const outbound=await(await eth.bridge.deposit(receiver,units('100'))).wait();const first=await settle(eth,native,source,destination,outbound);
 assert.equal((await native.provider.getBalance(receiver))-before,units('100'));
 const reverse=await(await native.bridge.connect(native.recipient).deposit(await eth.recipient.getAddress(),units('40'),{value:units('40')})).wait();const second=await settle(native,eth,destination,source,reverse);
 assert.equal(await eth.token.balanceOf(await eth.recipient.getAddress()),units('40'));
 assert.equal(await eth.token.balanceOf(eth.bridge.target),units('60'));
 assert.equal(await eth.token.totalSupply(),units('1000'));
 assert.equal(await native.bridge.liquidity(),units('140'));
 console.log(JSON.stringify({passed:true,chains:[31338,31339],forwardWhole:'100',reverseWhole:'40',quorum:2,signers:3,replayRejectedBothWays:true,tokenSupplyUnchanged:true,messages:[first,second],realAssetsUsed:false}));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{providers.forEach(p=>p.destroy());for(const c of children){if(c.exitCode===null&&c.signalCode===null){c.kill('SIGTERM');await Promise.race([new Promise(r=>c.once('exit',r)),delay(3000)]);if(c.exitCode===null&&c.signalCode===null){c.kill('SIGKILL');await new Promise(r=>c.once('exit',r));}}}if(directory)fs.rmSync(directory,{recursive:true,force:true});});

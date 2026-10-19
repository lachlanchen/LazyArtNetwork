// Bounded TCP byte-stream transport over the existing HTTPS ingress.
// CometBFT still authenticates peers and processes consensus; no RPC/admin target.
const net=require('node:net'),crypto=require('node:crypto');
const MAX_FRAME=32768,MAX_QUEUE=1048576;
function createPeerTransport({host='127.0.0.1',port=19656,maxPeers=16,idleMs=120000,pollMs=1500}={}){
 const peers=new Map();let window=0,opens=0;
 const error=(message,status=400)=>Object.assign(Error(message),{status});
 function drop(id){const p=peers.get(id);if(!p)return;p.closed=true;p.socket.destroy();p.wake?.();peers.delete(id);}
 const timer=setInterval(()=>{for(const[id,p]of peers)if(Date.now()-p.touched>idleMs)drop(id);},Math.min(idleMs,10000));timer.unref();
 async function dispatch(action,b){
  if(!b||typeof b!=='object'||Array.isArray(b))throw error('Invalid peer request');
  if(action==='open'){
   if(Object.keys(b).length)throw error('No peer target may be supplied');
   const now=Math.floor(Date.now()/60000);if(now!==window){window=now;opens=0;}
   if(peers.size>=maxPeers||++opens>24)throw error('Peer capacity reached',429);
   const id=crypto.randomBytes(32).toString('hex'),socket=net.connect({host,port});
   const p={socket,queue:[],bytes:0,touched:Date.now(),rx:-1,tx:-1,last:null,closed:false,reading:false,writing:false,history:[],historyBytes:0};peers.set(id,p);
   socket.on('data',chunk=>{p.queue.push(chunk);p.bytes+=chunk.length;if(p.bytes>=MAX_QUEUE)socket.pause();p.wake?.();});
   socket.on('error',()=>{p.closed=true;p.wake?.();});socket.on('close',()=>{p.closed=true;p.wake?.();});socket.setNoDelay(true);
   try{await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(error('Peer connection unavailable',503)),5000);socket.once('connect',()=>{clearTimeout(t);resolve();});socket.once('error',()=>{clearTimeout(t);reject(error('Peer connection unavailable',503));});});}catch(e){drop(id);throw e;}
   return{id,maxFrame:MAX_FRAME};
  }
  if(!/^[a-f0-9]{64}$/.test(b.id||''))throw error('Invalid peer session');
  const p=peers.get(b.id);if(!p)throw error('Peer session expired',410);p.touched=Date.now();
  if(action==='close'){if(Object.keys(b).length!==1)throw error('Invalid close');drop(b.id);return{closed:true};}
  if(!Number.isSafeInteger(b.seq)||b.seq<0)throw error('Invalid sequence');
  if(action==='read'){
   if(p.mode==='stream')throw error('Peer uses streaming reads',409);
   if(Object.keys(b).sort().join(',')!=='id,seq')throw error('Invalid read');
   if(b.seq===p.rx)return p.last;
   if(b.seq!==p.rx+1||p.reading)throw error('Read sequence conflict',409);
   p.reading=true;
   try{
    if(!p.bytes&&!p.closed)await new Promise(resolve=>{const t=setTimeout(resolve,pollMs);p.wake=()=>{clearTimeout(t);resolve();};});
    p.wake=null;
    let remaining=MAX_FRAME;const parts=[];
    while(p.queue.length&&remaining){const c=p.queue[0],take=Math.min(c.length,remaining);parts.push(c.subarray(0,take));remaining-=take;p.bytes-=take;if(take===c.length)p.queue.shift();else p.queue[0]=c.subarray(take);}
    if(p.bytes<MAX_FRAME&&!p.closed)p.socket.resume();
    p.rx=b.seq;p.last={seq:b.seq,data:Buffer.concat(parts).toString('base64'),closed:p.closed&&!p.bytes};return p.last;
   }finally{p.reading=false;}
  }
  if(action==='write'){
   if(Object.keys(b).sort().join(',')!=='data,id,seq'||typeof b.data!=='string'||b.data.length>Math.ceil(MAX_FRAME/3)*4||!b.data||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b.data))throw error('Invalid frame');
   const bytes=Buffer.from(b.data,'base64');if(bytes.length>MAX_FRAME)throw error('Frame too large');
   const hash=crypto.createHash('sha256').update(bytes).digest('hex');
   if(b.seq===p.tx){if(hash!==p.txHash)throw error('Conflicting repeated frame',409);return{ack:b.seq};}
   if(b.seq!==p.tx+1||p.writing)throw error('Write sequence conflict',409);
   if(p.closed)throw error('Peer connection closed',410);
   p.writing=true;
   try{await new Promise((resolve,reject)=>p.socket.write(bytes,e=>e?reject(error('Peer connection closed',410)):resolve()));p.tx=b.seq;p.txHash=hash;return{ack:b.seq};}finally{p.writing=false;}
  }
  throw error('Unknown peer operation',404);
 }
 async function stream(b,res){
  if(!b||Object.keys(b).sort().join(',')!=='id,seq'||!Number.isSafeInteger(b.seq)||b.seq<0||!/^[a-f0-9]{64}$/.test(b.id||''))throw error('Invalid stream request');
  const p=peers.get(b.id);if(!p)throw error('Peer session expired',410);
  if(p.streaming||p.reading)throw error('Existing stream must close first',409);
  if(b.seq>p.rx+1||(b.seq<=p.rx&&!p.history.some(f=>f.seq===b.seq)))throw error('Stream sequence outside replay window',409);
  p.mode='stream';p.streaming=true;p.touched=Date.now();
  // The requested next sequence acknowledges earlier frames. Unacknowledged
  // frames stay bounded and replayable when a response is interrupted.
  p.history=p.history.filter(f=>f.seq>=b.seq);p.historyBytes=p.history.reduce((n,f)=>n+f.data.length,0);
  let ended=false;const stop=()=>{ended=true;p.wake?.();};res.once('close',stop);
  const deadline=Date.now()+85000;
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.flushHeaders();
  async function send(value){if(ended)return;const ok=res.write('data: '+JSON.stringify(value)+'\n\n');if(!ok)await new Promise(resolve=>{res.once('drain',resolve);res.once('close',resolve);});}
  try{
   for(const frame of p.history){await send(frame);if(ended)return;}
   while(!ended&&Date.now()<deadline&&p.historyBytes<MAX_QUEUE){
    p.touched=Date.now();
    if(!p.bytes&&!p.closed){await new Promise(resolve=>{const t=setTimeout(resolve,8000);p.wake=()=>{clearTimeout(t);resolve();};});p.wake=null;}
    if(ended)break;
    if(!p.bytes&&!p.closed){await send({heartbeat:true});continue;}
    let left=MAX_FRAME;const parts=[];while(p.queue.length&&left){const c=p.queue[0],n=Math.min(c.length,left);parts.push(c.subarray(0,n));left-=n;p.bytes-=n;if(n===c.length)p.queue.shift();else p.queue[0]=c.subarray(n);}
    const frame={seq:++p.rx,data:Buffer.concat(parts).toString('base64'),closed:p.closed&&!p.bytes};p.history.push(frame);p.historyBytes+=frame.data.length;
    if(p.bytes<MAX_FRAME&&!p.closed)p.socket.resume();await send(frame);if(frame.closed)break;
   }
  }finally{p.streaming=false;p.wake=null;res.removeListener('close',stop);if(!res.destroyed)res.end();}
 }
 return{dispatch,stream,close(){clearInterval(timer);for(const id of peers.keys())drop(id);},size:()=>peers.size};
}
module.exports={createPeerTransport,MAX_FRAME};

#!/usr/bin/env node
// Local-only public node helper. Never handles wallet/validator private keys.
const net=require('node:net');
const origin=process.env.LAZYART_ORIGIN||'https://lac.lazying.art';
const listen=Number(process.env.LAZYART_PEER_PORT||26659);
if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/.test(origin)||!Number.isInteger(listen)||listen<1024||listen>65535)throw Error('Invalid HTTPS origin or local port');
async function request(action,body){let last;for(let i=0;i<3;i++){try{const r=await fetch(origin+'/api/pos/peer/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:action==='close'?AbortSignal.timeout(5000):AbortSignal.any([shutdown.signal,AbortSignal.timeout(15000)])});if(!r.ok)throw Object.assign(Error('Peer transport HTTP '+r.status),{terminal:r.status<500&&r.status!==429});return await r.json();}catch(e){last=e;if(e.terminal)throw e;}}throw last;}
const sockets=new Set();const shutdown=new AbortController();
const server=net.createServer(async socket=>{sockets.add(socket);socket.pause();let id,stopped=false,seq=0;
 const stop=()=>{if(stopped)return;stopped=true;socket.destroy();sockets.delete(socket);if(id)request('close',{id}).catch(()=>{});};socket.on('error',stop);socket.on('close',stop);
 try{({id}=await request('open',{}));if(stopped){request('close',{id}).catch(()=>{});return;}
  (async()=>{let n=0,failures=0;while(!stopped){try{const response=await fetch(origin+'/api/pos/peer/stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,seq:n}),signal:AbortSignal.any([shutdown.signal,AbortSignal.timeout(100000)])});if(!response.ok)throw Object.assign(Error('Stream unavailable'),{terminal:[400,404,410].includes(response.status)});let buffer='';for await(const chunk of response.body){buffer+=Buffer.from(chunk).toString('utf8');if(buffer.length>262144)throw Error('Oversized peer frame');let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(!line)continue;if(!line.startsWith('data: '))throw Error('Invalid peer stream');const frame=JSON.parse(line.slice(6));if(frame.heartbeat)continue;if(frame.seq!==n)throw Object.assign(Error('Stream sequence mismatch'),{terminal:true});if(frame.data){const bytes=Buffer.from(frame.data,'base64');if(bytes.length>32768)throw Error('Oversized peer frame');if(!socket.write(bytes))await new Promise(resolve=>{socket.once('drain',resolve);socket.once('close',resolve);});}n++;failures=0;if(frame.closed){stop();return;}}if(stopped)return;}}catch(e){if(e.terminal||++failures>5)throw e;await new Promise(r=>setTimeout(r,300));}}})().catch(stop);
  socket.on('data',async chunk=>{socket.pause();try{for(let i=0;i<chunk.length;i+=32768)await request('write',{id,seq:seq++,data:chunk.subarray(i,i+32768).toString('base64')});if(!stopped)socket.resume();}catch{stop();}});socket.resume();
 }catch{stop();}
});
server.listen(listen,'127.0.0.1',()=>console.log('LazyArt peer transport listening on 127.0.0.1:'+listen));
function close(){shutdown.abort();for(const s of sockets)s.destroy();server.close();}process.on('SIGTERM',close);process.on('SIGINT',close);

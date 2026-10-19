const test=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {createAccountProxy}=require('../account-proxy.cjs');
async function server(handler){const s=http.createServer(handler);await new Promise(r=>s.listen(0,'127.0.0.1',r));return {s,port:s.address().port};}
async function close(...servers){await Promise.all(servers.map(s=>new Promise(r=>s.close(r))));}
test('account proxy pins upstream capability and preserves callback cookies/query',async()=>{
 let observed;const upstream=await server((req,res)=>{observed={url:req.url,headers:req.headers};res.writeHead(302,{'Set-Cookie':'__Host-lac_account=synthetic; Secure; HttpOnly; Path=/','Location':'/?account_result=connected'});res.end();});
 const proxy=createAccountProxy({port:upstream.port,token:'internal-synthetic'}),front=await server((q,r)=>proxy(q,r));
 try{const r=await fetch('http://127.0.0.1:'+front.port+'/api/v2/auth/callback?code=one&state=bound&iss=https%3A%2F%2Fissuer.test',{redirect:'manual',headers:{Authorization:'Bearer external-synthetic',Cookie:'__Host-lac_auth_flow=browser'}});assert.equal(r.status,302);assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('set-cookie'),/Secure/);assert.equal(observed.headers.authorization,'Bearer internal-synthetic');assert.equal(observed.headers.cookie,'__Host-lac_auth_flow=browser');assert(observed.url.includes('code=one'));}finally{await close(front.s,upstream.s);}
});
test('account proxy rejects cross-origin mutations and method substitution',async()=>{
 let calls=0;const upstream=await server((q,r)=>{calls++;r.end('{}');});const proxy=createAccountProxy({port:upstream.port,token:'internal-synthetic'}),front=await server((q,r)=>proxy(q,r));
 try{for(const [path,options]of[['/api/v2/logout',{method:'POST',headers:{Origin:'https://coin.lazying.art'},body:'{}'}],['/api/v2/account',{method:'POST'}]]){const r=await fetch('http://127.0.0.1:'+front.port+path,options);assert.equal(r.status,403);}assert.equal(calls,0);}finally{await close(front.s,upstream.s);}
});
test('account proxy has no wallet or financial forwarding route',async()=>{const proxy=createAccountProxy({token:'synthetic'});for(const url of ['/api/v2/wallet/verify','/api/v2/register','/api/v1/admin/campaigns','/api/v2/profile/delete'])assert.equal(await proxy({url},{}),false);});

// Fixed local account sidecar. No caller-selected upstream or authorization header.
const http = require('node:http');
const routes = new Map([
  ['/api/v2/auth/config', 'GET'], ['/api/v2/auth/start', 'GET'],
  ['/api/v2/auth/callback', 'GET'], ['/api/v2/account', 'GET'], ['/api/v2/logout', 'POST'],
]);
function createAccountProxy({port = 8590, token, origin = 'https://lac.lazying.art'} = {}) {
  return async function handle(req, res) {
    const url = new URL(req.url, origin);
    if (!routes.has(url.pathname)) return false;
    if (!token) { res.writeHead(503, {'Content-Type':'application/json','Cache-Control':'no-store'}); res.end('{"error":"Account sign-in is temporarily unavailable."}'); return true; }
    if (req.method !== routes.get(url.pathname) || (req.method === 'POST' && req.headers.origin !== origin)) {
      res.writeHead(403, {'Cache-Control':'no-store'}); res.end(); return true;
    }
    const headers = {authorization:'Bearer '+token, host:'127.0.0.1:'+port};
    for (const name of ['cookie','origin','content-type','sec-fetch-site']) if(req.headers[name]) headers[name]=req.headers[name];
    let size=0; const chunks=[];
    for await (const chunk of req) { size+=chunk.length; if(size>8192){res.writeHead(413);res.end();return true;} chunks.push(chunk); }
    await new Promise(resolve => {
      let replied=false;
      const fail=()=>{if(!replied){replied=true;if(!res.headersSent)res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"Account sign-in is temporarily unavailable."}');}resolve();};
      const upstream=http.request({hostname:'127.0.0.1',port,path:url.pathname+url.search,method:req.method,headers,timeout:55000}, response=>{
        const data=[]; let bytes=0;
        response.on('data',chunk=>{bytes+=chunk.length;if(bytes>65536){response.destroy();fail();}else data.push(chunk);});
        response.on('error',fail);
        response.on('end',()=>{if(replied)return;replied=true;const out={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
          for(const name of ['content-type','set-cookie','location','retry-after'])if(response.headers[name])out[name]=response.headers[name];
          res.writeHead(response.statusCode,out);res.end(Buffer.concat(data));resolve();});
      });
      upstream.on('timeout',()=>upstream.destroy());upstream.on('error',fail);
      upstream.end(Buffer.concat(chunks));
    });
    return true;
  };
}
function accountLanding(url, method) {
  return ['GET','HEAD'].includes(method) && url.pathname==='/'
    && [...url.searchParams.keys()].length===1
    && ['connected','reconnect'].includes(url.searchParams.get('account_result'));
}
module.exports={createAccountProxy,accountLanding};

// Standalone portal for an explicitly provisioned LazyArt node; loopback only.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {createPosService}=require('./pos/service.cjs');
const {createAccountProxy}=require('./pos/account-proxy.cjs');
const {serveFile}=require('./lab/static-file.cjs');
const port=Number(process.env.PORT||18888),origin=process.env.PUBLIC_ORIGIN||`http://127.0.0.1:${port}`;
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
const service=createPosService({origin,publicMode:origin.startsWith('https:')});
const account=createAccountProxy({origin,token:process.env.ACCOUNT_TOKEN_FILE?fs.readFileSync(process.env.ACCOUNT_TOKEN_FILE,'utf8').trim():null});
const root=path.resolve('pos/web/dist');
function reply(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));}
async function body(req,limit=8192,array=false){const parts=[];let bytes=0;for await(const part of req){bytes+=part.length;if(bytes>limit)throw Object.assign(Error(),{status:413});parts.push(part);}const v=JSON.parse(Buffer.concat(parts));if(!v||typeof v!=='object'||(!array&&Array.isArray(v)))throw Object.assign(Error(),{status:400});return v;}
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);
 if(url.pathname==='/api/v2/auth/config'&&!process.env.ACCOUNT_TOKEN_FILE)return reply(res,200,{enabled:false,providers:[]});
 if(await account(req,res))return;
 if(url.search)throw Object.assign(Error(),{status:400});
 if(await service.handle(req,res,body,reply))return;
 if(!['GET','HEAD'].includes(req.method))throw Object.assign(Error(),{status:404});
 const file=path.resolve(root,'.'+(['/','/stake'].includes(url.pathname)?'/index.html':url.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())throw Object.assign(Error(),{status:404});
 const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream';
 serveFile(req,res,file,{'Content-Type':type,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
 }catch(e){if(res.headersSent)res.destroy();else reply(res,e.status||503,{error:'Request unavailable'});}
}).listen(port,'127.0.0.1',()=>console.log('LazyArt portal listening on loopback port '+port));

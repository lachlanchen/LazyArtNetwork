// Immutable release files: declare length and support resumable node-kit downloads.
const fs=require('node:fs'),crypto=require('node:crypto');
const etags=new Map();
function serveFile(req,res,file,headers,{ranges=false}={}){
 const stat=fs.statSync(file),size=stat.size;
 let start=0,end=size-1,status=200;
 if(ranges){
  const key=file+':'+stat.mtimeMs+':'+size;
  let etag=etags.get(key);
  if(!etag){etag='"'+crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')+'"';etags.set(key,etag);}
  headers={...headers,'Accept-Ranges':'bytes','ETag':etag,'Cache-Control':'no-store, no-transform'};
  if(req.headers.range&&(!req.headers['if-range']||req.headers['if-range']===etag)){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   let valid=!!match&&!!(match[1]||match[2]);
   if(valid){
    if(!match[1]){const suffix=Number(match[2]);valid=Number.isSafeInteger(suffix)&&suffix>0;start=Math.max(0,size-suffix);}
    else{start=Number(match[1]);end=match[2]?Number(match[2]):end;valid=Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start<=end;end=Math.min(end,size-1);}
    valid=valid&&start<size&&size>0;
   }
   if(!valid){res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`,'Content-Length':0});res.end();return;}
   status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  }
 }
 res.writeHead(status,{...headers,'Content-Length':Math.max(0,end-start+1)});
 if(size===0){res.end();return;}
 const stream=fs.createReadStream(file,{start,end});
 stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
module.exports={serveFile};

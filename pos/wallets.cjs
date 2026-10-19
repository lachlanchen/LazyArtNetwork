// Creates only new, isolated community-network wallets. Never loads existing ones.
const fs=require('node:fs'),path=require('node:path');
const{ethers}=require('ethers');
function bech32(address,prefix='cosmos'){
 const values=[];let acc=0,bits=0;for(const byte of ethers.getBytes(address)){acc=(acc<<8)|byte;bits+=8;while(bits>=5){bits-=5;values.push((acc>>bits)&31);}}if(bits)values.push((acc<<(5-bits))&31);
 const expanded=[...prefix].map(c=>c.charCodeAt(0)>>5).concat(0,[...prefix].map(c=>c.charCodeAt(0)&31));let chk=1;
 for(const v of [...expanded,...values,0,0,0,0,0,0]){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((top>>>i)&1)chk^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][i];}chk^=1;
 const chars='qpzry9x8gf2tvdw0s3jn54khce6mua7l';return prefix+'1'+[...values,...Array.from({length:6},(_,i)=>(chk>>>(5*(5-i)))&31)].map(v=>chars[v]).join('');
}
module.exports={bech32};
if(require.main===module){const dir=process.argv[2];if(!dir)throw Error('Protected output directory required');const result={};for(const name of ['faucet','treasury']){const key=path.join(dir,name+'.key');if(fs.existsSync(key))throw Error('Existing wallet preserved');const w=ethers.Wallet.createRandom();fs.writeFileSync(key,w.privateKey+'\n',{mode:0o600,flag:'wx'});result[name]=w.address;result[name+'Cosmos']=bech32(w.address);}console.log(JSON.stringify(result));}

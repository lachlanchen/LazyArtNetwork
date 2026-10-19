// Offline unsigned CREATE plan. No network connection, key access, signing or broadcast.
const fs=require('node:fs'),path=require('node:path');
const {ethers}=require('ethers');
const names=['LazyArtGovernance','LazyArtGovernance','TreasuryVault','LazyArtCoinV2','LazyArtModuleRegistry','FunDGrantVault','CommunityClaimVault','TaskEscrow'];
function buildPlan(m,artifacts){
 if(m.schema_version!==1||m.network?.chain_id!==1||m.broadcast_enabled!==false)throw Error('Expected disabled Ethereum candidate manifest');
 const address=(v,label)=>{if(!ethers.isAddress(v)||v===ethers.ZeroAddress)throw Error('Set '+label);return ethers.getAddress(v);};
 const units=(v,label)=>{if(typeof v!=='string'||!/^\d+(?:\.\d{1,18})?$/.test(v))throw Error('Set decimal string '+label);return ethers.parseUnits(v,18);};
 const integer=(v,label)=>{if(!Number.isSafeInteger(v)||v<=0)throw Error('Set positive integer '+label);return v;};
 const deployer=address(m.deployment.deployer,'deployment.deployer'),nonce=m.deployment.starting_nonce;
 if(!Number.isSafeInteger(nonce)||nonce<0)throw Error('Set starting nonce');
 const proposer=address(m.governance.proposer_multisig,'proposer_multisig'),executor=address(m.governance.executor,'executor');
 const guardian=address(m.governance.mint_guardian,'mint_guardian'),moduleGuardian=address(m.governance.module_guardian,'module_guardian');
 const routine=integer(m.governance.routine_delay_seconds,'routine_delay'),slow=integer(m.governance.module_change_delay_seconds,'module_delay');if(slow<=routine)throw Error('Module-change delay must exceed routine delay');
 const t=m.token;if(t.name!=='LazyArtCoin'||t.symbol!=='LAC'||t.decimals!==18)throw Error('Candidate token identity mismatch');
 const initial=units(t.initial_supply_whole_tokens,'initial_supply'),lifetime=units(t.lifetime_gross_cap_whole_tokens,'lifetime_cap'),year=units(t.rolling_year_gross_cap_whole_tokens,'rolling_cap'),epoch=units(t.epoch_gross_cap_whole_tokens,'epoch_cap'),allowance=units(t.initial_epoch_allowance_whole_tokens,'allowance'),seconds=integer(t.epoch_seconds,'epoch_seconds');
 if(lifetime>(1n<<192n)-1n||lifetime===0n||year===0n||year>lifetime||epoch===0n||epoch>year||allowance>epoch||initial>allowance||seconds>365*86400)throw Error('Invalid monetary envelope');
 const a=names.map((_,i)=>ethers.getCreateAddress({from:deployer,nonce:nonce+i}));
 const campaign=m.claims.campaign_id;if(!/^0x[0-9a-fA-F]{64}$/.test(campaign)||campaign===ethers.ZeroHash)throw Error('Set campaign ID');
 const attestor=address(m.claims.attestor,'claims.attestor'),budget=units(m.claims.campaign_budget_whole_tokens,'campaign budget'),limit=units(m.claims.per_claim_limit_whole_tokens,'per claim'),taskLimit=units(m.tasks.per_task_limit_whole_tokens,'per task');
 if(budget===0n||limit===0n||limit>budget||taskLimit===0n)throw Error('Invalid module limits');
 const args=[[routine,[proposer],[executor]],[slow,[proposer],[executor]],[a[0],moduleGuardian],[a[2],a[0],guardian,initial,[lifetime,year,epoch,allowance,seconds]],[a[1]],[a[3],a[0],a[2]],[a[3],attestor,campaign,budget,limit,a[0]],[a[3],a[0],moduleGuardian,taskLimit]];
 const transactions=names.map((name,i)=>{const art=artifacts[name];if(!art)throw Error('Compile candidate first');const iface=new ethers.Interface(art.abi);const data='0x'+art.evm.bytecode.object+iface.encodeDeploy(args[i]).slice(2);return{index:i,contract:name,predicted_address:a[i],chainId:1,from:deployer,nonce:nonce+i,value:'0',data,gas_estimate:null,fee_preview:null};});
 return{schema_version:1,kind:'unsigned offline constructor plan',broadcast_enabled:false,ready_for_broadcast:false,transactions,requires:['Verify current deployer nonce and all predicted contract addresses','Verify multisig custody and signer roles','Independent security review','Fork simulation, gas estimates and current fee preview','Owner review of exact transactions','Source verification after deployment'],preserves_existing_LAC:true,automatic_migration:false};
}
module.exports={buildPlan};
if(require.main===module){try{const input=process.argv[2];if(!input)throw Error('Usage: node contracts-v2/plan.cjs <completed-decision-file>');const m=JSON.parse(fs.readFileSync(input)),artifacts=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../.private/v2/contracts.json'))).contracts,result=buildPlan(m,artifacts);const out=path.resolve(__dirname,'../.private/v2/unsigned-plan.json');fs.writeFileSync(out,JSON.stringify(result,null,2),{mode:0o600});console.log('Prepared eight unsigned deployment records in '+out+'; no transaction sent.');}catch(e){console.error(e.message);process.exitCode=1;}}

const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(__dirname + '/../bestaetigung.js', 'utf8');
async function scenario({hash = '#token_hash=' + 'a'.repeat(64), status = 200, fail = false, mobile = false} = {}) {
  let calls = 0, callback, sent, cleaned;
  const elements = Object.fromEntries(['title','message','confirm','app'].map(id => [id,{hidden:true,disabled:false,textContent:'',addEventListener(_,fn){callback=fn;}}]));
  vm.runInNewContext(source, {
    document:{getElementById:id=>elements[id]}, location:{hash,pathname:'/bestaetigung.html'},
    history:{replaceState:(_,__,url)=>{cleaned=url;}}, navigator:{userAgent:mobile?'iPhone':'Windows Firefox'},
    URLSearchParams, AbortController, setTimeout, clearTimeout,
    fetch:async (_,options)=>{calls++;sent=options;if(fail)throw Error('Offline');return {status,ok:status===200,json:async()=>({user:{email_confirmed_at:'2026-10-05T12:00:00Z'}})};},
  });
  assert.equal(calls,0,'Opening the email must not consume the token');
  assert.equal(cleaned,'/bestaetigung.html');
  if (hash) await callback?.();
  return {elements,calls,sent,callback};
}
(async()=>{
  const pc=await scenario();assert.equal(pc.calls,1);assert.match(pc.elements.title.textContent,/wurde bestätigt/);assert.equal(pc.elements.app.hidden,true);assert.equal(pc.sent.credentials,'omit');assert.equal(JSON.parse(pc.sent.body).type,'email');
  await pc.callback();assert.equal(pc.calls,1);
  const phone=await scenario({mobile:true});assert.equal(phone.elements.app.hidden,false);
  for(const status of [400,403,422]){const x=await scenario({status});assert.match(x.elements.title.textContent,/nicht mehr gültig/);assert.equal(x.elements.confirm.hidden,true);}
  for(const options of [{status:500},{fail:true}]){const x=await scenario(options);assert.match(x.elements.title.textContent,/gerade nicht möglich/);assert.equal(x.elements.confirm.disabled,false);}
  for(const hash of ['', '#token_hash=bad', '#token_hash=<script>']){const x=await scenario({hash});assert.equal(x.calls,0);assert.equal(x.elements.confirm.hidden,true);}
  console.log('10 confirmation scenarios passed; no automatic verification or desktop app redirect');
})();

import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from './worker.mjs';
const origin='https://broker.example',env={BROKER_COOKIE_KEY:'ab'.repeat(32)},state='c'.repeat(64),uid='owner';
function jar(response,previous=''){const values=new Map(previous.split('; ').filter(Boolean).map(v=>v.split('=')));for(const c of response.headers.getSetCookie()){const [part]=c.split(';');const [name,value]=part.split('=');if(value)values.set(name,value);else values.delete(name);}return [...values].map(([k,v])=>k+'='+v).join('; ');}
function request(path,cookies='',options={}){return new Request(origin+path,{...options,headers:{'oai-authenticated-user-id':uid,Cookie:cookies,...options.headers}});}
function nonce(html){return html.match(/name="nonce" value="([a-f0-9]+)"/)[1];}
async function setup(type='web',cookies=''){const r=await handle(request('/?state='+state+'&client_id=client_id&type='+type,cookies),env);return {cookies:jar(r,cookies),nonce:nonce(await r.text())};}
function form(fields){return {method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields).toString()};}
const token={access_token:'fake-access-token',token_type:'bearer',expires_in:3600,scope:'identity read',refresh_token:'fake-refresh'};
test('web app uses code flow, exchanges secret privately, and remembers encrypted credentials',async()=>{
 const start=await setup();const response=await handle(request('/start',start.cookies,form({nonce:start.nonce,type:'web',client_id:'client_id',client_secret:'fake-secret',remember:'yes'})),env);
 const auth=new URL(response.headers.get('Location'));assert.equal(auth.searchParams.get('response_type'),'code');assert.equal(auth.searchParams.has('client_secret'),false);assert.equal(auth.searchParams.get('redirect_uri'),'https://mikolajwichrowski.github.io/reddit-relay/');
 const cookies=jar(response,start.cookies);assert.equal(cookies.includes('fake-secret'),false);
 let exchange;
 const callback=await handle(request('/exchange?code=auth-code&state='+state,cookies),env,async(url,options)=>{exchange=options;assert.equal(url,'https://www.reddit.com/api/v1/access_token');return Response.json(token);});
 assert.equal(callback.status,303);assert.equal(exchange.headers.Authorization,'Basic '+btoa('client_id:fake-secret'));assert.equal(new URLSearchParams(exchange.body).get('grant_type'),'authorization_code');
 const result=new URL(callback.headers.get('Location'));assert.equal(result.origin,'https://mikolajwichrowski.github.io');assert.equal(new URLSearchParams(result.hash.slice(1)).get('access_token'),'fake-access-token');
 const saved=jar(callback,cookies);assert.equal(saved.includes('fake-secret'),false);assert.equal(saved.includes('fake-refresh'),false);assert.ok(saved.includes('__Host-relay_connection='));
 const reconnect=await setup('web',saved);let grant;
 const refreshed=await handle(request('/start',reconnect.cookies,form({nonce:reconnect.nonce,type:'web',client_id:'client_id',remember:'yes'})),env,async(_url,options)=>{grant=new URLSearchParams(options.body).get('grant_type');return Response.json(token);});assert.equal(grant,'refresh_token');assert.equal(refreshed.status,303);
});
test('script clients use client credentials and accept wildcard read scopes',async()=>{
 const s=await setup('script');let grant;const r=await handle(request('/start',s.cookies,form({nonce:s.nonce,type:'script',client_id:'client_id',client_secret:'fake-secret'})),env,async(_u,options)=>{grant=new URLSearchParams(options.body).get('grant_type');return Response.json({...token,scope:'*'});});assert.equal(grant,'client_credentials');assert.equal(r.status,303);assert.equal(new URL(r.headers.get('Location')).hostname,'mikolajwichrowski.github.io');
});
test('missing identity, bad origin, tampered cookies, and mismatched state fail closed',async()=>{
 assert.equal((await handle(new Request(origin+'/'),env)).status,401);const s=await setup();
 assert.equal((await handle(request('/start',s.cookies,{...form({nonce:s.nonce}),headers:{Origin:'https://attacker.test','Content-Type':'application/x-www-form-urlencoded'}}),env)).status,403);
 assert.equal((await handle(request('/start',s.cookies,form({nonce:'wrong'})),env)).status,403);
 assert.equal((await handle(request('/exchange?code=code&state=wrong',s.cookies),env)).status,403);
 assert.equal((await handle(request('/start',s.cookies+'tampered',form({nonce:s.nonce})),env)).status,403);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizationURL,readCallback} from './auth.js';
test('installed OAuth URL uses minimum read permissions and no secret',()=>{
 const url=new URL(authorizationURL('my_client_id','https://example.com/reader/','nonce'));
 assert.equal(url.origin,'https://www.reddit.com');assert.equal(url.searchParams.get('response_type'),'token');assert.equal(url.searchParams.get('scope'),'identity read');assert.equal(url.searchParams.get('redirect_uri'),'https://example.com/reader/');assert.equal(url.searchParams.has('client_secret'),false);
 assert.throws(()=>authorizationURL('','https://example.com/','nonce'));
 assert.throws(()=>authorizationURL('my_client_id','http://example.com/','nonce'));
});
test('OAuth callback validates state, request age, token type, expiry and read scope',()=>{
 const pending={state:'nonce',createdAt:1000,remember:true};const hash='#access_token=token&token_type=bearer&expires_in=3600&scope=identity%20read&state=nonce';
 assert.deepEqual(readCallback(hash,pending,2000),{token:'token',expiresAt:3602000,remember:true});
 assert.equal(readCallback('',pending,2000),null);
 assert.throws(()=>readCallback(hash,null,2000));
 assert.throws(()=>readCallback(hash.replace('state=nonce','state=wrong'),pending,2000));
 assert.throws(()=>readCallback(hash,pending,700000));
 assert.throws(()=>readCallback(hash.replace('expires_in=3600','expires_in=-1'),pending,2000));
 assert.throws(()=>readCallback(hash.replace('token_type=bearer','token_type=other'),pending,2000));
 assert.throws(()=>readCallback(hash.replace('identity%20read','identity'),pending,2000));
 assert.throws(()=>readCallback('#error=access_denied&state=nonce',pending,2000),/cancelled/);
});

test('confidential app requests use the fixed private broker and validate returned codes',async()=>{
 const {brokerStartURL,brokerExchangeURL,BROKER_ORIGIN}=await import('./auth.js');
 const state='a'.repeat(64),pending={state,provider:'broker',createdAt:1000};const start=new URL(brokerStartURL('existing_id',state,'web'));assert.equal(start.origin,BROKER_ORIGIN);assert.equal(start.searchParams.get('type'),'web');assert.equal(start.searchParams.has('client_secret'),false);
 assert.equal(new URL(brokerExchangeURL('code=code&state='+state,pending,2000)).origin,BROKER_ORIGIN);
 assert.throws(()=>brokerExchangeURL('code=code&state=wrong',pending,2000));assert.throws(()=>brokerExchangeURL('code=code&state='+state,pending,700000));assert.throws(()=>brokerStartURL('existing_id',state,'unknown'));
});

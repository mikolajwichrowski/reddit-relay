export function authorizationURL(clientId,redirectUri,state){
 if(!/^[A-Za-z0-9_-]{5,128}$/.test(clientId))throw Error('Enter the client ID of your installed Reddit app.');
 const redirect=new URL(redirectUri);if(redirect.protocol!=='https:'&&!(['localhost','127.0.0.1'].includes(redirect.hostname)&&redirect.protocol==='http:'))throw Error('Reddit sign-in needs HTTPS or localhost.');
 const url=new URL('https://www.reddit.com/api/v1/authorize.compact');
 for(const [key,value] of Object.entries({client_id:clientId,response_type:'token',state,redirect_uri:redirect.href,scope:'identity read',duration:'temporary'}))url.searchParams.set(key,value);
 return url.href;
}
export function readCallback(hash,pending,now=Date.now()){
 const params=new URLSearchParams(hash.replace(/^#/,''));
 if(!params.has('access_token')&&!params.has('error'))return null;
 if(!pending||!pending.state||params.get('state')!==pending.state||!Number.isFinite(pending.createdAt)||now-pending.createdAt>600000||now<pending.createdAt)throw Error('Sign-in could not be verified. Connect with Reddit again in the same browser.');
 if(params.has('error'))throw Error(params.get('error')==='access_denied'?'Reddit sign-in was cancelled.':'Reddit could not authorize this app. Check its type, client ID, redirect URL, and API approval.');
 const token=params.get('access_token'),seconds=Number(params.get('expires_in'));
 if(params.get('token_type')?.toLowerCase()!=='bearer'||!token||/\s/.test(token)||token.length>4096||!Number.isFinite(seconds)||seconds<=0||seconds>86400)throw Error('Reddit returned an invalid access token. Try connecting again.');
 const scope=(params.get('scope')||'').split(/[ ,]+/);if(!scope.includes('read')&&!scope.includes('*'))throw Error('Reddit did not grant permission to read posts. Connect again and approve read access.');
 return {token,expiresAt:now+seconds*1000,remember:pending.remember===true};
}
export const BROKER_ORIGIN='https://relay-reddit-connect-mw.mikolajwichrowski.chatgpt.site';
export function brokerStartURL(clientId,state,type){
 if(clientId&&!/^[A-Za-z0-9_-]{5,128}$/.test(clientId))throw Error('Enter a valid Reddit client ID, or leave it empty to use the saved private connection.');
 if(!['web','script'].includes(type)||!/^[a-f0-9]{64}$/.test(state))throw Error('Invalid connection request.');
 const url=new URL('/',BROKER_ORIGIN);url.searchParams.set('state',state);url.searchParams.set('type',type);if(clientId)url.searchParams.set('client_id',clientId);return url.href;
}
export function brokerExchangeURL(search,pending,now=Date.now()){
 const params=new URLSearchParams(search);if(!params.has('code')&&!params.has('error'))return null;
 if(pending?.provider!=='broker'||!pending.state||params.get('state')!==pending.state||!Number.isFinite(pending.createdAt)||now-pending.createdAt>600000||now<pending.createdAt)throw Error('This Reddit connection expired or could not be verified. Connect again from Settings.');
 const code=params.get('code');if(!params.has('error')&&(!code||code.length>2048||/\s/.test(code)))throw Error('Reddit returned an invalid authorization code.');
 const url=new URL('/exchange',BROKER_ORIGIN);url.searchParams.set('state',pending.state);if(params.has('error'))url.searchParams.set('error','access_denied');else url.searchParams.set('code',code);return url.href;
}

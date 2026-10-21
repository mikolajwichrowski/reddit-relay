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
 const scope=(params.get('scope')||'').split(/[ ,]+/);if(!scope.includes('read'))throw Error('Reddit did not grant permission to read posts. Connect again and approve read access.');
 return {token,expiresAt:now+seconds*1000,remember:pending.remember===true};
}

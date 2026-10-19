import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaFor,listingURL,safeURL} from './media.js';
test('safe media resolution across Reddit and external hosts',()=>{
 assert.equal(safeURL('javascript:alert(1)'), '');
 for(const ext of ['jpg','png','gif','webp','avif'])assert.equal(mediaFor({url:`https://i.redd.it/test.${ext}?x=1`}).type,'image');
 assert.equal(mediaFor({url:'https://a.test/a.webm'}).type,'video');
 assert.equal(mediaFor({url:'https://a.test/a.m3u8'}).hls,'https://a.test/a.m3u8');
 assert.equal(mediaFor({url:'https://a.test/a.mpd'}).dash,'https://a.test/a.mpd');
 assert.equal(mediaFor({secure_media:{reddit_video:{fallback_url:'https://v.redd.it/a.mp4'}}}).native,true);
 assert.deepEqual(mediaFor({gallery_data:{items:[{media_id:'a'},{media_id:'gone'}]},media_metadata:{a:{s:{u:'https://a.test/a.webp'}}}}).images,['https://a.test/a.webp']);
 assert.equal(mediaFor({crosspost_parent_list:[{url:'https://a.test/a.gif'}]}).type,'image');
 assert.equal(mediaFor({url:'https://youtu.be/aqz-KE-bpKQ'}).type,'embed');
 assert.equal(mediaFor({url:'https://youtube.com.evil.test/watch?v=aqz-KE-bpKQ'}).type,'link');
 assert.equal(mediaFor({url:'https://vimeo.com/12345'}).type,'embed');
 assert.equal(mediaFor({url:'https://redgifs.com/watch/example'}).type,'link');
});
test('query encoding, mature content, and authenticated requests',()=>{
 const u=new URL(listingURL({query:'cats & dogs',adult:true,after:'t3_a',authenticated:true}));
 assert.equal(u.hostname,'oauth.reddit.com');assert.equal(u.searchParams.get('q'),'cats & dogs');assert.equal(u.searchParams.get('include_over_18'),'on');assert.equal(u.searchParams.get('after'),'t3_a');
 assert.equal(new URL(listingURL({feed:'EarthPorn',sort:'top'})).pathname,'/r/EarthPorn/top.json');
});

test('animated previews, extensionless images, and self-post attachments stay inline',()=>{
 assert.equal(mediaFor({url:'https://i.redd.it/a.gif',preview:{images:[{variants:{mp4:{source:{url:'https://i.redd.it/a.mp4'}}}}]}}).animated,true);
 assert.equal(mediaFor({url:'https://i.imgur.com/a.gifv'}).mp4,'https://i.imgur.com/a.mp4');
 assert.equal(mediaFor({url:'https://example.com/image',post_hint:'image',preview:{images:[{source:{url:'https://preview.redd.it/a.webp'}}]}}).type,'image');
 assert.deepEqual(mediaFor({is_self:true,media_metadata:{a:{s:{mp4:'https://a.test/a.mp4',gif:'https://a.test/a.gif'}}}}).images,['https://a.test/a.mp4']);
});

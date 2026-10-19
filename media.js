export function decode(value = '') { return String(value).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
export function safeURL(value) { try { const u = new URL(decode(value)); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
export function mediaFor(post) {
  const p = post.crosspost_parent_list?.[0] || post;
  const url = safeURL(p.url_overridden_by_dest || p.url);
  const video = p.secure_media?.reddit_video || p.media?.reddit_video || p.preview?.reddit_video_preview;
  if (video) return {type: 'video', mp4: safeURL(video.fallback_url), hls: safeURL(video.hls_url), dash: safeURL(video.dash_url), native: true};
  if (p.gallery_data && p.media_metadata) {
    const images = p.gallery_data.items.map(item => p.media_metadata[item.media_id]).filter(Boolean).map(m => safeURL(m.s?.gif || m.s?.u || m.s?.mp4)).filter(Boolean);
    if (images.length) return {type:'gallery', images};
  }
  if (/\.(mp4|webm|ogv|mov)(?:[?#]|$)/i.test(url)) return {type:'video',mp4:url};
  if (/\.m3u8(?:[?#]|$)/i.test(url)) return {type:'video',hls:url};
  if (/\.mpd(?:[?#]|$)/i.test(url)) return {type:'video',dash:url};
  if (/\.(jpe?g|png|gif|webp|avif|svg|bmp)(?:[?#]|$)/i.test(url)) return {type:'image',url};
  let u; try { u = new URL(url); } catch { return {type:'text'}; }
  const host = u.hostname.replace(/^www\./,'');
  let id;
  if (host === 'youtu.be') id = u.pathname.slice(1);
  if (host === 'youtube.com' || host === 'm.youtube.com') id = u.searchParams.get('v') || u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1];
  if (id && /^[\w-]{11}$/.test(id)) return {type:'embed',url:`https://www.youtube-nocookie.com/embed/${id}`,provider:'YouTube'};
  if (host === 'vimeo.com' && /^\/\d+$/.test(u.pathname)) return {type:'embed',url:`https://player.vimeo.com/video${u.pathname}`,provider:'Vimeo'};
  const preview = safeURL(p.preview?.images?.[0]?.source?.url);
  // Third-party providers change their embed contracts; keep the original link instead of scraping them.
  return {type: p.is_self ? 'text' : 'link', url, preview, provider:host};
}
export function listingURL({feed='popular',sort='hot',query='',period='day',after='',adult=false,authenticated=false}) {
  const base = authenticated ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const path = query ? '/search.json' : `/r/${encodeURIComponent(feed)}/${sort}.json`;
  const url = new URL(path, base);
  Object.entries({limit:24,raw_json:1,include_over_18:adult?'on':'off',t:period,...(query?{q:query,sort:sort==='hot'?'relevance':sort==='rising'?'relevance':sort}:{}),...(after?{after}:{})}).forEach(([k,v])=>url.searchParams.set(k,v));
  return url.href;
}

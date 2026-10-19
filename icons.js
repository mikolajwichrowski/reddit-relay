const paths = {
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5z"/>',
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 bookmark:'<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
 flame:'<path d="M12 3c2 5-2 5 0 9 1-1 2-2 2-4 4 3 5 5 5 8a7 7 0 0 1-14 0c0-4 3-7 7-13z"/>',
 sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM21 2v4M19 4h4"/>',
 arrow:'<path d="M12 20V4m-6 6 6-6 6 6"/>',
 trend:'<path d="m3 17 6-6 4 4 8-10m-7 0h7v7"/>',
 comment:'<path d="M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-.8L3 21l1.8-5A9 9 0 1 1 21 11z"/>',
 external:'<path d="M14 3h7v7m0-7L11 13M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 volume:'<path d="m11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 muted:'<path d="m11 4-6 5H2v6h3l6 5zM16 9l6 6m0-6-6 6"/>',
 play:'<path d="m8 4 12 8-12 8z"/>',
 key:'<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-3-3 3-3m-6 0 3-3"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
};
export function icon(name) {
 const template=document.createElement('template');
 template.innerHTML=`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.compass}</svg>`;
 return template.content.firstElementChild;
}
export function labelIcon(node,name,text){node.replaceChildren(icon(name),document.createTextNode(text?' '+text:''));return node;}

'use strict';
/* ====== Watch / listen together room ======
   Everybody opens the SAME file from their own device; only tiny control messages go through the server.
   Room chat + voice (Opus when the browser can, voice-activated) are separate from calls. v2: free rooms, invites, own song uploads. */
Object.assign(IC,{
  film:"M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z",
  mic:"M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z",
  micoff:"M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3 3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z",
  nxt:"M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",prv:"M6 6h2v12H6zm3.5 6 8.5 6V6z",
  fs:"M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z",
  cc:"M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z",
  list:"M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
  rep:"M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  link:"M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  inv:"M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  lock:"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  mini:"M19 13H5v-2h14v2z",crown:"M5 16 3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"});
const RROOM=['❤️','😂','😮','👏','🔥','😢','👍','🎉'];
const R={on:false,min:false,id:null,chat:null,meta:null,st:null,members:[],log:[],pool:[],files:{},urls:new Map(),off:0,rtt:0,calibrated:false,tab:'chat',unread:0,
  vol:+lsGet('wd-rvol','1'),duck:lsGet('wd-rduck','1')==='1',autoup:lsGet('wd-rautoup','1')==='1',duckUntil:0,voices:{},mic:null,cam:null,tiles:{},sock:null,el:null,elId:null,live:{},subs:null,timers:[],
  invites:[],hq:false,songs:null,usage:null,wl:null,msig:'',bufSent:false,bufT:0};
const rsv=()=>Date.now()+R.off;
const rtm=s=>{s=Math.max(0,Math.floor(s||0));const hh=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(hh?hh+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
const rcur=()=>R.st&&R.st.queue.find(i=>i.id===R.st.cur)||null;
const rcan=()=>!!R.st&&(R.st.ctl==='all'||R.st.host===S.me.id);
const rhost=()=>!!R.st&&R.st.host===S.me.id;
const rurl=f=>{if(!R.urls.has(f))R.urls.set(f,URL.createObjectURL(f));return R.urls.get(f)};
const b64=u=>{let s='';for(let i=0;i<u.length;i+=0x4000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x4000));return btoa(s)};
const rIsAudio=f=>/^audio\//.test(f.type)||/\.(mp3|m4a|aac|flac|wav|ogg|opus|weba|wma)$/i.test(f.name);
function rctl(a,extra){if(!R.on)return Promise.resolve();return call('room_ctl',{room:R.id,a,...(extra||{})}).catch(e=>{toast(e.message)})}
async function rCalib(){let best=null;
  for(let i=0;i<5;i++){const t0=performance.now(),w0=Date.now();
    try{const r=await call('room_time'),rtt=performance.now()-t0,off=r.t-(w0+rtt/2);if(!best||rtt<best.rtt)best={rtt,off}}catch{}
    await new Promise(r=>setTimeout(r,80))}
  if(best){R.off=best.off;R.rtt=best.rtt;R.calibrated=true}}
/* heartbeat: also the server's authoritative timeline, so a missed event can never leave us out of sync */
async function rBeat(){
  if(!R.on||R.beating)return;R.beating=true;
  try{const t0=performance.now(),w0=Date.now(),r=await call('room_sync',{room:R.id}),rtt=performance.now()-t0,off=r.state.now-(w0+rtt/2);
    if(!R.calibrated||Math.abs(off-R.off)>400){R.off=off;R.calibrated=true}else if(rtt<=Math.max(R.rtt*1.5,80))R.off+=(off-R.off)*.25;
    R.rtt=R.rtt?R.rtt*.8+rtt*.2:rtt;
    const sig=JSON.stringify(r.members);if(sig!==R.msig){R.msig=sig;R.members=r.members;rDrawPeople();rDrawHead()}
    if(!R.st||r.state.v!==R.st.v)rApply(r.state)}
  catch(e){if(e.server)rRejoin()}finally{R.beating=false}}

/* ---------- matching local files to queue items ---------- */
const libUrl=rel=>'/roomaudio/'+rel.split('/').map(encodeURIComponent).join('/')+'?k='+encodeURIComponent(S.mediaKey||'');
const LIBFILE={lib:1};
function rMatch(it){
  if(it.lib)return LIBFILE;
  if(R.files[it.id])return R.files[it.id];
  const c=R.pool.filter(f=>f.size===it.size),f=c.find(x=>x.name===it.name)||c[0];
  if(f)R.files[it.id]=f;return f||null}
function rProbe(f){return new Promise(res=>{
  const isA=rIsAudio(f);
  const v=document.createElement(isA?'audio':'video');v.preload='metadata';
  const done=d=>{clearTimeout(t);res({name:f.name,size:f.size,dur:isFinite(d)?d:0,kind:isA?'audio':'video'})};const t=setTimeout(()=>done(0),8000);
  v.onloadedmetadata=()=>done(v.duration);v.onerror=()=>done(0);v.src=rurl(f)})}
function rUploadOne(f){return new Promise((res,rej)=>{
  const x=new XMLHttpRequest();x.open('POST','/roomupload?'+new URLSearchParams({k:S.mediaKey,name:f.name}));
  x.upload.onprogress=e=>{if(e.lengthComputable)toast('آپلود «'+f.name+'» … '+fa(Math.round(e.loaded/e.total*100))+'٪',false)};
  x.onload=()=>{let j={};try{j=JSON.parse(x.responseText)}catch{}x.status===200&&j.ok?res(j):rej(new Error(j.error||'آپلود ناموفق بود'))};
  x.onerror=()=>rej(new Error('ارتباط حین آپلود قطع شد'));x.send(f)})}
async function rFiles(files,forItem){
  files=[...files];if(!files.length||!R.st)return;
  if(forItem){const f=files[0];
    if(f.size!==forItem.size&&!confirm('حجم این فایل با فایل «'+forItem.name+'» فرق داره؛ یعنی احتمالاً نسخه دیگه‌ایه و سینک نمی‌مونه. با این حال استفاده بشه؟'))return;
    if(!R.pool.some(p=>p.name===f.name&&p.size===f.size&&p.lastModified===f.lastModified))R.pool.push(f);
    R.files[forItem.id]=f;files=files.slice(1)}
  // audio files go to the server (private to me, in my song folder) so EVERYBODY can hear them without owning the file
  const up=R.autoup?files.filter(f=>rIsAudio(f)&&f.size<=80*1048576):[];
  let upN=0;const failed=new Set();
  for(const f of up){
    try{const j=await rUploadOne(f);await rctl('add',{items:[{lib:j.rel}]});upN++;R.songs=null}
    catch(e){toast(e.message);failed.add(f)}}
  const local=files.filter(f=>!up.includes(f)||failed.has(f));
  for(const f of local)if(!R.pool.some(p=>p.name===f.name&&p.size===f.size&&p.lastModified===f.lastModified))R.pool.push(f);
  const fresh=local.filter(f=>!R.st.queue.some(it=>it.size===f.size));
  if(fresh.length){const items=await Promise.all(fresh.map(rProbe));await rctl('add',{items});toast(fa(items.length)+' مورد به صف اضافه شد (بقیه باید همین فایل رو داشته باشن)',false)}
  else if(upN)toast(fa(upN)+' آهنگ آپلود شد و به صف رفت؛ همه می‌شنون',false);
  rLoad();rDrawAll();rFlags()}
function rPick(forItem){R.pickFor=forItem||null;R.inp.value='';R.inp.click()}
function rFlags(){if(!R.on)return;const it=rcur(),have=!!(it&&rMatch(it));if(R.haveSent!==have){R.haveSent=have;call('room_flags',{room:R.id,have}).catch(()=>{})}}

/* ---------- the media element + synchronisation ---------- */
function rLoad(){
  const it=rcur(),key=it?it.id:null;
  if(R.elId===key&&(R.el||!it||!rMatch(it)))return;
  if(R.el){try{R.el.pause()}catch{}R.el.remove();R.el=null}R.elId=key;R.err=null;R.tap=false;R.subs=null;
  if(it){const f=rMatch(it);
    if(f){const v=document.createElement('video');Object.assign(v,{playsInline:true,preload:'auto',src:it.lib?libUrl(it.lib):rurl(f),className:'rvid'});v.setAttribute('playsinline','');
      v.onended=()=>rctl('ended',{item:it.id});
      v.onerror=()=>{R.err='این فایل روی مرورگر پخش نمی‌شه (بهترین فرمت MP4 با H.264 و AAC یا MP3 است).';rDrawStage()};
      v.onloadedmetadata=()=>{if(it.dur&&Math.abs(v.duration-it.dur)>2)toast('طول این فایل با فایل بقیه فرق داره؛ ممکنه دقیق سینک نشه',false);rSync(true);rDrawStage()};
      v.onclick=()=>rToggle();
      R.el=v;R.screen.prepend(v);rVol()}}
  rFlags();rDrawStage();rMedia()}
function rExpected(){const s=R.st;if(!s)return 0;return Math.max(0,s.playing?s.pos+(rsv()-s.at)*s.rate/1000:s.pos)}
function rSync(hard){
  const v=R.el,s=R.st;if(!v||!s||v.readyState<1)return;
  const tgt=Math.min(rExpected(),(v.duration||1e9)-.05),diff=v.currentTime-tgt;
  if(s.playing){
    if((hard&&Math.abs(diff)>.25)||Math.abs(diff)>1.2){v.currentTime=tgt;v.playbackRate=s.rate}
    else v.playbackRate=Math.abs(diff)>.12?s.rate*(1-Math.max(-.1,Math.min(.1,diff*.4))):s.rate;
    if(v.paused)v.play().then(()=>{if(R.tap){R.tap=false;rDrawStage()}}).catch(()=>{if(!R.tap){R.tap=true;rDrawStage()}})}
  else{if(!v.paused)v.pause();if(Math.abs(diff)>.1)v.currentTime=tgt}}
function rToggle(){
  if(!R.st||!R.st.cur)return rPick();if(!rcan())return toast('الان فقط میزبان کنترل می‌کنه');
  const pos=R.el?R.el.currentTime:rExpected();rctl(R.st.playing||R.st.held?'pause':'play',{pos})}
function rVol(){if(!R.el)return;const k=R.duck&&performance.now()<R.duckUntil?.3:1;try{R.el.volume=Math.max(0,Math.min(1,R.vol*k))}catch{}}
/* phone: keep the screen on while watching, show lock-screen controls */
async function rWake(){try{if(R.on&&!R.wl&&!R.wlBusy&&navigator.wakeLock&&document.visibilityState==='visible'){R.wlBusy=true;R.wl=await navigator.wakeLock.request('screen');R.wl.addEventListener('release',()=>{R.wl=null})}}catch{}R.wlBusy=false}
function rWakeOff(){try{R.wl&&R.wl.release()}catch{}R.wl=null}
function rMedia(){
  if(!('mediaSession' in navigator)||!R.on)return;const it=rcur();
  try{navigator.mediaSession.metadata=it?new MediaMetadata({title:it.name,artist:R.meta?R.meta.title:'Windroida',album:'اتاق تماشا'}):null;
    const set=(a,f)=>{try{navigator.mediaSession.setActionHandler(a,f)}catch{}};
    set('play',()=>{if(R.st&&!R.st.playing)rToggle()});set('pause',()=>{if(R.st&&R.st.playing)rToggle()});
    set('nexttrack',()=>rcan()?rctl('next'):0);set('previoustrack',()=>rcan()?rctl('prev'):0)}catch{}}

/* ---------- subtitles (local only; .srt or .vtt, utf-8 or windows-1256) ---------- */
async function rSubs(file){
  const buf=await file.arrayBuffer();let t=new TextDecoder('utf-8').decode(buf);if(t.includes('�')){try{t=new TextDecoder('windows-1256').decode(buf)}catch{}}
  t=t.replace(/^﻿/,'').replace(/\r/g,'');
  if(!/^WEBVTT/.test(t))t='WEBVTT\n\n'+t.replace(/(\d+:\d+:\d+),(\d+)/g,'$1.$2');
  const v=R.el;if(!v)return toast('اول فایل ویدیو باید باز باشه');
  [...v.querySelectorAll('track')].forEach(x=>x.remove());
  const u=URL.createObjectURL(new Blob([t],{type:'text/vtt'})),tr=document.createElement('track');tr.kind='subtitles';tr.src=u;tr.default=true;v.append(tr);
  tr.addEventListener('load',()=>{tr.track.mode='showing'});tr.track.mode='showing';toast('زیرنویس فعال شد',false)}

/* ---------- state / events ---------- */
function rApply(st,act){
  if(R.st&&st.v<R.st.v)return;const prev=R.st;R.st=st;R.meta=st.meta||R.meta;
  if(prev&&prev.host!==st.host)rSys(rName(st.host)+' میزبان شد');
  if(act==='hold')rSys('⏳ پخش تا بارگذاری دوستت منتظر موند');
  rLoad();rSync(true);rDrawAll();rFlags()}
function rName(id){const m=R.members.find(x=>x.id===id);return m?m.name:userName(id)}
function rSys(t){R.log.push({sys:1,text:t});rDrawChat()}
function rLive(e){R.live[e.chat_id]=e.live?{room:e.room,count:e.count,cur:e.cur}:null;rBanner()}
function rInvited(e){
  if(R.on&&R.id===e.room)return;
  R.invites=R.invites.filter(x=>x.room!==e.room);R.invites.push({room:e.room,title:e.title,from:e.from});sfx('recv');rInvCard();
  try{if(document.hidden&&'Notification' in window&&Notification.permission==='granted')new Notification(e.from.name+' تو رو به اتاق تماشا دعوت کرد',{body:e.title})}catch{}}
function rInvCard(){
  let c=$('#rinv');if(!R.invites.length){c&&c.remove();return}
  if(!c){c=h('div',{id:'rinv'});document.body.append(c)}
  const x=R.invites[R.invites.length-1];
  c.replaceChildren(ic('film',22),h('div',{class:'grow'},h('b',{},x.from.name+' دعوتت کرد'),h('small',{},'اتاق «'+x.title+'»'+(R.invites.length>1?' · و '+fa(R.invites.length-1)+' دعوت دیگه':''))),
    h('button',{class:'btn',onclick:()=>{R.invites=R.invites.filter(i=>i!==x);rInvCard();openRoomId(x.room)}},'بپیوند'),
    h('button',{class:'iconbtn',title:'نادیده',onclick:()=>{R.invites.pop();rInvCard()}},ic('close',20)))}
const _onEvent=onEvent;
onEvent=function(e){
  const k=e.event;
  if(k==='room_live')return rLive(e);
  if(k==='room_invite')return rInvited(e);
  if(k&&k.startsWith('room_')){
    if(!R.on||e.room!==R.id)return;
    if(k==='room_state')rApply(e.state,e.act);
    else if(k==='room_members'){
      const old=R.members;R.members=e.members;R.msig=JSON.stringify(e.members);if(e.meta)R.meta=e.meta;Object.keys(R.tiles).forEach(u=>{if(!e.members.some(m=>m.id==u&&m.cam))rTileDel(u)});
      e.members.filter(m=>!old.some(o=>o.id===m.id)).forEach(m=>{if(m.id!==S.me.id){rSys(m.name+' اومد');sfx('recv')}});
      old.filter(o=>!e.members.some(m=>m.id===o.id)).forEach(o=>rSys(o.name+' رفت'));rDrawPeople();rDrawHead()}
    else if(k==='room_chat'){R.log.push(e);if(R.log.length>300)R.log.splice(0,100);if(R.tab!=='chat'||R.min){R.unread++;rDrawTabs()}if(e.from!==S.me.id)sfx('recv');rDrawChat()}
    else if(k==='room_react')rFloat(e.emoji,e.from);
    else if(k==='room_audio')rVoiceIn(e);
    else if(k==='room_video')rCamIn(e);
    else if(k==='room_kicked'){toast('میزبان تو رو از اتاق حذف کرد');rLeave(true)}
    return}
  return _onEvent(e)};
const _logout=logout;logout=function(s){if(R.on)rLeave(true);_logout(s)};

/* ---------- join / leave ---------- */
async function rEnter(r){
  if(R.on&&R.id===r.room.id){R.min=false;rShow();return}
  if(R.on)await rLeave();
  Object.assign(R,{on:true,min:false,id:r.room.id,chat:r.room.chat_id,meta:r.room,st:null,members:r.members,log:r.chat.map(m=>m),pool:[],files:{},tab:'chat',songs:null,unread:0,el:null,elId:null,
    haveSent:null,bufSent:false,bufT:0,sock:ws,calibrated:false,msig:JSON.stringify(r.members),voices:{}});
  R.invites=R.invites.filter(i=>i.room!==R.id);rInvCard();
  rBuild();await rCalib();rApply(r.state);rShow();rPlayInit();rWake();rMedia();
  rHqCheck().then(ok=>{R.hq=ok;if(ok&&R.on)call('room_flags',{room:R.id,hq:true}).catch(()=>{})});
  if(r.created)toast(r.room.kind==='free'?'اتاق ساخته شد؛ از تب «حاضرین» دوستات رو دعوت کن یا لینکش رو بفرست':'اتاق ساخته شد؛ فایل بذار و بقیه رو دعوت کن',false);
  R.timers=[setInterval(rTick,250),setInterval(rDrift,1000),setInterval(rBeat,4000)];rBanner()}
async function rOpen(op,payload){let r;try{r=await call(op,payload)}catch(e){return toast(e.message)}await rEnter(r)}
const openRoom=cid=>R.on&&R.id&&R.chat===cid?(R.min=false,rShow()):rOpen('room_open',{chat_id:cid});
const openRoomId=id=>R.on&&R.id===id?(R.min=false,rShow()):rOpen('room_join',{room:id});
const openRoomNew=title=>rOpen('room_open',{title:(title||'').trim()});
async function rLeave(silent){
  if(!R.on)return;const rid=R.id;R.timers.forEach(clearInterval);R.timers=[];
  rMicOff(true);rCamOff(true);rWakeOff();
  Object.values(R.voices).forEach(V=>{try{V.dec&&V.dec.close()}catch{}});R.voices={};try{R.pctx&&R.pctx.close()}catch{}R.pctx=null;
  if(R.el){try{R.el.pause()}catch{}R.el.remove()}R.el=null;R.on=false;R.min=false;R.id=null;R.chat=null;
  R.urls.forEach(u=>URL.revokeObjectURL(u));R.urls.clear();
  try{if('mediaSession' in navigator)navigator.mediaSession.metadata=null}catch{}
  if(R.root){R.root.remove();R.root=null}$('#roompill')&&$('#roompill').remove();
  if(!silent)try{await call('room_leave',{room:rid})}catch{}rBanner()}
function rShow(){if(!R.root)return;R.root.hidden=R.min;const p=$('#roompill');if(p)p.hidden=!R.min;if(!R.min){rDrawAll();setTimeout(()=>{const l=$('.rlog',R.root);l&&(l.scrollTop=l.scrollHeight)},50)}}
function rMinimize(){R.min=true;rShow();rBanner()}
function rRejoin(){
  if(!R.on||R.rejoining)return;R.rejoining=true;
  call('room_join',{room:R.id}).then(r=>{R.members=r.members;R.msig=JSON.stringify(r.members);R.haveSent=null;R.bufSent=false;rApply(r.state);rBeat();
    if(R.hq)call('room_flags',{room:R.id,hq:true}).catch(()=>{});if(R.mic)call('room_flags',{room:R.id,mic:true}).catch(()=>{});if(R.cam)call('room_flags',{room:R.id,cam:true}).catch(()=>{})})
    .catch(e=>{if(e.server){toast(e.message||'اتاق بسته شده بود');rLeave(true)}}).finally(()=>{R.rejoining=false})}
function rTick(){
  if(!R.on)return;
  if(R.sock!==ws&&ws&&ws.readyState===1){R.sock=ws;rRejoin()}      // reconnected (phone woke up): come back into the room
  rVol();
  if(R.st&&R.st.playing&&!R.wl)rWake();
  // tell the others while my player is still loading, so they can wait for me
  const bn=!!(R.el&&R.st&&(R.st.playing||R.st.held)&&(R.el.readyState<3||R.el.seeking)),t=performance.now();
  if(bn){if(!R.bufT)R.bufT=t}else R.bufT=0;
  const want=bn&&t-R.bufT>700;if(want!==R.bufSent){R.bufSent=want;call('room_flags',{room:R.id,buf:want}).catch(()=>{})}
  if(t-(R.vsweep||0)>10000){R.vsweep=t;for(const k in R.voices){const V=R.voices[k];if(t-V.last>30000){try{V.dec&&V.dec.close()}catch{}delete R.voices[k]}}}
  for(const u in R.tiles){if(+u!==S.me.id&&t-R.tiles[u].seen>4000)rTileDel(u)}
  if(R.min)return;
  const v=R.el,bar=R.seek;if(v&&bar&&!R.drag){const d=v.duration||0;bar.max=d||1;bar.value=v.currentTime;R.tcur.textContent=fa(rtm(v.currentTime));R.tdur.textContent=fa(rtm(d))}
  if(R.playIc){const pl=!!(R.st&&R.st.playing);if(R.playIc.dataset.p!==String(pl)){R.playIc.dataset.p=pl;setIcon(R.playIc,pl?'pause':'play',30)}}
  R.root.classList.toggle('playing',!!(R.st&&R.st.playing&&R.el&&!R.el.paused));
  if(R.chip){const w=R.members.filter(m=>m.buf).map(m=>m.name);let c='';
    if(R.st&&R.st.held&&w.length)c='⏳ منتظر '+w.join('، ');
    else if(R.el&&R.st&&R.st.playing){const d=Math.abs(R.el.currentTime-rExpected());c=d<.2?'⚡ همگام':'↻ '+fa(d.toFixed(1))+' ثانیه اختلاف'}
    if(R.chip.textContent!==c)R.chip.textContent=c}
  document.querySelectorAll('.rpeep.talk').forEach(e=>{if(t>(+e.dataset.until||0))e.classList.remove('talk')})}
function rDrift(){if(R.on&&R.st&&R.st.playing)rSync(false)}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&R.on){rWake();rBeat();rSync(true);rPlayInit();if(R.pctx&&R.pctx.state!=='running')R.pctx.resume&&R.pctx.resume()}});

/* ---------- UI ---------- */
const rKind=k=>({private:'اتاق چت خصوصی',group:'اتاق گروه',free:'اتاق خصوصی'})[k]||'اتاق';
function rBuild(){
  R.inp=h('input',{type:'file',hidden:true,multiple:true,accept:'video/*,audio/*,.mkv,.mp3,.m4a,.flac,.wav,.ogg,.opus',onchange:e=>{const f=[...e.target.files],pf=R.pickFor;R.pickFor=null;rFiles(f,pf)}});
  R.songInp=h('input',{type:'file',hidden:true,multiple:true,accept:'audio/*,.mp3,.m4a,.flac,.ogg,.opus,.wav',onchange:e=>{const f=[...e.target.files];e.target.value='';rUpload(f)}});
  R.subInp=h('input',{type:'file',hidden:true,accept:'.srt,.vtt',onchange:e=>{const f=e.target.files[0];e.target.value='';f&&rSubs(f)}});
  R.screen=h('div',{class:'rscreen'});R.tcur=h('span',{},'۰:۰۰');R.tdur=h('span',{},'۰:۰۰');
  R.seek=h('input',{type:'range',class:'rseek',min:0,max:1,step:.1,value:0,
    oninput:e=>{R.drag=true;R.tcur.textContent=fa(rtm(+e.target.value))},
    onchange:e=>{R.drag=false;if(!rcan())return toast('الان فقط میزبان کنترل می‌کنه');rctl('seek',{pos:+e.target.value})}});
  R.playIc=h('span',{});setIcon(R.playIc,'play',30);
  const btn=(icn,title,fn,cls)=>h('button',{class:'rb '+(cls||''),title,onclick:fn},ic(icn,24));
  const vol=h('input',{type:'range',class:'rvol',min:0,max:1,step:.05,value:R.vol,title:'صدای ویدیو',oninput:e=>{R.vol=+e.target.value;lsSet('wd-rvol',R.vol);rVol()}});
  const speed=h('button',{class:'rb rsp',title:'سرعت',onclick:e=>{const r=e.currentTarget.getBoundingClientRect();
    popMenu(r.left,r.top-190,[0.75,1,1.25,1.5,2].map(x=>[fa(x)+'×','play',()=>{if(!rcan())return toast('الان فقط میزبان کنترل می‌کنه');rctl('rate',{rate:x})}]))}},'۱×');R.speedB=speed;
  R.pickCard=h('div',{class:'rpick',hidden:true});R.tapB=h('button',{class:'rtap',hidden:true,onclick:()=>{R.tap=false;if(R.el)R.el.play().catch(()=>{});rSync(true);rDrawStage()}},ic('play',48),h('span',{},'برای پیوستن به پخش بزن'));
  R.art=h('div',{class:'rart',hidden:true},h('div',{class:'eq'},[...Array(5)].map((_,i)=>h('i',{style:'animation-delay:'+(i*.17)+'s'}))),h('div',{class:'rtitle'}));
  R.cams=h('div',{class:'rcams',hidden:true});R.tiles={};
  R.float=h('div',{class:'rfloat'});R.errB=h('div',{class:'rerr',hidden:true});R.empty=h('div',{class:'rempty'},ic('film',56),h('b',{},'هنوز چیزی انتخاب نشده'),h('span',{},'آهنگ آپلود کن یا از کتابخانه بذار؛ فیلم رو همه از گوشی خودشون باز می‌کنن'),h('button',{class:'btn',onclick:()=>rPick()},'افزودن فایل'));
  R.screen.append(R.empty,R.art,R.pickCard,R.errB,R.tapB,R.float);
  R.title=h('div',{class:'rnow'});
  R.camB2=h('button',{class:'rb',title:'دوربین اتاق',onclick:()=>R.cam?rCamOff():rCam()},ic('video',24));
  R.micB2=h('button',{class:'rb',title:'میکروفون اتاق',onclick:()=>R.mic?rMicOff():rMic()},ic('micoff',24));
  const bar=h('div',{class:'rbar',dir:'ltr'},
    h('div',{class:'rtime'},R.tcur,R.seek,R.tdur),
    h('div',{class:'rrow'},btn('prv','قبلی',()=>rctl('prev')),h('button',{class:'rb big',onclick:rToggle,title:'پخش / توقف'},R.playIc),btn('nxt','بعدی',()=>rctl('next')),
      speed,h('span',{class:'grow'}),ic('speaker',20),vol,R.camB2,R.micB2,btn('cc','زیرنویس',()=>R.subInp.click()),btn('fs','تمام‌صفحه',()=>{const s=R.stage;if(document.fullscreenElement)document.exitFullscreen();else (s.requestFullscreen||s.webkitRequestFullscreen||(()=>toast('تمام‌صفحه پشتیبانی نمی‌شه'))).call(s)})));
  R.stage=h('div',{class:'rstage'},R.screen,R.cams,R.title,bar);
  R.head=h('div',{class:'rhead'});
  R.tabs=h('div',{class:'rtabs'});R.pane=h('div',{class:'rpane'});
  R.chatIn=h('input',{class:'rcin',placeholder:'یه چیزی بنویس…',maxlength:500,autocomplete:'off',onkeydown:e=>{if(e.key==='Enter')rSend()}});
  R.dock=h('div',{class:'rdock'},
    h('button',{class:'rmic',id:'rmic',title:'میکروفون',onclick:()=>R.mic?rMicOff():rMic()},ic('micoff',26)),
    h('button',{class:'rmic rcam',id:'rcam',title:'دوربین',onclick:()=>R.cam?rCamOff():rCam()},ic('video',24)),
    h('div',{class:'rreacts'},RROOM.map(x=>h('button',{onclick:()=>call('room_react',{room:R.id,emoji:x}).catch(()=>{})},x))),
    h('button',{class:'rb',title:'افزودن فایل',onclick:()=>rPick()},ic('add',26)));
  R.root=h('div',{id:'room',hidden:true},h('div',{class:'rbg'}),R.head,h('div',{class:'rmain'},R.stage,h('div',{class:'rside'},R.tabs,R.pane,
    h('div',{class:'rsend',hidden:true,id:'rsend'},R.chatIn,h('button',{class:'rb',onclick:rSend},ic('send',22))),R.dock)),R.inp,R.subInp,R.songInp);
  document.body.append(R.root);
  document.body.append(h('button',{id:'roompill',hidden:true,onclick:()=>{R.min=false;rShow()}},h('span',{class:'eqm'},h('i'),h('i'),h('i')),h('span',{class:'pt'},'اتاق تماشا'),ic('film',20)));
  rDrawAll()}
function rDrawAll(){rDrawHead();rDrawStage();rDrawTabs();rDrawPane()}
function rDrawHead(){
  if(!R.root)return;const mt=R.meta||{title:'اتاق',kind:'free'};R.chip=h('span',{class:'rchip'});
  R.head.replaceChildren(
    h('button',{class:'rb',title:'کوچک کردن (اتاق باز می‌مونه)',onclick:rMinimize},ic('mini',24)),
    h('div',{class:'rht'},h('b',{},mt.title),h('small',{},rKind(mt.kind)+' · '+fa(R.members.length)+' نفر ',R.chip)),
    h('div',{class:'rpeeps'},R.members.slice(0,6).map(m=>{const a=uAv(m.id,34),w=h('span',{class:'rpeep','data-u':m.id,title:m.name},a);if(m.mic)w.append(h('i',{class:'mk'},ic('mic',11)));if(m.id===R.st?.host)w.append(h('i',{class:'cr'},ic('crown',11)));return w})),
    h('button',{class:'rb',title:'دعوت',onclick:rInvite},ic('inv',24)),
    h('button',{class:'rb',title:'تنظیمات اتاق',onclick:rSettings},ic('settings',24)),
    h('button',{class:'rb leave',title:'خروج از اتاق',onclick:()=>{if(confirm('از اتاق خارج بشی؟'))rLeave()}},ic('logout',24)))}
function rLink(){return location.origin+'/#room='+R.id}
function rInvite(){
  const mt=R.meta||{};
  if(mt.invite==='host'&&!rhost())return toast('فقط میزبان می‌تونه دعوت کنه');
  const[i,l]=userSearch(async u=>{try{await call('room_invite',{room:R.id,username:u.username});toast(u.display_name+' دعوت شد',false)}catch(e){toast(e.message)}},true);
  const parts=[h('div',{class:'muted',style:'font-size:13px;line-height:1.8;margin-bottom:6px'},'نام کاربری دوستت رو کامل بنویس و روش بزن؛ براش دعوت‌نامه می‌ره. فقط کسی که دعوت بشه (یا لینک رو داشته باشه) اتاق رو می‌بینه.'),i,l];
  if(mt.kind==='free'&&mt.link)parts.push(h('hr'),h('button',{class:'btn soft',onclick:()=>copyText(rLink())},'کپی لینک اتاق'),h('div',{class:'muted',style:'font-size:12px'},'هر کسی با این لینک وارد بشه می‌تونه بپیونده. میزبان می‌تونه لینک رو از تنظیمات خاموش کنه.'));
  dialog('دعوت به اتاق',...parts);i.focus()}
function rSettings(e){e.stopPropagation();
  const r=e.currentTarget.getBoundingClientRect(),s=R.st,mt=R.meta||{},host=rhost(),it=[];
  if(host){
    it.push([s.ctl==='all'?'کنترل پخش: همه (بزن تا فقط میزبان بشه)':'کنترل پخش: فقط میزبان (بزن تا همه بشه)','group',()=>rctl('mode',{ctl:s.ctl==='all'?'host':'all'})]);
    it.push([mt.invite==='host'?'دعوت کردن: فقط میزبان (بزن تا همه بتونن)':'دعوت کردن: همه اعضا (بزن تا فقط میزبان بشه)','inv',()=>rctl('mode',{invite:mt.invite==='host'?'all':'host'})]);
    if(mt.kind==='free')it.push([mt.link?'لینک اتاق: روشن (بزن تا خاموش بشه)':'لینک اتاق: خاموش (بزن تا روشن بشه)','link',()=>rctl('mode',{link:!mt.link})]);
    it.push([mt.wait?'صبر برای بارگذاری بقیه: روشن':'صبر برای بارگذاری بقیه: خاموش','rep',()=>rctl('mode',{wait:!mt.wait})]);
    it.push(['تکرار: '+({off:'خاموش',all:'کل صف',one:'یک مورد'})[s.repeat]+' (بزن تا عوض بشه)','rep',()=>rctl('mode',{repeat:{off:'all',all:'one',one:'off'}[s.repeat]})]);
    it.push(['تغییر اسم اتاق','pencil',()=>{const t=prompt('اسم اتاق:',mt.title||'');if(t&&t.trim())rctl('mode',{title:t})}])}
  if(mt.kind==='free'&&mt.link)it.push(['کپی لینک اتاق','link',()=>copyText(rLink())]);
  it.push([R.duck?'کم‌کردن صدای فیلم وقتی کسی حرف می‌زنه: روشن':'کم‌کردن صدای فیلم وقتی کسی حرف می‌زنه: خاموش','speaker',()=>{R.duck=!R.duck;lsSet('wd-rduck',R.duck?'1':'0')}]);
  it.push([R.autoup?'آهنگ انتخابی خودکار آپلود بشه تا همه بشنون: روشن':'آهنگ انتخابی خودکار آپلود بشه: خاموش (فقط فایل مشترک)','attach',()=>{R.autoup=!R.autoup;lsSet('wd-rautoup',R.autoup?'1':'0')}]);
  it.push(['پاک کردن همه صف','delete',()=>{if(rcan()&&confirm('کل صف پاک بشه؟'))rctl('clear');else if(!rcan())toast('الان فقط میزبان کنترل می‌کنه')}]);
  popMenu(Math.max(8,r.left-220),r.bottom+4,it)}
function rDrawStage(){
  if(!R.root)return;const it=rcur(),f=it&&rMatch(it);
  R.empty.hidden=!!it;R.art.hidden=!(it&&f&&it.kind==='audio');R.root.classList.toggle('isaudio',!!(it&&it.kind==='audio'));
  R.pickCard.hidden=!(it&&!f);R.errB.hidden=!R.err;R.errB.textContent=R.err||'';R.tapB.hidden=!R.tap;
  if(it&&!f)R.pickCard.replaceChildren(ic(it.kind==='audio'?'headphones':'film',44),h('b',{},it.name),h('span',{},fmtSize(it.size)+(it.dur?' · '+fa(rtm(it.dur)):'')),
    h('div',{class:'muted'},'همین فایل رو از حافظه گوشی/کامپیوترت انتخاب کن (باید دقیقاً یکی باشه)'),h('button',{class:'btn',onclick:()=>rPick(it)},'انتخاب فایل'));
  R.title.textContent=it?it.name:'';const t=$('.rtitle',R.art);if(t)t.textContent=it?it.name.replace(/\.[^.]+$/,''):'';
  R.speedB.textContent=fa(R.st?R.st.rate:1)+'×'}
function rDrawTabs(){
  if(!R.tabs)return;const t=(id,label,badge)=>h('button',{class:R.tab===id?'on':'',onclick:()=>{R.tab=id;if(id==='chat')R.unread=0;if(id==='songs')R.songs=null;rDrawTabs();rDrawPane()}},label,badge?h('i',{class:'bd'},fa(badge)):null);
  R.tabs.replaceChildren(t('chat','گفتگو',R.unread),t('queue','صف ('+fa(R.st?R.st.queue.length:0)+')'),t('songs','🎵 آهنگ‌ها'),t('people','حاضرین'));
  $('#rsend',R.root).hidden=R.tab!=='chat'}
function rDrawPane(){R.tab==='chat'?rDrawChat():R.tab==='queue'?rDrawQueue():R.tab==='songs'?rDrawSongs():rDrawPeople()}
function rDrawChat(){
  if(!R.root||R.tab!=='chat')return;const log=h('div',{class:'rlog'});
  if(!R.log.length)log.append(h('div',{class:'hint'},'اینجا می‌تونید همزمان با دیدن، چت کنید 💬'));
  R.log.slice(-100).forEach(m=>log.append(m.sys?h('div',{class:'rsys'},m.text):h('div',{class:'rmsg'+(m.from===S.me.id?' me':'')},h('b',{},m.from===S.me.id?'تو':m.name),h('span',{dir:'auto'},m.text))));
  R.pane.replaceChildren(log);log.scrollTop=log.scrollHeight}
const rSrc=it=>it.lib?(it.lib.startsWith('_uploads/')?'آهنگ آپلودشده':'از کتابخانه سرور'):(rMatch(it)?'فایل داری ✓':'فایل نداری');
function rDrawQueue(){
  if(!R.st)return;const box=h('div',{class:'rq'});
  box.append(h('div',{class:'rqh'},h('button',{class:'btn soft',onclick:()=>rPick()},'افزودن / انتخاب فایل'),
    h('small',{},'آهنگ‌ها آپلود می‌شن و همه می‌شنون. فیلم رو هر کس باید از گوشی خودش همون فایل رو انتخاب کنه؛ خودکار جور می‌شه.')));
  if(!R.st.queue.length)box.append(h('div',{class:'hint'},'صف خالیه'));
  R.st.queue.forEach(it=>{const have=!!rMatch(it),cur=it.id===R.st.cur;
    box.append(h('div',{class:'rqi'+(cur?' cur':''),onclick:()=>{if(!rcan())return toast('الان فقط میزبان کنترل می‌کنه');rctl('play_item',{item:it.id})}},
      h('span',{class:'qi'},ic(it.kind==='audio'?'headphones':'film',22)),
      h('div',{class:'grow'},h('b',{},it.name),h('small',{},fmtSize(it.size)+(it.dur?' · '+fa(rtm(it.dur)):'')+' · '+rSrc(it)+(it.by?' · '+rName(it.by):''))),
      have?null:h('button',{class:'iconbtn',title:'انتخاب فایل',onclick:e=>{e.stopPropagation();rPick(it)}},ic('attach',20)),
      h('button',{class:'iconbtn',title:'حذف از صف',onclick:e=>{e.stopPropagation();if(rcan()||it.by===S.me.id)rctl('remove',{item:it.id});else toast('الان فقط میزبان کنترل می‌کنه')}},ic('close',20))))});
  R.pane.replaceChildren(box)}
/* ---------- songs: server library (admin's roomaudio folder) + MY private uploads ---------- */
async function rSongsLoad(){try{const r=await call('roomaudio_list');R.songs=r.songs;R.usage=r.usage}catch(e){toast(e.message)}if(R.tab==='songs')rDrawSongs()}
const rFolderName=f=>f||'کتابخانه';
const rInQ=rel=>!!(R.st&&R.st.queue.some(i=>i.lib===rel));
const rMB=b=>fa((b/1048576).toFixed(b<10485760?1:0));
function rDrawSongs(){
  if(!R.root||R.tab!=='songs')return;if(!R.songs){R.songs=[];rSongsLoad()}
  const q=(R.songQ||'').toLowerCase(),box=h('div',{class:'rq'}),groups=new Map(),mine=[];
  R.songs.filter(x=>!q||x.name.toLowerCase().includes(q)||x.folder.toLowerCase().includes(q)).forEach(x=>{if(x.mine)mine.push(x);else{if(!groups.has(x.folder))groups.set(x.folder,[]);groups.get(x.folder).push(x)}});
  const inp=h('input',{class:'rcin',placeholder:'جستجوی آهنگ…',value:R.songQ||'',oninput:e=>{R.songQ=e.target.value;clearTimeout(R.sj);R.sj=setTimeout(()=>{rDrawSongs();const i=$('.rcin',R.pane);i&&(i.focus(),i.setSelectionRange(99,99))},200)}});
  const u=R.usage;
  box.append(h('div',{class:'rinfo'},
    h('b',{},'این بخش چطور کار می‌کنه؟'),
    h('div',{},'📚 «کتابخانه»: آهنگ‌هایی که مدیر روی سرور گذاشته؛ برای همه‌ست. فقط روشون بزن تا به صف اضافه بشه.'),
    h('div',{},'🔒 «آهنگ‌های من»: آهنگ‌هایی که خودت آپلود کردی؛ تو پوشه مخصوص خودت روی سرور می‌مونن و فقط خودت می‌بینی‌شون. وقتی یکی رو بذاری تو صف اتاق، اعضای همون اتاق هم می‌شنون (فایل رو ندارن هم مشکلی نیست).'),
    h('div',{},'🗑 هیچ آهنگی خودکار پاک نمی‌شه؛ هر وقت کارت تموم شد خودت پاکش کن (از صف اتاق‌ها هم برداشته می‌شه). مدیر هم می‌تونه پاک کنه.')));
  box.append(h('div',{class:'rqh'},h('button',{class:'btn',onclick:()=>R.songInp.click()},'⬆ آپلود آهنگ جدید'),
    h('small',{},(u?fa(u.count)+' از '+fa(u.max_count)+' آهنگ · '+rMB(u.bytes)+' از '+rMB(u.max_bytes)+' مگابایت · ':'')+'هر فایل تا ۸۰ مگابایت'),inp));
  box.append(h('div',{class:'rgh'},h('b',{},'🔒 آهنگ‌های من ('+fa(mine.length)+')'),
    mine.length?h('button',{class:'btn soft',onclick:()=>rctl('add',{items:mine.slice(0,30).map(x=>({lib:x.rel}))}).then(()=>toast('به صف اضافه شد',false))},'افزودن همه'):null));
  if(!mine.length)box.append(h('div',{class:'hint'},'هنوز آهنگی آپلود نکردی'));
  mine.forEach(x=>box.append(h('div',{class:'rqi',onclick:()=>rctl('add',{items:[{lib:x.rel}]}).then(()=>toast('«'+x.name+'» به صف اضافه شد',false))},
    h('span',{class:'qi'},ic('headphones',22)),h('div',{class:'grow'},h('b',{},x.name),h('small',{},fmtSize(x.size)+(rInQ(x.rel)?' · تو صف هست ▶':''))),
    h('button',{class:'iconbtn',title:'پاک کردن از سرور',onclick:e=>{e.stopPropagation();rSongDel(x)}},ic('delete',22)),h('span',{class:'qi'},ic('add',22)))));
  if(!R.songs.some(x=>!x.mine))box.append(h('div',{class:'hint'},'کتابخانه خالیه؛ مدیر می‌تونه تو پوشه roomaudio آهنگ بذاره'));
  groups.forEach((list,folder)=>{
    box.append(h('div',{class:'rgh'},h('b',{},'📚 '+rFolderName(folder)+' ('+fa(list.length)+')'),
      h('button',{class:'btn soft',onclick:()=>rctl('add',{items:list.slice(0,30).map(x=>({lib:x.rel}))}).then(()=>toast('به صف اضافه شد',false))},'افزودن همه')));
    list.forEach(x=>box.append(h('div',{class:'rqi',onclick:()=>rctl('add',{items:[{lib:x.rel}]}).then(()=>toast('«'+x.name+'» به صف اضافه شد',false))},
      h('span',{class:'qi'},ic('headphones',22)),h('div',{class:'grow'},h('b',{},x.name),h('small',{},fmtSize(x.size))),h('span',{class:'qi'},ic('add',22)))))});
  R.pane.replaceChildren(box)}
async function rSongDel(x){
  if(!confirm('«'+x.name+'» برای همیشه از سرور پاک بشه؟'+(rInQ(x.rel)?'\n(الان تو صف اتاق هست و از صف هم برداشته می‌شه)':'')))return;
  try{await call('roomaudio_delete',{rel:x.rel});toast('پاک شد',false)}catch(e){toast(e.message)}R.songs=null;rDrawSongs()}
async function rUpload(files){
  for(const f of [...files]){
    if(f.size>80*1048576){toast('«'+f.name+'» بزرگ‌تر از ۸۰ مگابایته');continue}
    try{await rUploadOne(f);toast('«'+f.name+'» آپلود شد؛ تو «آهنگ‌های من» روش بزن تا بره تو صف',false)}catch(e){toast(e.message)}}
  R.songs=null;if(R.tab==='songs')rDrawSongs()}
function rDrawPeople(){
  if(!R.root||R.tab!=='people')return;const box=h('div',{class:'rq'}),mt=R.meta||{},host=rhost();
  box.append(h('div',{class:'rqh'},h('button',{class:'btn',onclick:rInvite},'➕ دعوت دوست'),
    mt.kind==='free'&&mt.link?h('button',{class:'btn soft',onclick:()=>copyText(rLink())},'کپی لینک اتاق'):null,
    h('small',{},mt.kind==='free'?'این اتاق فقط برای کسانی دیده می‌شه که دعوت بشن یا لینک رو داشته باشن.':mt.kind==='group'?'اعضای گروه اتاق رو می‌بینن؛ بقیه رو هم می‌تونی دعوت کنی.':'تو و طرف مقابلت اتاق رو می‌بینید؛ هر کدوم می‌تونید آدم بیارید.')));
  R.members.forEach(m=>box.append(h('div',{class:'rqi',style:'cursor:default'},h('span',{class:'rpeep','data-u':m.id},uAv(m.id,40)),
    h('div',{class:'grow'},h('b',{},m.id===S.me.id?m.name+' (تو)':m.name),h('small',{},(m.id===R.st?.host?'میزبان · ':'')+(m.away?'اتصال قطع (منتظر برگشتنه) · ':'')+(m.buf?'در حال بارگذاری · ':'')+(m.have?'فایل داره ✓':'فایل نداره'))),
    m.mic?h('span',{class:'live'},ic('mic',20)):null,
    host&&m.id!==S.me.id?h('button',{class:'iconbtn',title:'حذف از اتاق',onclick:()=>{if(confirm('«'+m.name+'» از اتاق حذف بشه؟ دیگه نمی‌تونه برگرده.'))call('room_kick',{room:R.id,user:m.id}).catch(e=>toast(e.message))}},ic('close',20)):null)));
  R.pane.replaceChildren(box)}
function rSend(){const t=R.chatIn.value.trim();if(!t)return;R.chatIn.value='';call('room_chat',{room:R.id,text:t}).catch(e=>toast(e.message));R.chatIn.focus()}
function rFloat(emoji,from){
  if(!R.float)return;const e=h('span',{class:'fl'},emoji);e.style.left=(8+Math.random()*80)+'%';R.float.append(e);setTimeout(()=>e.remove(),2600);
  const p=document.querySelector('.rpeep[data-u="'+from+'"]');if(p){p.classList.add('talk');p.dataset.until=performance.now()+900}}
function rTalk(uid,on){if(!on)return;document.querySelectorAll('.rpeep[data-u="'+uid+'"]').forEach(p=>{p.classList.add('talk');p.dataset.until=performance.now()+450})}

/* ---------- voice: its own audio path, completely separate from calls ----------
   48 kHz mono Opus (WebCodecs, ~48 kbps, voice-tuned) when everybody's browser can; otherwise 16 kHz PCM16.
   Receivers keep a small adaptive jitter buffer per speaker. */
async function rHqCheck(){
  try{if(!window.AudioEncoder||!window.AudioDecoder||!window.AudioData||!window.EncodedAudioChunk)return false;
    const a=await AudioEncoder.isConfigSupported({codec:'opus',sampleRate:48000,numberOfChannels:1,bitrate:48000}),b=await AudioDecoder.isConfigSupported({codec:'opus',sampleRate:48000,numberOfChannels:1});
    return !!(a&&a.supported&&b&&b.supported)}catch{return false}}
function rMicUI(on){
  const b=$('#rmic');if(b){b.replaceChildren(ic(on?'mic':'micoff',26));b.classList.toggle('on',on)}
  if(R.micB2){R.micB2.replaceChildren(ic(on?'mic':'micoff',24));R.micB2.classList.toggle('on',on)}}
async function rMic(){
  if(R.mic)return;
  if(C)return toast('وسط تماس نمی‌شه میکروفون اتاق رو روشن کرد');if(REC.on)return toast('اول ضبط ویس رو تموم کن');
  let stream;try{stream=await getMic()}catch(e){return toast(e.message)}
  if(!R.on){stream.getTracks().forEach(t=>t.stop());return}
  const AC=window.AudioContext||window.webkitAudioContext;let ctx;try{ctx=new AC({sampleRate:48000,latencyHint:'interactive'})}catch{ctx=new AC()}
  const m=R.mic={stream,ctx,hang:0,node:null,acc:new Float32Array(8192),n:0,enc:null,ts:0,frame:Math.round(ctx.sampleRate*.02)};ctx.resume&&ctx.resume();
  try{await call('room_flags',{room:R.id,mic:true})}catch(e){rMicOff(true);return toast(e.message)}
  if(R.mic!==m)return;
  const src=ctx.createMediaStreamSource(stream);
  try{await ctx.audioWorklet.addModule('/static/mic-worklet.js');if(R.mic!==m)return;const n=new AudioWorkletNode(ctx,'mic',{numberOfInputs:1,numberOfOutputs:0});n.port.onmessage=e=>rMicBlock(e.data);src.connect(n);m.node=n}
  catch{if(R.mic!==m)return;const p=ctx.createScriptProcessor(1024,1,1),z=ctx.createGain();z.gain.value=0;p.onaudioprocess=e=>rMicBlock(new Float32Array(e.inputBuffer.getChannelData(0)));src.connect(p);p.connect(z);z.connect(ctx.destination);m.node=p}
  rMicUI(true);rPlayInit();
  if(!lsGet('wd-rhp'))toast('برای اینکه صدای فیلم تو میکروفون نیفته، هدفون بذار 🎧',false),lsSet('wd-rhp','1')}
function rMicOff(silent){
  const m=R.mic;R.mic=null;
  if(m){try{m.stream.getTracks().forEach(t=>t.stop())}catch{}try{m.enc&&m.enc.close()}catch{}try{m.node&&m.node.disconnect();m.ctx.close()}catch{}}
  rMicUI(false);
  if(!silent&&R.on)call('room_flags',{room:R.id,mic:false}).catch(()=>{})}
function rMicBlock(f){            // re-chunk into 20 ms frames
  const m=R.mic;if(!m)return;
  if(m.n+f.length>m.acc.length)m.n=0;
  m.acc.set(f,m.n);m.n+=f.length;
  while(m.n>=m.frame){const fr=m.acc.slice(0,m.frame);m.acc.copyWithin(0,m.frame,m.n);m.n-=m.frame;rSendFrame(fr)}}
function rWire(codec,sr,u8){
  if(!ws||ws.readyState!==1||ws.bufferedAmount>200000||!R.on)return;
  ws.send(JSON.stringify({op:'room_audio',room:R.id,sr,c:codec,d:b64(u8)}))}
function rEncInit(m){
  const cfg={codec:'opus',sampleRate:48000,numberOfChannels:1,bitrate:48000};
  const mk=c=>{const e=new AudioEncoder({output:ch=>{const u=new Uint8Array(ch.byteLength);ch.copyTo(u);rWire('opus',48000,u)},
    error:()=>{if(m.enc===e)m.enc=null;R.hq=false;if(R.on)call('room_flags',{room:R.id,hq:false}).catch(()=>{})}});e.configure(c);return e};
  try{m.enc=mk({...cfg,opus:{application:'voip',signal:'voice',frameDuration:20000,complexity:6,useinbandfec:true,usedtx:false}})}catch{m.enc=mk(cfg)}}
function rSendFrame(f){
  const m=R.mic;if(!m||!ws||ws.readyState!==1)return;
  let pk=0;for(let i=0;i<f.length;i++){const a=Math.abs(f[i]);if(a>pk)pk=a}
  const t=performance.now();if(pk>.012)m.hang=t+500;if(t>m.hang)return;rTalk(S.me.id,true);   // only send while someone is talking: saves bandwidth
  const others=R.members.filter(x=>x.id!==S.me.id&&!x.away);if(!others.length)return;
  const sr=m.ctx.sampleRate;
  if(R.hq&&sr===48000&&others.every(x=>x.hq)){
    try{if(!m.enc)rEncInit(m);m.enc.encode(new AudioData({format:'f32-planar',sampleRate:48000,numberOfFrames:f.length,numberOfChannels:1,timestamp:m.ts,data:f}));m.ts+=20000;return}catch{R.hq=false}}
  const k=Math.max(1,Math.round(sr/16000)),n=Math.floor(f.length/k),pcm=new Int16Array(n);        // PCM16 fallback, box-filtered down to ~16 kHz
  for(let i=0;i<n;i++){let s=0;for(let j=0;j<k;j++)s+=f[i*k+j];const v=Math.max(-1,Math.min(1,s/k));pcm[i]=v<0?v*32768:v*32767}
  rWire('pcm',Math.round(sr/k),new Uint8Array(pcm.buffer))}
function rPlayInit(){
  if(R.pctx)return;const AC=window.AudioContext||window.webkitAudioContext;try{R.pctx=new AC({sampleRate:48000,latencyHint:'balanced'})}catch{R.pctx=new AC()}   /* 48 kHz = Opus rate: no per-frame resampling (that made voices buzzy/thin on 44.1 kHz phones) */
  R.pctx.resume&&R.pctx.resume();R.pout=R.pctx.createGain();R.pout.gain.value=1.3;const comp=R.pctx.createDynamicsCompressor();R.pout.connect(comp);
  try{const d=R.pctx.createMediaStreamDestination();comp.connect(d);let a=$('#rvoice');if(!a){a=h('audio',{id:'rvoice',autoplay:true});a.setAttribute('playsinline','');document.body.append(a)}a.srcObject=d.stream;a.play().catch(()=>{})}
  catch{comp.connect(R.pctx.destination)}}
function rPlayF32(V,from,ch,sr){
  const ctx=R.pctx;if(!ctx||!ch.length)return;
  const ab=ctx.createBuffer(1,ch.length,sr);ab.copyToChannel(ch,0);let pk=0;for(let i=0;i<ch.length;i++){const a=Math.abs(ch[i]);if(a>pk)pk=a}
  if(pk>.02){rTalk(from,true);R.duckUntil=performance.now()+700}
  const now=ctx.currentTime,node=ctx.createBufferSource();node.buffer=ab;node.connect(R.pout);
  if(V.next<=now+.005){const gap=now-V.next;if(V.next>0&&gap<.25)V.target=Math.min(.4,V.target+.03);else V.target=Math.max(.1,V.target-.01);V.next=now+V.target}   // real underrun -> a bit more buffer
  else if(V.next>now+V.target+1.2)V.next=now+V.target;                                                                                                // fell too far behind: skip ahead
  node.start(V.next);V.next+=ab.duration}
function rDecInit(V,from){
  V.dec=new AudioDecoder({output:ad=>{try{const f=new Float32Array(ad.numberOfFrames);ad.copyTo(f,{planeIndex:0,format:'f32-planar'});ad.close();rPlayF32(V,from,f,48000)}catch{try{ad.close()}catch{}}},
    error:()=>{V.dec=null}});
  V.dec.configure({codec:'opus',sampleRate:48000,numberOfChannels:1});V.ts=0}
function rVoiceIn(e){
  if(!R.pctx)rPlayInit();const ctx=R.pctx;if(ctx.state!=='running')ctx.resume&&ctx.resume();
  const V=R.voices[e.from]||(R.voices[e.from]={next:0,target:.12,dec:null,last:0,ts:0});V.last=performance.now();
  try{const bin=atob(e.d),n=bin.length,u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=bin.charCodeAt(i);
    if(e.c==='opus'){if(!window.AudioDecoder)return;if(!V.dec)rDecInit(V,e.from);V.dec.decode(new EncodedAudioChunk({type:'key',timestamp:V.ts,data:u}));V.ts+=20000}
    else{const k=n>>1,dv=new DataView(u.buffer),f=new Float32Array(k);for(let i=0;i<k;i++)f[i]=dv.getInt16(i*2,true)/32768;rPlayF32(V,e.from,f,e.sr||16000)}}catch{}}

/* ---------- camera: small JPEG frames through the server (like calls), up to 4 cameras per room ---------- */
function rCamUI(on){for(const b of [$('#rcam'),R.camB2])if(b)b.classList.toggle('on',on)}
function rTile(uid){
  let t=R.tiles[uid];if(t||!R.cams)return t;
  const img=h('img',{alt:''}),nm=h('span',{},rName(+uid));t={el:h('div',{class:'rtile','data-u':uid},img,nm),img,seen:performance.now()};
  R.tiles[uid]=t;R.cams.append(t.el);R.cams.hidden=false;return t}
function rTileDel(uid){const t=R.tiles[uid];if(!t)return;t.el.remove();delete R.tiles[uid];if(R.cams&&!R.cams.children.length)R.cams.hidden=true}
function rCamIn(e){
  if(!R.on)return;if(!e.d)return rTileDel(e.from);
  const t=rTile(e.from);if(t){t.img.src='data:image/jpeg;base64,'+e.d;t.seen=performance.now()}}
async function rCam(){
  if(R.cam)return;if(C)return toast('وسط تماس نمی‌شه دوربین اتاق رو روشن کرد');
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return toast('این مرورگر دوربین نداره');
  let vs;try{vs=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:320},height:{ideal:240},facingMode:'user'},audio:false})}catch{return toast('دسترسی به دوربین داده نشد')}
  if(!R.on){vs.getTracks().forEach(t=>t.stop());return}
  try{await call('room_flags',{room:R.id,cam:true})}catch(e){vs.getTracks().forEach(t=>t.stop());return toast(e.message)}
  const vid=document.createElement('video');vid.muted=true;vid.playsInline=true;vid.srcObject=vs;await vid.play().catch(()=>{});
  const cv=document.createElement('canvas'),c=R.cam={stream:vs,vid,timer:null};
  const t=rTile(S.me.id);if(t){t.img.replaceWith(vid);vid.className='mine'}
  c.timer=setInterval(()=>{
    if(R.cam!==c||!ws||ws.readyState!==1||ws.bufferedAmount>60000||!vid.videoWidth)return;     // voice has priority: skip frames when the link is busy
    const hh=Math.min(240,vid.videoHeight),w=Math.round(hh*vid.videoWidth/vid.videoHeight);cv.width=w;cv.height=hh;cv.getContext('2d').drawImage(vid,0,0,w,hh);
    ws.send(JSON.stringify({op:'room_video',room:R.id,d:cv.toDataURL('image/jpeg',.5).slice(23)}))},170);      // ~6 fps, 240p
  rCamUI(true)}
function rCamOff(silent){
  const c=R.cam;R.cam=null;
  if(c){clearInterval(c.timer);try{c.stream.getTracks().forEach(t=>t.stop())}catch{}if(R.on&&!silent&&ws&&ws.readyState===1)ws.send(JSON.stringify({op:'room_video',room:R.id,d:''}));rTileDel(S.me.id)}
  rCamUI(false);
  if(!silent&&R.on)call('room_flags',{room:R.id,cam:false}).catch(()=>{})}

/* ---------- entry points: hub (drawer), chat header, banner ---------- */
function rBanner(){
  const bar=$('#roombar');if(!bar)return;const cid=S.current,live=R.live[cid];
  if(R.on&&R.min&&R.chat===cid){bar.hidden=false;bar.replaceChildren(ic('film',20),h('span',{class:'grow'},'تو اتاق تماشا هستی'),h('button',{class:'btn soft',onclick:()=>{R.min=false;rShow();rBanner()}},'برگرد به اتاق'));return}
  if(!live||(R.on&&R.chat===cid)){bar.hidden=true;return}
  bar.hidden=false;bar.replaceChildren(ic('film',20),h('span',{class:'grow'},'اتاق تماشا فعاله · '+fa(live.count)+' نفر'+(live.cur?' · '+live.cur:'')),h('button',{class:'btn',onclick:()=>openRoom(cid)},'بپیوند'))}
async function rRefresh(){
  const c=S.chats[S.current],b=$('#roombtn');if(!b)return;const ok=!!c&&!c.channel;b.hidden=!ok;
  if(!ok){rBanner();return}
  try{const r=await call('room_info',{chat_id:c.id});R.live[c.id]=r.live?{room:r.room,count:r.count,cur:r.cur}:null}catch{}rBanner()}
async function openRoomHub(){
  const list=h('div',{class:'ulist'}),title=h('input',{placeholder:'اسم اتاق (اختیاری)',maxlength:40,autocomplete:'off'});
  dialog('🎬 اتاق تماشا',
    h('div',{class:'muted',style:'font-size:13px;line-height:1.9'},'همه می‌تونن اتاق بسازن. اتاقی که می‌سازی فقط برای کسانی دیده می‌شه که خودت دعوت کنی. اتاق هر چت یا گروه رو هم از داخل همون چت می‌تونی بسازی.'),
    title,h('button',{class:'btn',onclick:()=>{const t=title.value;closeDialog();openRoomNew(t)}},'ساخت اتاق جدید'),
    h('h4',{style:'margin:14px 0 4px'},'اتاق‌های فعالِ در دسترس تو'),list);
  try{const r=await call('room_mine');
    if(!r.rooms.length)return list.replaceChildren(h('div',{class:'hint'},'الان اتاق فعالی نیست'));
    list.replaceChildren(...r.rooms.map(x=>h('div',{class:'srow'},ic('film',24),h('div',{class:'grow'},h('b',{},x.title),h('small',{},rKind(x.kind)+' · '+fa(x.count)+' نفر'+(x.cur?' · '+x.cur:'')+(x.invited&&!x.joined?' · دعوت شدی':''))),
      h('button',{class:'btn soft',style:'width:auto;padding:6px 14px',onclick:()=>{closeDialog();openRoomId(x.room)}},x.joined?'برگرد':'بپیوند'))))}catch(e){list.replaceChildren(h('div',{class:'hint'},e.message))}}
function rHashGrab(){const m=location.hash.match(/^#room=([\w-]{6,40})$/);if(m){lsSet('wd-room',m[1]);try{history.replaceState(null,'',location.pathname)}catch{}rHashCheck()}}
function rHashCheck(){const v=lsGet('wd-room');if(!v||!S.me)return;lsSet('wd-room',null);openRoomId(v)}
window.addEventListener('hashchange',rHashGrab);rHashGrab();
const _bd=buildDrawer;buildDrawer=function(){_bd();rHashCheck()};
(function(){
  const b=h('button',{class:'iconbtn',id:'roombtn',title:'اتاق تماشا / گوش دادن همزمان',hidden:true,onclick:e=>{e.stopPropagation();S.current&&openRoom(S.current)}});setIcon(b,'film');
  const cb=$('#callbtn');cb.parentNode.insertBefore(b,cb);
  const pin=$('#pinbar');pin.parentNode.insertBefore(h('div',{id:'roombar',hidden:true}),pin.nextSibling);
  const _fh=fillHeader;fillHeader=function(){_fh();rRefresh()}})();

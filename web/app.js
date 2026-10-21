'use strict';
/* Windroida web client. Safe DOM building only (no innerHTML with user data). */
const QUESTIONS=["یه کلمه یا جمله مخفی که فقط خودم می‌دونم","اسم اولین کتابی که یادمه و خوندمش؟","اسم کوچه یا جایی که برای من خاطره خاصی داره؟","یه عبارت شخصی که هیچ‌وقت جایی نگفتم؟"];
const RULES_DEFAULT=`۱. با دیگران محترمانه رفتار کن؛ توهین، تهدید، آزار و مزاحمت ممنوعه.
۲. ارسال محتوای غیرقانونی، مستهجن، کلاهبرداری یا فریب دیگران ممنوعه.
۳. اسپم و تبلیغ مزاحم (فرستادن پیام یا لینک تبلیغاتی برای افراد ناآشنا) ممنوعه.
۴. خودت را جای شخص دیگری جا نزن و از حساب دیگران استفاده نکن.
۵. مسئولیت پیام‌ها و فایل‌هایی که می‌فرستی با خودته.
۶. مدیر می‌تونه حساب یا گروهی که قوانین رو رعایت نکنه مسدود یا حذف کنه.
۷. حریم خصوصی: پیام‌ها روی سرور همین برنامه ذخیره می‌شن و پیام‌رسان رمزنگاری سرتاسری نداره؛ مدیر سرور ممکنه به اون‌ها دسترسی داشته باشه. اطلاعات خیلی حساس (رمز بانکی و…) نفرست.
۸. رمز و جواب سوال امنیتیت رو به کسی نگو. اگه رمزت رو فراموش کنی تنها راه بازیابی همون سوال امنیتیه.`;
async function rulesText(){try{const r=await fetch('/rules.txt',{cache:'no-store'});if(r.ok){const t=(await r.text()).trim();if(t)return t}}catch{}return RULES_DEFAULT}
async function showRules(){const t=await rulesText();dialog('قوانین',h('div',{style:'white-space:pre-wrap;line-height:2;font-size:14px;max-height:60vh;overflow:auto'},t),h('button',{class:'btn',style:'display:block;margin-top:12px;width:100%',onclick:closeDialog},'متوجه شدم'))}
const EMOJIS=["😀","😁","😂","🤣","😊","😍","😘","😎","🤔","😢","😭","😡","👍","👎","👏","🙏","💪","🔥","❤️","💔","🎉","✨","🌹","☕","🍕","🎂","🎁","✅","❌","⭐","🚀","🌙","☀️","🌈","🐱","🐶","😴","🤝","👋","🙌","😉","😅","🥰","🤩","🥳","😇","😜","🤗","😏","😬","🙄","😤","🤯","😱","🥺","😋","🤪","🙈","💯","👀","🫶","🤞","✌️","💙","💜","🖤","💥","🎶","🍔","⚽","🏆","🌍","💡","📌","📎"];
const REACTS=["👍","❤️","🔥","🎉","😂","😮","😢","🙏","👎","💯","🤔","👏"];
const COLORS=["#e17076","#7bc862","#e5ca77","#65aadd","#a695e7","#ee7aae","#6ec9cb","#faa774"];
const ACCENTS=["#3390ec","#7c4dff","#e91e63","#f4511e","#2e9e55","#00acc1","#8d6e63","#455a64"];
const USER_RE=/^(?=.*[A-Za-z0-9])[A-Za-z0-9_]{3,32}$/;
const $=(s,r=document)=>r.querySelector(s);

/* ---------- icons ---------- */
const IC={menu:"M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",search:"M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
pencil:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
send:"M2.01 21 23 12 2.01 3 2 10l15 2-15 2z",mic:"M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z",
attach:"M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6h-1.5z",
emoji:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-10c.83 0 1.5-.67 1.5-1.5S16.33 7 15.5 7 14 7.67 14 8.5s.67 1.5 1.5 1.5zm-7 0C9.33 10 10 9.33 10 8.5S9.33 7 8.5 7 7 7.67 7 8.5 7.67 10 8.5 10zm3.5 7.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z",
phone:"M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z",
more:"M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
back:"M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",close:"M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
check:"M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",checkall:"M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41 6 19l1.41-1.41L1.83 12 .41 13.41z",
reply:"M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z",forward:"M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z",
copy:"M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
delete:"M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",pin:"M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z",
download:"M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",file:"M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z",
play:"M8 5v14l11-7z",pause:"M6 19h4V5H6v14zm8-14v14h4V5h-4z",
group:"M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
person:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
bookmark:"M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z",
settings:"M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z",
moon:"M9.37 5.51A7.35 7.35 0 0 0 9.1 7.5c0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27A7.014 7.014 0 0 1 12 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49zM12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z",
logout:"M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
down:"M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z",up:"M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z",
bellx:"M20 18.69 7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42v5l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.42.12L18 14.68z",
bell:"M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
star:"M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
info:"M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
camera:"M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
devices:"M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z",
video:"M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
lock:"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
add:"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z",stop:"M6 6h12v12H6z",
channel:"M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z",
headphones:"M12 1a9 9 0 0 0-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7a9 9 0 0 0-9-9z",
speaker:"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
image:"M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"};
IC.skipprev="M6 6h2v12H6zm3.5 6 8.5 6V6z";IC.skipnext="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z";
IC.chatb="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z";
function ic(n,size){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('class','i');
  if(size){s.style.width=s.style.height=size+'px'}const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',IC[n]||'');s.append(p);return s}
function setIcon(el,n,size){el.replaceChildren(ic(n,size))}

/* ---------- tiny helpers ---------- */
function h(tag,props={},...kids){
  const e=document.createElement(tag);
  for(const [k,v] of Object.entries(props||{})){
    if(v==null||v===false)continue;
    if(k==='class')e.className=v;else if(k==='style')e.style.cssText=v;
    else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);
    else if(k==='value')e.value=v;else e.setAttribute(k,v===true?'':v);
  }
  for(const kid of kids.flat(Infinity)){if(kid==null||kid===false)continue;e.append(kid.nodeType?kid:document.createTextNode(String(kid)))}
  return e}
const fa=s=>String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const short=(t,n)=>{t=String(t).replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n-1)+'…':t};
const dkey=ts=>{const d=new Date(ts*1000);return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()};
const fmtTime=ts=>fa(new Date(ts*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}));
const jdate=(ts,y=true)=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',...(y?{year:'numeric'}:{})}).format(new Date(ts*1000));
function dayDiff(ts){const a=new Date(ts*1000),b=new Date();a.setHours(0,0,0,0);b.setHours(0,0,0,0);return Math.round((b-a)/864e5)}
function dayLabel(ts){const d=dayDiff(ts);return d===0?'امروز':d===1?'دیروز':jdate(ts)}
function listTime(ts){const d=dayDiff(ts);return d===0?fmtTime(ts):d===1?'دیروز':d<7?new Intl.DateTimeFormat('fa-IR',{weekday:'long'}).format(new Date(ts*1000)):jdate(ts,false)}
const seenText=p=>p.online?'آنلاین':p.seen_hidden?'آخرین بازدید: به‌تازگی':'آخرین بازدید: '+lastSeen(p.last_seen);
function lastSeen(ts){if(!ts)return'مدت‌ها پیش';const d=dayDiff(ts);return d<=1?(d?'دیروز ':'امروز ')+fmtTime(ts):jdate(ts)}
const fmtSize=n=>n<1024?fa(n)+' B':n<1048576?fa((n/1024).toFixed(1))+' KB':fa((n/1048576).toFixed(1))+' MB';
const fmtDur=s=>{s=Math.max(0,Math.round(s||0));return fa(Math.floor(s/60)+':'+String(s%60).padStart(2,'0'))};
function strength(pw){let s=0;if(pw.length>=8)s++;if(pw.length>=12)s++;if(/[a-z]/.test(pw)&&/[A-Z]/.test(pw))s++;if(/\d/.test(pw))s++;if(/[^A-Za-z0-9]/.test(pw))s++;return pw?Math.min(s,4):0}
function pwError(pw,user){if(pw.length<8)return'رمز باید حداقل ۸ کاراکتر باشه';if(user&&pw.toLowerCase().includes(user.toLowerCase()))return'رمز نباید شامل نام کاربری باشه';
  if(/^\d+$/.test(pw)||/^[A-Za-z]+$/.test(pw))return'رمز باید ترکیبی از حرف و عدد (یا نماد) باشه';return null}
const lsGet=(k,d=null)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch{return d}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch{}};

/* ---------- text rendering: **bold** __italic__ ~~strike~~ `code` ```block``` ||spoiler|| links @mentions ---------- */
const INLINE=/(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\|\|[^|\n]+\|\||https?:\/\/[^\s<>"']+|@[A-Za-z0-9_]{3,32})/;
function inline(str,out){
  for(const part of str.split(INLINE)){
    if(!part)continue;
    if(part[0]==='`'&&part.length>2)out.append(h('code',{},part.slice(1,-1)));
    else if(part.startsWith('**')&&part.length>4)out.append(h('b',{},inline2(part.slice(2,-2))));
    else if(part.startsWith('__')&&part.length>4)out.append(h('i',{},inline2(part.slice(2,-2))));
    else if(part.startsWith('~~')&&part.length>4)out.append(h('s',{},part.slice(2,-2)));
    else if(part.startsWith('||')&&part.length>4)out.append(h('span',{class:'spoiler',onclick:e=>{e.stopPropagation();e.currentTarget.classList.toggle('open')}},part.slice(2,-2)));
    else if(/^https?:\/\//.test(part)){let u=part,tail='';const m=u.match(/[.,;:!?)»]+$/);if(m){tail=m[0];u=u.slice(0,-tail.length)}
      out.append(h('a',{href:u,target:'_blank',rel:'noopener noreferrer',onclick:e=>e.stopPropagation()},u),tail)}
    else if(part[0]==='@'&&USER_RE.test(part.slice(1)))out.append(h('span',{class:'mention'},part));
    else out.append(part)}}
function inline2(s){const f=document.createDocumentFragment();inline(s,f);return f}
const EMO_ONLY=/^(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*\s*){1,3}$/u;
function bodyEl(m){
  const t=m.body||'';
  if(!m.file&&EMO_ONLY.test(t.trim())){
    const d=h('div',{class:'text bigemo',dir:'auto',title:'بزن تا دوباره حرکت کنه'},t.trim());
    if(/[❤♥💖💗💓💕]/u.test(t))d.classList.add('heartmsg');
    d.onclick=e=>{e.stopPropagation();d.classList.remove('pop');void d.offsetWidth;d.classList.add('pop')};d.classList.add('pop');
    return d}
  return h('div',{class:'text',dir:'auto'},renderText(t))}
function renderText(text){
  const f=document.createDocumentFragment();
  text.split(/(```[\s\S]*?```)/).forEach(seg=>{
    if(seg.startsWith('```')&&seg.endsWith('```')&&seg.length>6)f.append(h('pre',{},seg.slice(3,-3).replace(/^\n/,'')));
    else inline(seg,f)});
  return f}

/* ---------- appearance settings ---------- */
const PREF={get accent(){return lsGet('wd-accent',ACCENTS[0])},get sound(){return lsGet('wd-sound','1')==='1'},get notif(){return lsGet('wd-notif','1')==='1'},get size(){return +lsGet('wd-size','15')}};
function applyAccent(c){const r=document.documentElement.style;r.setProperty('--accent',c);r.setProperty('--accent-d',c);
  const n=parseInt(c.slice(1),16);r.setProperty('--accent-soft',`rgba(${n>>16},${(n>>8)&255},${n&255},.14)`);
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=c;lsSet('wd-accent',c)}
function syncBar(){try{if(window.WD&&WD.setBar){const d=document.documentElement.dataset.theme==='dark';WD.setBar(d?'#181818':'#ffffff',d)}}catch{}}
function setTheme(t){document.documentElement.dataset.theme=t;lsSet('wd-theme',t);syncBar()}
function toggleTheme(){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')}
const WALLS=[['پیش‌فرض',''],['شب','linear-gradient(160deg,#0f2027,#203a43,#2c5364)'],['غروب','linear-gradient(160deg,#ff9966,#ff5e62 60%,#7b4397)'],['جنگل','linear-gradient(160deg,#134e5e,#71b280)'],['اقیانوس','linear-gradient(160deg,#2193b0,#6dd5ed)'],['بنفش','linear-gradient(160deg,#41295a,#2f0743 70%,#6a3093)'],['ساده روشن','#e9eef3'],['ساده تیره','#10151b']];
const wallUrl=(n,ver,small)=>'/wall/'+encodeURIComponent(n)+'?k='+encodeURIComponent(S.mediaKey||'')+'&v='+(ver||0)+(small?'&s=1':'');
const userWallUrl=(v,small)=>'/userwall?k='+encodeURIComponent(S.mediaKey||'')+'&v='+(v||0)+(small?'&s=1':'');
const wallSet=v=>{try{return JSON.parse(lsGet('wd-wallset','{}'))[v]||{}}catch{return{}}};     // size/fit of each own background (kept on this device)
const wallSetSave=(v,o)=>{try{const a=JSON.parse(lsGet('wd-wallset','{}'));if(o)a[v]=o;else delete a[v];lsSet('wd-wallset',JSON.stringify(a))}catch{}};
const WDIM={};
function paintMine(el,v,st){st=st||wallSet(v);const z=st.z||100,mode=st.mode||'cover';
  el.style.backgroundImage='url("'+userWallUrl(v)+'")';el.style.backgroundPosition='center';el.style.backgroundRepeat='no-repeat';
  if(z===100&&mode==='cover'){el.style.backgroundSize='cover';return}
  const d=WDIM[v];if(!d){el.style.backgroundSize='cover';const im=new Image();im.onload=()=>{WDIM[v]=[im.naturalWidth,im.naturalHeight];paintMine(el,v,st)};im.src=userWallUrl(v);return}
  const W=el.clientWidth,H=el.clientHeight;if(!W||!H){el.style.backgroundSize='cover';return}
  const k=(mode==='contain'?Math.min:Math.max)(W/d[0],H/d[1])*z/100;
  if(mode==='contain')el.style.backgroundColor='var(--bg2)';
  el.style.backgroundSize=Math.round(d[0]*k)+'px '+Math.round(d[1]*k)+'px'}
function dlgWallSize(v){
  const st=Object.assign({z:100,mode:'cover'},wallSet(v)),pv=h('div',{class:'wpv'});
  const paint=()=>{pv.style.backgroundColor='';paintMine(pv,v,st)};
  const zr=h('input',{type:'range',min:100,max:250,step:5,value:st.z,style:'padding:0;border:0',oninput:e=>{st.z=+e.target.value;zl.textContent=fa(st.z)+'٪';paint()}}),zl=h('span',{},fa(st.z)+'٪');
  const mb=(label,mode)=>h('button',{type:'button',class:'btn soft'+(st.mode===mode?' on':''),style:'flex:1',onclick:e=>{st.mode=mode;[...e.currentTarget.parentNode.children].forEach(x=>x.classList.remove('on'));e.currentTarget.classList.add('on');paint()}},label);
  dialog('اندازه پس‌زمینه',pv,h('label',{},'بزرگ‌نمایی ',zl),zr,h('div',{style:'display:flex;gap:8px;margin:10px 0'},mb('پر کردن صفحه','cover'),mb('کامل (بدون برش)','contain')),
    h('div',{style:'display:flex;gap:8px'},
      h('button',{class:'btn',style:'flex:1',onclick:()=>{if(st.z===100&&st.mode==='cover')wallSetSave(v,null);else wallSetSave(v,{z:st.z,mode:st.mode});lsSet('wd-wall','mine:'+v);applyWall();closeDialog()}},'ذخیره و استفاده'),
      h('button',{class:'btn soft',onclick:()=>{st.z=100;st.mode='cover';zr.value=100;zl.textContent=fa(100)+'٪';paint()}},'پیش‌فرض')));
  requestAnimationFrame(paint)}
function applyWall(){const w=$('#wall');if(!w)return;const v=lsGet('wd-wall','');
  w.style.backgroundImage='';w.style.backgroundColor='';w.style.backgroundSize='';w.classList.toggle('custom',!!v);
  if(v.startsWith('srv:')){if(!S.mediaKey)return;const[n,ver]=v.slice(4).split('|');w.style.backgroundImage='url("'+wallUrl(n,ver)+'")';w.style.backgroundSize='cover';w.style.backgroundPosition='center'}
  else if(v.startsWith('mine:')){if(!S.mediaKey)return;paintMine(w,v.slice(5))}
  else if(v.startsWith('img:')){w.style.backgroundImage='url("'+v.slice(4)+'")';w.style.backgroundSize='cover';w.style.backgroundPosition='center'}
  else if(v)w.style.background=v;else w.style.background=''}
function pickWallImage(file){
  if(!file)return;const url=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{const k=Math.min(1,1280/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);
    c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
    c.toBlob(async b=>{if(!b)return toast('عکس خیلی بزرگه');
      if(!S.mediaKey){try{lsSet('wd-wall','img:'+c.toDataURL('image/jpeg',.75));applyWall()}catch{toast('عکس خیلی بزرگه')}return}
      try{const r=await fetch('/userwall?k='+encodeURIComponent(S.mediaKey),{method:'POST',body:b}),j=await r.json();   // saved on the server, in YOUR folder
        if(!j.ok)return toast(j.error||'ذخیره نشد');S.wallV=j.v;S.walls=[j.v,...(S.walls||[]).filter(x=>x!==j.v)];lsSet('wd-wall','mine:'+j.v);applyWall();toast('پس‌زمینه ذخیره شد',false)}catch{toast('ذخیره نشد')}},'image/jpeg',.82)};
  im.onerror=()=>toast('عکس خونده نشد');im.src=url}
function applySize(n){document.body.style.fontSize=n+'px';lsSet('wd-size',n)}

/* ---------- network (auto-reconnect + persistent session; a call survives short drops) ---------- */
let ws=null,nextId=1,pingTimer=null,reconnecting=false,lastRx=Date.now(),netT=null,pingFails=0;const pending=new Map();
const getToken=()=>lsGet('wd-token'),setToken=t=>{lsSet('wd-token',t);try{window.WD&&WD.setToken&&WD.setToken(t||'')}catch{}};   // WD = bridge of the Android app (it keeps the token to poll for notifications)
if(window.WD&&WD.setToken){try{WD.setToken(lsGet('wd-token')||'')}catch{}}
const setNet=ok=>{clearTimeout(netT);const b=$('#netbar'),t=$('#apptitle');if(ok||!S.me){b.hidden=true;if(t){t.textContent='Windroida';t.classList.remove('wait')}}else netT=setTimeout(()=>{b.hidden=false;if(t){t.textContent='در حال اتصال…';t.classList.add('wait')}},1200)};
function connect(){
  return new Promise((res,rej)=>{
    if(ws&&ws.readyState===1)return res();
    const sock=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/ws');ws=sock;
    sock.onopen=()=>{lastRx=Date.now();pingFails=0;clearInterval(pingTimer);pingTimer=setInterval(()=>keepAlive(sock),12000);res()};
    sock.onerror=()=>rej(new Error('وصل شدن به سرور ممکن نشد'));
    sock.onmessage=e=>{lastRx=Date.now();let m;try{m=JSON.parse(e.data)}catch{return}
      if(m.event)return onEvent(m);
      const p=pending.get(m.id);if(p){pending.delete(m.id);if(m.ok)p.res(m);else{const er=new Error(m.error||'خطا');er.server=true;p.rej(er)}}};
    sock.onclose=()=>sockDead(sock);
  })}
/* a link is only declared dead when NOTHING arrived for a long while and two pings in a row got no answer
   (a busy upload link answers slowly; that must never end a call) */
async function keepAlive(sock){
  if(ws!==sock)return;
  if(Date.now()-lastRx<10000){pingFails=0;return}
  try{await Promise.race([call('ping'),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),C?25000:12000))]);pingFails=0}
  catch{if(ws===sock&&Date.now()-lastRx>(C?30000:15000)&&++pingFails>=2)sockDead(sock)}}
function sockDead(sock){
  if(ws!==sock)return;ws=null;clearInterval(pingTimer);
  for(const p of pending.values())p.rej(new Error('ارتباط با سرور قطع شد'));pending.clear();
  try{sock.close()}catch{}
  if(S.me){setNet(false);if(C&&C.state==='active'){C.reconnecting=true;showCallUI()}}
  if(getToken())reconnect()}
function call(op,data={}){
  return new Promise((res,rej)=>{
    if(!ws||ws.readyState!==1)return rej(new Error('به سرور وصل نیستی'));
    const id=nextId++;pending.set(id,{res,rej});ws.send(JSON.stringify({id,op,...data}))})}
async function hello(){
  try{const r=await call('hello',{caps:['call']});S.mediaKey=r.media_key;S.wallV=r.wall_v||0;S.walls=r.walls||(r.wall_v?[r.wall_v]:[]);applyWall();S.ice=r.ice_servers;S.maxUpload=r.max_upload;
    clearInterval(S.keyTimer);S.keyTimer=setInterval(()=>call('media_key').then(r=>{S.mediaKey=r.media_key}).catch(()=>{}),6*3600e3)}catch{}}
async function reconnect(){
  if(reconnecting)return;reconnecting=true;let delay=700;
  while(getToken()){
    try{
      await connect();const r=await call('resume',{token:getToken()});reconnecting=false;
      if(S.me){S.me=r.me;setNet(true);await afterReconnect()}else{$('#splash').hidden=true;await enter(r.me)}
      return;
    }catch(e){
      if(e.server){reconnecting=false;setToken(null);$('#splash').hidden=true;setNet(true);showAuth(e.message);return}
      if(S.me)setNet(false);
      await new Promise(r=>setTimeout(r,delay));delay=Math.min(delay*1.5,C?3000:6000)}}
  reconnecting=false}
async function afterReconnect(){
  await hello();buildDrawer();if(document.visibilityState!=='visible')call('visible',{v:false}).catch(()=>{});
  if(C){                                                    // back in the call that was running when the link dropped
    if(C.state==='active'){try{const r=await call('call_rejoin',{call_id:C.id});C.reconnecting=false;C.peerAway=!r.peer_online;C.next=0;showCallUI()}catch{endLocal('تماس تموم شده بود')}}
    else endLocal()}
  await refreshChats();S.readSent={};
  const id=S.current,keep=id&&S.msgs[id];S.msgs={};
  if(id&&keep){try{const r=await call('history',{chat_id:id,limit:40});S.msgs[id]=r.messages;S.hasMore[id]=r.has_more;S.hasNewer[id]=false;if(S.current===id){softRender();markRead(id)}}catch{}}}
async function boot(){
  if(!getToken()){$('#splash').hidden=true;return showAuth()}
  try{const m=JSON.parse(lsGet('wd-me')||'null'),cc=JSON.parse(lsGet('wd-chats')||'null');   // open instantly from the saved copy, like Telegram
    if(m&&cc&&cc.u===m.id){S.me=m;S.chats=cc.c;if(window.WD&&!S.mediaKey)S.mediaKey='cached';$('#splash').hidden=true;$('#auth').hidden=true;$('#app').hidden=false;buildDrawer();renderList();setNet(false)}}catch{}
  reconnect()}
let cacheT=null;
function saveCache(){clearTimeout(cacheT);cacheT=setTimeout(()=>{try{if(!S.me)return;const j=JSON.stringify({u:S.me.id,c:S.chats});if(j.length<600000){lsSet('wd-chats',j);lsSet('wd-me',JSON.stringify(S.me))}saveMsgs()}catch{}},1500)}
/* the last messages of recently opened chats are kept on the device too, so chats open with no internet (at most ~1.2 MB, oldest chats dropped first) */
function readMsgs(){try{const s=JSON.parse(lsGet('wd-msgs')||'null');if(s&&S.me&&s.u===S.me.id)return s}catch{}return{u:S.me&&S.me.id,o:[],m:{}}}
function saveMsgs(){
  if(!S.me)return;const st=readMsgs();
  for(const id of Object.keys(S.msgs)){const a=S.msgs[id];if(!a||!a.length||S.hasNewer[id]||!S.chats[id])continue;
    st.m[id]=a.slice(-40);st.o=st.o.filter(x=>x!==id);st.o.push(id)}
  st.o=st.o.filter(id=>S.chats[id]&&st.m[id]);
  for(const id of Object.keys(st.m))if(!st.o.includes(id))delete st.m[id];
  let j=JSON.stringify(st);while((j.length>1200000||st.o.length>30)&&st.o.length){delete st.m[st.o.shift()];j=JSON.stringify(st)}
  lsSet('wd-msgs',j)}

/* ---------- state ---------- */
const S={me:null,chats:{},msgs:{},hasMore:{},hasNewer:{},current:null,typing:{},drafts:(()=>{try{return JSON.parse(lsGet('wd-drafts')||'{}')}catch{return{}}})(),readSent:{},reply:null,editing:null,lastTyping:0,
  early:{},searchRes:[],searchGroups:[],searchJob:null,filter:'all',mediaKey:null,newBelow:0,users:{}};
function toast(t,err=true){const e=$('#toast');e.textContent=t;e.className=err?'err':'';e.hidden=false;clearTimeout(toast.j);toast.j=setTimeout(()=>e.hidden=true,3500)}
const at=n=>h('span',{dir:'ltr',style:'unicode-bidi:isolate;display:inline-block'},'@'+n);
const initial=t=>([...(t||'?').trim()][0]||'?').toUpperCase();
/* avatar(kind 'u'|'c', id, name, avatar_at, size, online) — photo from /avatar/..., initials fallback */
function avatar(kind,id,name,at,size,online){
  const a=h('div',{class:'avatar',style:`width:${size}px;height:${size}px;font-size:${size/2.3}px;background:${COLORS[Math.abs(id||0)%COLORS.length]}`},initial(name));
  if(at&&S.mediaKey){const img=h('img',{alt:'',loading:'lazy',src:`/avatar/${kind}${id}?k=${encodeURIComponent(S.mediaKey)}&v=${at}${size>64?'':'&s=1'}`,onerror:()=>img.remove()});a.append(img)}
  if(online)a.append(h('span',{class:'dot'}));return a}
const gav=(kind,id,name,at,size,online)=>{const a=avatar(kind,id,name,at,size,online);if(at){a.style.cursor='zoom-in';a.onclick=e=>{e.stopPropagation();openGallery(kind,id,name)}}return a};
const chatAvatar=(c,size,online)=>c.channel&&!c.avatar_at?h('div',{class:'avatar',style:`width:${size}px;height:${size}px;background:linear-gradient(135deg,#f4511e,#ff8a50)`},ic('channel',size*.55)):c.saved?(()=>{const a=h('div',{class:'avatar',style:`width:${size}px;height:${size}px;background:var(--accent)`},ic('bookmark',size*.55));return a})():
  c.peer?avatar('u',c.peer.id,c.peer.display_name,c.peer.avatar_at,size,online&&c.peer.online):avatar('c',c.id,c.title,c.avatar_at,size,false);

/* ---------- auth ---------- */
let mode='login',resetStep=1;
function field(id,label,type='text',extra={}){return [h('label',{for:id},label),h('input',{id,type,...extra})]}
function buildAuth(m){
  mode=m;const f=$('#form');f.replaceChildren();$('#amsg').textContent='';
  $('#tab-login').classList.toggle('on',m!=='register');$('#tab-register').classList.toggle('on',m==='register');
  const btn=$('#abtn');btn.disabled=false;
  if(m==='login'){btn.textContent='ورود';
    f.append(...field('f-user','نام کاربری','text',{autocomplete:'username',autocapitalize:'none',value:lsGet('wd-user','')}),
      ...field('f-pw','رمز عبور','password',{autocomplete:'current-password'}),
      h('div',{class:'row-between'},h('button',{type:'button',class:'link',onclick:()=>buildAuth('reset')},'رمزم رو فراموش کردم'),
        h('label',{style:'margin:0;cursor:pointer'},h('input',{type:'checkbox',style:'width:auto;margin-inline-end:6px',onchange:e=>{$('#f-pw').type=e.target.checked?'text':'password'}}),'نمایش رمز')));
  }else if(m==='register'){btn.textContent='ساخت حساب';
    const meter=h('div',{class:'meter'},h('i'),h('i'),h('i'),h('i')),ml=h('div',{class:'muted',style:'font-size:11px;min-height:16px'});
    f.append(...field('f-user','نام کاربری (انگلیسی، ۳ تا ۳۲ کاراکتر)','text',{autocomplete:'username',autocapitalize:'none'}),
      ...field('f-name','نام نمایشی'),
      ...field('f-pw','رمز عبور (حداقل ۸ کاراکتر، حرف + عدد)','password',{autocomplete:'new-password',oninput:e=>{const s=strength(e.target.value);
        [...meter.children].forEach((x,i)=>x.style.background=i<s?(s<=1?'var(--danger)':s==2?'var(--warn)':'var(--ok)'):'var(--border)');
        ml.textContent=e.target.value?'قدرت رمز: '+['','ضعیف','متوسط','خوب','قوی'][s]:''}}),
      meter,ml,...field('f-pw2','تکرار رمز','password',{autocomplete:'new-password'}),
      h('label',{for:'f-q'},'سوال امنیتی (برای بازیابی رمز)'),
      h('input',{id:'f-q',list:'qs',placeholder:'یه سوال بنویس یا از لیست انتخاب کن',value:''}),h('datalist',{id:'qs'},QUESTIONS.map(q=>h('option',{value:q}))),
      ...field('f-ans','جواب سوال امنیتی'),
      h('div',{class:'muted',style:'font-size:11px;margin-top:4px'},'سوالی بنویس که فقط خودت جوابش رو بدونی (نه چیزی که دیگران حدس می‌زنن، مثل اسم مدرسه). جوابت رو یادت نگه دار؛ تنها راه بازیابی رمزه.'),
      h('label',{class:'rules',style:'display:flex;gap:8px;align-items:center;margin-top:12px;font-size:13px;cursor:pointer'},h('input',{type:'checkbox',id:'f-rules',style:'width:18px;height:18px;flex:none'}),h('span',{},'',h('a',{href:'#',style:'color:var(--accent);font-weight:700',onclick:e=>{e.preventDefault();e.stopPropagation();showRules()}},'قوانین'),' را خوانده‌ام و می‌پذیرم')));
  }else{btn.textContent='دریافت سوال امنیتی';resetStep=1;
    f.append(...field('f-user','نام کاربری','text',{autocapitalize:'none'}),h('div',{class:'row-between'},h('button',{type:'button',class:'link',onclick:()=>buildAuth('login')},'← بازگشت به ورود')))}
  const first=f.querySelector('input');if(first&&innerWidth>760)first.focus()}
function say(t,kind=''){const e=$('#amsg');e.textContent=t;e.className='msg '+kind}
const val=id=>$('#'+id).value;
async function withNet(fn){const b=$('#abtn');b.disabled=true;say('صبر کن…','info');
  try{await connect();await fn()}catch(e){say(e.message)}finally{b.disabled=false}}
const devName=()=>{const u=navigator.userAgent;const b=/Edg\//.test(u)?'Edge':/OPR\//.test(u)?'Opera':/Chrome\//.test(u)?'Chrome':/Firefox\//.test(u)?'Firefox':/Safari\//.test(u)?'Safari':'Browser';
  const o=/Windows/.test(u)?'Windows':/Android/.test(u)?'Android':/iPhone|iPad/.test(u)?'iOS':/Mac OS/.test(u)?'macOS':/Linux/.test(u)?'Linux':'';return b+(o?' · '+o:'')};
async function submitAuth(){
  if(mode==='login'){
    const u=val('f-user').trim(),p=val('f-pw');if(!u||!p)return say('نام کاربری و رمز رو وارد کن');
    await withNet(async()=>{const r=await call('login',{username:u,password:p,device:devName()});setToken(r.session);await enter(r.me)});
  }else if(mode==='register'){
    const u=val('f-user').trim(),p=val('f-pw'),q=val('f-q').trim(),a=val('f-ans');
    if(!USER_RE.test(u))return say('نام کاربری باید ۳ تا ۳۲ کاراکتر و فقط حرف انگلیسی، عدد یا _ باشه');
    const pe=pwError(p,u);if(pe)return say(pe);if(p!==val('f-pw2'))return say('تکرار رمز با رمز یکی نیست');
    if(q.length<5)return say('یه سوال امنیتی انتخاب کن یا بنویس');if(a.trim().length<4)return say('جواب سوال امنیتی رو بنویس (حداقل ۴ حرف)');
    if(!$('#f-rules').checked)return say('برای ساخت حساب باید قوانین رو بپذیری');
    await withNet(async()=>{const r=await call('register',{username:u,password:p,display_name:val('f-name').trim()||u,sec_question:q,sec_answer:a,device:devName()});setToken(r.session);await enter(r.me)});
  }else if(resetStep===1){
    const u=val('f-user').trim();if(!u)return say('نام کاربری رو بنویس');
    await withNet(async()=>{const r=await call('reset_question',{username:u});resetStep=2;
      $('#f-user').disabled=true;
      $('#form').append(h('div',{style:'margin-top:12px;color:var(--accent);font-weight:700'},r.question),...field('f-ans','جواب'),...field('f-pw','رمز جدید','password',{autocomplete:'new-password'}),...field('f-pw2','تکرار رمز جدید','password',{autocomplete:'new-password'}));
      $('#abtn').textContent='تغییر رمز';$('#f-ans').focus();say('')});
  }else{
    const u=val('f-user').trim(),p=val('f-pw'),pe=pwError(p,u);if(pe)return say(pe);if(p!==val('f-pw2'))return say('تکرار رمز با رمز یکی نیست');
    await withNet(async()=>{await call('reset_password',{username:u,answer:val('f-ans'),new_password:p});lsSet('wd-user',u);buildAuth('login');say('رمز عوض شد. حالا با رمز جدید وارد شو.','ok')})}}
function showAuth(notice){
  S.me=null;S.current=null;S.chats={};S.msgs={};lsSet('wd-me',null);lsSet('wd-chats',null);lsSet('wd-msgs',null);document.title='Windroida';$('#app').hidden=true;$('#auth').hidden=false;buildAuth('login');if(notice)say(notice)}

/* ---------- entering the app ---------- */
async function enter(me){
  S.me=me;lsSet('wd-user',me.username);try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch{}registerSW();
  $('#auth').hidden=true;$('#app').hidden=false;$('#app').classList.remove('show-chat');S.current=null;showChatView(false);
  await hello();await refreshChats();loadPrivacy();buildDrawer();handleJoin();if(window.wdShare)setTimeout(window.wdShare,300);
  if(PREF.notif&&'Notification' in window&&Notification.permission==='default')setTimeout(()=>Notification.requestPermission().then(()=>pushSync()).catch(()=>{}),4000)}
async function refreshChats(){
  try{const r=await call('chats');const nw={};r.chats.forEach(c=>nw[c.id]=c);
    if(S.current&&!nw[S.current]&&S.chats[S.current])nw[S.current]=S.chats[S.current];S.chats=nw;renderList();if(S.current)fillHeader()}catch(e){toast(e.message)}}
function saveDrafts(){try{lsSet('wd-drafts',JSON.stringify(Object.fromEntries(Object.entries(S.drafts).filter(([,v])=>v))))}catch{}}
const lastKey=c=>c.last?[c.last.created_at,c.last.id]:[c.created_at,0];
const sorted=()=>Object.values(S.chats).sort((a,b)=>{if(!!a.fav!==!!b.fav)return a.fav?-1:1;const ka=lastKey(a),kb=lastKey(b);return kb[0]-ka[0]||kb[1]-ka[1]});
function preview(c){
  const m=c.last;if(!m)return'هنوز پیامی نیست';if(m.kind==='system')return short(m.body,44);if(m.deleted)return'';
  let t;if(m.file)t=m.file.voice?'🎤 پیام صوتی '+fmtDur(m.file.dur):({image:'🖼 ',video:'🎬 ',audio:'🎵 '}[m.file.kind]||'📎 ')+(m.body||m.file.name);else t=m.body;
  const p=m.sender_id===S.me.id?'تو: ':(c.kind==='group'&&m.sender_name?short(m.sender_name,12)+': ':'');return short(p+t,48)}
const FILTERS=[['all','همه'],['unread','خوانده‌نشده'],['private','شخصی'],['group','گروه‌ها'],['fav','سنجاق‌شده']];
function renderFilters(){
  const el=$('#filters');el.replaceChildren(...FILTERS.map(([k,t])=>{
    const n=k==='unread'?Object.values(S.chats).filter(c=>c.unread&&!c.muted).length:0;
    return h('button',{class:S.filter===k?'on':'',onclick:()=>{S.filter=k;renderFilters();renderList()}},t,n?h('span',{class:'cnt'},fa(n)):null)}))}
function chatRow(c){
  const tp=Object.entries(S.typing).filter(([k,x])=>k.startsWith(c.id+':')&&x.exp>Date.now()),typing=tp.length>0,tpText=tp.length&&tp[0][1].action==='voice'?'در حال ضبط ویس…':'در حال نوشتن…';
  return h('div',{class:'chat'+(c.id===S.current?' sel':''),onclick:()=>openChat(c.id),oncontextmenu:e=>{e.preventDefault();chatMenu(e.clientX,e.clientY,c)}},
    chatAvatar(c,52,true),
    h('div',{class:'ci'},
      h('div',{class:'ct'},h('span',{class:'name'},c.channel?ic('channel'):c.kind==='group'?ic('group'):null,c.title,c.muted?ic('bellx'):null),h('span',{class:'time'},(c.last&&c.last.sender_id===S.me.id&&!c.last.deleted&&c.last.kind!=='system')?h('span',{class:'tick'+(c.peer_read>=c.last.id?' read':'')},ic(c.peer_read>=c.last.id?'checkall':'check',16)):null,c.last?listTime(c.last.created_at):'')),
      h('div',{class:'cb'},h('span',{class:'prev'},typing?h('span',{class:'typing'},tpText):preview(c)),
        c.unread?h('span',{class:'badge'+(c.muted?' muted':'')},fa(c.unread>99?'99+':c.unread)):(c.fav?ic('pin',16):null))))}
function renderList(){
  renderFilters();
  const q=$('#search').value.trim().toLowerCase(),box=$('#list');box.replaceChildren();
  let chats=sorted();
  if(S.filter==='unread')chats=chats.filter(c=>c.unread);else if(S.filter==='private')chats=chats.filter(c=>c.kind==='private');
  else if(S.filter==='group')chats=chats.filter(c=>c.kind==='group');else if(S.filter==='fav')chats=chats.filter(c=>c.fav);
  if(q)chats=chats.filter(c=>c.title.toLowerCase().includes(q)||(c.peer&&c.peer.username.toLowerCase().includes(q)));
  chats.forEach(c=>box.append(chatRow(c)));
  if(q&&S.searchRes.length){box.append(h('div',{class:'sect'},'کاربران'));
    S.searchRes.forEach(u=>box.append(h('div',{class:'chat',onclick:()=>openPrivate(u.username)},avatar('u',u.id,u.display_name,u.avatar_at,46,u.online),
      h('div',{class:'ci'},h('div',{class:'name'},u.display_name),h('div',{class:'prev'},at(u.username))))))}
  if(!chats.length&&!q)box.append(h('div',{class:'hint'},S.filter==='all'?['هنوز چتی نداری.',h('br'),'با دکمه مداد پایین، چت یا گروه جدید بساز.']:'چتی در این دسته نیست.'));
  if(q&&(S.searchGroups||[]).length){box.append(h('div',{class:'sect'},'گروه‌ها'));
    S.searchGroups.forEach(g=>box.append(h('div',{class:'chat',onclick:()=>{if(S.chats[g.id])openChat(g.id);else joinDialog({...g,member:false},{username:g.username})}},h('div',{class:'avatar',style:`width:46px;height:46px;background:${COLORS[g.id%COLORS.length]}`},ic('group',24)),
      h('div',{class:'ci'},h('div',{class:'name'},g.title),h('div',{class:'prev'},at(g.username),' · '+fa(g.member_count)+' عضو')))))}
  if(q&&(S.msgRes||[]).length){box.append(h('div',{class:'sect'},'پیام‌ها'));
    S.msgRes.forEach(r=>{const c=S.chats[r.chat_id];if(!c)return;box.append(h('div',{class:'chat',onclick:()=>{$('#search').value='';S.msgRes=[];renderList();openChat(r.chat_id,r.id)}},
      chatAvatar(c,46,true),
      h('div',{class:'ci'},h('div',{class:'name'},c.title),h('div',{class:'prev'},(r.sender?r.sender+': ':'')+r.text))))})}
  if(q&&!chats.length&&!S.searchRes.length&&!(S.searchGroups||[]).length&&!(S.msgRes||[]).length)box.append(h('div',{class:'hint'},'برای پیدا کردن کاربر جدید، نام کاربری کامل‌ش رو بنویس (مثلاً ali_123)'));
  const other=Object.values(S.chats).reduce((a,c)=>a+(c.id!==S.current&&!c.muted?c.unread:0),0),bb=$('#bb');if(bb){bb.hidden=!other;bb.textContent=fa(other>99?'99+':other)}
  saveCache();renderNav();
  const total=Object.values(S.chats).reduce((a,c)=>a+(c.muted?0:c.unread),0);document.title=total?`(${fa(total)}) Windroida`:'Windroida'}
/* bottom bar (phone / Android app): Chats · Contacts · Settings · Profile */
function renderNav(){
  const nav=$('#bnav');if(!nav||!S.me)return;
  nav.querySelectorAll('button').forEach(b=>{const t=b.dataset.t,bi=b.firstElementChild;
    if(!bi.firstChild||bi.dataset.me!==String(S.me.avatar_at||0)+t){
      if(t==='me'){bi.replaceChildren(avatar('u',S.me.id,S.me.display_name,S.me.avatar_at,26,false))}
      else bi.replaceChildren(ic({chats:'chatb',contacts:'person',settings:'settings'}[t],26));
      bi.dataset.me=String(S.me.avatar_at||0)+t}
    b.classList.toggle('on',t==='chats'?S.filter!=='private':t==='contacts'?S.filter==='private':false)});
  const n=Object.values(S.chats).filter(c=>c.unread&&!c.muted).length;let e=nav.querySelector('.nb');
  if(!e){e=h('em',{class:'nb'});nav.querySelector('[data-t=chats] .bi').append(e)}e.hidden=!n;e.textContent=fa(n>99?'99+':n)}
function navGo(t){
  if(t==='chats'){S.filter='all';$('#list').scrollTop=0;renderList()}
  else if(t==='contacts'){S.filter='private';$('#list').scrollTop=0;renderList()}
  else if(t==='settings')dlgSettings();else if(t==='me')dlgProfile()}
/* Android back button: close the top-most thing; false = nothing left, app goes to background */
window.wdBack=()=>{
  if(!$('#ctx').hidden){$('#ctx').hidden=true;return true}
  if(document.getElementById('psheet')){closeSheet();return true}
  if(!$('#modal').hidden){closeDialog();return true}
  if(!$('#lightbox').hidden){$('#lightbox').hidden=true;return true}
  if($('#drawer').classList.contains('on')){openDrawer(false);return true}
  if(!$('#emoji').hidden){$('#emoji').hidden=true;return true}
  if(!$('#schbar').hidden){closeSearch();return true}
  if(S.reply||S.editing){clearBar();autosize();return true}
  if($('#app').classList.contains('show-chat')){$('#back').click();return true}
  if(S.me&&S.filter!=='all'){S.filter='all';renderList();return true}
  return false};
async function openPrivate(username){
  try{const r=await call('open_private',{username});S.chats[r.chat.id]=S.chats[r.chat.id]||r.chat;$('#search').value='';S.searchRes=[];renderList();openChat(r.chat.id)}catch(e){toast(e.message)}}
function chatMenu(x,y,c){
  const items=[[c.fav?'سنجاق‌شده رو بردار':'سنجاق به بالای لیست','pin',()=>setChat(c.id,{fav:!c.fav})],
    [c.muted?'فعال کردن اعلان':'بی‌صدا کردن','bellx',()=>setChat(c.id,{muted:!c.muted})]];
  if(c.unread)items.push(['علامت‌گذاری خوانده‌شده','check',()=>{call('read',{chat_id:c.id,up_to:(c.last&&c.last.id)||0}).catch(()=>{});c.unread=0;renderList()}]);
  if(c.kind==='group'&&!c.channel)items.push(['ترک گروه','logout',()=>leaveGroup(c),true]);
  if(c.kind==='group'&&!c.channel&&c.owner_id===S.me.id)items.push(['حذف گروه','delete',()=>deleteGroup(c),true]);
  popMenu(x,y,items)}
async function setChat(id,patch){try{const r=await call('chat_settings',{chat_id:id,...patch});S.chats[id]=Object.assign(S.chats[id]||{},r.chat);renderList();if(S.current===id)fillHeader()}catch(e){toast(e.message)}}
async function leaveGroup(c){if(!confirm('از گروه «'+c.title+'» خارج بشی؟'))return;try{await call('leave',{chat_id:c.id});onEvent({event:'chat_removed',chat_id:c.id});closeDialog()}catch(e){toast(e.message)}}

async function deleteGroup(c){if(!confirm('گروه «'+c.title+'» برای همه اعضا حذف بشه؟ (فایل‌های آپلودشده روی سرور می‌مونن)'))return;
  try{await call('delete_group',{chat_id:c.id});onEvent({event:'chat_removed',chat_id:c.id});closeDialog()}catch(e){toast(e.message)}}

/* ---------- chat view ---------- */
function showChatView(on){$('#chatview').hidden=!on;$('#empty').hidden=on}
async function openChat(id,aroundId){
  if(!S.chats[id])return;
  if(S.current&&S.current!==id)S.drafts[S.current]=$('#input').value;saveDrafts();
  if(S.current!==id){cancelRec(true);closeSearch(true)}
  S.current=id;clearBar();showChatView(true);$('#app').classList.add('show-chat');S.newBelow=0;
  $('#input').value=S.drafts[id]||'';autosize();fillHeader();renderList();updateSendBtn();
  const c=S.chats[id];S.unreadFrom=c.unread?c.my_read:null;
  if(aroundId){await loadAround(aroundId)}
  else if(S.msgs[id]&&!S.hasNewer[id]){renderMsgs();markRead(id)}
  else{$('#msgs').replaceChildren(h('div',{class:'hint'},'در حال بارگذاری…'));
    try{const r=await call('history',{chat_id:id,limit:40});S.msgs[id]=r.messages;S.hasMore[id]=r.has_more;S.hasNewer[id]=false;
      for(const m of (S.early[id]||[]))if(!S.msgs[id].some(x=>x.id===m.id))S.msgs[id].push(m);delete S.early[id];S.msgs[id].sort((a,b)=>a.id-b.id);
      if(S.current===id){renderMsgs();markRead(id)}}
    catch(e){const old=readMsgs().m[id];                       // no internet: show the copy saved on this device
      if(old&&old.length&&S.current===id){S.msgs[id]=old;S.hasMore[id]=false;S.hasNewer[id]=false;renderMsgs();toast('بدون اینترنت: پیام‌های ذخیره‌شده',false)}
      else toast(e.message)}}
  if(matchMedia('(min-width:761px)').matches)$('#input').focus()}
async function loadAround(mid){
  const id=S.current;
  try{const r=await call('history',{chat_id:id,around:mid,limit:40});S.msgs[id]=r.messages;S.hasMore[id]=r.has_more;S.hasNewer[id]=!!r.has_newer;
    if(S.current===id){renderMsgs(mid);flash(mid)}}catch(e){toast(e.message)}}
function subtitle(c){
  if(c.channel)return[fa(c.member_count)+' مشترک',false];
  const now=Date.now(),t=Object.entries(S.typing).filter(([k,x])=>k.startsWith(c.id+':')&&x.exp>now);
  if(t.length)return[t[0][1].action==='voice'?'در حال ضبط پیام صوتی…':'در حال نوشتن…',true];
  if(c.saved)return['فقط خودت می‌بینی',false];
  if(c.channel)return[fa(c.member_count)+' مشترک',false];
  if(c.kind==='group')return[fa(c.member_count)+' عضو',false];
  if(!c.peer)return['',false];return[seenText(c.peer),!!c.peer.online]}
function fillHeader(){
  const c=S.chats[S.current];if(!c)return;
  $('#hav').replaceChildren(chatAvatar(c,42,false));$('#hname').textContent=c.title;
  $('#callbtn').hidden=$('#vcallbtn').hidden=!(c.kind==='private'&&c.peer);refreshSub();
  const pb=$('#pinbar');pb.hidden=!c.pin_msg;if(c.pin_msg){$('#pintxt').textContent=short((c.pin_msg.sender_name?c.pin_msg.sender_name+': ':'')+c.pin_msg.text,80)}
  const ro=!!(c.channel&&!c.can_post);$('#composer').hidden=ro;$('#ronly').hidden=!ro}
function refreshSub(){const c=S.chats[S.current];if(!c)return;const[t,live]=subtitle(c);const e=$('#hsub');e.textContent=t;e.className=live?'live':''}
function tickEl(m){const c=S.chats[m.chat_id],read=c&&c.peer_read>=m.id;const t=h('span',{class:'tick'+(read?' read':''),'data-mid':m.id},ic(read?'checkall':'check',16));return t}
const mediaUrl=(m,dl)=>'/media/'+m.id+'?k='+encodeURIComponent(S.mediaKey||'')+(dl?'&dl=1':'');
const thumbUrl=m=>'/thumb/'+m.id+'?k='+encodeURIComponent(S.mediaKey||'');
const msgRef=m=>(S.msgs[m.chat_id]||[]).find(x=>x.id===m.id)||m;
function fileCard(m){
  const ext=(m.file.name.includes('.')?m.file.name.split('.').pop():'').slice(0,4).toUpperCase();
  return h('div',{class:'file',onclick:()=>download(m)},h('span',{class:'ic'},ic('file'),ext?h('em',{},ext):null),
    h('div',{class:'fi'},h('b',{},short(m.file.name,34)),h('small',{},fmtSize(m.file.size))),h('span',{class:'dl'},ic('download',20)))}
/* one shared audio player for voice messages and music: one plays at a time, keeps playing when you change chat,
   shows a mini player bar (list + chat) and plays the next song / voice message by itself */
const VP={audio:null,mid:null,m:null,rate:1,uis:new Map()};
function markPlayed(m){
  const r=msgRef(m),f=r.file;if(!f||r.sender_id===S.me.id||(f.played||[]).includes(S.me.id))return;
  (f.played=f.played||[]).push(S.me.id);document.querySelectorAll(`[data-bid="${m.id}"] .vdot`).forEach(x=>x.remove());
  call('voice_played',{message_id:m.id}).catch(()=>{})}
/* every card of the playing message (the chat can be redrawn at any time) is kept in sync */
function regUi(m,ui){let s=VP.uis.get(m.id);if(!s){s=new Set();VP.uis.set(m.id,s)}s.add(ui);
  if(VP.mid===m.id&&VP.audio){const a=VP.audio;setIcon(ui.play,a.paused?'play':'pause');if(isFinite(a.duration)&&!ui.dur)ui.dur=a.duration;ui.paint(a.currentTime)}}
function eachUi(fn){const s=VP.uis.get(VP.mid);if(!s)return;for(const u of [...s]){if(!u.play.isConnected){s.delete(u);continue}try{fn(u)}catch{}}}
function playToggle(m,ui){
  if(VP.mid===m.id&&VP.audio){VP.audio.paused?VP.audio.play().catch(()=>{}):VP.audio.pause();return}
  startPlay(m,ui)}
function startPlay(m,ui){
  stopVoice();const a=new Audio(mediaUrl(m));a.preload='auto';a.playbackRate=(ui&&ui.rate)||VP.rate||1;
  VP.audio=a;VP.mid=m.id;VP.m=m;
  a.onplay=()=>{eachUi(u=>setIcon(u.play,'pause'));paintMini();mediaSess()};
  a.onpause=()=>{eachUi(u=>setIcon(u.play,'play'));paintMini()};
  a.onloadedmetadata=()=>{if(isFinite(a.duration))eachUi(u=>{if(!u.dur){u.dur=a.duration;u.reset&&u.reset()}})};
  a.ontimeupdate=()=>{eachUi(u=>u.paint(a.currentTime));paintMiniBar()};
  a.onended=()=>{const m0=VP.m;
    if(!m0.file.voice&&VP.repeat==='one'){a.currentTime=0;a.play().catch(()=>{});return}
    stopVoice();
    if(!playNext(m0,1)&&VP.repeat==='all'&&!m0.file.voice){const l=songsOf(m0.chat_id);if(l.length)startPlay(l[0],null)}};
  a.onerror=()=>{toast('پخش ممکن نشد');stopVoice()};
  a.play().catch(()=>{});
  if(m.file.voice)markPlayed(m);
  paintMini()}
function stopVoice(){
  const a=VP.audio;if(a){a.onplay=a.onpause=a.ontimeupdate=a.onended=a.onerror=a.onloadedmetadata=null;try{a.pause()}catch{}}
  eachUi(u=>{setIcon(u.play,'play');u.reset&&u.reset()});
  VP.audio=null;VP.mid=null;VP.m=null;paintMini();
  try{if('mediaSession' in navigator&&!C)navigator.mediaSession.metadata=null}catch{}}
/* next / previous song (or next unheard voice message) of the same chat */
function neighbour(m,dir){
  const l=(S.msgs[m.chat_id]||[]).filter(x=>!x.deleted&&x.file&&(m.file.voice?x.file.voice:(x.file.kind==='audio'&&!x.file.voice)));
  const i=l.findIndex(x=>x.id===m.id);if(i<0)return null;
  if(dir>0){for(let j=i+1;j<l.length;j++){if(!m.file.voice||(l[j].sender_id!==S.me.id&&!(l[j].file.played||[]).includes(S.me.id)))return l[j]}return null}
  return i>0&&!m.file.voice?l[i-1]:null}
function playNext(m,dir){const n=m&&neighbour(m,dir);if(n)startPlay(n,null);return !!n}
const songsOf=cid=>(S.msgs[cid]||[]).filter(x=>!x.deleted&&x.file&&x.file.kind==='audio'&&!x.file.voice);
function mediaSess(){
  if(!('mediaSession' in navigator)||!VP.m||C)return;
  const m=VP.m,f=m.file;
  try{navigator.mediaSession.metadata=new MediaMetadata({title:f.voice?'پیام صوتی':f.name.replace(/\.[^.]+$/,''),artist:m.sender_name||'',album:'Windroida'});
    const set=(k,fn)=>{try{navigator.mediaSession.setActionHandler(k,fn)}catch{}};
    set('play',()=>VP.audio&&VP.audio.play().catch(()=>{}));set('pause',()=>VP.audio&&VP.audio.pause());
    set('previoustrack',()=>VP.m&&playNext(VP.m,-1));set('nexttrack',()=>VP.m&&playNext(VP.m,1));
    set('seekto',e=>{if(VP.audio&&isFinite(e.seekTime))VP.audio.currentTime=e.seekTime})}catch{}}
/* the mini player bar (like Telegram): play/pause · title · speed · close; tap the title to jump to the message */
function fillMini(el){
  const pb=h('button',{class:'iconbtn mp',type:'button',title:'پخش/توقف',onclick:e=>{e.stopPropagation();if(VP.audio)VP.audio.paused?VP.audio.play().catch(()=>{}):VP.audio.pause()}}),
    prev=h('button',{class:'iconbtn mprev',type:'button',title:'قبلی',onclick:e=>{e.stopPropagation();VP.m&&playNext(VP.m,-1)}}),
    next=h('button',{class:'iconbtn mnext',type:'button',title:'بعدی',onclick:e=>{e.stopPropagation();VP.m&&playNext(VP.m,1)}}),
    rate=h('button',{class:'mrate',type:'button',title:'سرعت',onclick:e=>{e.stopPropagation();if(!VP.audio)return;VP.rate=VP.rate===1?1.5:VP.rate===1.5?2:1;VP.audio.playbackRate=VP.rate;paintMini()}}),
    x=h('button',{class:'iconbtn mx',type:'button',title:'بستن',onclick:e=>{e.stopPropagation();stopVoice()}}),
    tt=h('b',{class:'mtt'}),ts=h('span',{class:'mts'}),bar=h('i',{class:'mbar'},h('b')),
    mid=h('div',{class:'mt',onclick:()=>{if(!VP.m)return;if(!VP.m.file.voice)return openPlayer();if(S.chats[VP.m.chat_id])openChat(VP.m.chat_id,VP.m.id)}},tt,ts);
  setIcon(prev,'skipprev',20);setIcon(next,'skipnext',20);setIcon(x,'close',20);
  el.replaceChildren(pb,mid,prev,next,rate,x,bar);el._m={pb,tt,ts,bar,rate,prev,next}}
function paintMini(){
  document.querySelectorAll('.mini').forEach(el=>{
    if(!el._m)fillMini(el);const q=el._m,m=VP.m,a=VP.audio;el.hidden=!a||!m;if(!a||!m)return;
    const f=m.file,c=S.chats[m.chat_id];
    q.tt.textContent=f.voice?'پیام صوتی':f.name.replace(/\.[^.]+$/,'');
    q.ts.textContent=(m.sender_id===S.me.id?'تو':(m.sender_name||''))+(c&&c.kind==='group'?' · '+c.title:'');
    setIcon(q.pb,a.paused?'play':'pause',22);
    q.rate.textContent='×'+fa(VP.rate);q.rate.hidden=!f.voice;
    q.prev.hidden=q.next.hidden=!!f.voice||!(neighbour(m,1)||neighbour(m,-1));
    paintMiniBar()});paintSheet()}
function paintMiniBar(){const a=VP.audio;paintSheetBar();document.querySelectorAll('.mini').forEach(el=>{if(el._m&&a)el._m.bar.firstChild.style.width=(isFinite(a.duration)&&a.duration?a.currentTime/a.duration*100:0)+'%'})}
function seekFrac(e,el,ui,m){const r=el.getBoundingClientRect(),frac=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));
  if(!(VP.mid===m.id&&VP.audio))playToggle(m,ui);const a=VP.audio;if(a&&ui.dur){try{a.currentTime=frac*ui.dur}catch{}}}
function voiceBlock(m){
  const f=m.file,bars=(f.wave&&f.wave.length?f.wave:Array.from({length:32},(_,i)=>6+((i*7)%14)));
  const unheard=m.sender_id!==S.me.id&&!(f.played||[]).includes(S.me.id);
  const play=h('button',{class:'play',type:'button'},ic('play')),vt=h('span',{class:'vt'},fmtDur(f.dur||0)),sp=h('button',{class:'sp',type:'button'},'×'+fa(VP.rate));
  const wv=h('div',{class:'wv'},bars.map(b=>h('i',{style:`height:${Math.max(3,Math.round((b+1)/32*28))}px`})));
  const ui={play,wv,dur:f.dur||0,m,rate:VP.rate};
  ui.paint=t=>{const n=wv.children.length,k=ui.dur?Math.floor(t/ui.dur*n):0;[...wv.children].forEach((b,i)=>b.classList.toggle('on',i<k));vt.textContent=fmtDur(t)};
  ui.reset=()=>{[...wv.children].forEach(b=>b.classList.remove('on'));vt.textContent=fmtDur(ui.dur)};
  play.onclick=e=>{e.stopPropagation();playToggle(m,ui)};
  wv.onclick=e=>{e.stopPropagation();seekFrac(e,wv,ui,m)};
  sp.onclick=e=>{e.stopPropagation();VP.rate=VP.rate===1?1.5:VP.rate===1.5?2:1;ui.rate=VP.rate;if(VP.audio)VP.audio.playbackRate=VP.rate;document.querySelectorAll('.voice .sp').forEach(x=>x.textContent='×'+fa(VP.rate));paintMini()};
  regUi(m,ui);
  return h('div',{class:'voice'},play,h('div',{style:'flex:1;min-width:0'},wv,h('div',{style:'display:flex;justify-content:space-between;align-items:center'},h('span',{style:'display:flex;align-items:center;gap:6px'},vt,unheard?h('i',{class:'vdot',title:'هنوز گوش ندادی'}):null),sp)))}
/* music / audio file: filled card with big play button, title, duration and size (like Telegram) */
function musicBlock(m){
  const f=m.file,title=f.name.replace(/\.[^.]+$/,''),play=h('button',{class:'play big',type:'button'},ic('play')),sub=h('div',{class:'msub'},fmtSize(f.size)),fill=h('i'),bar=h('div',{class:'mbar'},fill);
  const ui={play,dur:0,m,rate:1};
  ui.paint=t=>{fill.style.width=(ui.dur?t/ui.dur*100:0)+'%';sub.textContent=fmtDur(t)+' • '+fmtSize(f.size)};
  ui.reset=()=>{fill.style.width='0';sub.textContent=(ui.dur?fmtDur(ui.dur)+' • ':'')+fmtSize(f.size)};
  play.onclick=e=>{e.stopPropagation();playToggle(m,ui)};bar.onclick=e=>{e.stopPropagation();seekFrac(e,bar,ui,m)};
  regUi(m,ui);
  return h('div',{class:'music'},play,h('div',{class:'mi'},h('b',{},short(title,40)),sub,bar),
    h('button',{class:'iconbtn dl',type:'button',title:'ذخیره',onclick:e=>{e.stopPropagation();download(m)}},ic('download',20)))}
/* image / video preview: a small thumbnail made by the sender's browser; the real file is only fetched when you tap */
const thumbQ=[];let thumbBusy=false;
const thumbIO='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){thumbIO.unobserve(e.target);e.target._lz&&e.target._lz()}}),{rootMargin:'100px'}):null;
async function thumbPump(){if(thumbBusy)return;thumbBusy=true;
  while(thumbQ.length){const job=thumbQ.shift();try{await job()}catch{}}thumbBusy=false}
/* old videos without a preview: make one (one at a time, only when scrolled into view) and store it for everyone */
function lazyThumb(box,m){
  box._lz=()=>thumbQ.push(()=>new Promise(done=>{
    if(!S.mediaKey||!box.isConnected||box.classList.contains('playing'))return done();
    makeThumb(mediaUrl(m),'video').then(t=>{done();if(!t||!box.isConnected)return;
      box.prepend(h('img',{src:URL.createObjectURL(t.blob),alt:''}));box.classList.remove('nothumb');
      fetch('/thumb?'+new URLSearchParams({k:S.mediaKey,message_id:m.id,w:t.w,h:t.h}),{method:'POST',body:t.blob}).catch(()=>{})})}))&&thumbPump();
  if(thumbIO)thumbIO.observe(box)}
function mediaBox(m){
  const f=m.file,vid=f.kind==='video',fail=()=>box.replaceWith(fileCard(m));
  const ratio=f.tw&&f.th?f.tw/f.th:(vid?16/9:4/3),w=ratio<.9?'230px':'320px';
  const box=h('div',{class:'pv'+(f.thumb?'':' nothumb'),style:`aspect-ratio:${Math.max(.5,Math.min(2.2,ratio)).toFixed(3)};width:${w};max-width:100%`});
  if(f.thumb)box.append(h('img',{src:thumbUrl(m),alt:'',loading:'lazy',draggable:'false',onerror:e=>e.target.remove()}));
  if(vid&&!f.thumb)lazyThumb(box,m);
  if(vid){box.append(h('span',{class:'pbtn'},ic('play',30)),h('span',{class:'psz'},fmtSize(f.size)));
    box.onclick=e=>{e.stopPropagation();if(window.WD&&WD.playVideo){try{WD.playVideo(mediaUrl(m),f.name||'');return}catch{}}      // Android app: native full-screen player
      const v=h('video',{class:'media',src:mediaUrl(m),controls:true,autoplay:true,preload:'auto',playsinline:true,onerror:fail});box.replaceChildren(v);box.classList.add('playing');box.style.aspectRatio='auto';box.onclick=null}}
  else box.onclick=e=>{e.stopPropagation();lightbox(mediaUrl(m))};
  return box}
function fileBlock(m){
  const f=m.file,k=f.kind,fail=e=>e.target.replaceWith(fileCard(m));
  if(S.mediaKey){
    if(f.voice)return voiceBlock(m);
    if(k==='audio')return musicBlock(m);
    if(k==='image'&&f.thumb)return mediaBox(m);
    if(k==='image')return h('img',{class:'media',src:mediaUrl(m),loading:'lazy',alt:f.name,onclick:e=>{e.stopPropagation();lightbox(mediaUrl(m))},onerror:fail});
    if(k==='video')return mediaBox(m)}
  return fileCard(m)}
function lightbox(src){const l=$('#lightbox');l.replaceChildren(h('img',{src}),h('button',{class:'iconbtn x',style:'color:#fff'},ic('close')));l.hidden=false;l.onclick=()=>{l.hidden=true;l.replaceChildren()}}
/* profile photo gallery: swipe / arrows / dots through every kept photo (like Telegram) */
async function openGallery(kind,id,title){
  let pics=[];
  try{const r=await call('avatar_list',kind==='u'?{user_id:id}:{chat_id:id});pics=r.pics}catch(e){return toast(e.message)}
  if(!pics.length)return toast('عکسی نیست',false);
  const l=$('#lightbox');let i=0;
  const url=(n,small)=>`/avatar/${kind}${id}?k=${encodeURIComponent(S.mediaKey)}&pic=${encodeURIComponent(n)}${small?'&s=1':''}`;
  const img=h('img',{class:'gimg',draggable:'false'}),cnt=h('div',{class:'gcnt'}),dots=h('div',{class:'gdots'}),cap=h('div',{class:'gcap'},title||'');
  const show=n=>{i=(n+pics.length)%pics.length;img.src=url(pics[i]);cnt.textContent=fa(i+1)+' از '+fa(pics.length);
    dots.replaceChildren(...pics.map((_,k)=>h('i',{class:k===i?'on':''})));img.classList.remove('slide');void img.offsetWidth;img.classList.add('slide')};
  const close=()=>{l.hidden=true;l.replaceChildren();l.onclick=null;document.removeEventListener('keydown',key)};
  const key=e=>{if(e.key==='ArrowLeft')show(i+1);else if(e.key==='ArrowRight')show(i-1);else if(e.key==='Escape')close()};
  const nav=(cls,icn,fn)=>h('button',{class:'iconbtn gnav '+cls,onclick:e=>{e.stopPropagation();fn()}},ic(icn));
  l.replaceChildren(img,cap,cnt,dots,h('button',{class:'iconbtn x',style:'color:#fff',onclick:e=>{e.stopPropagation();close()}},ic('close')),
    pics.length>1?nav('gl','back',()=>show(i+1)):null,pics.length>1?nav('gr','back',()=>show(i-1)):null);
  let x0=null;l.ontouchstart=e=>{x0=e.touches[0].clientX};
  l.ontouchend=e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>40&&pics.length>1){show(dx<0?i+1:i-1)}};
  l.onclick=e=>{if(e.target===l)close()};document.addEventListener('keydown',key);l.hidden=false;show(0)}
function uAv(id,size){
  if(id===S.me.id)return avatar('u',id,S.me.display_name,S.me.avatar_at,size,false);
  const c=Object.values(S.chats).find(x=>x.peer&&x.peer.id===id);
  return c?avatar('u',id,c.peer.display_name,c.peer.avatar_at,size,false):avatar('u',id,userName(id),S.users['a'+id]||0,size,false)}
function reactBar(m){
  if(!m.reactions||!m.reactions.length)return null;
  return h('div',{class:'reacts'},m.reactions.map(r=>h('span',{class:'react'+(r.users.includes(S.me.id)?' me':'')+(r.e==='❤️'?' heart':''),title:r.users.map(u=>userName(u)).join('، '),onclick:e=>{e.stopPropagation();react(m,r.e)}},
    h('span',{class:'re'},r.e),r.users.length<=3?h('span',{class:'ravs'},r.users.map(u=>uAv(u,22))):h('small',{},fa(r.users.length)))))}
function userName(id){if(id===S.me.id)return'تو';for(const c of Object.values(S.chats))if(c.peer&&c.peer.id===id)return c.peer.display_name;return S.users[id]||'کاربر'}
async function react(m,emoji){try{const r=await call('react',{message_id:m.id,emoji});applyUpdate(r.message)}catch(e){toast(e.message)}}
function bubble(m,pos){
  const mine=m.sender_id===S.me.id,c=S.chats[m.chat_id]||{};
  const mediaOnly=!m.deleted&&m.file&&!m.body&&!m.reply&&!m.fwd&&!m.file.voice&&(m.file.kind==='image'||m.file.kind==='video')&&!(c.kind==='group'&&!mine&&pos.first);
  const b=h('div',{class:'bubble'+(mediaOnly?' media-only':''),'data-bid':m.id});
  if(c.kind==='group'&&!mine&&m.sender_name&&pos.first)b.append(h('div',{class:'sender',style:'color:'+COLORS[(m.sender_id||0)%COLORS.length]},m.sender_name));
  if(m.fwd)b.append(h('div',{class:'fwd'},'فوروارد از '+(m.fwd.name||m.fwd.sender_name||m.fwd)));
  if(m.reply&&!m.deleted)b.append(h('div',{class:'quote',onclick:e=>{e.stopPropagation();jumpTo(m.reply.id)}},h('b',{},m.reply.sender_name||''),h('span',{},short(m.reply.text,70))));
  if(m.deleted)b.append(h('div',{class:'deleted'},'این پیام حذف شد'));
  else{if(m.file)b.append(fileBlock(m));if(m.body)b.append(bodyEl(m))}
  const meta=h('div',{class:'meta'});if(m.edited_at&&!m.deleted)meta.append(h('span',{},'ویرایش‌شده'));
  if(mine&&m.file&&m.file.voice&&(m.file.played||[]).length)meta.append(h('span',{class:'vheard',title:'پیام صوتی شنیده شد'},ic('headphones',13),c.kind==='group'?fa(m.file.played.length):'شنیده شد'));
  meta.append(h('span',{},fmtTime(m.created_at)));if(mine&&!m.deleted)meta.append(tickEl(m));b.append(meta);
  const rb=reactBar(m);if(rb)b.append(rb);
  attachMenu(b,m);
  const row=h('div',{class:'mrow '+(mine?'mine':'theirs')+(pos.first?' first gap':'')+(pos.last?' last':'')+(Date.now()-(window.__live||0)<400?' new':''),'data-id':m.id},b);
  if(!mine&&c.kind==='group'){const av=h('div',{class:'av'});if(pos.last&&m.sender_id){const u=h('div',{onclick:()=>showUser(m.sender_id,m.sender_name)});u.append(avatar('u',m.sender_id,m.sender_name,(S.users['a'+m.sender_id])||0,34,false));av.append(u)}row.append(av)}
  return row}
function attachMenu(b,m){
  b.addEventListener('contextmenu',e=>{if(m.deleted||e.target.closest('a,.spoiler'))return;e.preventDefault();msgMenu(e.clientX,e.clientY,m)});
  let t=null,sx=0,sy=0;
  b.addEventListener('touchstart',e=>{if(m.deleted)return;const p=e.touches[0];sx=p.clientX;sy=p.clientY;t=setTimeout(()=>{t=null;msgMenu(sx,sy,m)},480)},{passive:true});
  const cancel=()=>{clearTimeout(t);t=null};b.addEventListener('touchend',cancel);b.addEventListener('touchmove',e=>{const p=e.touches[0];if(Math.abs(p.clientX-sx)>10||Math.abs(p.clientY-sy)>10)cancel()},{passive:true});
  b.addEventListener('dblclick',e=>{if(!m.deleted&&!e.target.closest('video,audio,a'))react(m,'👍')});
  // swipe the message to the LEFT → reply (like Telegram); the bubble follows the finger
  const row=b.closest('.mrow')||b;let gx=0,gy=0,mode=0,dx=0,hint=null;
  const skip=e=>!!e.target.closest('audio,video,input,textarea,.spoiler');
  const reset=(anim)=>{if(hint){hint.remove();hint=null}row.style.transition=anim?'transform .18s':'';row.style.transform='';mode=0;dx=0;if(anim)setTimeout(()=>{row.style.transition=''},200)};
  b.addEventListener('touchstart',e=>{mode=0;dx=0;if(m.deleted||m.kind==='system'||e.touches.length!==1||skip(e))return;const p=e.touches[0];gx=p.clientX;gy=p.clientY;mode=1},{passive:true});
  b.addEventListener('touchmove',e=>{if(!mode)return;const p=e.touches[0],x=p.clientX-gx,y=p.clientY-gy;
    if(mode===1){if(Math.abs(y)>10&&Math.abs(y)>Math.abs(x)){mode=0;return}if(x<-12&&Math.abs(x)>Math.abs(y)*1.5){mode=2;cancel();
      if(!hint){hint=h('div',{class:'swr'});const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');const pa=document.createElementNS('http://www.w3.org/2000/svg','path');pa.setAttribute('d',IC.reply);s.append(pa);hint.append(s);row.append(hint)}}else return}
    dx=Math.max(-90,Math.min(0,x));row.style.transition='';row.style.transform='translateX('+dx+'px)';
    if(hint){const k=Math.min(1,-dx/60);hint.style.opacity=k;hint.style.transform='translateY(-50%) scale('+(.5+.5*k)+')'}
    if(e.cancelable)e.preventDefault()},{passive:false});
  const fin=e=>{if(mode===2){const ok=-dx>=60;reset(true);if(ok){try{navigator.vibrate&&navigator.vibrate(12)}catch{}const cc=S.chats[m.chat_id];if(!(cc&&cc.channel&&!cc.can_post))startReply(m)}}else mode=0};
  b.addEventListener('touchend',fin);b.addEventListener('touchcancel',()=>reset(true))}
function samePos(a,b){return a&&b&&a.kind!=='system'&&b.kind!=='system'&&a.sender_id===b.sender_id&&dkey(a.created_at)===dkey(b.created_at)&&Math.abs(a.created_at-b.created_at)<300}
function addRows(list,startIdx,box,state){
  for(let i=startIdx;i<list.length;i++){
    const m=list[i];if(m.deleted)continue;                        // deleted messages vanish, like Telegram
    const k=dkey(m.created_at);
    if(k!==state.day){box.append(h('div',{class:'day'},h('span',{},dayLabel(m.created_at))));state.day=k}
    if(S.unreadFrom!=null&&!state.divDone&&m.id>S.unreadFrom&&m.sender_id!==S.me.id&&m.kind!=='system'){box.append(h('div',{class:'unread-div',id:'udiv'},'پیام‌های خوانده‌نشده'));state.divDone=true}
    if(m.kind==='system'){box.append(h('div',{class:'sys','data-id':m.id},h('span',{},m.body)));continue}
    box.append(bubble(m,{first:!samePos(list[i-1],m),last:!samePos(m,list[i+1])}))}}
function renderMsgs(anchor){
  saveCache();
  const box=$('#msgs'),id=S.current;box.replaceChildren();const list=S.msgs[id]||[];
  box.append(h('div',{class:'spacer'}));
  if(S.hasMore[id])box.append(h('div',{class:'older'},h('button',{class:'btn soft',onclick:loadOlder},'پیام‌های قدیمی‌تر…')));
  const st={day:null};addRows(list,0,box,st);S.state=st;
  if(!list.length)box.append(h('div',{class:'hint',style:'position:relative;color:#fff'},S.chats[id]&&S.chats[id].saved?'اینجا هر چیزی رو برای خودت ذخیره کن':'هنوز پیامی نیست؛ سلام بده 👋'));
  const a=anchor&&box.querySelector(`[data-id="${anchor}"]`),ud=!anchor&&$('#udiv');
  if(a)a.scrollIntoView({block:'center'});else if(ud)ud.scrollIntoView({block:'start'});else box.scrollTop=box.scrollHeight;
  updateDown()}
function flash(mid){const b=$(`#msgs [data-bid="${mid}"]`);if(!b)return;b.classList.add('flash');setTimeout(()=>b.classList.remove('flash'),1600)}
async function loadOlder(){
  const id=S.current,first=S.msgs[id]&&S.msgs[id][0];if(!first)return;
  try{const r=await call('history',{chat_id:id,before_id:first.id,limit:40});S.msgs[id]=r.messages.concat(S.msgs[id]);S.hasMore[id]=r.has_more;if(S.current===id)renderMsgs(first.id)}catch(e){toast(e.message)}}
async function jumpTo(mid){
  const e=$(`#msgs [data-bid="${mid}"]`);
  if(e){e.scrollIntoView({block:'center',behavior:'smooth'});flash(mid)}else await loadAround(mid)}
const nearBottom=()=>{const b=$('#msgs');return b.scrollHeight-b.scrollTop-b.clientHeight<140};
function updateDown(){const far=!nearBottom()||S.hasNewer[S.current];$('#down').hidden=!far;
  const d=$('#down');d.replaceChildren(ic('down'),...(S.newBelow?[h('span',{class:'badge'},fa(S.newBelow))]:[]))}
async function scrollBottom(){
  const id=S.current;
  if(S.hasNewer[id]){try{const r=await call('history',{chat_id:id,limit:40});S.msgs[id]=r.messages;S.hasMore[id]=r.has_more;S.hasNewer[id]=false;S.unreadFrom=null;renderMsgs()}catch(e){toast(e.message)}}
  $('#msgs').scrollTo({top:$('#msgs').scrollHeight,behavior:'smooth'});S.newBelow=0;markRead(id)}
function markRead(id){
  const c=S.chats[id];if(!c||document.visibilityState!=='visible'||S.hasNewer[id])return;
  const l=S.msgs[id],last=l&&l.length?l[l.length-1].id:(c.last?c.last.id:0);
  if(last&&last>(S.readSent[id]||0)){S.readSent[id]=last;call('read',{chat_id:id,up_to:last}).catch(()=>{})}
  if(c.unread){c.unread=0;renderList()}}
function ingest(m){
  const id=m.chat_id,c=S.chats[id];if(!c)return refreshChats();
  const l=S.msgs[id];
  if(!l)(S.early[id]=S.early[id]||[]).push(m);          // history still loading: merge when it arrives
  if(l&&!S.hasNewer[id]){if(l.some(x=>x.id===m.id))return;l.push(m);l.sort((a,b)=>a.id-b.id)}
  c.last=m;const mine=m.sender_id===S.me.id,viewing=id===S.current&&document.visibilityState==='visible';
  if(!mine&&m.kind!=='system'&&!viewing)c.unread++;
  if(id===S.current&&l&&!S.hasNewer[id]){
    const stick=mine||nearBottom(),box=$('#msgs');box.querySelectorAll('.hint').forEach(x=>x.remove());
    const prev=l[l.length-2];
    if(prev&&samePos(prev,m)){const pr=box.querySelector(`[data-id="${prev.id}"]`);if(pr)pr.classList.remove('last')}
    addRows(l,l.length-1,box,S.state||{day:null});
    if(stick){box.scrollTop=box.scrollHeight;S.newBelow=0}else if(!mine)S.newBelow++;
    updateDown();if(!mine&&viewing&&stick)markRead(id)}
  if(!mine&&m.kind!=='system')notify(c,m);
  renderList()}
const heartsOf=m=>{const r=(m&&m.reactions||[]).find(x=>x.e==='❤️'||x.e==='❤');return r?r.users.length:0};
/* a ❤️ reaction: hearts float up from the message and the bubble beats */
function heartBurst(el){
  if(!el||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  el.classList.remove('heartbeat');void el.offsetWidth;el.classList.add('heartbeat');setTimeout(()=>el.classList.remove('heartbeat'),1000);
  const box=h('div',{class:'hearts'});for(let i=0;i<9;i++){const s=h('span',{style:`left:${10+Math.random()*80}%;animation-delay:${Math.random()*.35}s;font-size:${14+Math.random()*16}px`},'❤️');box.append(s)}
  el.append(box);setTimeout(()=>box.remove(),1800);try{navigator.vibrate&&navigator.vibrate([25,40,25])}catch{}}
function applyUpdate(m){
  const l=S.msgs[m.chat_id];const prev=l&&l.find(x=>x.id===m.id);const gotHeart=heartsOf(m)>heartsOf(prev);if(l){const i=l.findIndex(x=>x.id===m.id);if(i>=0)l[i]=m}
  const c=S.chats[m.chat_id];if(c&&c.last&&c.last.id===m.id)c.last=m;
  if(m.chat_id===S.current&&l){const old=$(`#msgs [data-id="${m.id}"]`);if(old){const i=l.findIndex(x=>x.id===m.id);
    if(m.deleted){const r=old.closest('.mrow')||old;r.style.maxHeight=r.offsetHeight+'px';void r.offsetHeight;r.classList.add('gone');setTimeout(()=>r.remove(),240);renderList();return}
    const nw=m.kind==='system'?old:bubble(m,{first:old.classList.contains('first'),last:old.classList.contains('last')});if(nw!==old)old.replaceWith(nw);if(gotHeart)heartBurst((nw.querySelector&&nw.querySelector('.bubble'))||nw)}}
  renderList()}

/* ---------- notifications ---------- */
let ac=null;
function beep(freq=880,len=.12,vol=.05){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume&&ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+len)}catch{}}
/* synthesized sounds (no files needed): send / message in the open chat / notification */
function sfx(kind){
  if(!PREF.sound)return;
  try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume&&ac.resume();const t=ac.currentTime;
    const tone=(f,st,d,v=.07)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f,t+st);
      g.gain.setValueAtTime(.0001,t+st);g.gain.exponentialRampToValueAtTime(v,t+st+.015);g.gain.exponentialRampToValueAtTime(.0001,t+st+d);
      o.connect(g);g.connect(ac.destination);o.start(t+st);o.stop(t+st+d+.03)};
    if(kind==='send'){tone(660,0,.09);tone(990,.07,.13)}
    else if(kind==='recv'){tone(880,0,.1);tone(1175,.09,.17,.055)}
    else{tone(784,0,.13);tone(988,.11,.13);tone(1319,.22,.26,.07)}}catch{}}
let swReg=null;
async function registerSW(){
  if(swReg||window.WD||!('serviceWorker' in navigator))return;      // the Android app has its own notifications and its own cache
  try{swReg=await navigator.serviceWorker.register('/sw.js',{scope:'/'});setTimeout(pushSync,1500)}catch{swReg=null}}   // fails on an untrusted self-signed certificate: we fall back to plain Notification
/* ---- Web Push: wake-up notifications while the app is closed ---- */
const u8key=s=>{const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')),o=new Uint8Array(b.length);for(let i=0;i<b.length;i++)o[i]=b.charCodeAt(i);return o};
async function pushSync(){
  try{
    if(!PREF.notif||!swReg||!swReg.pushManager||!('Notification' in window)||Notification.permission!=='granted')return;
    let sub=await swReg.pushManager.getSubscription();
    if(!sub){const k=await call('push_key');sub=await swReg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8key(k.key)})}
    await call('push_subscribe',{endpoint:sub.endpoint})}catch{}}
async function pushDiag(delay){
  const L=[],add=(ok,t)=>L.push([ok,t]);
  add(window.isSecureContext,'اتصال امن (HTTPS معتبر) '+(window.isSecureContext?'':'— گواهی روی این گوشی معتبر نیست'));
  if(!('serviceWorker' in navigator)){add(false,'مرورگر سرویس‌ورکر نداره');return L}
  if(!swReg){try{swReg=await navigator.serviceWorker.register('/sw.js',{scope:'/'})}catch(e){add(false,'ثبت سرویس‌ورکر نشد: '+(e.message||e)+' — معمولاً یعنی گواهی معتبر نیست');return L}}
  add(true,'سرویس‌ورکر ثبت شده');
  if(!('Notification' in window)){add(false,'مرورگر اعلان نداره');return L}
  if(Notification.permission==='default'){try{await Notification.requestPermission()}catch{}}
  add(Notification.permission==='granted','اجازه اعلان: '+({granted:'داده شده',denied:'رد شده (تنظیمات سایت تو کروم رو چک کن)',default:'جواب داده نشد'})[Notification.permission]);
  if(Notification.permission!=='granted')return L;
  if(!PREF.notif){lsSet('wd-notif','1');PREF.notif=true}
  if(!swReg.pushManager){add(false,'این مرورگر Push نداره');return L}
  try{let sub=await swReg.pushManager.getSubscription();if(!sub){const k=await call('push_key');sub=await swReg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8key(k.key)})}
    await call('push_subscribe',{endpoint:sub.endpoint});add(true,'اشتراک اعلان ثبت شد')}
  catch(e){add(false,'ثبت اشتراک ناموفق: '+(e.message||e)+' — معمولاً یعنی گوشی به سرویس اعلان گوگل (FCM) وصل نمی‌شه');return L}
  try{const r=await call('push_test',{delay:!!delay});
    const ok=r.codes.length&&r.codes.every(c=>c>=200&&c<300);
    add(!!ok,'سرور → سرویس اعلان: '+(r.codes.join('، ')||'اشتراکی نیست')+(ok?' (قبول شد)':r.codes.includes(-1)?' — سرور نمی‌تونه به سرویس اعلان گوگل وصل بشه (اینترنت بین‌الملل سرور؟)':r.codes.includes(0)?' — آدرس رد شد':' — سرویس اعلان درخواست رو رد کرد'))}
  catch(e){add(false,'آزمایش سرور: '+e.message)}
  return L}
function dlgPushTest(){
  const box=h('div',{style:'line-height:2'},'در حال بررسی…');
  dialog('بررسی اعلان',box,h('div',{class:'muted',style:'font-size:13px;line-height:1.8'},'بعد از بررسی، تا ۱۰ ثانیه برنامه رو ببند یا صفحه گوشی رو قفل کن؛ باید اعلان «پیام جدید داری» بیاد.'));
  pushDiag(true).then(L=>box.replaceChildren(...L.map(([ok,t])=>h('div',{},(ok?'✅ ':'❌ ')+t))))}
async function pushOff(){try{const sub=swReg&&swReg.pushManager&&await swReg.pushManager.getSubscription();if(sub){await call('push_unsubscribe',{endpoint:sub.endpoint}).catch(()=>{});await sub.unsubscribe()}}catch{}}
setInterval(()=>{if(document.visibilityState==='visible'&&ws&&ws.readyState===1&&S.me)call('visible',{v:true}).catch(()=>{})},20000);   // heartbeat: a phone that froze the page stops sending it, so the server knows to push
document.addEventListener('visibilitychange',()=>{if(ws&&ws.readyState===1&&S.me)call('visible',{v:document.visibilityState==='visible'}).catch(()=>{})});
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.resub)pushSync()});
function showNote(title,body,tag,cid){
  const open=()=>{window.focus();openChat(cid)};
  if(swReg&&swReg.showNotification){swReg.showNotification(title,{body,tag,icon:'/static/icon.svg',badge:'/static/icon.svg',data:{cid},renotify:true,dir:'rtl',lang:'fa'}).catch(()=>plainNote(title,body,tag,open));return}
  plainNote(title,body,tag,open)}
function plainNote(title,body,tag,open){try{const n=new Notification(title,{body,tag,icon:'/static/icon.svg'});n.onclick=()=>{open();n.close()}}catch{}}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.cid&&S.chats[e.data.cid]){window.focus();openChat(e.data.cid)}});
function notify(c,m){
  if(c.muted)return;const viewing=c.id===S.current&&document.visibilityState==='visible';
  if(viewing){sfx('recv');return}
  sfx('notif');
  if(PREF.notif&&'Notification' in window&&Notification.permission==='granted'&&document.visibilityState!=='visible'){
    const t=m.file?(m.file.voice?'🎤 پیام صوتی':'📎 '+m.file.name):m.body;
    showNote(c.title,short((c.kind==='group'&&m.sender_name?m.sender_name+': ':'')+t,100),'c'+c.id,c.id)}}

/* ---------- events ---------- */
function onEvent(e){
  const k=e.event;
  if(k==='message'){window.__live=Date.now();ingest(e.message)}
  else if(k==='message_updated')applyUpdate(e.message);
  else if(k==='read'){const c=S.chats[e.chat_id];if(c&&e.user_id!==S.me.id){c.peer_read=Math.max(c.peer_read||0,e.up_to);
    document.querySelectorAll('.tick[data-mid]').forEach(t=>{if(+t.dataset.mid<=e.up_to&&!t.classList.contains('read')){t.classList.add('read');t.replaceChildren(ic('checkall',16))}})}}
  else if(k==='typing'){S.typing[e.chat_id+':'+e.user_id]={exp:Date.now()+4000,action:e.action};if(e.chat_id===S.current)refreshSub();renderList();setTimeout(()=>{refreshSub();renderList()},4300)}
  else if(k==='presence'){Object.values(S.chats).forEach(c=>{if(c.peer&&c.peer.id===e.user_id){c.peer.online=e.online;c.peer.last_seen=e.last_seen;c.peer.seen_hidden=!!e.seen_hidden}});renderList();refreshSub()}
  else if(k==='profile'){const u=e.user;S.users[u.id]=u.display_name;S.users['a'+u.id]=u.avatar_at;if(u.id===S.me.id){Object.assign(S.me,u);buildDrawer()}
    Object.values(S.chats).forEach(c=>{if(c.peer&&c.peer.id===u.id){c.peer=u;if(c.kind==='private')c.title=u.display_name}});renderList();if(S.current)fillHeader();if(S.current)renderMsgs&&softRender()}
  else if(k==='chat_added'){S.chats[e.chat.id]=e.chat;renderList()}
  else if(k==='chat_updated'){const old=S.chats[e.chat.id]||{};S.chats[e.chat.id]=Object.assign(old,e.chat);renderList();if(S.current===e.chat.id)fillHeader()}
  else if(k==='voice_played'){const l=S.msgs[e.chat_id],m=l&&l.find(x=>x.id===e.message_id);if(m&&m.file){m.file.played=m.file.played||[];if(!m.file.played.includes(e.user_id))m.file.played.push(e.user_id);if(e.user_id!==S.me.id)applyUpdate(m)}}
  else if(k==='call_peer'){if(C&&C.id===e.call_id){C.peerAway=e.state==='reconnecting';showCallUI()}}
  else if(k==='chat_removed'){delete S.chats[e.chat_id];delete S.msgs[e.chat_id];if(S.current===e.chat_id){S.current=null;showChatView(false);$('#app').classList.remove('show-chat')}renderList()}
  else if(k==='members_changed'){refreshChats();if(window.__group&&window.__group.id===e.chat_id)window.__group.reload()}
  else if(k==='call_incoming')onIncoming(e);else if(k==='call_accepted')onAccepted(e);else if(k==='call_audio')onCallAudio(e);else if(k==='call_video')onCallVideo(e);else if(k==='call_signal')onSignal(e);
  else if(k==='call_ended'){if(C&&C.id===e.call_id)endLocal(callText[e.reason]||'')}
  else if(k==='session_ended'){setToken(null);logout(true);showAuth('این نشست از دستگاه دیگه بسته شد.')}
  else if(k==='banned'){alert('حساب تو مسدود شد.');setToken(null);logout()}}
function softRender(){const y=$('#msgs').scrollTop,nb=nearBottom();renderMsgs();$('#msgs').scrollTop=nb?$('#msgs').scrollHeight:y}

/* ---------- composer ---------- */
function autosize(){const t=$('#input');t.style.height='auto';t.style.height=Math.min(140,t.scrollHeight)+'px'}
function showBar(t,x,icn){$('#bar-t').textContent=t;$('#bar-x').textContent=short(x,90);setIcon($('#bar-ic'),icn||'reply');$('#bar').hidden=false}
function clearBar(){S.reply=S.editing=null;$('#bar').hidden=true;updateSendBtn()}
function startReply(m){clearBar();S.reply=m;showBar('پاسخ به '+(m.sender_name||''),m.body||(m.file?(m.file.voice?'پیام صوتی':'📎 '+m.file.name):''));$('#input').focus()}
function startEdit(m){clearBar();S.editing=m;showBar('ویرایش پیام',m.body,'pencil');$('#input').value=m.body;autosize();updateSendBtn();$('#input').focus()}
function updateSendBtn(){
  const has=$('#input').value.trim().length>0||S.editing,b=$('#sendbtn');
  if(REC.on)setIcon(b,'send');else setIcon(b,has?'send':'mic');b.title=has||REC.on?'ارسال':'ضبط پیام صوتی'}
async function sendCurrent(){
  if(REC.on)return finishRec();
  const t=$('#input'),text=t.value.trim();
  if(!S.current)return;if(!text&&!S.editing)return startRec();
  if(S.editing){const m=S.editing;clearBar();t.value='';autosize();updateSendBtn();
    try{const r=await call('edit',{message_id:m.id,text});applyUpdate(r.message)}catch(e){toast(e.message)}return}
  const id=S.current,reply=S.reply?S.reply.id:null;t.value='';delete S.drafts[id];saveDrafts();clearBar();autosize();updateSendBtn();
  try{const r=await call('send',{chat_id:id,text,reply_to:reply});sfx('send');window.__live=Date.now();ingest(r.message);$('#msgs').scrollTop=$('#msgs').scrollHeight}catch(e){toast(e.message);if(!t.value)t.value=text;autosize();updateSendBtn()}}
/* upload with progress (raw body -> /upload; voice params make it a voice message) */
function uploadBlob(blob,name,opts={}){
  if(!S.current)return;const max=S.maxUpload||5*1048576;
  if(blob.size>max)return toast('حجم فایل بیشتر از '+fa(Math.round(max/1048576))+' مگابایته');
  if(!S.mediaKey)return toast('هنوز به سرور وصل نیستی');
  const cc=S.chats[S.current];if(cc&&cc.channel&&!cc.can_post)return toast('فقط مدیر می‌تونه تو کانال پیام بذاره');
  const th=(!opts.voice&&/^(image|video)\//.test(blob.type||''))?makeThumb(blob,blob.type.split('/')[0]):null;
  const id=S.current,q=new URLSearchParams({k:S.mediaKey,chat_id:id,name});
  if(opts.caption)q.set('text',opts.caption);if(opts.reply)q.set('reply_to',opts.reply);
  if(opts.voice){q.set('voice','1');q.set('dur',String(opts.dur||0));q.set('wave',(opts.wave||[]).join(','))}
  /* Telegram-style outgoing bubble: round button with a progress ring and an X (tap = cancel), name, "sent / total" */
  const R=21,CIRC=2*Math.PI*R,ring=document.createElementNS('http://www.w3.org/2000/svg','circle');
  ring.setAttribute('cx',24);ring.setAttribute('cy',24);ring.setAttribute('r',R);ring.setAttribute('class','ring');ring.style.strokeDasharray=CIRC;ring.style.strokeDashoffset=CIRC*.85;
  const rsvg=document.createElementNS('http://www.w3.org/2000/svg','svg');rsvg.setAttribute('viewBox','0 0 48 48');rsvg.setAttribute('class','ringsvg');rsvg.append(ring);
  const ext=(name.includes('.')?name.split('.').pop():'').slice(0,4).toUpperCase(),sz=h('small',{},fmtSize(blob.size)+(ext?' '+ext:''));
  const cancel=h('button',{class:'ucancel',type:'button',title:'لغو ارسال'},ic('close',22),rsvg);
  const box=h('div',{class:'mrow mine last upl2'},h('div',{class:'bubble'},h('div',{class:'file'},cancel,h('div',{class:'fi'},h('b',{},short(name,34)),sz)),
    h('div',{class:'meta'},h('span',{},fmtTime(Math.floor(Date.now()/1000))),h('span',{class:'tick'},ic('clock',15)))));
  $('#msgs').append(box);$('#msgs').scrollTop=$('#msgs').scrollHeight;
  const x=new XMLHttpRequest();x.open('POST','/upload?'+q);
  cancel.onclick=e=>{e.stopPropagation();x.abort();box.remove()};
  x.upload.onprogress=e=>{if(e.lengthComputable){ring.style.strokeDashoffset=CIRC*(1-Math.max(.06,e.loaded/e.total));sz.textContent=fmtSize(e.loaded)+' / '+fmtSize(e.total)}};
  x.onload=()=>{box.remove();let r={};try{r=JSON.parse(x.responseText)}catch{}if(x.status===200&&r.ok){sfx('send');ingest(r.message);if(th)th.then(t=>{if(t)fetch('/thumb?'+new URLSearchParams({k:S.mediaKey,message_id:r.message.id,w:t.w,h:t.h}),{method:'POST',body:t.blob}).catch(()=>{})});$('#msgs').scrollTop=$('#msgs').scrollHeight}else toast(r.error||'ارسال فایل ناموفق بود')};
  x.onerror=()=>{box.remove();toast('ارسال فایل ناموفق بود')};x.send(blob)}
/* preview picture (first frame / scaled image), made here and uploaded after the message exists */
function makeThumb(file,kind){
  return new Promise(res=>{
    if(kind==='image'&&typeof file!=='string'&&(/gif$/i.test(file.type)||file.size>60*1048576))return res(null);
    const own=typeof file!=='string',url=own?URL.createObjectURL(file):file;let fin=false;const done=v=>{if(fin)return;fin=true;if(own)URL.revokeObjectURL(url);res(v)};
    const draw=(el,w,hh)=>{if(!w||!hh)return done(null);const k=Math.min(1,320/Math.max(w,hh)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(hh*k));
      try{c.getContext('2d').drawImage(el,0,0,c.width,c.height);c.toBlob(b=>done(b?{blob:b,w,h:hh}:null),'image/jpeg',.7)}catch{done(null)}};
    if(kind==='image'){const im=new Image();im.onload=()=>draw(im,im.naturalWidth,im.naturalHeight);im.onerror=()=>done(null);im.src=url}
    else{const v=document.createElement('video');v.muted=true;v.preload='metadata';v.playsInline=true;const t=setTimeout(()=>done(null),9000);
      v.onloadedmetadata=()=>{try{v.currentTime=Math.min(1,(v.duration||2)/4)}catch{}};
      v.onseeked=()=>{clearTimeout(t);draw(v,v.videoWidth,v.videoHeight)};v.onerror=()=>{clearTimeout(t);done(null)};v.src=url}})}
function sendFiles(files){
  const list=[...files];if(!list.length)return;
  const caption=$('#input').value.trim(),reply=S.reply?S.reply.id:null;
  if(caption){$('#input').value='';autosize();updateSendBtn()}clearBar();
  list.forEach((f,i)=>uploadBlob(f,f.name||'file',{caption:i===0?caption:'',reply:i===0?reply:null}))}
/* ---------- files/text shared INTO the app from other apps (Android) ---------- */
window.wdShare=function(){
  try{const raw=window.WD&&WD.takeShare&&WD.takeShare();if(raw)window.__share=JSON.parse(raw)}catch{}
  if(window.__share&&S.me)runShare()};
function runShare(){
  const sh=window.__share;if(!sh)return;window.__share=null;
  const files=sh.files||[],text=(sh.text||'').trim();
  const sum=files.length?fa(files.length)+' فایل'+(text?' + متن':''):'متن';
  const pick=async c=>{
    closeDialog();await openChat(c.id);
    try{
      if(!files.length){if(text){const r=await call('send',{chat_id:c.id,text});sfx('send');ingest(r.message)}return}
      for(let i=0;i<files.length;i++){const f=files[i],r=await fetch('/__wd/share/'+f.i),b=await r.blob();
        uploadBlob(new File([b],f.name,{type:f.mime||b.type}),f.name,{caption:i===0?text:''})}
    }catch(e){toast('ارسال نشد: '+e.message)}};
  const list=h('div',{class:'ulist',style:'max-height:360px'}),q=h('input',{placeholder:'جستجو…',autocomplete:'off'});
  const draw=()=>{const t=q.value.trim().toLowerCase();
    list.replaceChildren(...sorted().filter(c=>!(c.channel&&!c.can_post)&&(!t||(c.title||'').toLowerCase().includes(t))).map(c=>
      h('div',{class:'srow',onclick:()=>pick(c)},chatAvatar(c,40,false),h('div',{class:'grow'},h('b',{},c.saved?'پیام‌های ذخیره‌شده':c.title)))))};
  q.addEventListener('input',draw);draw();
  dialog('ارسال '+sum+' به…',q,list)}

/* ---------- storage used by the Android app ---------- */
function dlgStorage(){
  let info;try{info=JSON.parse(WD.cacheInfo())}catch{return toast('این بخش فقط تو اپ اندروید هست')}
  const mb=b=>fa((b/1048576).toFixed(b<10485760?1:0))+' مگابایت';
  const use=h('div',{style:'font-size:15px;line-height:2'}),draw=()=>{try{info=JSON.parse(WD.cacheInfo())}catch{};use.replaceChildren(h('b',{},mb(info.bytes)),' — '+fa(info.count)+' فایل ذخیره‌شده تو اپ')};draw();
  const opts=[[200,'۲۰۰ مگابایت'],[500,'۵۰۰ مگابایت'],[1024,'۱ گیگابایت'],[2048,'۲ گیگابایت'],[5120,'۵ گیگابایت'],[10240,'۱۰ گیگابایت'],[0,'بدون محدودیت']];
  if(!opts.some(o=>o[0]===info.limit_mb))opts.push([info.limit_mb,mb(info.limit_mb*1048576)]);
  const sel=h('select',{onchange:e=>{try{WD.cacheLimit(+e.target.value)}catch{}draw()}},opts.map(o=>h('option',{value:o[0],selected:o[0]===info.limit_mb},o[1])));
  dialog('مدیریت حافظه',
    h('div',{class:'muted',style:'font-size:13px;line-height:1.9'},'عکس، ویدیو، آهنگ و فایل‌هایی که یک بار باز کردی تو خود اپ نگه داشته می‌شن تا بدون اینترنت هم باز بشن. وقتی از حد مجاز بیشتر بشه، قدیمی‌ترین‌ها خودکار پاک می‌شن.'),
    use,h('label',{},'حداکثر حافظه'),sel,
    h('button',{class:'btn danger',style:'display:block;margin-top:12px',onclick:()=>{if(!confirm('همه فایل‌های ذخیره‌شده پاک بشه؟ (پیام‌ها و فایل‌های روی سرور سر جاشون می‌مونن)'))return;try{WD.cacheClear()}catch{}draw();toast('پاک شد',false)}},'پاک کردن فایل‌های ذخیره‌شده'))}
const DL={big:150*1048576,chunk:8*1048576,blobMax:1024*1048576};
/* download progress line (top of the screen): same for the web page and for the Android app (the app reports through window.wdDl) */
const DLS={},DLN={};
function dlUi(id,name,got,total,state,cancel){
  let c=DLS[id];
  if(!c){const bar=h('i'),pct=h('span',{class:'pc'}),x=cancel?h('button',{class:'iconbtn',title:'لغو',onclick:()=>{const q=DLS[id];q&&q.cancel&&q.cancel()}},ic('close',16)):null;
    const el=h('div',{class:'dlc'},h('div',{class:'dt'},h('b',{},short(name||'فایل',30)),pct,x),h('div',{class:'bar'},bar));
    let box=document.getElementById('dlbox');if(!box){box=h('div',{id:'dlbox'});document.body.append(box)}box.append(el);c=DLS[id]={el,bar,pct,cancel}}
  if(cancel)c.cancel=cancel;
  const p=total>0?Math.min(100,Math.round(got/total*100)):0;
  c.bar.style.width=(state===1?100:p)+'%';c.el.classList.toggle('ok',state===1);c.el.classList.toggle('bad',state===2);
  c.pct.textContent=state===1?'ذخیره شد ✓':state===2?'ناموفق':(total>0?fa(p)+'٪ · '+fa(fmtSize(got))+' / '+fa(fmtSize(total)):fa(fmtSize(got)));
  clearTimeout(c.t);c.t=setTimeout(()=>{c.el.remove();delete DLS[id]},state===1?2500:state===2?4500:90000)}     // a bar that gets no news for 90 s goes away
window.wdDl=(id,got,total,state)=>dlUi('a'+id,DLN[id],got,total,state);
/* one piece of the file; a dropped connection retries that piece only (the server answers Range requests); onBytes = live progress */
async function dlPiece(url,a,b,onBytes,signal){
  for(let t=0;;t++){
    try{const r=await fetch(url,{headers:{Range:'bytes='+a+'-'+b},signal});if(r.status!==206&&!(r.status===200&&a===0))throw new Error('http '+r.status);
      if(!r.body||!r.body.getReader)return await r.blob();
      const rd=r.body.getReader(),parts=[];let n=0;for(;;){const{done,value}=await rd.read();if(done)break;parts.push(value);n+=value.length;onBytes&&onBytes(n)}
      return new Blob(parts)}
    catch(e){if(e&&e.name==='AbortError')throw e;if(t>=3)throw e;await new Promise(z=>setTimeout(z,1200*(t+1)))}}}
async function download(m){
  if(!S.mediaKey&&!window.WD)return toast('هنوز به سرور وصل نیستی');
  if(window.WD&&WD.saveFile){try{DLN[m.id]=m.file.name;dlUi('a'+m.id,m.file.name,0,m.file.size||0,0);WD.saveFile(location.origin+'/media/'+m.id+'?k='+encodeURIComponent(S.mediaKey||'')+'&dl=1',m.file.name);return}catch{}}
  const url=mediaUrl(m,true),name=m.file.name,size=m.file.size||0;
  const direct=()=>{const l=h('a',{href:url,download:name});document.body.append(l);l.click();l.remove()};
  /* Chrome refuses (pauses) a DIRECT download from a site with a self-signed certificate. The page itself is open and trusted by you, so the file
     is read through the page in pieces and saved: straight to disk where the browser allows it (desktop Chrome/Edge: any size), otherwise from memory. */
  if(!size)return direct();
  if(size>DL.big&&!confirm('این فایل '+fmtSize(size)+' هست و دانلودش طول می‌کشه. تا تموم نشده این صفحه رو نبند. ادامه بدم؟'))return;
  let handle=null;
  if(size>DL.big&&window.showSaveFilePicker){try{handle=await showSaveFilePicker({suggestedName:name})}catch(e){if(e&&e.name==='AbortError')return}}
  if(!handle&&size>DL.blobMax){toast('این فایل برای دانلود تو مرورگر خیلی بزرگه؛ با اپ اندروید یا کروم/اج کامپیوتر دانلودش کن',true);return}
  let w=null,got=0,last=0;const parts=[],ab=new AbortController(),id='w'+m.id+'_'+Date.now();
  try{
    if(handle)w=await handle.createWritable();
    dlUi(id,name,0,size,0,()=>ab.abort());
    for(let a=0;a<size;a+=DL.chunk){
      const b=Math.min(a+DL.chunk-1,size-1),base=got,blob=await dlPiece(url,a,b,n=>{if(Date.now()-last>200){last=Date.now();dlUi(id,name,base+n,size,0)}},ab.signal);
      if(w)await w.write(blob);else parts.push(blob);
      got+=blob.size;dlUi(id,name,got,size,0)}
    if(w){await w.close();dlUi(id,name,size,size,1);return}
    const u=URL.createObjectURL(new Blob(parts,{type:'application/octet-stream'})),a=h('a',{href:u,download:name});
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);dlUi(id,name,size,size,1)
  }catch(e){
    try{if(w)await w.abort()}catch{}
    const c=DLS[id];if(c){clearTimeout(c.t);c.el.remove();delete DLS[id]}
    if(e&&e.name==='AbortError')return toast('دانلود لغو شد',false);
    if(!got)return direct();
    toast('دانلود قطع شد؛ دوباره امتحان کن')}}

/* ---------- voice recording (MediaRecorder; needs https or localhost) ---------- */
const REC={on:false,rec:null,stream:null,chunks:[],t0:0,levels:[],timer:null,ctx:null,an:null,cancelled:false,mime:'',ext:''};
const MAX_REC=15*60;
function pickMime(){
  const c=[['audio/webm;codecs=opus','.weba'],['audio/webm','.weba'],['audio/ogg;codecs=opus','.ogg'],['audio/mp4','.m4a']];
  for(const [m,e] of c){try{if(MediaRecorder.isTypeSupported(m))return[m,e]}catch{}}return['','.weba']}
async function startRec(){
  if(REC.on||!S.current)return;const cc0=S.chats[S.current];if(cc0&&cc0.channel&&!cc0.can_post)return toast('فقط مدیر می‌تونه تو کانال پیام بذاره');
  if(!window.isSecureContext)return toast('ضبط صدا فقط روی https یا همین کامپیوتر (localhost) کار می‌کنه. با آدرس https باز کن.');
  if(!navigator.mediaDevices||!window.MediaRecorder)return toast('این مرورگر از ضبط صدا پشتیبانی نمی‌کنه');
  if(C)return toast('وسط تماس نمی‌شه ویس ضبط کرد');
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false})}
  catch(e){return toast(e&&e.name==='NotFoundError'?'میکروفونی پیدا نشد':'دسترسی به میکروفون داده نشد؛ از قفل کنار آدرس اجازه بده')}
  const [mime,ext]=pickMime();let rec;
  try{rec=new MediaRecorder(stream,mime?{mimeType:mime}:{})}catch{stream.getTracks().forEach(t=>t.stop());return toast('شروع ضبط ممکن نشد')}
  Object.assign(REC,{on:true,rec,stream,chunks:[],t0:Date.now(),levels:[],cancelled:false,mime:rec.mimeType||mime,ext,chat:S.current,reply:S.reply?S.reply.id:null});
  stopVoice();
  try{REC.ctx=new(window.AudioContext||window.webkitAudioContext)();const src=REC.ctx.createMediaStreamSource(stream);REC.an=REC.ctx.createAnalyser();REC.an.fftSize=512;src.connect(REC.an)}catch{REC.an=null}
  rec.ondataavailable=e=>{if(e.data&&e.data.size)REC.chunks.push(e.data)};
  rec.onstop=onRecStop;rec.start(250);
  $('#rec').hidden=false;$('#lvl').replaceChildren();updateSendBtn();
  let tick=0;REC.timer=setInterval(()=>{
    const s=(Date.now()-REC.t0)/1000;$('#rect').textContent=fmtDur(s);
    let lv=0;if(REC.an){const d=new Uint8Array(REC.an.fftSize);REC.an.getByteTimeDomainData(d);let sum=0;for(const v of d)sum+=((v-128)/128)**2;lv=Math.min(1,Math.sqrt(sum/d.length)*3.2)}
    REC.levels.push(lv);const lvl=$('#lvl');lvl.append(h('i',{style:`height:${Math.max(3,Math.round(lv*28))}px`}));while(lvl.children.length>60)lvl.firstChild.remove();
    if(++tick%30===0)call('typing',{chat_id:REC.chat,action:'voice'}).catch(()=>{});
    if(s>=MAX_REC)finishRec()},100);
  call('typing',{chat_id:REC.chat,action:'voice'}).catch(()=>{})}
function endRecResources(){
  clearInterval(REC.timer);if(REC.stream)REC.stream.getTracks().forEach(t=>t.stop());
  try{REC.ctx&&REC.ctx.close()}catch{}REC.ctx=null;REC.an=null;REC.on=false;$('#rec').hidden=true;updateSendBtn()}
function finishRec(){if(!REC.on)return;REC.cancelled=false;try{REC.rec.stop()}catch{onRecStop()}}
function cancelRec(silent){if(!REC.on)return;REC.cancelled=true;try{REC.rec.stop()}catch{onRecStop()}if(!silent)toast('ضبط لغو شد',false)}
function onRecStop(){
  const dur=(Date.now()-REC.t0)/1000,chunks=REC.chunks,levels=REC.levels,cancelled=REC.cancelled,chat=REC.chat,reply=REC.reply,type=REC.mime||'audio/webm',ext=REC.ext;
  endRecResources();if(cancelled)return;
  if(dur<.7||!chunks.length)return toast('ویس خیلی کوتاه بود');
  const blob=new Blob(chunks,{type});
  const N=40,wave=[];for(let i=0;i<N;i++){const a=Math.floor(i*levels.length/N),b=Math.max(a+1,Math.floor((i+1)*levels.length/N));let mx=0;for(let j=a;j<b&&j<levels.length;j++)mx=Math.max(mx,levels[j]);wave.push(Math.round(mx*31))}
  if(chat!==S.current)openChat(chat);
  if(S.reply)clearBar();
  const stamp=new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
  uploadBlob(blob,`voice-${stamp}${ext}`,{voice:true,dur:Math.round(dur*10)/10,wave,reply})}

/* ---------- context menus & forwarding ---------- */
function popMenu(x,y,items,top){
  const menu=$('#ctx');menu.replaceChildren();
  if(top)menu.append(top);
  items.forEach(it=>{if(!it)return;const[t,icn,fn,red]=it;menu.append(h('button',{class:red?'red':'',onclick:e=>{e.stopPropagation();menu.hidden=true;fn()}},ic(icn),t))});
  menu.hidden=false;menu.style.left=menu.style.top='0px';
  const w=menu.offsetWidth,hh=menu.offsetHeight;
  menu.style.left=Math.max(6,Math.min(x,innerWidth-w-8))+'px';menu.style.top=Math.max(6,Math.min(y,innerHeight-hh-8))+'px'}
function msgMenu(x,y,m){
  const c=S.chats[m.chat_id]||{},mine=m.sender_id===S.me.id,owner=c.kind==='group'&&(c.owner_id===S.me.id||c.my_role==='admin'),canPin=c.channel?!!c.can_post:(c.kind!=='group'||owner);
  const rx=h('div',{class:'rx'},REACTS.slice(0,6).map(e=>h('button',{onclick:ev=>{ev.stopPropagation();$('#ctx').hidden=true;react(m,e)}},e)));
  const pinned=c.pin_msg&&c.pin_msg.id===m.id;
  popMenu(x,y,[['پاسخ','reply',()=>startReply(m)],
    m.body?['کپی متن','copy',()=>navigator.clipboard?navigator.clipboard.writeText(m.body).then(()=>toast('کپی شد',false)).catch(()=>toast('کپی نشد')):toast('کپی نشد')]:null,
    ['فوروارد','forward',()=>dlgForward(m)],
    canPin?[pinned?'برداشتن سنجاق':'سنجاق کردن','pin',()=>call('pin',{chat_id:m.chat_id,message_id:pinned?null:m.id}).catch(e=>toast(e.message))]:null,
    m.file?['ذخیره فایل','download',()=>download(m)]:null,
    m.file&&m.file.voice&&mine?['چه کسانی گوش دادن','headphones',()=>toast((m.file.played||[]).length?'شنیده شده توسط: '+m.file.played.map(userName).join('، '):'هنوز کسی گوش نداده',false)]:null,
    mine&&m.body&&!m.file?['ویرایش','pencil',()=>startEdit(m)]:(mine&&m.file&&m.body?['ویرایش توضیح','pencil',()=>startEdit(m)]:null),
    (mine||owner)?['حذف','delete',async()=>{if(!confirm('این پیام برای همه حذف بشه؟'))return;try{const r=await call('delete',{message_id:m.id});applyUpdate(r.message)}catch(e){toast(e.message)}},true]:null],rx)}
function dialog(title,...body){
  const m=$('#modal');m.replaceChildren(h('div',{class:'dlg'},h('h3',{},h('span',{class:'grow'},title),h('button',{class:'iconbtn',onclick:closeDialog},ic('close'))),...body));m.hidden=false;
  m.onclick=e=>{if(e.target===m)closeDialog()};return m}
function closeDialog(){$('#modal').hidden=true;$('#modal').replaceChildren();window.__group=null}
function dlgForward(m){
  const sel=new Set(),list=h('div',{class:'ulist',style:'max-height:340px'}),btn=h('button',{class:'btn',disabled:true,onclick:async()=>{
    try{const r=await call('forward',{message_id:m.id,chat_ids:[...sel]});closeDialog();(r.messages||[]).forEach(ingest);sfx('send');toast('فوروارد شد',false)}catch(e){toast(e.message)}}},'ارسال');
  sorted().forEach(c=>{const row=h('div',{class:'srow'},chatAvatar(c,40,false),h('div',{class:'grow'},h('b',{},c.title)),h('span',{class:'sw2'}));
    row.onclick=()=>{sel.has(c.id)?sel.delete(c.id):sel.add(c.id);row.lastChild.classList.toggle('on',sel.has(c.id));btn.disabled=!sel.size};list.append(row)});
  dialog('فوروارد به…',list,btn)}

/* ---------- drawer, profile, settings ---------- */
function openDrawer(on){$('#drawer').classList.toggle('on',on);$('#scrim').classList.toggle('on',on)}
function buildDrawer(){
  const d=$('#drawer'),me=S.me;if(!me)return;const ma=$('#meav');if(ma){ma.replaceChildren(avatar('u',me.id,me.display_name,me.avatar_at,38,false));ma.onclick=dlgProfile}
  const item=(icn,t,fn)=>h('button',{class:'ditem',onclick:()=>{openDrawer(false);fn()}},ic(icn),t);
  d.replaceChildren(
    h('div',{class:'dhead',onclick:()=>{openDrawer(false);dlgProfile()}},avatar('u',me.id,me.display_name,me.avatar_at,64,false),
      h('button',{class:'iconbtn moon',onclick:e=>{e.stopPropagation();toggleTheme()},title:'تم'},ic('moon')),
      h('div',{class:'dn'},me.display_name),h('div',{class:'du'},at(me.username))),
    item('person','پروفایل من',dlgProfile),item('group','گروه جدید',dlgNewGroup),item('pencil','چت جدید',dlgNewChat),item('film','اتاق تماشا',()=>typeof openRoomHub==='function'&&openRoomHub()),
    item('bookmark','پیام‌های ذخیره‌شده',()=>openPrivate(me.username)),item('settings','تنظیمات',dlgSettings),item('lock','حریم خصوصی',dlgPrivacy),
    item('devices','دستگاه‌های من',dlgSessions),item('logout','خروج',()=>logout()),
    h('div',{class:'dfoot'},'Windroida'))}
/* crop the picked photo to a centered square (max 512px) in the browser, then upload */
function cropSquare(file,px=512){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{const s=Math.min(img.naturalWidth,img.naturalHeight),c=document.createElement('canvas');c.width=c.height=Math.min(px,s);
      c.getContext('2d').drawImage(img,(img.naturalWidth-s)/2,(img.naturalHeight-s)/2,s,s,0,0,c.width,c.height);URL.revokeObjectURL(url);
      c.toBlob(b=>b?res(b):rej(new Error('تبدیل عکس ناموفق بود')),'image/jpeg',.9)};
    img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('این فایل عکس معتبر نیست'))};img.src=url})}
async function postAvatar(file,target,chatId){
  const blob=await cropSquare(file);
  const q=new URLSearchParams({k:S.mediaKey,target});if(chatId)q.set('chat_id',chatId);
  const r=await fetch('/avatar?'+q,{method:'POST',body:blob});const j=await r.json().catch(()=>({}));
  if(!r.ok||!j.ok)throw new Error(j.error||'آپلود عکس ناموفق بود');return j.at}
function photoPicker(getAvatarEl,target,chatId,onDone){
  const inp=h('input',{type:'file',accept:'image/*',hidden:true,onchange:async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
    try{await postAvatar(f,target,chatId);toast('عکس ذخیره شد',false);onDone&&onDone()}catch(er){toast(er.message)}}});
  return[inp,()=>inp.click()]}
function dlgProfile(){
  const me=S.me,name=h('input',{value:me.display_name,maxlength:40}),bio=h('textarea',{rows:2,maxlength:140,style:'resize:none'},me.bio||''),msg=h('div',{class:'msg'});
  const big=h('div',{class:'pbig'});
  const draw=()=>{big.replaceChildren(gav('u',me.id,me.display_name,me.avatar_at,112,false),h('button',{class:'cam',onclick:pick,title:'تغییر عکس'},ic('camera',18)))};
  const[inp,pick]=photoPicker(null,'me',null,async()=>{try{const r=await call('me');Object.assign(S.me,r.me)}catch{}draw();buildDrawer()});
  draw();
  dialog('پروفایل',big,inp,
    h('div',{style:'text-align:center;margin-bottom:6px'},h('button',{class:'link',onclick:pick},'انتخاب عکس جدید'),
      me.avatar_at?h('span',{},'  ·  ',h('button',{class:'link',style:'color:var(--danger)',onclick:async()=>{try{await call('remove_avatar');S.me.avatar_at=0;draw();buildDrawer()}catch(e){toast(e.message)}}},'حذف عکس')):null),
    h('label',{},'نام نمایشی'),name,h('label',{},'درباره من'),bio,
    h('div',{class:'muted',style:'font-size:12px;margin-top:8px'},'نام کاربری: @'+me.username+' (قابل تغییر نیست)'),
    h('button',{class:'btn',onclick:async()=>{try{const r=await call('update_profile',{display_name:name.value,bio:bio.value});Object.assign(S.me,r.me);buildDrawer();msg.className='msg ok';msg.textContent='ذخیره شد'}catch(e){msg.className='msg';msg.textContent=e.message}}},'ذخیره'),msg)}
/* "Install app" (PWA): Chrome offers it only when the page is trusted https (install the certificate first) */
let installEv=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEv=e});window.addEventListener('appinstalled',()=>{installEv=null;toast('نصب شد 🎉',false)});
async function installApp(){
  if(window.matchMedia('(display-mode: standalone)').matches)return toast('برنامه همین الان نصبه',false);
  if(!installEv)return toast('کروم هنوز اجازه نصب نداده: اول گواهی رو نصب کن، کروم رو کامل ببند و دوباره باز کن؛ یا از منوی کروم (⋮) گزینه Install app / Add to Home screen رو بزن');
  installEv.prompt();try{await installEv.userChoice}catch{}installEv=null}
/* the certificate is fetched through the already-open page connection and saved from memory: nothing for Android's download manager to stall on */
async function dlCert(){
  try{const r=await fetch('/windroida.crt',{cache:'no-store'});if(!r.ok)throw 0;const b=await r.blob();
    const u=URL.createObjectURL(new Blob([b],{type:'application/x-x509-ca-cert'})),x=h('a',{href:u,download:'windroida.crt'});document.body.append(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);toast('گواهی ذخیره شد؛ از پوشه Downloads نصبش کن',false)}
  catch{toast('دانلود نشد؛ آدرس http زیر دکمه رو امتحان کن')}}
function dlgSettings(){
  const sw=(label,on,fn)=>{const s=h('span',{class:'sw2'+(on?' on':'')});return h('div',{class:'tog',onclick:()=>{on=!on;s.classList.toggle('on',on);fn(on)}},h('span',{},label),s)};
  const old=h('input',{type:'password',autocomplete:'current-password'}),nw=h('input',{type:'password',autocomplete:'new-password'}),msg=h('div',{class:'msg'});
  const sws=h('div',{class:'sw'},ACCENTS.map(c=>h('button',{style:'background:'+c,class:PREF.accent===c?'on':'',onclick:e=>{applyAccent(c);[...sws.children].forEach(x=>x.classList.remove('on'));e.currentTarget.classList.add('on')}})));
  const srvWalls=h('div',{class:'walls srv'});
  call('wallpaper_list').then(r=>srvWalls.replaceChildren(...r.walls.map(w=>h('button',{type:'button',class:'wsw wphoto',title:w.name,style:'background-image:url("'+wallUrl(w.name,w.v,true)+'")',onclick:()=>{lsSet('wd-wall','srv:'+w.name+'|'+w.v);applyWall()}})))).catch(()=>{});
  const size=h('input',{type:'range',min:13,max:19,value:PREF.size,style:'padding:0;border:0',oninput:e=>applySize(+e.target.value)});
  dialog('تنظیمات',
    sw('حالت تاریک',document.documentElement.dataset.theme==='dark',on=>setTheme(on?'dark':'light')),
    h('label',{},'رنگ اصلی'),sws,h('label',{},'اندازه متن'),size,
    h('label',{},'پس‌زمینه چت'),srvWalls,h('div',{class:'walls'},WALLS.map(([n,v])=>h('button',{type:'button',class:'wsw',title:n,style:v?'background:'+v:'',onclick:()=>{lsSet('wd-wall',v);applyWall()}},v?'':'A')),
      ...(S.walls||[]).map(v=>{const del=async()=>{if(!confirm('این عکس پس‌زمینه حذف بشه؟'))return;try{const r=await call('userwall_remove',{v});S.walls=r.walls||[];S.wallV=r.wall_v||0;wallSetSave(v,null);if((lsGet('wd-wall','')||'')==='mine:'+v)lsSet('wd-wall','');applyWall();closeDialog();dlgSettings();toast('حذف شد',false)}catch(e){toast(e.message)}};
        const menu=(x,y)=>popMenu(x,y+34,[['استفاده','check',()=>{lsSet('wd-wall','mine:'+v);applyWall()}],['تنظیم اندازه','settings',()=>dlgWallSize(v)],['حذف','delete',del,true]]);
        let lt=null,lp=false;const b=h('button',{type:'button',class:'wsw wphoto',title:'نگه دار: حذف و تنظیم اندازه',style:'background-image:url("'+userWallUrl(v,true)+'")',onclick:e=>{if(lp){lp=false;e.stopPropagation();return}lsSet('wd-wall','mine:'+v);applyWall()}});
        b.addEventListener('contextmenu',e=>{e.preventDefault();lp=true;menu(e.clientX,e.clientY)});
        b.addEventListener('touchstart',e=>{const p=e.touches[0];lp=false;lt=setTimeout(()=>{lt=null;lp=true;menu(p.clientX,p.clientY)},500)},{passive:true});
        const cl=()=>{clearTimeout(lt);lt=null};b.addEventListener('touchend',cl);b.addEventListener('touchmove',cl,{passive:true});b.addEventListener('touchcancel',cl);
        return h('span',{class:'wph'},b,h('button',{type:'button',class:'wx',title:'حذف این عکس',onclick:del},'×'))}),
      h('button',{type:'button',class:'wsw wimg',title:'عکس خودت',onclick:()=>$('#wallfile').click()},ic('attach'))),
    sw('صدای پیام جدید',PREF.sound,on=>lsSet('wd-sound',on?'1':'0')),
    sw('اعلان مرورگر',PREF.notif,on=>{lsSet('wd-notif',on?'1':'0');if(on&&'Notification' in window)Notification.requestPermission().catch(()=>{})}),
    h('button',{class:'btn soft',style:'display:block;margin-top:8px',onclick:()=>{closeDialog();dlgPrivacy()}},'🔒 حریم خصوصی و بلاک'),
    h('button',{class:'btn soft',style:'display:block;margin-top:8px',onclick:dlgPushTest},'🔔 بررسی و آزمایش اعلان'),
    window.WD&&WD.cacheInfo?h('button',{class:'btn soft',style:'display:block;margin-top:8px',onclick:()=>{closeDialog();dlgStorage()}},'💾 مدیریت حافظه'):null,
    window.WD&&WD.changeServer?h('button',{class:'btn soft',style:'display:block;margin-top:8px',onclick:()=>WD.changeServer()},'🌐 آدرس سرور (اپ اندروید)'):null,
    h('hr'),h('b',{},'نصب برنامه روی گوشی'),
    h('div',{class:'muted',style:'font-size:13px;line-height:1.8'},'اگه کنار آدرس هشدار قرمز می‌بینی یا «Install» کار نمی‌کنه، یک بار این گواهی رو نصب کن: دانلود کن → تنظیمات گوشی › امنیت › رمزگذاری و اعتبارنامه › نصب گواهی › گواهی CA. بعد کروم رو کامل ببند و دوباره باز کن؛ بعدش منوی کروم › Install app.'),
    h('button',{class:'btn',style:'display:block;margin-top:8px',onclick:installApp},'📲 نصب برنامه روی گوشی'),
    h('button',{class:'btn soft',style:'display:block;margin-top:8px',onclick:dlCert},'دانلود گواهی'),
    h('div',{class:'muted',style:'font-size:12px;line-height:1.8;margin-top:6px'},'اگه دانلود گیر کرد، این آدرس رو با http (نه https) تو کروم باز کن: ',h('span',{dir:'ltr',style:'user-select:all;word-break:break-all'},'http://'+location.host+'/windroida.crt')),
    h('hr'),h('b',{},'تغییر رمز'),h('label',{},'رمز فعلی'),old,h('label',{},'رمز جدید'),nw,
    h('button',{class:'btn soft',onclick:async()=>{try{await call('change_password',{old_password:old.value,new_password:nw.value});old.value=nw.value='';msg.className='msg ok';msg.textContent='رمز عوض شد'}catch(e){msg.className='msg';msg.textContent=e.message}}},'تغییر رمز'),msg)}
async function dlgSessions(){
  const list=h('div'),draw=async()=>{try{const r=await call('sessions');list.replaceChildren(...r.sessions.map(s=>
    h('div',{class:'member'},ic('devices'),h('div',{class:'grow'},h('b',{},s.device||'دستگاه'+(s.current?' (همین دستگاه)':'')),h('div',{class:'muted',style:'font-size:12px'},'آخرین فعالیت: '+lastSeen(s.last_used))),
      s.current?null:h('button',{class:'iconbtn',title:'خروج این دستگاه',onclick:async()=>{try{await call('terminate_session',{session_id:s.id});draw()}catch(e){toast(e.message)}}},ic('close')))))}catch(e){toast(e.message)}};
  dialog('دستگاه‌های من',list,h('button',{class:'btn danger',onclick:async()=>{if(!confirm('از همه دستگاه‌های دیگه خارج بشی؟'))return;try{await call('terminate_others');draw()}catch(e){toast(e.message)}}},'خروج از همه دستگاه‌های دیگه'));draw()}
function userSearch(onPick,multi){
  const input=h('input',{placeholder:'نام کاربری کامل (مثلاً ali_123)',autocomplete:'off',autocapitalize:'none'}),list=h('div',{class:'ulist'});let job;
  input.addEventListener('input',()=>{clearTimeout(job);const q=input.value.trim().replace(/^@/,'');if(!q){list.replaceChildren();return}
    if(!USER_RE.test(q)){list.replaceChildren(h('div',{class:'hint'},'نام کاربری رو کامل بنویس'));return}
    job=setTimeout(async()=>{try{const r=await call('search_users',{q});if(q!==input.value.trim().replace(/^@/,''))return;if(!r.users.length)return list.replaceChildren(h('div',{class:'hint'},'کاربری با این نام پیدا نشد'));list.replaceChildren(...r.users.map(u=>
      h('div',{class:'srow',onclick:()=>{onPick(u);if(multi){input.value='';list.replaceChildren();input.focus()}}},avatar('u',u.id,u.display_name,u.avatar_at,40,u.online),h('div',{class:'grow'},h('b',{},u.display_name),h('small',{},at(u.username))))))}catch{}},250)});
  return[input,list]}
function dlgNewChat(){const[i,l]=userSearch(u=>{closeDialog();openPrivate(u.username)});dialog('چت جدید',i,l);i.focus()}
function dlgNewGroup(){
  const title=h('input',{placeholder:'اسم گروه',maxlength:40}),chosen=new Map(),chips=h('div',{class:'chips'}),err=h('div',{class:'msg'});
  const draw=()=>chips.replaceChildren(...[...chosen.values()].map(u=>h('span',{class:'chip',title:'حذف',onclick:()=>{chosen.delete(u.username);draw()}},u.display_name+' ✕')));
  const[i,l]=userSearch(u=>{chosen.set(u.username,u);draw()},true);
  dialog('گروه جدید',title,h('div',{style:'height:8px'}),i,chips,l,err,h('button',{class:'btn',onclick:async()=>{
    if(!title.value.trim())return err.textContent='اسم گروه رو بنویس';
    try{const r=await call('create_group',{title:title.value,usernames:[...chosen.keys()]});S.chats[r.chat.id]=r.chat;closeDialog();openChat(r.chat.id)}catch(e){err.textContent=e.message}}},'ساخت گروه'));title.focus()}

/* ---------- chat info (user / group) + shared media ---------- */
function showUser(uid,name){
  for(const c of Object.values(S.chats))if(c.peer&&c.peer.id===uid)return dlgUser(c.peer);
  dialog(name||'کاربر',h('div',{class:'muted'},'برای دیدن مشخصات یا پیام دادن، نام کاربری رو جستجو کن.'))}
function dlgUser(p){
  dialog(p.display_name,h('div',{class:'pbig'},gav('u',p.id,p.display_name,p.avatar_at,112,p.online),h('div',{class:'muted'},at(p.username)),
    h('div',{class:'muted',style:'font-size:13px'},seenText(p))),
    p.bio?h('div',{style:'white-space:pre-wrap;margin:6px 0',dir:'auto'},p.bio):null,
    h('button',{class:'btn',onclick:()=>{closeDialog();openPrivate(p.username)}},'ارسال پیام'))}
async function sharedTab(box,chatId,kind){
  box.replaceChildren(h('div',{class:'hint'},'در حال بارگذاری…'));
  try{const r=await call('shared',{chat_id:chatId,kind});
    if(!r.messages.length)return box.replaceChildren(h('div',{class:'hint'},'چیزی نیست'));
    const jump=m=>{closeDialog();openChat(chatId,m.id)};
    if(kind==='media')box.replaceChildren(h('div',{class:'grid3'},r.messages.map(m=>{
      const v=m.file.kind==='video',cell=h('div',{class:'vthumb'+(v?' isv':'')},m.file.thumb?h('img',{src:thumbUrl(m),loading:'lazy',alt:''}):(!v?h('img',{src:mediaUrl(m),loading:'lazy',alt:''}):h('span',{class:'ph'},ic('video',26))));
      cell.onclick=()=>v?jump(m):lightbox(mediaUrl(m));return cell})));
    else box.replaceChildren(...r.messages.map(m=>{
      if(kind==='link'){const u=(m.body.match(/https?:\/\/[^\s<>"']+/)||[''])[0];return h('div',{class:'srow',onclick:()=>jump(m)},ic('file'),h('div',{class:'grow'},h('a',{href:u,target:'_blank',rel:'noopener noreferrer',onclick:e=>e.stopPropagation()},short(u,50)),h('small',{},short(m.body,60))))}
      return h('div',{class:'srow',onclick:()=>jump(m)},ic(m.file.voice?'mic':'file'),h('div',{class:'grow'},h('b',{},m.file.voice?'پیام صوتی '+fmtDur(m.file.dur):short(m.file.name,34)),h('small',{},(m.sender_name||'')+' · '+jdate(m.created_at)+' · '+fmtSize(m.file.size))),
        h('button',{class:'iconbtn',onclick:e=>{e.stopPropagation();download(m)}},ic('download')))}))
  }catch(e){box.replaceChildren(h('div',{class:'hint'},e.message))}}
function sharedSection(c){
  const box=h('div',{style:'min-height:80px'}),tabs=[['media','رسانه'],['file','فایل'],['voice','ویس'],['audio','موزیک'],['link','لینک']];
  const seg=h('div',{class:'seg'},tabs.map(([k,t])=>h('button',{class:k==='media'?'on':'',onclick:e=>{[...seg.children].forEach(x=>x.classList.remove('on'));e.currentTarget.classList.add('on');sharedTab(box,c.id,k)}},t)));
  sharedTab(box,c.id,'media');return[seg,box]}
/* ---------- privacy: last seen, read receipts, block ---------- */
S.priv={priv_seen:'all',read_receipts:true,blocked:[]};
async function loadPrivacy(){try{const r=await call('privacy_get');S.priv={priv_seen:r.priv_seen,read_receipts:r.read_receipts,blocked:r.blocked}}catch{}}
const isBlocked=id=>(S.priv.blocked||[]).some(u=>u.id===id);
function blockRow(p){
  const b=h('button',{class:'btn '+(isBlocked(p.id)?'soft':'danger'),style:'display:block;margin-top:8px'},isBlocked(p.id)?'خارج کردن از بلاک':'بلاک کردن این کاربر');
  b.onclick=async()=>{const on=!isBlocked(p.id);if(on&&!confirm('«'+p.display_name+'» بلاک بشه؟ نمی‌تونه بهت پیام بده یا زنگ بزنه و آخرین بازدیدت رو نمی‌بینه.'))return;
    try{const r=await call(on?'block':'unblock',{user_id:p.id});S.priv.blocked=r.blocked;b.textContent=on?'خارج کردن از بلاک':'بلاک کردن این کاربر';b.className='btn '+(on?'soft':'danger');toast(on?'بلاک شد':'از بلاک خارج شد',false)}catch(e){toast(e.message)}};
  return b}
async function dlgPrivacy(){
  await loadPrivacy();
  const seg=h('div',{class:'seg'}),modes=[['all','همه'],['contacts','مخاطب‌ها'],['nobody','هیچ‌کس']];
  const drawSeg=()=>seg.replaceChildren(...modes.map(([k,t])=>h('button',{class:S.priv.priv_seen===k?'on':'',type:'button',onclick:async()=>{
    try{const r=await call('privacy_set',{priv_seen:k});S.priv.priv_seen=r.priv_seen;drawSeg()}catch(e){toast(e.message)}}},t)));drawSeg();
  const rr=h('span',{class:'sw2'+(S.priv.read_receipts?' on':'')}),
    rrRow=h('div',{class:'tog',onclick:async()=>{const on=!S.priv.read_receipts;try{const r=await call('privacy_set',{read_receipts:on});S.priv.read_receipts=r.read_receipts;rr.classList.toggle('on',r.read_receipts)}catch(e){toast(e.message)}}},h('span',{},'تیک خوانده‌شدن (دو طرفه)'),rr);
  const list=h('div',{class:'ulist'});
  const drawList=()=>list.replaceChildren(...((S.priv.blocked||[]).length?S.priv.blocked.map(u=>h('div',{class:'member'},avatar('u',u.id,u.display_name,u.avatar_at,38,false),
    h('div',{class:'grow'},h('b',{},u.display_name),h('div',{class:'muted',style:'font-size:12px'},at(u.username))),
    h('button',{class:'btn soft',style:'width:auto;margin:0;padding:6px 12px',onclick:async()=>{try{const r=await call('unblock',{user_id:u.id});S.priv.blocked=r.blocked;drawList()}catch(e){toast(e.message)}}},'آزاد کردن'))):[h('div',{class:'hint'},'کسی رو بلاک نکردی')]));drawList();
  dialog('حریم خصوصی',h('b',{},'کی آخرین بازدید و آنلاین بودنم رو ببینه؟'),seg,
    h('div',{class:'muted',style:'font-size:12px;line-height:1.7'},'«مخاطب‌ها» یعنی کسایی که با هم پیام رد و بدل کردین. اگه مخفی کنی، بقیه به‌جاش «به‌تازگی» می‌بینن.'),
    h('hr'),rrRow,
    h('div',{class:'muted',style:'font-size:12px;line-height:1.7'},'اگه خاموشش کنی، نه تیک خوانده‌شدن پیام‌هات رو بقیه می‌بینن، نه تو مال اونا رو.'),
    h('hr'),h('b',{},'کاربران بلاک‌شده'),list)}
function dlgInfo(){
  const c=S.chats[S.current];if(!c)return;
  const muteRow=h('div',{class:'tog',onclick:async e=>{await setChat(c.id,{muted:!c.muted});e.currentTarget.lastChild.classList.toggle('on',!!c.muted)}},h('span',{},'بی‌صدا کردن اعلان‌ها'),h('span',{class:'sw2'+(c.muted?' on':'')}));
  if(c.kind==='private'&&c.peer){const p=c.peer;
    dialog(p.display_name,h('div',{class:'pbig'},gav('u',p.id,p.display_name,p.avatar_at,112,p.online),h('div',{class:'muted'},at(p.username)),h('div',{class:'muted',style:'font-size:13px'},seenText(p))),
      p.bio?h('div',{style:'white-space:pre-wrap;margin:6px 0',dir:'auto'},p.bio):null,muteRow,blockRow(p),...sharedSection(c));return}
  if(c.saved){dialog('پیام‌های ذخیره‌شده',...sharedSection(c));return}
  if(c.channel){
    const adm=!!c.can_post,big=h('div',{class:'pbig'}),err=h('div',{class:'msg'});
    const draw=()=>{const cc=S.chats[c.id]||c;big.replaceChildren(cc.avatar_at?gav('c',cc.id,cc.title,cc.avatar_at,112,false):h('div',{class:'avatar',style:'width:112px;height:112px;background:linear-gradient(135deg,#f4511e,#ff8a50)'},ic('channel',56)),
      adm?h('button',{class:'cam',onclick:pick,title:'تغییر عکس'},ic('camera',18)):null,h('b',{style:'font-size:18px'},cc.title),h('div',{class:'muted',style:'font-size:13px;white-space:pre-wrap;text-align:center'},cc.description||''),h('div',{class:'muted',style:'font-size:12px'},fa(cc.member_count)+' مشترک'))};
    const[inp,pick]=photoPicker(null,'chat',c.id,()=>setTimeout(draw,400));draw();
    const title=h('input',{value:c.title,maxlength:40}),desc=h('textarea',{rows:2,maxlength:200,style:'resize:none'},c.description||'');
    dialog(c.title,big,inp,adm?h('div',{},h('label',{},'نام کانال'),title,h('label',{},'توضیحات'),desc,
      h('button',{class:'btn soft',onclick:async()=>{try{const r=await call('edit_group',{chat_id:c.id,title:title.value,description:desc.value});S.chats[c.id]=Object.assign(S.chats[c.id],r.chat);renderList();fillHeader();draw();toast('ذخیره شد',false)}catch(e){err.textContent=e.message}}},'ذخیره'),
      c.avatar_at?h('button',{class:'btn danger',onclick:async()=>{try{await call('remove_avatar',{chat_id:c.id});setTimeout(draw,400)}catch(e){err.textContent=e.message}}},'حذف عکس کانال'):null,err):null,muteRow,...sharedSection(c));return}
  const list=h('div'),err=h('div',{class:'msg'}),isOwner=c.owner_id===S.me.id,isMgr=isOwner||c.my_role==='admin';
  const big=h('div',{class:'pbig'});
  const draw=()=>{const cc=S.chats[c.id]||c;big.replaceChildren(gav('c',cc.id,cc.title,cc.avatar_at,112,false),isOwner?h('button',{class:'cam',onclick:pick},ic('camera',18)):null,h('b',{style:'font-size:18px'},cc.title),h('div',{class:'muted',style:'font-size:13px;white-space:pre-wrap'},cc.description||''),h('div',{class:'muted',style:'font-size:12px'},fa(cc.member_count)+' عضو'))};
  const[inp,pick]=photoPicker(null,'chat',c.id,()=>setTimeout(draw,300));draw();
  const g={id:c.id,async reload(){draw();try{const r=await call('members',{chat_id:c.id});list.replaceChildren(...r.members.map(u=>h('div',{class:'member'},avatar('u',u.id,u.display_name,u.avatar_at,38,u.online),
    h('div',{class:'grow'},h('b',{},u.display_name),h('div',{class:'muted',style:'font-size:12px'},at(u.username),(u.role==='owner'?' · سازنده':u.role==='admin'?' · ادمین':''))),
    isOwner&&u.role!=='owner'?h('button',{class:'iconbtn',title:u.role==='admin'?'برداشتن ادمین':'ادمین کردن',onclick:async()=>{try{await call('set_role',{chat_id:c.id,user_id:u.id,admin:u.role!=='admin'});err.textContent=''}catch(e){err.textContent=e.message}}},ic('check')):null,
    isMgr&&u.id!==S.me.id&&u.role!=='owner'&&(isOwner||u.role!=='admin')?h('button',{class:'iconbtn',title:'حذف از گروه',onclick:async()=>{try{await call('remove_member',{chat_id:c.id,user_id:u.id})}catch(e){err.textContent=e.message}}},ic('close')):null)))}catch(e){err.textContent=e.message}}};
  const add=h('input',{placeholder:'نام کاربری عضو جدید',style:'flex:1'}),
    addBtn=h('button',{class:'btn',style:'width:auto;margin:0',onclick:async()=>{const n=add.value.trim().replace(/^@/,'');if(!n)return;try{await call('add_member',{chat_id:c.id,username:n});add.value='';err.textContent=''}catch(e){err.textContent=e.message}}},'افزودن');
  const title=h('input',{value:c.title,maxlength:40}),desc=h('textarea',{rows:2,maxlength:200,style:'resize:none'},c.description||''),
    uname=h('input',{value:c.username||'',placeholder:'مثلاً my_group (اختیاری)',maxlength:32,autocapitalize:'none',dir:'ltr'}),link=h('div',{class:'invl'});
  const drawLink=async reset=>{try{const r=await call('invite_link',{chat_id:c.id,reset:!!reset});const u=location.origin+'/#join='+r.invite;
    link.replaceChildren(h('div',{class:'invurl',dir:'ltr'},u),h('div',{class:'invbtns'},h('button',{class:'btn soft',onclick:()=>copyText(u)},'کپی لینک'),
      h('button',{class:'btn soft',onclick:()=>{if(confirm('لینک قبلی از کار می‌افته. لینک جدید ساخته بشه؟'))drawLink(true)}},'لینک جدید')))}catch(e){err.textContent=e.message}};
  if(isOwner)drawLink(false);
  dialog('اطلاعات گروه',big,inp,
    isMgr?h('div',{},h('label',{},'اسم گروه'),title,h('label',{},'توضیحات'),desc,h('label',{},'آیدی عمومی گروه (دیگران با جستجوی دقیق پیداش می‌کنن)'),uname,h('label',{},'لینک دعوت'),link,
      h('button',{class:'btn soft',onclick:async()=>{try{const r=await call('edit_group',{chat_id:c.id,title:title.value,description:desc.value,username:uname.value});S.chats[c.id]=Object.assign(S.chats[c.id],r.chat);renderList();fillHeader();draw();toast('ذخیره شد',false)}catch(e){err.textContent=e.message}}},'ذخیره تغییرات')):null,
    muteRow,h('h4',{style:'margin:14px 0 4px'},'اعضا'),list,isMgr?h('div',{style:'display:flex;gap:8px;margin-top:10px'},add,addBtn):null,err,
    h('button',{class:'btn danger',onclick:()=>leaveGroup(c)},'ترک گروه'),isOwner?h('button',{class:'btn danger',onclick:()=>deleteGroup(c)},'حذف گروه برای همه'):null,h('hr'),...sharedSection(c));
  window.__group=g;g.reload()}

function copyText(t){
  const done=()=>toast('کپی شد',false);
  if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(t).then(done).catch(()=>fallbackCopy(t,done));
  fallbackCopy(t,done)}
function fallbackCopy(t,done){const x=h('textarea',{style:'position:fixed;opacity:0'},t);document.body.append(x);x.select();try{document.execCommand('copy');done()}catch{toast('کپی نشد')}x.remove()}
/* join a group by invite link (#join=token) or by its public @id */
function joinDialog(info,ref){
  if(info.member&&S.chats[info.id]){closeDialog();return openChat(info.id)}
  dialog('پیوستن به گروه',h('div',{class:'pbig'},h('div',{class:'avatar',style:'width:84px;height:84px;font-size:36px;background:'+COLORS[(info.id||0)%COLORS.length]},initial(info.title)),
    h('b',{style:'font-size:18px'},info.title),info.username?h('div',{class:'muted',dir:'ltr'},'@'+info.username):null,h('div',{class:'muted',style:'font-size:13px;white-space:pre-wrap;text-align:center'},info.description||''),h('div',{class:'muted',style:'font-size:12px'},fa(info.member_count)+' عضو')),
    h('button',{class:'btn',onclick:async()=>{try{const r=await call('join',ref);S.chats[r.chat.id]=r.chat;closeDialog();renderList();openChat(r.chat.id)}catch(e){toast(e.message)}}},'عضو شو'))}
async function handleJoin(){
  const v=lsGet('wd-join');if(!v||!S.me)return;lsSet('wd-join',null);
  const ref=v[0]==='@'?{username:v.slice(1)}:{token:v};
  try{const r=await call('invite_info',ref);joinDialog(r.chat,ref)}catch(e){toast(e.message)}}
function grabJoinFromUrl(){const m=location.hash.match(/^#join=([^&]{3,60})$/);if(m){lsSet('wd-join',decodeURIComponent(m[1]));try{history.replaceState(null,'',location.pathname)}catch{}if(S.me)handleJoin()}}
window.addEventListener('hashchange',grabJoinFromUrl);

/* ---------- in-chat search ---------- */
const SR={res:[],i:0,job:null};
function openSearch(){$('#schbar').hidden=false;$('#schq').value='';$('#schq').focus();SR.res=[];$('#schcnt').textContent=''}
function closeSearch(){$('#schbar').hidden=true;SR.res=[]}
function gotoResult(){if(!SR.res.length)return;const m=SR.res[SR.i];$('#schcnt').textContent=fa(SR.i+1)+' از '+fa(SR.res.length);jumpTo(m.id)}
$('#schq')&&0;
async function runSearch(){
  const q=$('#schq').value.trim();if(q.length<2){SR.res=[];$('#schcnt').textContent='';return}
  try{const r=await call('search_messages',{chat_id:S.current,q});if(q!==$('#schq').value.trim())return;SR.res=r.messages;SR.i=0;$('#schcnt').textContent=r.messages.length?'':'چیزی پیدا نشد';gotoResult()}catch(e){toast(e.message)}}

/* ---------- voice calls (WebRTC; audio goes peer-to-peer, the server only rings and relays signals) ---------- */
let C=null,ringT=null;
const callText={hangup:'تماس تموم شد',rejected:'تماس رد شد',cancelled:'تماس لغو شد',missed:'پاسخی داده نشد',disconnected:'ارتباط تماس قطع شد',answered_elsewhere:''};
async function getMic(){
  if(!window.isSecureContext)throw new Error('مرورگر روی http اجازه میکروفون نمی‌ده. با آدرس https باز کن.');
  if(!navigator.mediaDevices)throw new Error('این مرورگر از تماس صوتی پشتیبانی نمی‌کنه');
  try{return await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:true,channelCount:1},video:false})}catch{throw new Error('دسترسی به میکروفون داده نشد')}}
function ring(kind){clearInterval(ringT);ringT=null;if(!kind)return;const b=()=>beep(kind==='in'?520:425,kind==='in'?.6:1,.08);b();ringT=setInterval(b,kind==='in'?1800:3000)}
function showCallUI(){
  if(!C)return;const ui=$('#callui');ui.hidden=false;
  const st=C.state==='active'&&C.reconnecting?'در حال اتصال مجدد…':{ringing:'در حال زنگ زدن…',incoming:C.wantVideo?'تماس تصویری ورودی…':'تماس صوتی ورودی…',connecting:'در حال اتصال…',active:''}[C.state];
  const cb=(cls,t,icn,fn)=>h('button',{class:'cbtn '+cls,title:t,onclick:fn},ic(icn,28));
  const btns=C.state==='incoming'?[cb('red','رد','close',hangup),cb('green','پاسخ','phone',acceptCall)]
    :[cb(C.muted?'on':'',C.muted?'روشن کردن میکروفون':'بی‌صدا','mic',toggleMute),cb(C.cam?'on':'',C.cam?'خاموش کردن دوربین':'روشن کردن دوربین','video',toggleCam),cb(C.loud?'on':'','بلندگو / خروجی صدا','speaker',speakerMenu),cb('red','قطع','phone',hangup)];
  if(!C.rimg){C.rimg=h('img',{class:'rvid',alt:''});C.rimg.hidden=true;C.lvid=h('video',{class:'lvid',muted:true,playsinline:true,autoplay:true});C.lvid.muted=true;C.lvid.hidden=true;C.lvid.srcObject=C.vstream||null}
  ui.replaceChildren(C.rimg,C.lvid,h('div',{class:'cinfo'},C.rimg.hidden?avatar('u',C.peer.id,C.peer.display_name,C.peer.avatar_at,110,false):null,h('div',{class:'cname'},C.peer.display_name),h('div',{class:'cstat',id:'cstat'},st)),h('div',{class:'cbtns'},btns));
  if(C.state==='active')tickCall()}
/* camera: small JPEG frames (about 10 per second) relayed through the server, like the audio */
async function toggleCam(){
  const c=C;if(!c)return;
  if(c.cam){c.cam=false;clearInterval(c.camT);if(c.vstream)c.vstream.getTracks().forEach(t=>t.stop());c.vstream=null;c.lvid.srcObject=null;c.lvid.hidden=true;
    if(ws&&ws.readyState===1)ws.send(JSON.stringify({op:'call_video',call_id:c.id,d:''}));return showCallUI()}
  if(!navigator.mediaDevices)return toast('این مرورگر دوربین نداره');
  let vs;try{vs=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:480},height:{ideal:360},facingMode:'user'},audio:false})}catch{return toast('دسترسی به دوربین داده نشد')}
  if(C!==c){vs.getTracks().forEach(t=>t.stop());return}
  c.vstream=vs;c.cam=true;showCallUI();c.lvid.srcObject=vs;c.lvid.hidden=false;c.lvid.play().catch(()=>{});
  const cv=document.createElement('canvas'),vid=document.createElement('video');vid.muted=true;vid.playsInline=true;vid.srcObject=vs;await vid.play().catch(()=>{});
  c.camT=setInterval(()=>{
    if(C!==c||!ws||ws.readyState!==1||ws.bufferedAmount>80000||!vid.videoWidth)return;      // audio has priority: skip video when the link is busy
    const hh=Math.min(360,vid.videoHeight),w=Math.round(hh*vid.videoWidth/vid.videoHeight);cv.width=w;cv.height=hh;cv.getContext('2d').drawImage(vid,0,0,w,hh);       // 360p: the server upload is only ~5 Mbps
    const d=cv.toDataURL('image/jpeg',.5);ws.send(JSON.stringify({op:'call_video',call_id:c.id,d:d.slice(23)}))},125)}   // 8 fps
function onCallVideo(e){
  if(!C||C.id!==e.call_id||!C.rimg)return;
  if(!e.d){C.rimg.hidden=true;return showCallUI()}
  const was=C.rimg.hidden;C.rimg.src='data:image/jpeg;base64,'+e.d;if(was){C.rimg.hidden=false;showCallUI();C.rimg.hidden=false}}
function tickCall(){const e=$('#cstat');if(!e||!C||!C.t0)return;const s=Math.floor((Date.now()-C.t0)/1000);
  e.textContent=C.reconnecting?'در حال اتصال مجدد… صبر کن':C.peerAway?'اتصال طرف مقابل ضعیفه؛ منتظر برگشتنش…':fa(String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'))+(C.rtt!=null?'  ·  تأخیر شبکه '+fa(C.rtt)+' ms':'');
  if(!C.pinging&&(!C.lastPing||Date.now()-C.lastPing>2000)){const c=C;c.pinging=true;c.lastPing=Date.now();const t=performance.now();
    call('ping').then(()=>{c.rtt=Math.round(performance.now()-t)}).catch(()=>{}).finally(()=>{c.pinging=false})}}
async function startCall(video){
  const c=S.chats[S.current];if(!c||c.kind!=='private'||!c.peer)return;if(C)return toast('الان تو تماس هستی');if(REC.on)return toast('اول ضبط ویس رو تموم کن');
  let stream;try{stream=await getMic()}catch(e){return toast(e.message)}
  try{const r=await call('call_invite',{chat_id:c.id,video:!!video});
    C={id:r.call_id,chatId:c.id,peer:c.peer,state:'ringing',stream,pc:null,muted:false,ice:[],chain:Promise.resolve(),t0:null,wantVideo:!!video};showCallUI();ring('out')}
  catch(e){stream.getTracks().forEach(t=>t.stop());toast(e.message)}}
function onIncoming(e){
  if(C||REC.on){call('call_end',{call_id:e.call_id}).catch(()=>{});return}
  C={id:e.call_id,chatId:e.chat_id,peer:e.from,state:'incoming',stream:null,pc:null,muted:false,ice:[],chain:Promise.resolve(),t0:null,wantVideo:!!e.video};showCallUI();ring('in')}
async function acceptCall(){
  if(!C||C.state!=='incoming')return;const id=C.id;let stream;
  try{stream=await getMic()}catch(err){toast(err.message);return hangup()}
  if(!C||C.id!==id){stream.getTracks().forEach(t=>t.stop());return}
  C.stream=stream;C.state='active';C.t0=Date.now();ring(null);startRelay();showCallUI();C.tick=setInterval(tickCall,1000);if(C.wantVideo)toggleCam();
  try{await call('call_accept',{call_id:id})}catch(err){toast(err.message);endLocal()}}
function makePc(){
  const pc=new RTCPeerConnection({iceServers:S.ice||[{urls:'stun:stun.l.google.com:19302'}]}),id=C.id;C.pc=pc;
  C.stream.getTracks().forEach(t=>pc.addTrack(t,C.stream));
  C.cto=setTimeout(()=>{if(C&&C.id===id&&C.state!=='active'){toast('اتصال مستقیم صدا برقرار نشد (احتمالاً NAT/فایروال؛ برای تماس بین شبکه‌های مختلف سرور TURN لازمه — README)');hangup()}},20000);
  pc.onicecandidate=ev=>{if(ev.candidate&&C&&C.id===id)call('call_signal',{call_id:id,data:{type:'ice',candidate:ev.candidate}}).catch(()=>{})};
  pc.ontrack=ev=>{const a=$('#remote');a.srcObject=ev.streams[0];a.play().catch(()=>{})};
  pc.onconnectionstatechange=()=>{if(!C||C.id!==id)return;const st=pc.connectionState;
    if(st==='connected'){clearTimeout(C.cto);if(C.state!=='active'){C.state='active';C.t0=Date.now();clearInterval(C.tick);C.tick=setInterval(tickCall,1000);ring(null);showCallUI()}}
    else if(st==='disconnected'){const e=$('#cstat');if(e)e.textContent='اتصال ضعیفه…'}
    else if(st==='failed'){toast('اتصال صدا برقرار نشد');hangup()}}}
async function onAccepted(e){
  if(!C||C.id!==e.call_id||C.state!=='ringing')return;
  C.state='active';C.t0=Date.now();ring(null);startRelay();showCallUI();clearInterval(C.tick);C.tick=setInterval(tickCall,1000);if(C.wantVideo)toggleCam()}
function onSignal(){}
/* Audio is relayed through the Windroida server (16-bit PCM over the existing WebSocket): no STUN/TURN or
   internet needed, only the connection to this server. Small jitter buffer, drops audio if it falls behind. */
/* Audio is relayed through the Windroida server over the existing WebSocket as 16-bit PCM (16 kHz mono, 64 ms frames).
   Quality first: nothing is dropped on the sender, the microphone is captured on the audio thread (AudioWorklet),
   and the receiver keeps a big adaptive jitter buffer (starts ~0.4 s, grows after every stall) so playback stays smooth. */
/* voice calls: 48 kHz Opus (~56 kbps, WebCodecs) when both browsers can, else 16 kHz PCM. Both sides start with PCM + an "hq" hint and switch as soon as the other side shows it can decode Opus. */
function callBlock(c,f){
  if(C!==c||c.muted||!ws||ws.readyState!==1||ws.bufferedAmount>400000)return;
  if(!(c.hq&&c.peerHq&&c.ctx.sampleRate===48000))return sendFrame(c,f);
  c.acc=c.acc||new Float32Array(8192);c.n=c.n||0;if(c.n+f.length>c.acc.length)c.n=0;c.acc.set(f,c.n);c.n+=f.length;
  while(c.n>=960){const fr=c.acc.slice(0,960);c.acc.copyWithin(0,960,c.n);c.n-=960;
    try{if(!c.enc)callEncInit(c);c.enc.encode(new AudioData({format:'f32-planar',sampleRate:48000,numberOfFrames:960,numberOfChannels:1,timestamp:c.ets=(c.ets||0)+20000,data:fr}))}catch{c.hq=false;return}}}
function callEncInit(c){
  const cfg={codec:'opus',sampleRate:48000,numberOfChannels:1,bitrate:56000};
  const mk=o=>{const e=new AudioEncoder({output:ch=>{if(C!==c||!ws||ws.readyState!==1)return;const u=new Uint8Array(ch.byteLength);ch.copyTo(u);let s='';for(let i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);
    ws.send(JSON.stringify({op:'call_audio',call_id:c.id,sr:48000,c:'opus',hq:1,d:btoa(s)}))},error:()=>{c.hq=false;c.enc=null}});e.configure(o);return e};
  try{c.enc=mk({...cfg,opus:{application:'voip',signal:'voice',frameDuration:20000,complexity:6,useinbandfec:true}})}catch{c.enc=mk(cfg)}}
function sendFrame(c,f){
  if(C!==c||c.muted||!ws||ws.readyState!==1||ws.bufferedAmount>400000)return;
  if(c.ctx.sampleRate>16000){const k=Math.round(c.ctx.sampleRate/16000),n=Math.floor(f.length/k),g=new Float32Array(n);for(let i=0;i<n;i++){let s=0;for(let j=0;j<k;j++)s+=f[i*k+j];g[i]=s/k}f=g;c.psr=Math.round(c.ctx.sampleRate/k)}else c.psr=c.ctx.sampleRate;
  const pcm=new Int16Array(f.length);for(let i=0;i<f.length;i++){const v=Math.max(-1,Math.min(1,f[i]));pcm[i]=v<0?v*32768:v*32767}
  const u=new Uint8Array(pcm.buffer);let s='';for(let i=0;i<u.length;i+=0x4000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x4000));
  ws.send(JSON.stringify({op:'call_audio',call_id:c.id,sr:c.psr,c:'pcm',hq:c.hq?1:0,d:btoa(s)}))}
async function startRelay(){
  const c=C,AC=window.AudioContext||window.webkitAudioContext;
  c.hq=await rHqCheck();if(C!==c)return;
  try{c.ctx=c.hq?new AC({sampleRate:48000,latencyHint:'interactive'}):new AC({sampleRate:16000,latencyHint:'playback'})}catch{c.hq=false;c.ctx=new AC()}
  c.ctx.resume&&c.ctx.resume();c.next=0;
  c.out=c.ctx.createGain();c.out.gain.value=c.loud?2.2:1;const comp=c.ctx.createDynamicsCompressor();c.out.connect(comp);
  try{c.dest=c.ctx.createMediaStreamDestination();comp.connect(c.dest);const a=$('#remote');a.srcObject=c.dest.stream;a.play().catch(()=>{})}   // a media element keeps playing in the background and can pick the output device
  catch{comp.connect(c.ctx.destination)}
  keepCallAlive(c);
  const src=c.ctx.createMediaStreamSource(c.stream);c.src=src;
  try{
    await c.ctx.audioWorklet.addModule('/static/mic-worklet.js');if(C!==c)return;
    const node=new AudioWorkletNode(c.ctx,'mic',{numberOfInputs:1,numberOfOutputs:0});node.port.onmessage=ev=>callBlock(c,ev.data);src.connect(node);c.proc=node;
  }catch{                                           // old browser: main-thread fallback
    if(C!==c)return;const proc=c.ctx.createScriptProcessor(1024,1,1),mute=c.ctx.createGain();mute.gain.value=0;
    proc.onaudioprocess=ev=>callBlock(c,new Float32Array(ev.inputBuffer.getChannelData(0)));src.connect(proc);proc.connect(mute);mute.connect(c.ctx.destination);c.proc=proc}}
function onCallAudio(e){
  if(!C||C.id!==e.call_id||!C.ctx)return;
  if(e.hq)C.peerHq=true;
  try{const bin=atob(e.d),n=bin.length,u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=bin.charCodeAt(i);
    if(e.c==='opus'){
      if(!window.AudioDecoder)return;
      if(!C.dec){const c=C;c.dec=new AudioDecoder({output:ad=>{try{const f=new Float32Array(ad.numberOfFrames);ad.copyTo(f,{planeIndex:0,format:'f32-planar'});ad.close();if(C===c)callPlay(f,48000)}catch{try{ad.close()}catch{}}},error:()=>{c.dec=null}});
        c.dec.configure({codec:'opus',sampleRate:48000,numberOfChannels:1});c.dts=0}
      C.dec.decode(new EncodedAudioChunk({type:'key',timestamp:C.dts+=20000,data:u}));return}
    const k=n>>1,dv=new DataView(u.buffer),f=new Float32Array(k);for(let i=0;i<k;i++)f[i]=dv.getInt16(i*2,true)/32768;callPlay(f,e.sr||16000)}catch{}}
function callPlay(f,sr){
  const ctx=C&&C.ctx;if(!ctx)return;let pk=0;for(let i=0;i<f.length;i++){const v=Math.abs(f[i]);if(v>pk)pk=v}
  const ab=ctx.createBuffer(1,f.length,sr);ab.copyToChannel(f,0);
  C.rx=(C.rx||0)+1;C.peak=Math.max(C.peak||0,pk);
  const node=ctx.createBufferSource();node.buffer=ab;node.connect(C.out||ctx.destination);const now=ctx.currentTime,minT=C.hq&&C.peerHq?.12:.3;
  C.target=C.target||(C.hq&&C.peerHq?.15:.4);
  if(C.next<now+.01){                              // buffer ran dry: rebuild it, and make it bigger next time
    if(C.next>0&&now-(C.lastUnder||0)>1){C.target=Math.min(1.5,C.target+(minT<.2?.06:.2));C.lastUnder=now}
    C.next=now+C.target;C.stable=now}
  else if(now-(C.stable||now)>(minT<.2?8:20)&&C.target>minT){C.target=Math.max(minT,C.target-.03);C.stable=now}
  else if(C.next>now+C.target+3)return;           // 3 s behind after a long stall: skip to stay (nearly) live
  node.start(C.next);C.next+=ab.duration}
function toggleLoud(){if(!C)return;C.loud=!C.loud;if(C.out)C.out.gain.value=C.loud?2.2:1;showCallUI()}
async function speakerMenu(e){
  e.stopPropagation();if(!C)return;const r=e.currentTarget.getBoundingClientRect();
  const items=[[C.loud?'صدای عادی':'صدای بلندتر (حالت بلندگو)','speaker',toggleLoud]],rm=$('#remote');
  if(rm.setSinkId&&navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices){
    try{(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audiooutput').forEach(d=>items.push([(C.sink===d.deviceId?'✓ ':'')+(d.label||'خروجی صدا'),'speaker',async()=>{try{await rm.setSinkId(d.deviceId);C.sink=d.deviceId}catch{toast('این خروجی انتخاب نشد')}}]))}catch{}}
  else items.push(['(این مرورگر انتخاب خروجی نداره؛ از دکمه‌های صدای گوشی استفاده کن)','info',()=>{}]);
  popMenu(Math.max(8,r.left-60),r.top-40-items.length*40,items)}
/* keep the call alive when the app goes to the background: screen wake lock + media session; resume audio when you come back */
async function keepCallAlive(c){
  c.wd=setInterval(()=>{if(C===c)resumeCall()},4000);
  try{if(navigator.wakeLock){c.wl=await navigator.wakeLock.request('screen');c.wl.addEventListener('release',()=>{c.wl=null})}}catch{}
  try{if('mediaSession' in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:'تماس با '+c.peer.display_name,artist:'Windroida'});
    try{navigator.mediaSession.setActionHandler('hangup',()=>hangup())}catch{}}}catch{}}
function resumeCall(){if(!C)return;try{C.ctx&&C.ctx.state!=='running'&&C.ctx.resume()}catch{}try{$('#remote').paused&&$('#remote').play().catch(()=>{})}catch{}
  if(!C.wl&&navigator.wakeLock&&document.visibilityState==='visible'){const c=C;navigator.wakeLock.request('screen').then(w=>{c.wl=w;w.addEventListener('release',()=>{c.wl=null})}).catch(()=>{})}}
function toggleMute(){if(!C||!C.stream)return;C.muted=!C.muted;C.stream.getAudioTracks().forEach(t=>{t.enabled=!C.muted});showCallUI()}
function hangup(){if(!C)return;const id=C.id;call('call_end',{call_id:id}).catch(()=>{});endLocal()}
function endLocal(msg){
  if(!C)return;try{C.wl&&C.wl.release()}catch{}try{if('mediaSession' in navigator)navigator.mediaSession.metadata=null}catch{}ring(null);clearTimeout(C.cto);clearInterval(C.tick);clearInterval(C.wd);try{C.pc&&C.pc.close()}catch{}clearInterval(C.camT);if(C.vstream)C.vstream.getTracks().forEach(t=>t.stop());try{C.proc&&C.proc.disconnect();C.src&&C.src.disconnect();C.ctx&&C.ctx.close()}catch{}
  try{C.enc&&C.enc.close()}catch{}try{C.dec&&C.dec.close()}catch{}
  if(C.stream)C.stream.getTracks().forEach(t=>t.stop());
  $('#remote').srcObject=null;C=null;$('#callui').hidden=true;$('#callui').replaceChildren();if(msg)toast(msg,false)}
window.addEventListener('beforeunload',()=>{if(C)hangup()});
function logout(silent){
  if(C)hangup();cancelRec(true);stopVoice();if(!silent){try{pushOff();call('logout').catch(()=>{})}catch{}}
  setToken(null);clearInterval(S.keyTimer);clearInterval(pingTimer);const s=ws;ws=null;setTimeout(()=>{try{s&&s.close()}catch{}},150);
  openDrawer(false);closeDialog();if(!silent)showAuth();setNet(true)}

/* ---------- wiring ---------- */
setIcon($('#menu'),'menu');setIcon($('#sico'),'search');setIcon($('#fab'),'pencil');setIcon($('#back'),'back');setIcon($('#callbtn'),'phone');setIcon($('#vcallbtn'),'video');setIcon($('#hsearch'),'search');setIcon($('#hmore'),'more');
setIcon($('#emo'),'emoji');setIcon($('#attach'),'attach');setIcon($('#sendbtn'),'mic');setIcon($('#bar-c'),'close');setIcon($('#down'),'down');
setIcon($('#schup'),'up');setIcon($('#schdn'),'down');setIcon($('#schx'),'close');
$('#tab-login').onclick=()=>buildAuth('login');$('#tab-register').onclick=()=>buildAuth('register');
$('#abtn').onclick=submitAuth;$('#form').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitAuth()}});
$('#bnav').querySelectorAll('button').forEach(b=>b.onclick=()=>navGo(b.dataset.t));
if(window.WD)document.documentElement.classList.add('inapp');syncBar();
$('#menu').onclick=e=>{e.stopPropagation();openDrawer(true)};$('#scrim').onclick=()=>openDrawer(false);
$('#fab').onclick=e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();popMenu(r.left,r.top-100,[['چت جدید','pencil',dlgNewChat],['گروه جدید','group',dlgNewGroup]])};
$('#hdr').onclick=e=>{if(!e.target.closest('#back,#callbtn,#vcallbtn,#hsearch,#hmore'))dlgInfo()};
$('#callbtn').onclick=e=>{e.stopPropagation();startCall(false)};$('#vcallbtn').onclick=e=>{e.stopPropagation();startCall(true)};$('#back').onclick=e=>{e.stopPropagation();$('#app').classList.remove('show-chat');S.current=null;renderList()};
$('#hsearch').onclick=e=>{e.stopPropagation();openSearch()};
$('#hmore').onclick=e=>{e.stopPropagation();const c=S.chats[S.current];if(!c)return;const r=e.currentTarget.getBoundingClientRect();
  popMenu(r.left,r.bottom+4,[...(matchMedia('(max-width:760px)').matches?[['تماس تصویری','video',()=>startCall(true)],...(c.channel?[]:[['اتاق تماشا / گوش دادن همزمان','film',()=>openRoom(c.id)]])]:[]),['اطلاعات','info',dlgInfo],['جستجو در پیام‌ها','search',openSearch],[c.muted?'فعال کردن اعلان':'بی‌صدا کردن','bellx',()=>setChat(c.id,{muted:!c.muted})],
    [c.fav?'برداشتن سنجاق چت':'سنجاق چت','pin',()=>setChat(c.id,{fav:!c.fav})],c.kind==='group'&&!c.channel?['ترک گروه','logout',()=>leaveGroup(c),true]:null,c.kind==='group'&&!c.channel&&c.owner_id===S.me.id?['حذف گروه','delete',()=>deleteGroup(c),true]:null])};
$('#pinbar').onclick=()=>{const c=S.chats[S.current];if(c&&c.pin_msg)jumpTo(c.pin_msg.id)};
$('#schq').addEventListener('input',()=>{clearTimeout(SR.job);SR.job=setTimeout(runSearch,300)});
$('#schq').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(SR.res.length){SR.i=(SR.i+1)%SR.res.length;gotoResult()}}if(e.key==='Escape')closeSearch()});
$('#schup').onclick=()=>{if(SR.res.length){SR.i=(SR.i+1)%SR.res.length;gotoResult()}};$('#schdn').onclick=()=>{if(SR.res.length){SR.i=(SR.i-1+SR.res.length)%SR.res.length;gotoResult()}};$('#schx').onclick=closeSearch;
$('#bar-c').onclick=()=>{if(S.editing)$('#input').value='';clearBar();autosize()};
// hold the mic button = record, let go = send, drag away sideways = cancel (a quick tap still works the old way: tap to start, tap to send)
(()=>{const sb=$('#sendbtn');let hold=false,t0=0,sx=0,pr=null,away=false,swallow=false;
  sb.style.touchAction='none';sb.style.userSelect='none';sb.style.webkitUserSelect='none';
  sb.addEventListener('contextmenu',e=>e.preventDefault());
  sb.addEventListener('pointerdown',e=>{if(e.button>0||REC.on||!S.current||S.editing||$('#input').value.trim())return;
    hold=true;away=false;t0=Date.now();sx=e.clientX;swallow=true;try{sb.setPointerCapture(e.pointerId)}catch{}pr=startRec()});
  sb.addEventListener('pointermove',e=>{if(!hold)return;const a=Math.abs(e.clientX-sx)>90;if(a!==away){away=a;$('#rec').classList.toggle('will-cancel',a)}});
  const up=async e=>{if(!hold)return;hold=false;if(e.type==='pointercancel'){away=false;$('#rec').classList.remove('will-cancel');setTimeout(()=>{swallow=false},350);return}const held=Date.now()-t0,cancel=away;away=false;$('#rec').classList.remove('will-cancel');
    setTimeout(()=>{swallow=false},350);try{await pr}catch{}if(!REC.on)return;
    if(cancel)cancelRec();else if(held>=450)finishRec()};
  sb.addEventListener('pointerup',up);sb.addEventListener('pointercancel',up);
  sb.onclick=()=>{if(swallow){swallow=false;return}sendCurrent()}})();$('#reccancel').onclick=()=>cancelRec();
$('#attach').onclick=()=>$('#file').click();$('#file').onchange=e=>{sendFiles(e.target.files);e.target.value=''};
$('#down').onclick=scrollBottom;$('#msgs').addEventListener('scroll',()=>{if(nearBottom()&&!S.hasNewer[S.current]){S.newBelow=0;if(S.current)markRead(S.current)}updateDown()},{passive:true});
$('#input').addEventListener('input',()=>{autosize();updateSendBtn();if(S.current){S.drafts[S.current]=$('#input').value;saveDrafts()}const n=Date.now();if(S.current&&n-S.lastTyping>2500&&$('#input').value.trim()){S.lastTyping=n;call('typing',{chat_id:S.current}).catch(()=>{})}});
$('#input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendCurrent()}
  if(e.key==='ArrowUp'&&!$('#input').value&&S.current){const l=S.msgs[S.current]||[];for(let i=l.length-1;i>=0;i--)if(l[i].sender_id===S.me.id&&l[i].body&&!l[i].deleted){startEdit(l[i]);e.preventDefault();break}}});
$('#input').addEventListener('paste',e=>{const fs=[...(e.clipboardData&&e.clipboardData.files||[])];if(fs.length){e.preventDefault();sendFiles(fs)}});
$('#search').addEventListener('input',()=>{clearTimeout(S.searchJob);const q=$('#search').value.trim().replace(/^@/,'');renderList();
  if(!USER_RE.test(q))S.searchRes=[],S.searchGroups=[];if(q.length<2)S.msgRes=[];
  if(q.length<2)return;
  S.searchJob=setTimeout(async()=>{const cur=()=>q===$('#search').value.trim().replace(/^@/,'');
    if(USER_RE.test(q))try{const r=await call('search_users',{q});if(cur()){S.searchRes=r.users;S.searchGroups=r.groups||[];renderList()}}catch{}
    try{const r=await call('search_all',{q});if(cur()){S.msgRes=r.results;renderList()}}catch{}},300)});
const emo=$('#emoji');EMOJIS.forEach(x=>emo.append(h('button',{type:'button',onclick:()=>{const t=$('#input');t.setRangeText(x,t.selectionStart,t.selectionEnd,'end');t.focus();autosize();updateSendBtn()}},x)));
$('#emo').onclick=e=>{e.stopPropagation();emo.hidden=!emo.hidden};
/* drag & drop files */
let dragN=0;const main=$('#main');
main.addEventListener('dragenter',e=>{if(!S.current||!(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')))return;e.preventDefault();dragN++;$('#dropz').hidden=false});
main.addEventListener('dragover',e=>{if(S.current)e.preventDefault()});
main.addEventListener('dragleave',()=>{if(--dragN<=0){dragN=0;$('#dropz').hidden=true}});
main.addEventListener('drop',e=>{e.preventDefault();dragN=0;$('#dropz').hidden=true;if(S.current&&e.dataTransfer.files.length)sendFiles(e.dataTransfer.files)});
document.addEventListener('click',e=>{$('#ctx').hidden=true;if(!e.target.closest('#emoji,#emo'))emo.hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#ctx').hidden=true;emo.hidden=true;openDrawer(false);if(!$('#modal').hidden)closeDialog();else if(!$('#lightbox').hidden){$('#lightbox').hidden=true}else if(!$('#schbar').hidden)closeSearch();else if(S.reply||S.editing){clearBar()}}});
window.addEventListener('online',()=>{if(getToken()&&(!ws||ws.readyState!==1))reconnect()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resumeCall();if(document.visibilityState==='visible'&&getToken()){if(!ws||ws.readyState!==1)reconnect();else if(S.me){const sk=ws;Promise.race([call('ping'),new Promise((_,r)=>setTimeout(()=>r(0),6000))]).catch(()=>sockDead(sk))}}if(S.current)markRead(S.current)});
window.addEventListener('focus',()=>{if(S.current)markRead(S.current)});
try{setTheme(lsGet('wd-theme',matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));applyAccent(PREF.accent);applySize(PREF.size)}catch{}
grabJoinFromUrl();
applyWall();$('#wallfile').addEventListener('change',e=>{pickWallImage(e.target.files[0]);e.target.value=''});
boot();

/* finger-following swipes (like Telegram): drag a chat to the right = back to the list (the list shows underneath);
   drag the chat list left/right = next/previous filter tab */
(()=>{
  const phone=()=>matchMedia('(max-width:760px)').matches,app=$('#app'),main=$('#main'),side=$('#side'),list=$('#list');
  if(!app||!main||!side||!list)return;
  const blocked=t=>t.closest('input,textarea,select,#emoji,#lightbox,#callui,.wv,.prng,video,audio,#schbar')||document.getElementById('psheet')||!$('#modal').hidden||!$('#ctx').hidden;
  const raf2=f=>requestAnimationFrame(()=>requestAnimationFrame(f));
  // ---- chat -> list
  let a=null;
  main.addEventListener('touchstart',e=>{a=null;if(!phone()||!app.classList.contains('show-chat')||e.touches.length!==1||blocked(e.target))return;
    const p=e.touches[0];a={x:p.clientX,y:p.clientY,t:Date.now(),on:false,dx:0}},{passive:true});
  main.addEventListener('touchmove',e=>{if(!a)return;const p=e.touches[0],dx=p.clientX-a.x,dy=p.clientY-a.y;
    if(!a.on){if(Math.abs(dy)>14&&Math.abs(dy)>=Math.abs(dx)){a=null;return}
      if(dx>14&&dx>Math.abs(dy)*1.5){a.on=true;a.x=p.clientX;main.style.transition='none';main.style.boxShadow='-8px 0 24px rgba(0,0,0,.4)';
        side.style.transition='none';side.style.transform='none';side.style.zIndex=1;side.style.opacity='.85'}else return}
    a.dx=Math.max(0,p.clientX-a.x);main.style.transform='translateX('+a.dx+'px)';side.style.opacity=String(.85+.15*Math.min(1,a.dx/main.offsetWidth))},{passive:true});
  const endA=()=>{const s=a;a=null;if(!s||!s.on)return;
    const W=main.offsetWidth||360,go=s.dx>W*.33||(s.dx>50&&Date.now()-s.t<280);
    main.style.transition='transform .2s ease-out';main.style.transform=go?'translateX('+W+'px)':'translateX(0)';
    setTimeout(()=>{
      if(go)$('#back').click();
      main.style.transition='';main.style.transform='';main.style.boxShadow='';
      side.style.transition='none';side.style.transform='';side.style.zIndex='';side.style.opacity='';
      void side.offsetWidth;raf2(()=>{side.style.transition=''})},go?210:210)};
  main.addEventListener('touchend',endA,{passive:true});main.addEventListener('touchcancel',endA,{passive:true});
  // ---- list: tabs
  let b=null;
  list.addEventListener('touchstart',e=>{b=null;if(!phone()||e.touches.length!==1||blocked(e.target))return;const p=e.touches[0];b={x:p.clientX,y:p.clientY,t:Date.now(),on:false,dx:0}},{passive:true});
  list.addEventListener('touchmove',e=>{if(!b)return;const p=e.touches[0],dx=p.clientX-b.x,dy=p.clientY-b.y;
    if(!b.on){if(Math.abs(dy)>14&&Math.abs(dy)>=Math.abs(dx)){b=null;return}
      if(Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.5){b.on=true;b.x=p.clientX;list.style.transition='none'}else return}
    const i=FILTERS.findIndex(f=>f[0]===S.filter),n=i+(p.clientX-b.x<0?1:-1),ok=n>=0&&n<FILTERS.length;
    b.dx=p.clientX-b.x;list.style.transform='translateX('+(ok?b.dx:b.dx*.2)+'px)'},{passive:true});
  const endB=()=>{const s=b;b=null;if(!s||!s.on)return;
    const W=list.offsetWidth||360,i=FILTERS.findIndex(f=>f[0]===S.filter),dir=s.dx<0?1:-1,n=i+dir,
      go=n>=0&&n<FILTERS.length&&(Math.abs(s.dx)>W*.25||(Math.abs(s.dx)>50&&Date.now()-s.t<280));
    list.style.transition='transform .14s ease-out';
    if(!go){list.style.transform='translateX(0)';setTimeout(()=>{list.style.transition='';list.style.transform=''},150);return}
    list.style.transform='translateX('+(dir>0?-W:W)+'px)';
    setTimeout(()=>{S.filter=FILTERS[n][0];renderFilters();renderList();list.scrollTop=0;
      const f=$('#filters .on');if(f&&f.scrollIntoView)f.scrollIntoView({inline:'center',block:'nearest'});
      list.style.transition='none';list.style.transform='translateX('+(dir>0?W:-W)+'px)';void list.offsetWidth;
      list.style.transition='transform .16s ease-out';list.style.transform='translateX(0)';
      setTimeout(()=>{list.style.transition='';list.style.transform=''},180)},150)};
  list.addEventListener('touchend',endB,{passive:true});list.addEventListener('touchcancel',endB,{passive:true});
})();

/* ---------- full music player sheet (tap the mini player): playlist of the chat's songs + seek bar + repeat/prev/play/next ---------- */
IC.repeat="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z";
IC.repeat1="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z";
function songTitle(m){return m.file.name.replace(/\.[^.]+$/,'')}
function closeSheet(){const e=document.getElementById('psheet');if(e)e.remove();const sc=document.getElementById('psheet-scrim');if(sc)sc.remove()}
function openPlayer(){
  if(!VP.m||VP.m.file.voice)return;closeSheet();
  const sc=h('div',{id:'psheet-scrim',onclick:closeSheet}),sh=h('div',{id:'psheet'});document.body.append(sc,sh);
  const grip=h('div',{class:'pgrip'}),list=h('div',{class:'plist'}),
    tt=h('div',{class:'ptt'}),ts=h('div',{class:'pts'}),
    rng=h('input',{type:'range',class:'prng',min:0,max:1000,value:0,oninput:e=>{const a=VP.audio;if(a&&isFinite(a.duration))a.currentTime=e.target.value/1000*a.duration}}),
    t0=h('span',{},fmtDur(0)),t1=h('span',{},fmtDur(0)),
    rep=h('button',{class:'iconbtn',type:'button',title:'تکرار',onclick:()=>{VP.repeat=VP.repeat==='all'?'one':VP.repeat==='one'?'':'all';paintSheet()}}),
    prev=h('button',{class:'iconbtn',type:'button',onclick:()=>VP.m&&playNext(VP.m,-1)}),
    pp=h('button',{class:'iconbtn pbig',type:'button',onclick:()=>{if(VP.audio)VP.audio.paused?VP.audio.play().catch(()=>{}):VP.audio.pause()}}),
    next=h('button',{class:'iconbtn',type:'button',onclick:()=>VP.m&&playNext(VP.m,1)}),
    more=h('button',{class:'iconbtn',type:'button',onclick:e=>{e.stopPropagation();menu.hidden=!menu.hidden}}),
    menu=h('div',{class:'pmenu',hidden:true},
      h('button',{type:'button',onclick:()=>{const m=VP.m;closeSheet();if(m&&S.chats[m.chat_id])openChat(m.chat_id,m.id)}},'رفتن به پیام'),
      h('button',{type:'button',onclick:()=>{menu.hidden=true;if(VP.m)download(VP.m)}},'دانلود'),
      h('button',{type:'button',onclick:()=>{VP.rate=VP.rate===1?1.5:VP.rate===1.5?2:1;if(VP.audio)VP.audio.playbackRate=VP.rate;menu.hidden=true;paintSheet()}},'سرعت پخش'));
  setIcon(prev,'skipprev',26);setIcon(next,'skipnext',26);setIcon(more,'more',22);
  sh.append(grip,list,h('div',{class:'pnow'},tt,ts,rng,h('div',{class:'ptimes'},t0,t1),h('div',{class:'pctl'},rep,prev,pp,next,more),menu));
  sh._p={list,tt,ts,rng,t0,t1,rep,pp,prev,next};
  let y0=null;grip.addEventListener('touchstart',e=>{y0=e.touches[0].clientY},{passive:true});
  sh.addEventListener('touchend',e=>{if(y0!=null&&e.changedTouches[0].clientY-y0>70&&e.target.closest('.pgrip,.pnow'))closeSheet();y0=null},{passive:true});
  paintSheet(true)}
function paintSheet(rebuild){
  const sh=document.getElementById('psheet');if(!sh)return;
  if(!VP.m||!VP.audio||VP.m.file.voice){closeSheet();return}
  const q=sh._p,m=VP.m,a=VP.audio;
  const songs=songsOf(m.chat_id),sig=songs.map(x=>x.id).join(',');
  if(rebuild||q.list._sig!==sig){q.list._sig=sig;
    q.list.replaceChildren(...songs.map(x=>{const on=x.id===m.id,b=h('button',{class:'prow'+(on?' on':''),type:'button',onclick:()=>{VP.mid===x.id&&VP.audio?(VP.audio.paused?VP.audio.play().catch(()=>{}):VP.audio.pause()):startPlay(x,null)}},
      h('span',{class:'pcov'},ic(on&&!a.paused?'pause':'play',22)),h('div',{class:'pmeta'},h('b',{},songTitle(x)),h('small',{},x.sender_id===S.me.id?'تو':(x.sender_name||''))));return b}));
    const cur=q.list.querySelector('.on');if(cur&&cur.scrollIntoView)cur.scrollIntoView({block:'nearest'})}
  else [...q.list.children].forEach((b,i)=>{const on=songs[i].id===m.id;b.classList.toggle('on',on);setIcon(b.firstChild,on&&!a.paused?'pause':'play',22)});
  q.tt.textContent=songTitle(m);q.ts.textContent=(m.sender_id===S.me.id?'تو':(m.sender_name||''))+(VP.rate!==1?' · ×'+fa(VP.rate):'');
  setIcon(q.pp,a.paused?'play':'pause',34);setIcon(q.rep,VP.repeat==='one'?'repeat1':'repeat',24);q.rep.classList.toggle('on',!!VP.repeat);
  q.prev.disabled=!neighbour(m,-1);q.next.disabled=!neighbour(m,1);paintSheetBar()}
function paintSheetBar(){
  const sh=document.getElementById('psheet'),a=VP.audio;if(!sh||!sh._p||!a)return;const q=sh._p;
  if(!q.rng._drag&&document.activeElement!==q.rng)q.rng.value=isFinite(a.duration)&&a.duration?Math.round(a.currentTime/a.duration*1000):0;
  q.t0.textContent=fmtDur(a.currentTime);q.t1.textContent=isFinite(a.duration)?fmtDur(a.duration):'—'}

;(()=>{const w=document.getElementById('wall');if(w&&window.ResizeObserver){let t=null;new ResizeObserver(()=>{clearTimeout(t);t=setTimeout(()=>{const v=lsGet('wd-wall','')||'';if(v.startsWith('mine:')&&Object.keys(wallSet(v.slice(5))).length)applyWall()},80)}).observe(w)}})();

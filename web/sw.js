/* Windroida service worker: shows notifications (works on Android Chrome where `new Notification` does not)
   and brings the app to the front when one is tapped. No caching, so updates are always instant. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',e=>{
  e.notification.close();const cid=e.notification.data&&e.notification.data.cid;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus' in c){c.postMessage({cid});return c.focus()}}
    return self.clients.openWindow('/')}))});

/* Web Push: the server sends a content-free wake-up when a message arrives and the app is closed/hidden */
self.addEventListener('push',e=>{
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    if(list.some(c=>c.visibilityState==='visible'))return;                 // you are looking at the app: it shows its own sound/notification
    return self.registration.showNotification('Windroida',{body:'پیام جدید داری',tag:'wd-push',renotify:true,icon:'/static/icon-192.png',badge:'/static/icon.svg',dir:'rtl',lang:'fa',data:{}})}))});
self.addEventListener('pushsubscriptionchange',e=>{e.waitUntil(self.clients.matchAll({includeUncontrolled:true}).then(l=>l.forEach(c=>c.postMessage({resub:true}))))});

/* Chrome wants a fetch handler before it offers "Install app"; we simply let the network answer. */
self.addEventListener('fetch',()=>{});

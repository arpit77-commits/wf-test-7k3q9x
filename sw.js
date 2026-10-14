/* Wishfall cache: versioned files never change, so after the first visit they load from the phone, not the network */
var B='1791961805', C='wf-static', PRE=["Alerts.dc.html?v=1791961805", "Event.dc.html?v=1791961805", "Events.dc.html?v=1791961805", "Main.dc.html?v=1791961805", "Moon.dc.html?v=1791961805", "Sight.dc.html?v=1791961805", "Sky.dc.html?v=1791961805", "You.dc.html?v=1791961805", "a/astronomy.browser.min.js?v=1791961805", "a/satellite.min.js?v=1791961805", "a/three.min.js?v=1791961805", "a/wishfall-astro3.js?v=1791961805", "a/wishfall-deep3.js?v=1791961805", "a/wishfall-events9.js?v=1791961805", "a/wishfall-moon4.js?v=1791961805", "a/wishfall-planet.js?v=1791961805", "a/wishfall-sky19.js?v=1791961805", "a/wishfall-sky8.js?v=1791961805", "a/wishfall-ui6.js?v=1791961805", "bridge.js?v=1791961805", "outfit.css?v=1791961805", "support.js?v=1791961805"];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(C).then(function(c){return Promise.all(PRE.map(function(u){return c.match(u).then(function(h){return h||fetch(u).then(function(r){if(r&&r.ok)return c.put(u,r)}).catch(function(){})})}))}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.open(C).then(function(c){return c.keys().then(function(ks){return Promise.all(ks.map(function(k){var v=new URL(k.url).searchParams.get('v');if(v&&v!==B)return c.delete(k)}))})}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET')return; var u=new URL(r.url); if(u.origin!==location.origin)return;
  var p=u.pathname; if(/\/(shell\.html|sw\.js)$/.test(p)||/\/$/.test(p))return;
  var ver=u.searchParams.has('v'), stat=/\.(jpg|png|webp|js|css|woff2?|json)$/.test(p);
  if(!ver&&!stat)return;
  e.respondWith(caches.open(C).then(function(c){return c.match(r).then(function(h){
    var net=function(){return fetch(r).then(function(x){if(x&&x.ok)c.put(r,x.clone());return x})};
    if(h){ if(!ver&&(Date.now()-new Date(h.headers.get('date')||0))>864e5)net().catch(function(){}); return h; }
    return net();
  })}).catch(function(){return fetch(r)}));
});

/* Wishfall native bridge. Loaded first on every page inside the Android app.
   It does not change the design. It (1) fits the 390x844 design to any phone screen,
   (2) hands the phone's real compass sensors to the Sky page, (3) lets the Android
   back button work like the on-screen back arrow, (4) works out which alerts to
   schedule and passes them to the app, which sets them with Android. */
(function () {
  try { if (!document.querySelector('meta[name=color-scheme]')) { var cs = document.createElement('meta'); cs.name = 'color-scheme'; cs.content = 'dark'; (document.head || document.documentElement).appendChild(cs); } } catch (e) {}
  var framed = window.parent !== window;
  var RN = window.ReactNativeWebView;
  function post(m) {
    try {
      if (framed) window.parent.postMessage({ wf: 1, m: m }, '*');
      else if (RN) RN.postMessage(JSON.stringify(m));
    } catch (e) {}
  }
  var S = +window.__WF_S || 1;
  /* quality level: 3 = full, 2 = lighter, 1 = lightest (set by the shell from the phone's memory) */
  var Q = 3; try { Q = (framed && +window.parent.__WF_Q) || +window.__WF_Q || 3; } catch (e) {}
  window.__WF_Q = Q;
  try { window.__WF_LITE = framed ? +window.parent.__WF_LITE || 0 : +window.__WF_LITE || 0; } catch (e) {}
  var lq = null;
  function qcss(Q) {
    return '.fg,.fgn,[style*="backdrop-filter"]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
      '.switch::before,button[aria-label=Close]::before{content:"";position:absolute;left:-6px;right:-6px;top:-8px;bottom:-8px}button[aria-label=Close]{position:relative}'+'.tabbar{z-index:30}.scrim{z-index:40}.sheet,#wfplan .wfsh{z-index:41}'+'.sheet.fgn{background-color:#0d1120!important}'+'.fg[aria-pressed=true]{background-color:#fff!important;background-image:none!important}.btn-ic.fg,.wfback{background-color:#151927!important}.cta{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
      (Q === 1 ? '.fg{background-color:rgba(14,18,30,.82)!important}.fgn{background-color:rgba(12,15,26,.92)!important}' : '.fg{background-color:rgba(13,17,29,.68)!important}.fgn{background-color:rgba(11,14,25,.84)!important}') +
      (Q < 3 ? '.halo-pulse{animation:none!important}' + (Q === 1 ? '.floaty{animation:none!important}' : '') : '') +
      '.press{will-change:auto!important}' +
      (Q === 1 ? '.fg,.fgn{box-shadow:inset 0 1px 0 rgba(255,255,255,.18)!important}.rise{animation:none!important}.scrim{transition-duration:.2s!important}' : '');
  }
  try { lq = document.createElement('style'); lq.textContent = qcss(Q); document.documentElement.appendChild(lq); } catch (e) {}
  var rafRaw = window.requestAnimationFrame.bind(window), paused = false, held = [];
  window.requestAnimationFrame = function (cb) { if (paused) { held.push(cb); return 0; } return rafRaw(cb); };
  function setPaused(on) { paused = !!on; if (!paused) { var h = held; held = []; h.forEach(function (cb) { rafRaw(cb); }); } }

  /* 1. fit any screen: full width, the height adapts */
  try {
    if (!framed) {
      var vp = document.createElement('meta'); vp.name = 'viewport';
      vp.content = 'width=390,initial-scale=' + S + ',minimum-scale=' + S + ',maximum-scale=' + S + ',user-scalable=no';
      document.head.appendChild(vp);
    }
    var st = document.createElement('style');
    st.textContent = ':root{--wf-h:844px}' +
      'html,body{margin:0;height:100%;background:' + (framed ? 'transparent' : '#04060f') + ';overflow:hidden;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}' +
      'body{display:flex;align-items:flex-start;justify-content:center}x-dc{display:block;flex:none}' +
      '[style*="height:844px"],[style*="height: 844px"]{height:var(--wf-h)!important}' +
      'img[style*="2922px"]{height:max(var(--wf-h),844px)!important}' +
      (framed ? '[data-nav] .wf-body{animation:none!important}.wf-page{background:transparent!important}canvas[id^="spacecv_"]{display:none!important}' : '');
    document.head.appendChild(st);
    var fitH = function () { var h = Math.max(300, window.innerHeight || 844); document.documentElement.style.setProperty('--wf-h', h + 'px'); window.__wfDH = h - 844; };
    fitH(); window.addEventListener('resize', fitH);
  } catch (e) {}


  /* framed pages do not draw their own star background: the shell draws one for all of them */
  if (framed && !window.WishfallSky) {
    var noop = function () {}, stubObj = new Proxy({}, { get: function () { return noop; } });
    window.WishfallSky = { create: function () { return stubObj; } };
  }
  if (framed) {
    document.addEventListener('webglcontextlost', function (e) { try { e.preventDefault(); } catch (er) {} setTimeout(function () { post({ t: 'lost' }); }, 50); }, true);
  }
  document.addEventListener('error', function (e) {
    var t = e.target; if (!t || t.tagName !== 'IMG') return;
    var n = +(t.getAttribute('data-r') || 0); if (n >= 3) return; t.setAttribute('data-r', n + 1);
    var u = (t.getAttribute('data-src0') || t.getAttribute('src') || ''); t.setAttribute('data-src0', u);
    setTimeout(function () { t.src = u.split('?')[0] + '?r=' + (n + 1) + Date.now(); }, 350 * (n + 1));
  }, true);

  /* 2. real compass from the phone's sensors */
  var oriL = [], addL = window.addEventListener, remL = window.removeEventListener;
  function isOri(t) { return t === 'deviceorientationabsolute' || t === 'deviceorientation'; }
  window.addEventListener = function (t, fn) {
    if (isOri(t) && typeof fn === 'function' && oriL.indexOf(fn) < 0) { oriL.push(fn); if (oriL.length === 1) post({ t: 'sensors', on: true }); }
    return addL.apply(this, arguments);
  };
  window.removeEventListener = function (t, fn) {
    if (isOri(t)) { var i = oriL.indexOf(fn); if (i >= 0) { oriL.splice(i, 1); if (!oriL.length) post({ t: 'sensors', on: false }); } }
    return remL.apply(this, arguments);
  };
  window.__ori = function (x, y, z) {
    var ev = { type: 'deviceorientationabsolute', absolute: true, v: [x, y, z], alpha: 0, beta: 0, gamma: 0 };
    for (var i = 0; i < oriL.length; i++) { try { oriL[i](ev); } catch (e) {} }
  };

  /* 3. back: close whatever is open on this page first */
  function closeLocal() {
    try {
      var sc = document.querySelector('.scrim[data-open="1"]'); if (sc) { sc.click(); return true; }
      var c = document.querySelectorAll('button[aria-label="Back"],button[aria-label="Close"]');
      for (var i = 0; i < c.length; i++) {
        var r = c[i].getBoundingClientRect(); if (r.width < 4) continue;
        var el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (el && c[i].contains(el)) { c[i].click(); return true; }
      }
    } catch (e) {}
    return false;
  }
  window.__wfBack = function () {
    if (closeLocal()) return;
    try { var b = document.querySelector('a[aria-label="Back"]'); if (b) { b.click(); return; } } catch (e) {}
    post({ t: 'exit' });
  };
  function go(href) { if (framed) post({ t: 'nav', href: href }); else location.href = href; }
  if (framed) {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
      var h = a.getAttribute('href') || ''; if (!/\.dc\.html/.test(h)) return;
      e.preventDefault();
      var back = a.getAttribute('aria-label') === 'Back';
      setTimeout(function () { post({ t: 'nav', href: h.split('?')[0], back: back }); }, 0);
    }, true);
    window.addEventListener('message', function (e) {
      var d = e.data; if (!d || !d.wf) return;
      if (d.ori) window.__ori(d.ori[0], d.ori[1], d.ori[2]);
      else if (d.cmd === 'pause') setPaused(d.on);
      else if (d.cmd === 'lite') { window.__WF_Q = 1; window.__WF_LITE = 1; Q = 1; try { if (lq) lq.textContent = qcss(1); } catch (er) {} }
      else if (d.cmd === 'pill') { var ns = document.querySelectorAll('nav.tabbar'); if (d.quiet) { if (!document.getElementById('wfq')) { var sq = document.createElement('style'); sq.id = 'wfq'; sq.textContent = 'html.wfq nav.tabbar,html.wfq nav.tabbar *{transition:none!important}'; document.head.appendChild(sq); } document.documentElement.classList.add('wfq'); } for (var q = 0; q < ns.length; q++) { if (String(ns[q].getAttribute('data-at')) !== String(d.at)) ns[q].setAttribute('data-at', d.at); } if (d.quiet) { requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.remove('wfq'); }); }); } }
      else if (d.cmd === 'local') post({ t: 'local', id: d.id, ok: closeLocal() });
    });
    var t0r = Date.now();
    var rdy = setInterval(function () {
      if (!document.querySelector('.wf-page')) return;
      // graphics canvases (Moon, live sky) must have faded in before we call the page ready
      var cv = document.querySelectorAll('#skycv,[id^="mooncv_"]'), okc = true;
      for (var ci = 0; ci < cv.length; ci++) if (!cv[ci].classList.contains('on')) okc = false;
      if (!okc && !/\/(Moon|Event|Sight|Alerts)\.dc\.html/.test(location.pathname) && (Date.now() - t0r) < 3000) return;
      clearInterval(rdy);
      rafRaw(function () { rafRaw(function () { setTimeout(function () { post({ t: 'ready' }); }, 140); }); });
    }, 40);
  }

  /* 4. alerts: work out what to tell the person, and when */
  /* the real time an alert will fire, written for people (used by the Event, Sight and Events pages) */
  var _MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], _WK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function alertFmt(ms) {
    var d = new Date(ms), h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'pm' : 'am', h12 = h % 12 || 12;
    return _WK[d.getDay()] + ' ' + d.getDate() + ' ' + _MON[d.getMonth()] + ', ' + h12 + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + ap;
  }
  window.WFAlertFmt = alertFmt;
  /* each planned sighting has its own reminder: N minutes before, or a time of day the person picked */
  function leads() { try { return JSON.parse(localStorage.getItem('wf_plan_lead') || '{}') || {}; } catch (e) { return {}; } }
  function leadAt(v, ms) {
    if (v.k === 'c') {
      var p = String(v.t || '21:00').split(':'), d = new Date(ms), at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +p[0] || 0, +p[1] || 0, 0).getTime();
      while (at > ms - 60000) at -= 86400000;
      return at;
    }
    return ms - (+v.k || 30) * 60000;
  }
  function eveAt(date, hour) {
    var d = new Date(date), at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0);
    if (at.getTime() >= d.getTime() - 90 * 60000) at = new Date(at.getTime() - 86400000);
    return at.getTime();
  }
  /* alerts nobody planned (the "Tell me about" switches) arrive the evening before at 7 pm; space station passes 20 minutes before */
  function defAt(id, ms) { return String(id).indexOf('iss-') === 0 ? ms - 20 * 60000 : eveAt(ms, 19); }
  function alertAt(id, ms) { var v = leads()[id]; return v ? leadAt(v, ms) : defAt(id, ms); }
  function leadWord(v) { return v.k === '60' ? 'in 1 hour' : 'in ' + v.k + ' minutes'; }
  window.WFLead = {
    get: function (id) { return leads()[id] || null; },
    set: function (id, v) { var l = leads(); if (v) l[id] = v; else delete l[id]; try { localStorage.setItem('wf_plan_lead', JSON.stringify(l)); } catch (e) {} },
    at: leadAt
  };
  window.WFAlertText = function (id, eventMs) { return alertFmt(alertAt(id, eventMs)); };
  function openJs(href, setKey, setVal) {
    return "try{localStorage.setItem('wf_nav',JSON.stringify({dir:'fwd',from:'',t:Date.now()}));localStorage.setItem('wf_back','Main.dc.html');" +
      (setKey ? "localStorage.setItem(" + JSON.stringify(setKey) + "," + JSON.stringify(setVal) + ");" : '') + "}catch(e){}(window.__shellGo||function(h){location.href=h;})(" + JSON.stringify(href) + ");true;";
  }
  function moonOpenJs(ts) {
    return "try{var d=Math.round((new Date(" + ts + ").setHours(0,0,0,0)-new Date().setHours(0,0,0,0))/864e5);localStorage.setItem('wf_nav',JSON.stringify({dir:'fwd',from:'',t:Date.now()}));localStorage.setItem('wf_back','Main.dc.html');localStorage.setItem('wf_moon_go',JSON.stringify({off:d,t:Date.now()}));}catch(e){}(window.__shellGo||function(h){location.href=h;})('Moon.dc.html');true;";
  }
  var syncT = 0, issBusy = false;
  function sync() {
    clearTimeout(syncT);
    syncT = setTimeout(doSync, 1500);
  }
  function doSync() {
    var WF = window.WF, WFE = window.WFE, A = window.Astronomy, W = window.WFUI;
    if (!WF || !WFE || !A || !W) return;
    var P = W.prefs(), plans = W.plans(), meta = {}; try { meta = JSON.parse(localStorage.getItem('wf_plan_meta') || '{}') || {}; } catch (e) {}
    var now = new Date(), nowMs = now.getTime(), out = [], seen = {};
    function add(id, at, title, body, js) {
      if (!at || at < nowMs + 45000 || seen[id]) return; seen[id] = 1;
      out.push({ id: id, at: at, title: title, body: body, js: js });
    }
    WF.getObserver(function (o) {
      try {
        var go = !!P.goOnly;
        WF.upcoming(o, now).forEach(function (e) {
          var planned = plans.indexOf(e.id) >= 0;
          if (!planned && (!P.showers || (go && e.verdict !== 'Go'))) return;
          var bms = e.best.d.getTime(), v0 = leads()[e.id], nd = alertAt(e.id, bms);
          add('sh-' + e.id, nd, v0 ? e.name + (v0.k === 'c' ? ' is coming up' : ' ' + leadWord(v0)) : e.name + ' tonight', 'It is a ' + e.verdict + '. Best around ' + e.bestTime + ', looking ' + e.facing + '. ' + e.moonTxt + '.', openJs('Event.dc.html', 'wf_event', e.id));
        });
        var evs = []; try { evs = WFE.build(o, now) || []; } catch (e) {}
        try { evs = evs.concat(WFE.moonEvents(o, now, 120) || []); } catch (e) {}
        evs.forEach(function (e) {
          var planned = plans.indexOf(e.id) >= 0, ok = false;
          if (e.cat === 'eclipse') ok = P.eclipses !== false; else if (e.cat === 'planet') ok = P.planets !== false; else if (e.cat === 'moon') ok = P.moon !== false;
          var isMoon = e.cat === 'moon';
          if (!planned && (!ok || (go && (e.verdict === 'Maybe' || e.verdict === 'Skip')))) return;
          var v1 = leads()[e.id];
          add(e.id, alertAt(e.id, e.date.getTime()), v1 ? e.name + (v1.k === 'c' ? ' is coming up' : ' ' + leadWord(v1)) : e.name + (!isMoon && e.date.getHours() < 12 ? ' tomorrow morning' : ' tonight'), (e.detail || e.whenTxt || '').toString(), isMoon ? moonOpenJs(e.date.getTime()) : openJs('Sight.dc.html', 'wf_sight', e.id));
        });
        try {
          var q0 = now;
          for (var n = 0; n < 4; n++) {
            var q = A.SearchMoonPhase(0, q0, 45); if (!q) break; q0 = new Date(q.date.getTime() + 86400000 * 5);
            if (P.moon !== false) add('nm-' + q.date.getTime(), eveAt(q.date, 19), 'New Moon', 'The darkest sky of the month for faint things.', moonOpenJs(q.date.getTime()));
          }
        } catch (e) {}
        plans.forEach(function (id) {
          var m = meta[id]; if (!m || !m.t || id.indexOf('sh-') === 0 || seen[id]) return;
          if (/^(lec|sec|pl|opp|elo|sea|fm)-/.test(id) || id.indexOf('iss-') === 0) {
            var at = alertAt(id, m.t), v2 = leads()[id];
            add(id, at, v2 ? m.name + (v2.k === 'c' ? ' is coming up' : ' ' + leadWord(v2)) : m.name, (m.when || '') + '', openJs('Sight.dc.html', 'wf_sight', id));
          }
        });
        var finish = function () {
          out.sort(function (a, b) { return a.at - b.at; });
          post({ t: 'alerts', list: out.slice(0, 48) });
        };
        if (P.iss && !issBusy) {
          issBusy = true; var done = false, to = setTimeout(function () { if (!done) { done = true; issBusy = false; finish(); } }, 9000);
          try {
            WFE.iss(o, now, function (r) {
              if (done) return; done = true; clearTimeout(to); issBusy = false;
              ((r && r.list) || []).slice(0, 6).forEach(function (e) {
                if (go && e.verdict === 'Skip') return;
                var v3 = leads()[e.id];
                add(e.id, alertAt(e.id, e.date.getTime()), v3 ? 'Space station ' + (v3.k === 'c' ? 'coming up' : leadWord(v3)) : 'Space station soon', (e.whenTxt || '') + ' · ' + (e.detail || ''), openJs('Sight.dc.html', 'wf_sight', e.id));
              });
              finish();
            });
          } catch (e) { clearTimeout(to); issBusy = false; finish(); }
        } else finish();
      } catch (e) { post({ t: 'log', m: 'sync failed: ' + e.message }); }
    });
  }

  /* test alert: asks the app to fire one notification in 2 minutes; the app answers through window.parent.__wfTest */
  window.WFTestAlert = function (cb) {
    var t0 = Date.now(), tries = 0;
    try { post({ t: 'testAlert' }); } catch (e) {}
    var iv = setInterval(function () {
      tries++;
      var r = null; try { r = (framed ? window.parent : window).__wfTest; } catch (e) {}
      if (r && r.t >= t0) {
        clearInterval(iv);
        if (r.ok) { var d = new Date(r.at), h = d.getHours(), m = d.getMinutes(); cb('Alert set for ' + (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h >= 12 ? 'pm' : 'am') + '. Tap to send another'); }
        else cb(r.err === 'perm' ? 'Allow notifications for Wishfall in phone settings first' : 'Could not set the alert');
      } else if (tries > 24) { clearInterval(iv); cb('Update to the newest app version to use this test'); }
    }, 150);
  };
  /* long values on small tiles shrink to fit instead of being cut off */
  (function () {
    var tm = 0;
    function fit() {
      try {
        var els = document.querySelectorAll('.tile .t-value');
        for (var i = 0; i < els.length; i++) {
          var e = els[i]; e.style.fontSize = '';
          var fs = parseFloat(getComputedStyle(e).fontSize), cw = e.clientWidth, sw = e.scrollWidth;
          if (cw > 0 && sw > cw + 1) e.style.fontSize = Math.max(12, Math.floor(fs * cw / sw * 0.97)) + 'px';
        }
      } catch (er) {}
    }
    function later() { clearTimeout(tm); tm = setTimeout(fit, 120); }
    document.addEventListener('DOMContentLoaded', function () {
      later(); try { new MutationObserver(later).observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (er) {}
    });
  })();
  /* five quick taps on "Wishfall 0.1" (You tab) show a small speed log, for finding slow spots on a phone */
  (function () {
    var n = 0, t = 0;
    document.addEventListener('click', function (e) {
      try {
        var x = e.target; if (!x || !/^Wishfall 0\.\d/.test((x.textContent || '').trim()) || (x.textContent || '').length > 20) return;
        var now = Date.now(); n = now - t < 900 ? n + 1 : 1; t = now;
        if (n >= 5) { n = 0; post({ t: 'perf' }); }
      } catch (er) {}
    }, true);
  })();

  /* "When should we remind you?" sheet, opened when someone plans a sighting */
  window.WFPlanSheet = function (o) {
    try {
      var root = document.getElementById('wfplan');
      if (!root) {
        var st = document.createElement('style');
        st.textContent = '#wfplan{position:fixed;left:0;top:0;right:0;bottom:0;z-index:60;pointer-events:none}#wfplan .scrim{position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(3,4,11,.6);opacity:0;pointer-events:none;transition:opacity .3s ease}#wfplan .scrim[data-open="1"]{opacity:1;pointer-events:auto}' +
          '#wfplan .wfsh{position:absolute;left:0;right:0;bottom:0;transform:translateY(104%);transition:transform .38s cubic-bezier(.22,1,.36,1);border-radius:28px 28px 0 0;padding:10px 24px 24px;background:#0d1120;border:1px solid rgba(255,255,255,.17);border-bottom:0;box-sizing:border-box;pointer-events:auto;color:#fff;font-family:Outfit,sans-serif}#wfplan .wfsh[data-open="1"]{transform:none}' +
          '#wfplan .grab{width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,.25);margin:0 auto 18px}#wfplan .opt{display:flex;align-items:center;width:100%;height:52px;border-radius:26px;padding:0 20px;margin-top:8px;border:1px solid rgba(255,255,255,.17);background:#151927;color:rgba(255,255,255,.85);font:500 16px Outfit,sans-serif;text-align:left}' +
          '#wfplan .opt[aria-pressed=true]{background:#fff;color:#0b0e1d;border-color:#fff}#wfplan .opt:active{transform:scale(.98)}#wfplan input[type=time]{display:block;width:100%;height:52px;box-sizing:border-box;margin-top:8px;border-radius:26px;border:1px solid rgba(255,255,255,.3);background:#151927;color:#fff;font:500 20px Outfit,sans-serif;padding:0 20px;color-scheme:dark}' +
          '#wfplan .pv{min-height:20px;margin-top:14px;font:300 14px/20px Outfit,sans-serif;color:rgba(255,255,255,.7)}#wfplan .sv{display:flex;align-items:center;justify-content:center;width:100%;height:56px;border-radius:28px;border:0;margin-top:14px;background:#fff;color:#0b0e1d;font:600 17px Outfit,sans-serif;transition:opacity .2s}#wfplan .sv[disabled]{opacity:.35}';
        document.head.appendChild(st);
        root = document.createElement('div'); root.id = 'wfplan';
        root.innerHTML = '<div class="scrim" data-open="0"></div><div class="wfsh" data-open="0" role="dialog" aria-label="When should we remind you"><div class="grab"></div><div style="font:500 22px/28px Outfit,sans-serif;letter-spacing:-.01em">When should we remind you?</div><div class="nm" style="margin-top:4px;font:300 14px/20px Outfit,sans-serif;color:rgba(255,255,255,.7)"></div><div class="ops"></div><div class="tm" style="display:none"><input type="time" value="21:00" aria-label="Reminder time"></div><div class="pv"></div><button class="sv">Save</button></div>';
        document.body.appendChild(root);
      }
      var sc = root.querySelector('.scrim'), sh = root.querySelector('.wfsh'), ops = root.querySelector('.ops'), tmw = root.querySelector('.tm'), tin = tmw.querySelector('input'), pv = root.querySelector('.pv'), sv = root.querySelector('.sv');
      var OPT = [['15', '15 minutes before'], ['30', '30 minutes before'], ['60', '1 hour before'], ['c', 'Pick a time']];
      var cur = (window.WFLead && window.WFLead.get(o.id)) || { k: '30', t: '21:00' };
      if (cur.t) tin.value = cur.t;
      root.querySelector('.nm').textContent = o.name + ' · ' + alertFmt(o.eventMs);
      function value() { return cur.k === 'c' ? { k: 'c', t: tin.value || '21:00' } : { k: cur.k }; }
      function render() {
        ops.innerHTML = '';
        OPT.forEach(function (x) {
          var bt = document.createElement('button'); bt.className = 'opt'; bt.textContent = x[1]; bt.setAttribute('aria-pressed', cur.k === x[0] ? 'true' : 'false');
          bt.onclick = function () { cur = { k: x[0] }; render(); }; ops.appendChild(bt);
        });
        tmw.style.display = cur.k === 'c' ? 'block' : 'none';
        var at = leadAt(value(), o.eventMs), ok = at > Date.now() + 45000;
        pv.textContent = ok ? 'You will get it ' + alertFmt(at) : 'That time has already passed. Pick a later one.';
        sv.disabled = !ok;
      }
      function close() { sc.setAttribute('data-open', '0'); sh.setAttribute('data-open', '0'); }
      sc.onclick = close; tin.oninput = render; tin.onchange = render;
      sv.onclick = function () { if (sv.disabled) return; var v = value(); close(); if (window.WFLead) window.WFLead.set(o.id, v); if (o.done) o.done(v); };
      render();
      void sh.offsetWidth; sc.setAttribute('data-open', '1'); sh.setAttribute('data-open', '1');
    } catch (e) { try { if (o.done) o.done(); } catch (er) {} }
  };
  window.WFMW = function (ob, now, shift) {
    try {
      var A = window.Astronomy; if (!A) return null;
      var k = ob.lat.toFixed(2) + ',' + ob.lon.toFixed(2) + ',' + Math.floor(now.getTime() / 900000) + ',' + (shift || 0);
      window._mwc = window._mwc || {}; if (window._mwc[k]) return window._mwc[k];
      var o = new A.Observer(ob.lat, ob.lon, 0);
      var s0 = new Date(now); s0.setHours(now.getHours() < 6 ? -6 : 18, 0, 0, 0); if (shift) s0 = new Date(s0.getTime() + shift * 86400000);
      var first = null, last = null, best = null, bestAlt = -99, bestAz = 0, dark = false, moonBad = false;
      for (var i = 0; i <= 140; i++) {
        var d = new Date(s0.getTime() + i * 360000);
        var se = A.Equator(A.Body.Sun, d, o, true, true); var su = A.Horizon(d, o, se.ra, se.dec, 'normal');
        if (su.altitude > -18) continue;
        var g = A.Horizon(d, o, 17.7611, -28.936, 'normal'); if (g.altitude < 10) continue;
        dark = true;
        var me = A.Equator(A.Body.Moon, d, o, true, true); var mh = A.Horizon(d, o, me.ra, me.dec, 'normal');
        var ill = A.Illumination(A.Body.Moon, d).phase_fraction;
        if (mh.altitude > 0 && ill > 0.3) { moonBad = true; continue; }
        if (!first) first = d; last = d;
        if (g.altitude > bestAlt) { bestAlt = g.altitude; best = d; bestAz = g.azimuth; }
      }
      var r = { ok: !!first, moon: !first && moonBad, start: first, end: last, best: best, bestAlt: bestAlt, bestAz: bestAz };
      window._mwc[k] = r; return r;
    } catch (e) { return null; }
  };
  var KEYS = { wf_prefs: 1, wf_plans: 1, wf_plan_meta: 1, wf_plan_lead: 1 };
  try {
    var sp = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k) { var r = sp.apply(this, arguments); if (KEYS[k]) sync(); if (k === 'wf_obs') post({ t: 'obs' }); return r; };
  } catch (e) {}
  window.WFNative = { post: post, sync: sync, back: window.__wfBack, go: go };
  // the automatic checks run at most once every 10 minutes across all pages (changes to prefs/plans still sync at once)
  function autoSync() { try { var t = +localStorage.getItem('wf_sync_at') || 0; if (Date.now() - t < 600000) return; sp0.call(localStorage, 'wf_sync_at', String(Date.now())); } catch (e) {} sync(); }
  var sp0 = Storage.prototype.setItem;
  /* the alert check is heavy: only the Home page runs it, once the phone is idle, never while pages are opening */
  var isHome = /Main\.dc\.html/.test(location.pathname) || !framed;
  function idleSync() { if (!isHome) return; var go = function () { autoSync(); }; if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 30000 }); else setTimeout(go, 10000); }
  window.addEventListener('load', function () { setTimeout(idleSync, 20000); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(idleSync, 8000); });

  post({ t: 'page', path: location.pathname.split('/').pop() });
})();

/* Wishfall UI: the one source of style. Tokens, type, glass, motion, page and tab transitions.
   Screens use these classes and variables only. Nothing is styled twice. */
(function () {
  var css = [
  ':root{',
  '--wf-space:#04060f;--wf-ink-1:#fff;--wf-ink-2:rgba(255,255,255,.78);--wf-ink-3:rgba(255,255,255,.62);--wf-ink-off:rgba(255,255,255,.38);',
  '--wf-line:rgba(255,255,255,.14);--wf-edge:rgba(255,255,255,.17);--wf-fill:rgba(255,255,255,.10);--wf-fill-2:rgba(255,255,255,.16);',
  '--wf-go:#7ee7c7;--wf-maybe:#ffc46b;--wf-skip:#ff8f9c;--wf-select:#fff;--wf-select-ink:#0b0e1d;--wf-moon:#f1eee4;--wf-halo:rgba(175,195,255,.22);',
  '--wf-r-chip:16px;--wf-r-tile:20px;--wf-r-card:24px;--wf-r-hero:28px;--wf-r-bar:32px;',
  '--ease-out:cubic-bezier(.16,1,.3,1);--ease-spring:cubic-bezier(.34,1.3,.64,1);--ease-inout:cubic-bezier(.65,0,.35,1);',
  '--d-fast:150ms;--d-base:300ms;--d-slow:500ms;--d-page:480ms;--d-stagger:60ms;',
  '}',
  'html,body{margin:0;background:#04060f}',
  'body,button,a,input{font-family:Outfit,sans-serif}',
  'button,a{cursor:pointer;-webkit-tap-highlight-color:transparent;text-decoration:none;color:inherit}',
  'button{font-size:inherit}',
  '.noscroll{scrollbar-width:none;overscroll-behavior:contain}.noscroll::-webkit-scrollbar{display:none}',
  /* type scale */
  '.t-hero{font-size:36px;line-height:44px;font-weight:600;letter-spacing:-.02em}',
  '.t-display{font-size:32px;line-height:40px;font-weight:600;letter-spacing:-.015em}',
  '.t-title{font-size:28px;line-height:32px;font-weight:500;letter-spacing:-.01em}',
  '.t-h2{font-size:22px;line-height:28px;font-weight:500;letter-spacing:-.01em}',
  '.t-big{font-size:36px;line-height:44px;font-weight:300;letter-spacing:-.02em}',
  '.t-value{font-size:24px;line-height:32px;font-weight:300}',
  '.t-name{font-size:18px;line-height:24px;font-weight:500}',
  '.t-body{font-size:15px;line-height:22px;font-weight:300}',
  '.t-small{font-size:14px;line-height:20px;font-weight:400}',
  '.t-cap{font-size:13px;line-height:18px;font-weight:400}',
  '.t-label{font-size:12px;line-height:16px;font-weight:400}',
  '.t-eyebrow{font-size:12px;line-height:16px;font-weight:400;letter-spacing:.18em;text-transform:uppercase}',
  '.t-tab{font-size:11px;line-height:14px;font-weight:500}',
  '.i1{color:var(--wf-ink-1)}.i2{color:var(--wf-ink-2)}.i3{color:var(--wf-ink-3)}',
  '.nw{white-space:nowrap}.el{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
  /* glass */
  '.fg{background-color:rgba(12,15,26,.5);background-image:linear-gradient(155deg,rgba(255,255,255,.17),rgba(255,255,255,.03) 55%,rgba(255,255,255,.07));-webkit-backdrop-filter:blur(32px) saturate(160%);backdrop-filter:blur(32px) saturate(160%);border:1px solid var(--wf-edge);box-shadow:0 10px 30px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.24),inset 0 -1px 0 rgba(255,255,255,.04);box-sizing:border-box;transition:transform .25s var(--ease-spring),border-color var(--d-base) var(--ease-out),background-color var(--d-base) var(--ease-out),opacity var(--d-base) var(--ease-out)}',
  '.fgn{background-color:rgba(10,13,24,.72);background-image:linear-gradient(155deg,rgba(255,255,255,.15),rgba(255,255,255,.03) 55%,rgba(255,255,255,.07));-webkit-backdrop-filter:blur(40px) saturate(160%);backdrop-filter:blur(40px) saturate(160%);border:1px solid var(--wf-edge);box-shadow:0 14px 34px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.24),inset 0 -1px 0 rgba(255,255,255,.04);box-sizing:border-box}',
  '.card{border-radius:var(--wf-r-card);padding:16px}',
  '.tile{height:88px;border-radius:var(--wf-r-tile);padding:10px 12px;min-width:0;overflow:hidden}',
  '.btn-ic{flex:none;width:48px;height:48px;border-radius:24px;padding:0;display:flex;align-items:center;justify-content:center;color:#fff}',
  '.btn-pill{flex:none;height:44px;border-radius:22px;padding:0 18px;display:flex;align-items:center;justify-content:center;gap:6px;color:#fff;font-size:14px;line-height:16px;font-weight:500;white-space:nowrap}',
  '.chip{height:32px;border-radius:var(--wf-r-chip);padding:0 16px;display:inline-flex;align-items:center;gap:8px;font-size:14px;line-height:16px;font-weight:500;white-space:nowrap}',
  '.cta{height:56px;border-radius:28px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:17px;font-weight:600}',
  '.dot{flex:none;width:8px;height:8px;border-radius:4px;background:currentColor;box-shadow:0 0 10px currentColor}',
  '.halo{background:radial-gradient(circle,var(--wf-halo) 0%,rgba(0,0,0,0) 66%)}',
  /* interaction */
  '.press{transition:transform .25s var(--ease-spring),border-color var(--d-base) var(--ease-out),background-color var(--d-base) var(--ease-out),opacity var(--d-base) var(--ease-out);will-change:transform}',
  '.press:active{transform:scale(.95);transition-duration:.08s}',
  '@media (hover:hover){.fg.press:hover{border-color:rgba(255,255,255,.3)}}',
  '.fade{transition:opacity var(--d-slow) var(--ease-out)}',
  '.swap{transition:opacity .18s var(--ease-out),transform .18s var(--ease-out)}',
  '.swap[data-s="1"]{opacity:0;transform:translateY(6px)}',
  /* motion */
  '@keyframes wfRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
  '@keyframes wfFwd{from{opacity:0;transform:translateX(32px) scale(.985)}to{opacity:1;transform:none}}',
  '@keyframes wfBack{from{opacity:0;transform:translateX(-24px) scale(.99)}to{opacity:1;transform:none}}',
  '@keyframes wfTab{from{opacity:0;transform:translateY(10px) scale(.992)}to{opacity:1;transform:none}}',
  '@keyframes wfCold{from{opacity:0}to{opacity:1}}',
  '@keyframes wfMoon{from{opacity:0;transform:scale(.84)}to{opacity:1;transform:none}}',
    '@keyframes wfFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
  '@keyframes wfHalo{0%,100%{opacity:.8}50%{opacity:1}}',
  '@keyframes wfPing{0%{transform:scale(.7);opacity:.9}100%{transform:scale(2);opacity:0}}',
  '.wf-body{}',
  '[data-nav=fwd] .wf-body{animation:wfFwd var(--d-page) var(--ease-out) backwards}',
  '[data-nav=back] .wf-body{animation:wfBack var(--d-page) var(--ease-out) backwards}',
  '[data-nav=tab] .wf-body{animation:wfTab var(--d-page) var(--ease-out) backwards}',
  '[data-nav=cold] .wf-body{animation:wfCold .6s var(--ease-out) backwards}',
  '.rise{animation:wfRise .7s var(--ease-out) backwards;animation-delay:calc(90ms + var(--i,0) * var(--d-stagger))}',
  '.moon-in{animation:wfMoon 1s var(--ease-out) .05s backwards}',
  '.floaty{animation:wfFloat 9s ease-in-out infinite}.halo-pulse{animation:wfHalo 7s ease-in-out infinite}',
  '.ping{transform-origin:center;transform-box:fill-box;animation:wfPing 2.6s ease-out infinite}',
  '@keyframes wfDrift{from{transform:translateX(0)}to{transform:translateX(-2500px)}}',
  'html,body{margin:0;background:#04060f;color-scheme:dark}',
  /* verdict pill, separator dot, real moon thumbnail */
  '.vp{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 9px;border-radius:11px;background:var(--wf-fill);border:1px solid var(--wf-line);font-size:12px;line-height:16px;font-weight:600;white-space:nowrap;flex:none}',
  '.sep{display:inline-block;width:3px;height:3px;border-radius:2px;background:var(--wf-ink-2);margin:0 8px;vertical-align:middle;position:relative;top:-1px}',
  '.mthumb{flex:none;display:block;border-radius:50%;object-fit:cover;box-shadow:0 0 0 1px rgba(255,255,255,.14)}',
  '.mthumb-ph{flex:none;border-radius:50%;background:var(--wf-fill);border:1px solid var(--wf-line)}',
  '.drift{animation:wfDrift 900s linear infinite alternate}',
  '.bgfade{opacity:0;transition:opacity 1.1s var(--ease-out)}.bgfade.on{opacity:1}',
  /* switch, filter chip, list row, sheet, field */
  '.switch{position:relative;flex:none;width:52px;height:32px;border-radius:16px;border:1px solid var(--wf-edge);background:var(--wf-fill);padding:0;transition:background-color .35s var(--ease-out),border-color .35s var(--ease-out)}',
  '.switch::after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:12px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transition:transform .45s var(--ease-spring),background-color .35s var(--ease-out)}',
  '.switch[aria-checked=true]{background:var(--wf-select);border-color:var(--wf-select)}',
  '.switch[aria-checked=true]::after{transform:translateX(20px);background:var(--wf-select-ink)}',
  '.switch:active::after{width:28px}.switch[aria-checked=true]:active::after{transform:translateX(16px)}',
  '.fchip{flex:none;height:40px;border-radius:20px;padding:0 18px;border:1px solid var(--wf-edge);background:rgba(12,15,26,.5);color:var(--wf-ink-2);font-size:14px;font-weight:500;white-space:nowrap;transition:background-color .35s var(--ease-out),color .35s var(--ease-out),border-color .35s var(--ease-out),transform .25s var(--ease-spring)}',
  '.fchip[aria-pressed=true]{background:var(--wf-select);color:var(--wf-select-ink);border-color:var(--wf-select)}',
  '.fchip:active{transform:scale(.95)}',
  '.row{display:flex;align-items:center;gap:12px;min-height:64px;box-sizing:border-box}',
  '.row + .row{border-top:1px solid var(--wf-line)}',
  '.sheet{position:absolute;left:0;right:0;bottom:0;transform:translateY(104%);transition:transform .6s var(--ease-out)}',
  '.sheet[data-open="1"]{transform:none}',
  '.scrim{position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(3,4,11,.55);opacity:0;pointer-events:none;transition:opacity .45s var(--ease-out)}',
  '.scrim[data-open="1"]{opacity:1;pointer-events:auto}',
  '.field{height:48px;border-radius:24px;padding:0 18px;display:flex;align-items:center;gap:10px;color:var(--wf-ink-1)}',
  '.field input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font-size:16px;font-family:inherit}',
  '.field input::placeholder{color:var(--wf-ink-3)}',
  /* tab bar */
  '.tabbar{position:absolute;left:24px;right:24px;bottom:20px;height:64px;border-radius:var(--wf-r-bar);padding:4px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}',
  '.tab-ind{position:absolute;top:4px;left:4px;width:calc((100% - 8px) / 4);height:54px;border-radius:28px;background:var(--wf-fill-2);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 4px 14px rgba(0,0,0,.18);transition:transform .5s cubic-bezier(.22,1,.36,1);pointer-events:none}',
  '.tabbar[data-at="1"] .tab-ind{transform:translateX(100%)}.tabbar[data-at="2"] .tab-ind{transform:translateX(200%)}.tabbar[data-at="3"] .tab-ind{transform:translateX(300%)}',
  '.tab{position:relative;z-index:1;border:0;background:none;padding:0;border-radius:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--wf-ink-3);transition:color var(--d-base) var(--ease-out)}',
  '.tab svg{opacity:.85;transition:transform .45s var(--ease-out),opacity .35s var(--ease-out),filter .5s var(--ease-out)}',
  '.tab[aria-current=page]{color:#fff}',
  '.tab[aria-current=page] svg{opacity:1;transform:translateY(-1px);filter:drop-shadow(0 0 7px rgba(255,255,255,.4));animation:wfTabIcon .6s var(--ease-out) .1s backwards}',
  '.tab:active svg{transform:scale(.92);transition-duration:.1s}',
  '@keyframes wfTabIcon{from{opacity:.45;transform:translateY(3px);filter:drop-shadow(0 0 0 rgba(255,255,255,0))}to{opacity:1;transform:translateY(-1px);filter:drop-shadow(0 0 7px rgba(255,255,255,.4))}}',
  '@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;animation-delay:0s!important;transition-duration:.01ms!important}}'
  ].join('\n');
  try {
    if (!document.getElementById('wf-ui-css')) {
      var st = document.createElement('style'); st.id = 'wf-ui-css'; st.textContent = css; document.head.appendChild(st);
    }
  } catch (e) {}
  var KEY = 'wf_nav';
  var TABS = { tonight: 0, events: 1, sky: 2, you: 3 };
  window.WFUI = {
    TABS: TABS,
    read: function () { try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && Date.now() - j.t < 6000) return j; } catch (e) {} return null; },
    mark: function (dir, from, back) { try { localStorage.setItem(KEY, JSON.stringify({ dir: dir, from: from || '', t: Date.now() })); if (back) localStorage.setItem('wf_back', back); } catch (e) {} },
    back: function () { try { return localStorage.getItem('wf_back') || 'Main.dc.html'; } catch (e) { return 'Main.dc.html'; } },
    prefs: function () { var d = { showers: true, moon: true, goOnly: false, hour: 19 }; try { var j = JSON.parse(localStorage.getItem('wf_prefs') || 'null'); if (j) for (var k in j) d[k] = j[k]; } catch (e) {} return d; },
    setPref: function (k, v) { var p = this.prefs(); p[k] = v; try { localStorage.setItem('wf_prefs', JSON.stringify(p)); } catch (e) {} return p; },
    plans: function () { try { var j = JSON.parse(localStorage.getItem('wf_plans') || '[]'); return Array.isArray(j) ? j : []; } catch (e) { return []; } },
    hasPlan: function (id) { return this.plans().indexOf(id) >= 0; },
    togglePlan: function (id) { var a = this.plans(), i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); try { localStorage.setItem('wf_plans', JSON.stringify(a)); } catch (e) {} return i < 0; },
    hourText: function (h) { var ap = h >= 12 ? 'pm' : 'am'; var x = h % 12; if (x === 0) x = 12; return x + ' ' + ap; },
    nav: function () { var n = this.read(); return n ? n.dir : 'cold'; },
    tabFrom: function (me) { var n = this.read(); return (n && n.dir === 'tab' && TABS[n.from] != null) ? TABS[n.from] : TABS[me]; },
    fonts: ''
  };

  /* ---- coming back puts you exactly where you left: scroll position and any saved screen state ---- */
  (function () {
    var W = window.WFUI, isBack = W.nav() === 'back';
    W.isBack = isBack;
    W.keep = function (k, v) { try { localStorage.setItem('wf_keep_' + k, JSON.stringify(v)); } catch (e) {} };
    W.kept = function (k) { if (!isBack) return null; try { return JSON.parse(localStorage.getItem('wf_keep_' + k) || 'null'); } catch (e) { return null; } };
    function pageOf(el) { return el && el.closest ? el.closest('.wf-page') : null; }
    function keyOf(pg) { var c = pg && pg.querySelector('canvas[id^=spacecv_]'); return c ? c.id : 'page'; }
    function scrOf(pg) { return pg && pg.querySelector('.wf-body > .noscroll'); }
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
      var pg = pageOf(a), s = scrOf(pg); if (!s) return;
      try { localStorage.setItem('wf_scr_' + keyOf(pg), String(Math.round(s.scrollTop))); } catch (x) {}
    }, true);
    if (isBack) {
      var tries = 0, hits = 0, stopped = false;
      var stop = function () { stopped = true; };
      ['touchstart', 'wheel', 'pointerdown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, stop, { capture: true, passive: true, once: true }); });
      var iv = setInterval(function () {
        if (stopped || ++tries > 60) { clearInterval(iv); return; }
        var pg = document.querySelector('.wf-page'), s = scrOf(pg); if (!s) return;
        var v = parseFloat(localStorage.getItem('wf_scr_' + keyOf(pg)));
        if (!isFinite(v) || v <= 0) { clearInterval(iv); return; }
        s.scrollTop = v;
        if (Math.abs(s.scrollTop - v) < 2) { if (++hits >= 4) clearInterval(iv); } else hits = 0;
      }, 80);
    }
  })();
})();

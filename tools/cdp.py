# Looks inside the app's WebView on the emulator (Chrome DevTools protocol) and reports
# what each screen frame contains, plus every JS error/console message during a reload.
import json, subprocess, time, urllib.request, sys
import websocket

def sh(c): return subprocess.run(c, shell=True, capture_output=True, text=True).stdout
socks = [l.split('@')[-1].strip() for l in sh("adb shell cat /proc/net/unix").splitlines() if 'webview_devtools_remote' in l]
print('::notice::CDP sockets ' + ' '.join(socks))
if not socks: sys.exit(0)
sh('adb forward tcp:9333 localabstract:' + socks[0])
time.sleep(1)
targets = json.load(urllib.request.urlopen('http://127.0.0.1:9333/json'))
for t in targets: print('::notice::CDP target %s %s' % (t.get('type'), t.get('url', '')[:120]))
page = [t for t in targets if t.get('type') == 'page'][0]
ws = websocket.create_connection(page['webSocketDebuggerUrl'], timeout=5, suppress_origin=True)
mid = [0]
def call(method, params=None):
    mid[0] += 1; i = mid[0]
    ws.send(json.dumps({'id': i, 'method': method, 'params': params or {}}))
    while True:
        m = json.loads(ws.recv())
        if m.get('id') == i: return m
        log(m)
out = []
def log(m):
    meth = m.get('method', '')
    if meth == 'Runtime.exceptionThrown':
        d = m['params']['exceptionDetails']; ex = d.get('exception', {})
        out.append('EXC %s @%s:%s %s' % (d.get('text'), (d.get('url') or '').split('/')[-1], d.get('lineNumber'), (ex.get('description') or '')[:300]))
    elif meth == 'Runtime.consoleAPICalled':
        p = m['params']; out.append('CON %s %s' % (p['type'], ' '.join(str(a.get('value', a.get('description', '')))[:200] for a in p['args'])))
    elif meth == 'Log.entryAdded':
        e = m['params']['entry']; out.append('LOG %s %s %s' % (e.get('level'), e.get('text', '')[:300], (e.get('url') or '').split('/')[-1]))
PROBE = r"""(function(){var r=[];document.querySelectorAll('iframe').forEach(function(f){var o={src:(f.src||'').split('/').pop().slice(0,40),cls:f.className};try{var d=f.contentDocument,w=f.contentWindow;o.state=d.readyState;o.wfpage=!!d.querySelector('.wf-page');o.body=(d.body?d.body.innerHTML.length:-1);o.text=(d.body?d.body.innerText.slice(0,80):'');o.WF=typeof w.WF;o.Astro=typeof w.Astronomy;o.WFUI=typeof w.WFUI;o.dc=typeof w.DC+'/'+typeof w.customElements.get('x-dc');o.scripts=[].map.call(d.scripts,function(s){return (s.src||'inline').split('/').pop().split('?')[0]}).join(',');}catch(e){o.err=String(e)}r.push(o)});return JSON.stringify({cur:location.href.split('/').pop(),frames:r});})()"""
def probe(tag):
    m = call('Runtime.evaluate', {'expression': PROBE, 'returnByValue': True})
    v = m.get('result', {}).get('result', {}).get('value')
    print('::warning::CDP %s %s' % (tag, str(v)[:3000]))
BTN = r"""(function(){var r=[];document.querySelectorAll('iframe').forEach(function(f){try{var d=f.contentDocument;var c=d.querySelectorAll('button[aria-label="Back"],button[aria-label="Close"]');var o=[];for(var i=0;i<c.length;i++){var b=c[i].getBoundingClientRect();if(b.width<4)continue;var el=d.elementFromPoint(b.left+b.width/2,b.top+b.height/2);if(el&&c[i].contains(el))o.push(c[i].getAttribute('aria-label')+'@'+Math.round(b.left)+','+Math.round(b.top)+' in '+((c[i].closest('[class]')||{}).className||'').toString().slice(0,60)+' / '+(c[i].parentElement?c[i].parentElement.innerText.slice(0,60):''));}r.push((f.src||'').split('/').pop().split('?')[0]+' cls='+f.className+' top-buttons=['+o.join(' | ')+'] scrimOpen='+!!d.querySelector('.scrim[data-open="1"]'));}catch(e){r.push('err '+e)}});return r.join(' ;; ');})()"""
if len(sys.argv) > 1 and sys.argv[1] == 'buttons':
    m = call('Runtime.evaluate', {'expression': BTN, 'returnByValue': True})
    print('::warning::CDP buttons ' + str(m.get('result', {}).get('result', {}).get('value'))[:3000]); sys.exit(0)
call('Runtime.enable'); call('Log.enable')
probe('before-reload')
call('Page.enable'); call('Page.reload', {'ignoreCache': True})
t0 = time.time()
ws.settimeout(1)
while time.time() - t0 < 25:
    try: log(json.loads(ws.recv()))
    except Exception: pass
ws.settimeout(5)
probe('after-reload-25s')
s = ' || '.join(out)
for i in range(0, min(len(s), 12000), 900): print('::warning::CDPLOG ' + s[i:i + 900])

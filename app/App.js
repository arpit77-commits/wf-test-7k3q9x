import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, BackHandler, Linking, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { startCompass, stopCompass, setCompassPlace } from './src/compass';

// Test option: a web address here loads the pages from the web instead of from inside the app.
// Keep '' for real use (pages load from inside the app).
const TEST_URL = '';
const LAUNCH = Date.now();
const HOME = TEST_URL || 'file:///android_asset/www/shell.html';
const CHANNEL = 'sky-alerts';
const TEST_CH = 'wf-test';
const TEST_ID = 'wf-test-alert';
const PKG = 'package:app.wishfall.test';
const SPACE = '#04060f';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const F = { l: 'Outfit_300Light', r: 'Outfit_400Regular', m: 'Outfit_500Medium', s: 'Outfit_600SemiBold' };

/* ---------------- first-run setup ---------------- */
function Step({ n, title, text, label, onPress, done, strong }) {
  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[s.num, done && { backgroundColor: '#7ee7c7', borderColor: '#7ee7c7' }]}>
          <Text style={[s.numTxt, done && { color: '#06110d' }]}>{done ? '✓' : n}</Text>
        </View>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      <Text style={s.cardText}>{text}</Text>
      <Pressable onPress={onPress} style={({ pressed }) => [s.btn, strong && s.btnStrong, pressed && { opacity: 0.7 }]}>
        <Text style={[s.btnTxt, strong && { color: '#0b0e1d' }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

function Setup({ onDone }) {
  const insets = useSafeAreaInsets();
  const [notif, setNotif] = useState(false);
  const [loc, setLoc] = useState(false);
  const [exactSeen, setExactSeen] = useState(false);
  const [batSeen, setBatSeen] = useState(false);
  const brand = String(Device.manufacturer || '').toLowerCase();
  const api = Device.platformApiLevel || 0;
  const refresh = useCallback(async () => {
    try { setNotif((await Notifications.getPermissionsAsync()).status === 'granted'); } catch (e) {}
    try { setLoc((await Location.getForegroundPermissionsAsync()).status === 'granted'); } catch (e) {}
  }, []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);
  const askNotif = async () => {
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Sky alerts', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 200, 100, 200], lightColor: '#cfdbff' });
    const r = await Notifications.requestPermissionsAsync(); setNotif(r.status === 'granted');
    if (r.status !== 'granted') Linking.openSettings();
  };
  const askLoc = async () => { const r = await Location.requestForegroundPermissionsAsync(); setLoc(r.status === 'granted'); };
  const open = async (action, data) => { try { await IntentLauncher.startActivityAsync(action, data ? { data } : {}); } catch (e) { Linking.openSettings(); } };
  const exact = async () => { setExactSeen(true); if (api < 31) return; await open('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', PKG); };
  const battery = async () => { setBatSeen(true); await open('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS'); };
  const hint = /xiaomi|redmi|poco/.test(brand) ? 'On Xiaomi, Redmi and POCO phones also turn Autostart ON for Wishfall (Settings, Apps, Manage apps, Wishfall).'
    : /oppo|realme|oneplus/.test(brand) ? 'On Oppo, Realme and OnePlus phones also allow Auto launch and background activity in the app info page.'
    : /vivo|iqoo/.test(brand) ? 'On Vivo and iQOO phones also allow Autostart and high background power use in the app info page.'
    : /samsung/.test(brand) ? 'On Samsung phones make sure Wishfall is not listed under Sleeping apps or Deep sleeping apps (Settings, Battery).'
    : /huawei|honor/.test(brand) ? 'On Huawei and Honor phones open App launch, switch Wishfall to Manage manually, and allow all three options.'
    : /tecno|infinix|itel/.test(brand) ? 'On Tecno, Infinix and itel phones also allow Auto-start in Phone Master, and set battery to No restriction.'
    : 'Some phone makers also stop apps in the background. If alerts are late, look for an Autostart or Background activity setting for Wishfall.';
  return (
    <View style={{ flex: 1, backgroundColor: SPACE }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28, paddingHorizontal: 24 }}>
        <Text style={s.h1}>Four quick steps</Text>
        <Text style={s.p}>So Wishfall can tell you about the sky exactly when it matters, even with the phone locked. You only do this once.</Text>
        <Step n="1" title="Allow alerts" text="Lets us tell you the evening before a meteor shower, eclipse or Moon event." label={notif ? 'Allowed' : 'Allow notifications'} done={notif} strong={!notif} onPress={askNotif} />
        <Step n="2" title="On time, not late" text={api >= 31 ? 'Android delays alerts by minutes unless you allow exact alarms. Switch it ON for Wishfall.' : 'This phone already allows exact alerts.'} label={api >= 31 ? (exactSeen ? 'Open again' : 'Open exact alarm setting') : 'Already allowed'} done={api < 31 || exactSeen} strong={api >= 31 && !exactSeen} onPress={exact} />
        <Step n="3" title="Keep running at night" text={'Choose Wishfall and set it to Unrestricted or Don\'t optimise, so the phone does not put it to sleep. ' + hint} label={batSeen ? 'Open again' : 'Open battery setting'} done={batSeen} strong={!batSeen} onPress={battery} />
        <Step n="4" title="Your sky, your place" text="Your location gives the real Moon, planets and rise times for where you stand. It is never sent to us." label={loc ? 'Allowed' : 'Allow location'} done={loc} strong={!loc} onPress={askLoc} />
        <Pressable onPress={onDone} style={({ pressed }) => [s.btn, s.btnStrong, { marginTop: 8 }, pressed && { opacity: 0.7 }]}>
          <Text style={[s.btnTxt, { color: '#0b0e1d' }]}>Open Wishfall</Text>
        </Pressable>
        <Text style={[s.p, { marginTop: 14, textAlign: 'center', fontSize: 13 }]}>You can skip any step and do it later in your phone's settings.</Text>
      </ScrollView>
    </View>
  );
}

/* ---------------- the app: your designed pages ---------------- */
function Shell() {
  const insets = useSafeAreaInsets();
  const web = useRef(null);
  const stopCmp = useRef(null);
  const pending = useRef(null);
  const loaded = useRef(false);
  const shellReady = useRef(false);
  const tapSeen = useRef('');
  const lastSig = useRef('');
  const [box, setBox] = useState(null);
  const [boot, setBoot] = useState(null);
  const locBusy = useRef(false);
  const locAt = useRef(0);
  useEffect(() => { AsyncStorage.getItem('wf_last_obs').then((v) => setBoot(v || '')).catch(() => setBoot('')); }, []);
  const [err, setErr] = useState(null);
  const [wk, setWk] = useState(0);

  const run = useCallback((js) => { if (web.current && js) web.current.injectJavaScript(js); }, []);

  // compass for the live sky: only while a screen asks for it AND the app is on screen
  const wantSens = useRef(false);
  const sensors = useCallback(async (on) => {
    wantSens.current = !!on;
    stopCompass(); stopCmp.current = null;
    if (!on || AppState.currentState !== 'active') return;
    stopCmp.current = await startCompass(
      (x, y, z) => run('window.__ori&&window.__ori(' + x.toFixed(5) + ',' + y.toFixed(5) + ',' + z.toFixed(5) + ');true;'),
      (st) => run('window.__oriCal&&window.__oriCal(' + JSON.stringify(st) + ');true;'));
  }, [run]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') { if (wantSens.current) sensors(true); }
      else { stopCompass(); stopCmp.current = null; }
    });
    return () => sub.remove();
  }, [sensors]);

  const schedule = useCallback(async (list) => {
    try {
      const p = await Notifications.getPermissionsAsync(); if (p.status !== 'granted') return;
      const sig = list.map((a) => a.id + ':' + a.at).join('|'); if (sig === lastSig.current) return; lastSig.current = sig;
      try { const cur = await Notifications.getAllScheduledNotificationsAsync(); for (const c of cur) { if (c.identifier !== TEST_ID) await Notifications.cancelScheduledNotificationAsync(c.identifier); } } catch (e) {}
      for (const a of list) {
        if (a.at < Date.now() + 30000) continue;
        try {
          await Notifications.scheduleNotificationAsync({
            content: { title: a.title, body: a.body || '', data: { js: a.js }, sound: true },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(a.at), channelId: CHANNEL },
          });
        } catch (e) {}
      }
    } catch (e) {}
  }, []);

  const testAlert = useCallback(async () => {
    const reply = (o) => run('window.__wfTest=' + JSON.stringify(Object.assign({ t: Date.now() }, o)) + ';true;');
    try {
      let p = await Notifications.getPermissionsAsync();
      if (p.status !== 'granted') p = await Notifications.requestPermissionsAsync();
      if (p.status !== 'granted') return reply({ ok: false, err: 'perm' });
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(TEST_CH, { name: 'Test alert', importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 150, 250], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, enableVibrate: true, showBadge: false });
      try { await Notifications.cancelScheduledNotificationAsync(TEST_ID); } catch (e) {}
      const at = Date.now() + 120000;
      await Notifications.scheduleNotificationAsync({
        identifier: TEST_ID,
        content: { title: 'Wishfall test alert', body: 'This is your 2-minute test. Alerts are working on this phone.', sound: true, priority: Notifications.AndroidNotificationPriority.MAX, data: { js: "(window.__shellGo||function(){})('Alerts.dc.html');true;" } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: TEST_CH },
      });
      reply({ ok: true, at: at });
    } catch (e) { reply({ ok: false, err: String(e && e.message || e) }); }
  }, [run]);

  // Real location comes from Android itself (web pages inside the app cannot use GPS reliably).
  const pushLoc = useCallback(async (force) => {
    if (locBusy.current) return;
    if (!force && Date.now() - locAt.current < 20 * 60000) return;
    locBusy.current = true;
    let res = null;
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted' && force) perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        let pos = null;
        try { pos = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60000 }); } catch (e) {}
        if (!pos || force) { try { pos = await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), new Promise((r) => setTimeout(() => r(null), 12000))]) || pos; } catch (e) {} }
        if (pos) {
          let name = 'Your location';
          try {
            const g = await Promise.race([Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }), new Promise((r) => setTimeout(() => r(null), 4000))]);
            const a = g && g[0]; if (a) name = a.city || a.district || a.subregion || a.region || name;
          } catch (e) {}
          res = { lat: Math.round(pos.coords.latitude * 1e4) / 1e4, lon: Math.round(pos.coords.longitude * 1e4) / 1e4, name, real: true };
          locAt.current = Date.now();
          setCompassPlace(res.lat, res.lon);
          AsyncStorage.setItem('wf_last_obs', JSON.stringify(res)).catch(() => {});
        }
      }
    } catch (e) {}
    locBusy.current = false;
    run('(function(){try{var n=' + JSON.stringify(res) + ',f=' + (force ? 'true' : 'false') + ';if(n){var o=null;try{o=JSON.parse(localStorage.getItem("wf_obs")||"null");}catch(e){}if(f||!o||!o.manual){var same=o&&!o.manual&&Math.abs(o.lat-n.lat)<0.02&&Math.abs(o.lon-n.lon)<0.02&&o.name===n.name;if(f||!same){localStorage.setItem("wf_obs",JSON.stringify(n));window.dispatchEvent(new Event("wf-obs"));}}}if(window.__wfGpsCb){var c=window.__wfGpsCb;window.__wfGpsCb=null;c(n);}}catch(e){}})();true;');
  }, [run]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active' && loaded.current) pushLoc(false); });
    return () => sub.remove();
  }, [pushLoc]);

  // An alert was tapped: open what it points to, once, and only when the app shell is ready.
  const onTap = useCallback(async (resp) => {
    const n = resp && resp.notification; const js = n && n.request.content.data && n.request.content.data.js;
    if (!js) return;
    const key = n.request.identifier + ':' + n.date;
    if (tapSeen.current === key) return;
    try { if ((await AsyncStorage.getItem('wf_last_tap')) === key) return; } catch (e) {}
    tapSeen.current = key; AsyncStorage.setItem('wf_last_tap', key).catch(() => {});
    if (Date.now() - (n.date || Date.now()) > 24 * 3600000) return; // an old alert from long ago: just open the app
    if (shellReady.current) run(js); else pending.current = js;
  }, [run]);

  useEffect(() => {
    if (Platform.OS === 'android') Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Sky alerts', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 200, 100, 200], lightColor: '#cfdbff' }).catch(() => {});
    Notifications.getLastNotificationResponseAsync().then((r) => { if (r) onTap(r); }).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(onTap);
    const bh = BackHandler.addEventListener('hardwareBackPress', () => { run('window.__shellBack&&window.__shellBack();true;'); return true; });
    return () => { sub.remove(); bh.remove(); if (stopCmp.current) stopCmp.current(); };
  }, [onTap, run]);

  const onMessage = (e) => {
    let m; try { m = JSON.parse(e.nativeEvent.data); } catch (er) { return; }
    if (m.t === 'sensors') { if (m.obs && isFinite(m.obs.lat) && isFinite(m.obs.lon)) setCompassPlace(m.obs.lat, m.obs.lon); sensors(!!m.on); }
    else if (m.t === 'alerts') schedule(m.list || []);
    else if (m.t === 'testAlert') testAlert();
    else if (m.t === 'gps') pushLoc(true);
    else if (m.t === 'exit') BackHandler.exitApp();
    else if (m.t === 'log') console.log('WFLOG ' + m.s);
    else if (m.t === 'shell') { shellReady.current = true; if (pending.current) { const j = pending.current; pending.current = null; setTimeout(() => run(j), 300); } }
  };

    return (
    <View style={{ flex: 1, backgroundColor: SPACE, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }} onLayout={(e) => { const { width, height } = e.nativeEvent.layout; if (!box || Math.abs(box.w - width) > 1 || Math.abs(box.h - height) > 1) setBox({ w: width, h: height }); }}>
        {box && boot !== null ? (
          <WebView
            key={wk}
            ref={web}
            style={{ flex: 1, backgroundColor: SPACE }}
            source={{ uri: TEST_URL ? HOME + '?t=' + LAUNCH : HOME }}
            originWhitelist={['*']}
            cacheMode="LOAD_DEFAULT"
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            geolocationEnabled
            mixedContentMode="always"
            overScrollMode="never"
            androidLayerType="hardware"
            textZoom={100}
            forceDarkOn={false}
            webviewDebuggingEnabled={PKG.endsWith('.test')}
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            setSupportMultipleWindows={false}
            allowsInlineMediaPlayback
            injectedJavaScriptBeforeContentLoaded={'window.__WF_MEM=' + (Number(Device.totalMemory) || 0) + ';' + (boot ? 'try{var _o=JSON.parse(localStorage.getItem("wf_obs")||"null");if(!_o||!_o.manual)localStorage.setItem("wf_obs",' + JSON.stringify(boot) + ');}catch(e){}' : '') + 'true;'}
            onMessage={onMessage}
            onLoadStart={(e) => { shellReady.current = false; console.log('WFLOG native loadStart ' + e.nativeEvent.url); }}
            onLoadEnd={(e) => { console.log('WFLOG native loadEnd ' + e.nativeEvent.url); loaded.current = true; setTimeout(() => pushLoc(false), 1200); }}
            onError={(e) => { console.log('WFLOG native error ' + JSON.stringify(e.nativeEvent)); setErr('load'); }}
            onHttpError={() => setErr('load')}
            onRenderProcessGone={() => { loaded.current = false; shellReady.current = false; lastSig.current = ''; setErr(null); setWk((k) => k + 1); }}
            onContentProcessDidTerminate={() => { loaded.current = false; lastSig.current = ''; setWk((k) => k + 1); }}
            onShouldStartLoadWithRequest={(r) => {
              if (/^(file|about|blob|data):/.test(r.url)) return true;
              if (TEST_URL && r.url.indexOf(TEST_URL.replace(/shell\.html$/, '')) === 0) return true;
              if (/^https?:/.test(r.url)) { Linking.openURL(r.url).catch(() => {}); return false; }
              return true;
            }}
          />
        ) : null}
        {err ? <Pressable style={s.err} onPress={() => { setErr(null); setWk((k) => k + 1); }}><Text style={s.errTxt}>Wishfall could not open this screen. Tap here to try again.</Text></Pressable> : null}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsReady] = useFonts({ Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold });
  const [setup, setSetup] = useState(null);
  useEffect(() => { AsyncStorage.getItem('wf_setup_done').then((v) => setSetup(v !== '1')).catch(() => setSetup(false)); }, []);
  if (setup === null || !fontsReady) return <View style={{ flex: 1, backgroundColor: SPACE }} />;
  return (
    <SafeAreaProvider>
      {setup ? <Setup onDone={() => { AsyncStorage.setItem('wf_setup_done', '1').catch(() => {}); setSetup(false); }} /> : <Shell />}
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  h1: { color: '#fff', fontSize: 32, lineHeight: 40, fontFamily: F.s, letterSpacing: -0.5 },
  p: { color: 'rgba(255,255,255,.78)', fontSize: 15, lineHeight: 22, fontFamily: F.l, marginTop: 8, marginBottom: 20 },
  card: { backgroundColor: 'rgba(22,26,42,.8)', borderColor: 'rgba(255,255,255,.17)', borderWidth: 1, borderRadius: 24, padding: 16, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 18, fontFamily: F.m, flex: 1 },
  cardText: { color: 'rgba(255,255,255,.78)', fontSize: 14, lineHeight: 21, fontFamily: F.l, marginTop: 10, marginBottom: 14 },
  num: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,.3)', alignItems: 'center', justifyContent: 'center' },
  numTxt: { color: '#fff', fontSize: 14, fontFamily: F.m },
  btn: { minHeight: 52, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnStrong: { backgroundColor: '#fff', borderColor: '#fff' },
  btnTxt: { color: '#fff', fontSize: 16, fontFamily: F.m, textAlign: 'center' },
  err: { position: 'absolute', left: 16, right: 16, bottom: 16, padding: 12, borderRadius: 16, backgroundColor: 'rgba(40,10,16,.9)' },
  errTxt: { color: '#ffb3bd', fontSize: 13, fontFamily: F.r },
});

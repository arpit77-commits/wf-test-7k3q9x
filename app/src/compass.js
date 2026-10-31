// "Where is the phone looking" as a unit vector (east, north, up), plus the compass calibration state.
//
// Main path: Android's own fused rotation sensor (gyroscope + accelerometer + compass),
// the same kind of sensor Google Sky Map and star apps use. The gyroscope keeps the
// sky steady when the hand shakes or moves sideways; the compass only slowly corrects
// the direction. Heading is turned from magnetic north to true north for your place.
//
// Fallback (phones without that sensor): accelerometer + magnetometer with a One Euro
// filter (strong smoothing when still, quick when turning).
//
// Looking up: when the back camera points near straight up, its own heading becomes
// meaningless (it spins). There the heading comes from the top of the screen instead,
// blended smoothly from 70° up, so the sky never spins when you look overhead.
import { Accelerometer, Magnetometer } from 'expo-sensors';
import WfOrientation from '../modules/wf-orientation';

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return l > 1e-6 ? [v[0] / l, v[1] / l, v[2] / l] : null; };

// One Euro filter for a 3D vector (one speed estimate shared by the three axes).
export function vecFilter(minCut, beta, dCut) {
  let x = null, t0 = 0;
  const dx = [0, 0, 0];
  const alpha = (cut, dt) => { const tau = 1 / (2 * Math.PI * cut); return 1 / (1 + tau / dt); };
  return (v, t) => {
    if (!x) { x = v.slice(); t0 = t; return x; }
    const dt = Math.min(0.2, Math.max(0.004, (t - t0) / 1000)); t0 = t;
    const ad = alpha(dCut, dt);
    for (let i = 0; i < 3; i++) dx[i] += ((v[i] - x[i]) / dt - dx[i]) * ad;
    const speed = Math.hypot(dx[0], dx[1], dx[2]);
    const a = alpha(minCut + beta * speed, dt);
    for (let i = 0; i < 3; i++) x[i] += (v[i] - x[i]) * a;
    return x;
  };
}

const R1 = Math.PI / 180, MAXALT = 85 * R1; // the sky view itself stops at 85° up
// d = back camera, u = top of screen (both east/north/up). Below 70° up the heading is the camera's own
// (exact, whatever the tilt). From 70° to straight up it blends smoothly to "opposite the top of the
// screen", which stays steady overhead where the camera's own heading would spin.
export function lookVector(d, u) {
  const sa = Math.max(-1, Math.min(1, d[2]));
  if (!u) return d;
  const a = Math.abs(Math.asin(sa)) / R1;
  let t = Math.max(0, Math.min(1, (a - 70) / 20)); t = t * t * (3 - 2 * t);
  const g = t * Math.sign(sa);
  const we = d[0] - u[0] * g, wn = d[1] - u[1] * g, l = Math.hypot(we, wn);
  if (l < 1e-9) return d;
  const alt = Math.max(-MAXALT, Math.min(MAXALT, Math.asin(sa))), c = Math.cos(alt);
  return [we / l * c, wn / l * c, Math.sin(alt)];
}

// magnetic -> true north (degrees east), for the fallback path
let declDeg = 0;
export function setCompassPlace(lat, lon) {
  try { if (WfOrientation && WfOrientation.setPlace && isFinite(lat) && isFinite(lon)) declDeg = WfOrientation.setPlace(lat, lon) || 0; } catch (e) {}
}

function sender(onVec) {
  let lastSend = 0, last = null;
  return (o, t) => {
    if (t - lastSend < 30) return;
    if (last && Math.abs(o[0] - last[0]) + Math.abs(o[1] - last[1]) + Math.abs(o[2] - last[2]) < 0.0012) return; // moved less than about 0.05 degrees
    lastSend = t; last = o.slice();
    onVec(o[0], o[1], o[2]);
  };
}

// calibration: 'ok' or 'cal' (compass needs a figure-8), reported only when it changes
function calReporter(onStatus) {
  let last = '', bad = 0;
  return (acc, herr) => {
    // Android accuracy: 0 unreliable, 1 low, 2 medium, 3 high (-1 = not reported)
    const poor = acc === 0 || acc === 1 || (herr > 25);
    bad = poor ? Math.min(bad + 1, 40) : 0;
    const st = bad >= 15 ? 'cal' : (bad === 0 ? 'ok' : last || 'ok'); // must stay poor ~0.5 s before warning
    if (st !== last) { last = st; onStatus && onStatus(st); }
  };
}

let nativeOwner = 0;
async function startFused(onVec, onStatus, alive, my) {
  if (!WfOrientation || !WfOrientation.start || !WfOrientation.addListener) return null;
  let kind = '';
  try { kind = WfOrientation.start(); nativeOwner = my; } catch (e) { kind = ''; }
  if (kind !== 'rv') return null;
  const f = vecFilter(1.6, 4, 1.2); // very light: the fused sensor is already smooth
  const send = sender(onVec), cal = calReporter(onStatus);
  let got = false;
  const sub = WfOrientation.addListener('onDir', (d) => {
    if (!alive()) return;
    const b = norm([d.x, d.y, d.z]); if (!b) return; got = true;
    const top = d.tx != null ? norm([d.tx, d.ty, d.tz]) : null;
    const t = Date.now(); send(f(lookVector(b, top), t), t);
    cal(d.acc, d.herr);
  });
  // the native sensor is shared: only the newest start may switch it off
  const stop = () => { try { sub.remove(); if (nativeOwner === my) { nativeOwner = 0; WfOrientation.stop(); } } catch (e) {} };
  // if no data arrives (broken sensor on some phones), fall back
  await new Promise((r) => setTimeout(r, 1200));
  if (!got || !alive()) { stop(); return null; }
  return stop;
}

async function startAccMag(onVec, onStatus, alive) {
  const okA = await Accelerometer.isAvailableAsync().catch(() => false);
  const okM = await Magnetometer.isAvailableAsync().catch(() => false);
  if (!okA || !okM) { onStatus && onStatus('none'); return () => {}; }
  if (!alive()) return () => {};
  Accelerometer.setUpdateInterval(20);
  Magnetometer.setUpdateInterval(20);
  const fg = vecFilter(0.3, 0.5, 1.0), fm = vecFilter(0.35, 1.0, 1.0), fo = vecFilter(0.5, 1.0, 1.0); // tuned in a noise simulation
  const send = sender(onVec);
  let g = null, m = null;
  const rot = (v) => { if (!declDeg) return v; const r = declDeg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [v[0] * c + v[1] * s, v[1] * c - v[0] * s, v[2]]; };
  const compute = (t) => {
    if (!g || !m || !alive()) return;
    const H = norm(cross(m, g)); const A = norm(g); if (!H || !A) return;
    const M = cross(A, H);
    const d = norm([-H[2], -M[2], -A[2]]); if (!d) return; // back camera, east/north/up
    const top = norm([H[1], M[1], A[1]]); // top of the screen
    send(fo(lookVector(rot(d), top ? rot(top) : null), t), t);
  };
  const s1 = Accelerometer.addListener((d) => { const v = norm([d.x, d.y, d.z]); if (!v) return; const t = Date.now(); g = fg(v, t); compute(t); });
  const s2 = Magnetometer.addListener((d) => { const v = norm([d.x, d.y, d.z]); if (!v) return; m = fm(v, Date.now()); });
  onStatus && onStatus('ok');
  return () => { s1.remove(); s2.remove(); };
}

// Only one compass runs at a time. A start that is overtaken by a newer start/stop cleans itself up.
let gen = 0, current = null;
export async function startCompass(onVec, onStatus) {
  const my = ++gen; const alive = () => my === gen;
  if (current) { try { current(); } catch (e) {} current = null; }
  let stop = await startFused(onVec, onStatus, alive, my).catch(() => null);
  if (!stop && alive()) stop = await startAccMag(onVec, onStatus, alive);
  if (!alive()) { try { stop && stop(); } catch (e) {} return () => {}; }
  current = stop || null;
  return () => { if (my === gen) { gen++; } if (current === stop) current = null; try { stop && stop(); } catch (e) {} };
}
export function stopCompass() {
  gen++; if (current) { try { current(); } catch (e) {} current = null; }
  if (nativeOwner) { nativeOwner = 0; try { WfOrientation && WfOrientation.stop && WfOrientation.stop(); } catch (e) {} }
}

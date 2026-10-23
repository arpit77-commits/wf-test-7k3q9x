// "Where is the back of the phone pointing" as a unit vector (east, north, up).
//
// Main path: Android's own fused rotation sensor (gyroscope + accelerometer + compass),
// the same kind of sensor Google Sky Map and star apps use. The gyroscope keeps the
// sky steady when the hand shakes or moves sideways; the compass only slowly corrects
// the direction. Heading is turned from magnetic north to true north for your place.
//
// Fallback (phones without that sensor): accelerometer + magnetometer with a One Euro
// filter (strong smoothing when still, quick when turning).
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

async function startFused(onVec) {
  if (!WfOrientation || !WfOrientation.start || !WfOrientation.addListener) return null;
  let kind = '';
  try { kind = WfOrientation.start(); } catch (e) { kind = ''; }
  if (kind !== 'rv') return null;
  const f = vecFilter(1.6, 4, 1.2); // very light: the fused sensor is already smooth
  const send = sender(onVec);
  let got = false;
  const sub = WfOrientation.addListener('onDir', (d) => {
    const v = norm([d.x, d.y, d.z]); if (!v) return; got = true;
    const t = Date.now(); send(f(v, t), t);
  });
  // if no data arrives (broken sensor on some phones), fall back
  await new Promise((r) => setTimeout(r, 1200));
  if (!got) { try { sub.remove(); WfOrientation.stop(); } catch (e) {} return null; }
  return () => { try { sub.remove(); WfOrientation.stop(); } catch (e) {} };
}

async function startAccMag(onVec, onStatus) {
  const okA = await Accelerometer.isAvailableAsync().catch(() => false);
  const okM = await Magnetometer.isAvailableAsync().catch(() => false);
  if (!okA || !okM) { onStatus && onStatus('no ' + (!okA ? 'accelerometer' : 'magnetometer')); return () => {}; }
  Accelerometer.setUpdateInterval(20);
  Magnetometer.setUpdateInterval(20);
  const fg = vecFilter(0.3, 0.5, 1.0), fm = vecFilter(0.35, 1.0, 1.0), fo = vecFilter(0.5, 1.0, 1.0); // tuned in a noise simulation
  const send = sender(onVec);
  let g = null, m = null;
  const compute = (t) => {
    if (!g || !m) return;
    const H = norm(cross(m, g)); const A = norm(g); if (!H || !A) return;
    const M = cross(A, H);
    let d = norm([-H[2], -M[2], -A[2]]); if (!d) return; // east, north, up of the direction the back camera faces
    if (declDeg) { const r = declDeg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); d = [d[0] * c + d[1] * s, d[1] * c - d[0] * s, d[2]]; }
    send(fo(d, t), t);
  };
  const s1 = Accelerometer.addListener((d) => { const v = norm([d.x, d.y, d.z]); if (!v) return; const t = Date.now(); g = fg(v, t); compute(t); });
  const s2 = Magnetometer.addListener((d) => { const v = norm([d.x, d.y, d.z]); if (!v) return; m = fm(v, Date.now()); });
  onStatus && onStatus('ok');
  return () => { s1.remove(); s2.remove(); };
}

export async function startCompass(onVec, onStatus) {
  const stop = await startFused(onVec).catch(() => null);
  if (stop) { onStatus && onStatus('ok'); return stop; }
  return startAccMag(onVec, onStatus);
}

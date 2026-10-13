// Reads the phone's own magnetic-field and gravity sensors and turns them into
// "where is the back of the phone pointing" (a unit vector: east, north, up).
// Works on any Android that has an accelerometer and a magnetometer (almost all).
import { Accelerometer, Magnetometer } from 'expo-sensors';

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return l > 1e-6 ? [v[0] / l, v[1] / l, v[2] / l] : null; };

export async function startCompass(onVec, onStatus) {
  const okA = await Accelerometer.isAvailableAsync().catch(() => false);
  const okM = await Magnetometer.isAvailableAsync().catch(() => false);
  if (!okA || !okM) { onStatus && onStatus('no ' + (!okA ? 'accelerometer' : 'magnetometer')); return () => {}; }
  Accelerometer.setUpdateInterval(20);
  Magnetometer.setUpdateInterval(20);
  let g = null, m = null, lastSend = 0;
  const lp = (prev, n, k0, big, kBig) => { if (prev) { const d = Math.hypot(n.x - prev[0], n.y - prev[1], n.z - prev[2]) / (Math.hypot(prev[0], prev[1], prev[2]) || 1); return lp0(prev, n, d > big ? kBig : k0); } return [n.x, n.y, n.z]; };
  const lp0 = (prev, n, k) => (prev ? [prev[0] + (n.x - prev[0]) * k, prev[1] + (n.y - prev[1]) * k, prev[2] + (n.z - prev[2]) * k] : [n.x, n.y, n.z]);
  const compute = () => {
    if (!g || !m) return;
    const now = Date.now(); if (now - lastSend < 30) return; lastSend = now;
    const H = norm(cross(m, g)); const A = norm(g); if (!H || !A) return;
    const M = cross(A, H);
    onVec(-H[2], -M[2], -A[2]); // east, north, up of the direction the back camera faces
  };
  const s1 = Accelerometer.addListener((d) => { g = lp(g, d, 0.09, 0.22, 0.35); compute(); });
  const s2 = Magnetometer.addListener((d) => { m = lp(m, d, 0.05, 0.12, 0.28); });
  onStatus && onStatus('ok');
  return () => { s1.remove(); s2.remove(); };
}

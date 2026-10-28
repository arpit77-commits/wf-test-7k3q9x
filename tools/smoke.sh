#!/bin/bash
# Real-Android smoke test: install the APK on an emulator, open it, and check the screens actually appear.
APK=$(ls apk/*.apk | head -1)
PKG=app.wishfall.test
fail(){ echo "::error::SMOKE: $1"; exit 1; }
note(){ echo "::notice::SMOKE: $1"; }
adb install -r -g "$APK" || fail "install failed"
adb logcat -c; adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
dump(){ adb shell uiautomator dump /sdcard/u.xml >/dev/null 2>&1; adb shell cat /sdcard/u.xml 2>/dev/null; }
texts(){ echo "$1" | grep -o 'text="[^"]\+"' | sed 's/text="//;s/"$//' | tr '\n' '|' | cut -c1-600; }
tap_text(){ local X="$1" T="$2"; local b; b=$(echo "$X" | tr '>' '\n' | grep "text=\"$T\"" | grep -o 'bounds="[^"]*"' | head -1 | grep -o '[0-9]\+' | tr '\n' ' '); [ -z "$b" ] && return 1; set -- $b; adb shell input tap $(( ($1+$3)/2 )) $(( ($2+$4)/2 )); return 0; }
sleep 15
X=$(dump)
if echo "$X" | grep -q 'Four quick steps'; then
  note "first-run setup shown"
  for i in 1 2 3; do adb shell input swipe 540 1700 540 400 300; sleep 1; done
  X=$(dump); tap_text "$X" "Open Wishfall" || fail "no Open Wishfall button: $(texts "$X")"
fi
ok=""
for i in 1 2 3 4 5 6; do
  sleep 6; X=$(dump)
  if echo "$X" | grep -q 'text="Upcoming events"\|content-desc="Upcoming events"'; then ok=1; break; fi
done
adb exec-out screencap -p > /tmp/s1.png
python3 - <<'PY'
from PIL import Image, ImageStat
im=Image.open('/tmp/s1.png').convert('L'); w,h=im.size
bar=im.crop((0,int(h*0.86),w,int(h*0.95))); st=ImageStat.Stat(bar)
print("::notice::SMOKE: screen %dx%d mean %.1f, bottom-bar area mean %.1f sd %.1f"%(w,h,ImageStat.Stat(im).mean[0],st.mean[0],st.stddev[0]))
PY
adb logcat -d > /tmp/lc.txt
python3 - <<'PY'
import re
L=[l.strip() for l in open('/tmp/lc.txt',errors='ignore') if re.search(r'WFLOG|WFSTATE|WFERR|Uncaught|FATAL|chromium',l)]
L=[re.sub(r'^\S+ \S+ +\d+ +\d+ \w ','',l)[:260] for l in L][-60:]
s=' || '.join(L)
for i in range(0,min(len(s),9000),900): print('::warning::LOG '+s[i:i+900].replace('%','%25'))
PY
pip3 install -q websocket-client >/dev/null 2>&1 || pip3 install -q --break-system-packages websocket-client >/dev/null 2>&1
timeout 90 python3 tools/cdp.py || echo "::warning::cdp probe failed"
[ -n "$ok" ] || fail "Tonight screen never appeared. Visible text: $(texts "$X")"
note "Tonight screen OK: $(texts "$X" | cut -c1-200)"
tap_text "$X" "Events" || fail "no Events tab"
sleep 5; X=$(dump)
echo "$X" | grep -q 'Coming up' || fail "Events screen did not open: $(texts "$X")"
note "Events tab OK"
adb shell input keyevent 4; sleep 4; X=$(dump)
echo "$X" | grep -q 'Upcoming events' || fail "Back from Events did not return to Tonight: $(texts "$X")"
note "Back to Tonight OK"
tap_text "$X" "Sky" || fail "no Sky tab"; sleep 8; X=$(dump)
echo "$X" | grep -qi 'Search the sky\|3D view' || fail "Sky screen did not open: $(texts "$X")"
note "Sky tab OK"
adb shell input keyevent 4; sleep 4; X=$(dump)
echo "$X" | grep -q 'Upcoming events' || fail "Back from Sky did not return to Tonight: $(texts "$X")"
note "ALL SMOKE CHECKS PASSED"

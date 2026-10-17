/* Wishfall events: eclipses, named full moons, planet events and ISS passes, all worked out on the phone.
   WFE.build(observer, now) -> events (sync).  WFE.iss(observer, now, cb) -> ISS passes (needs a fresh orbit file, cached).
   Sky maths: astronomy-engine (MIT). ISS orbit maths: satellite.js (MIT). */
(function () {
  var A = window.Astronomy, D = Math.PI / 180, KM = 149597870.7, DAY = 86400000;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], WK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  var DIRW = ['north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest'];
  function ab(az) { return DIRS[Math.round((((az % 360) + 360) % 360) / 22.5) % 16]; }
  function dw(az) { return DIRW[Math.round((((az % 360) + 360) % 360) / 22.5) % 16]; }
  function ob(o) { return new A.Observer(o.lat, o.lon, 0); }
  function hz(body, date, o) { var obs = ob(o), eq = A.Equator(body, date, obs, true, true), h = A.Horizon(date, obs, eq.ra, eq.dec, 'normal'); return { alt: h.altitude, az: h.azimuth, ra: eq.ra, dec: eq.dec }; }
  function sunAlt(date, o) { return hz(A.Body.Sun, date, o).alt; }
  function t12(d) { var h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'pm' : 'am'; h = h % 12; if (h === 0) h = 12; return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap; }
  function t12s(d) { var h = d.getHours(), m = d.getMinutes(), s = d.getSeconds(), ap = h >= 12 ? 'pm' : 'am'; h = h % 12; if (h === 0) h = 12; return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + ' ' + ap; }
  function dayStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dayDiff(d, now) { return Math.round((dayStart(d) - dayStart(now)) / DAY); }
  function rel(n) { return n <= 0 ? 'Today' : n === 1 ? 'Tomorrow' : 'in ' + n + ' days'; }
  function dateTxt(d) { return WK[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function whenTxt(d, now) { var n = dayDiff(d, now); return dateTxt(d) + (d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : '') + ' · ' + (n <= 0 ? 'today' : rel(n)); }
  function mins(m) { m = Math.round(m); if (m < 60) return m + ' min'; var h = Math.floor(m / 60), r = m % 60; return h + ' h' + (r ? ' ' + r + ' min' : ''); }
  function addMin(d, m) { return new Date(d.getTime() + m * 60000); }
  function fixed(n, k) { return (Math.round(n * Math.pow(10, k)) / Math.pow(10, k)).toString(); }


  /* ---------- little pictures for each kind of event (no network, drawn here) ---------- */
  var PCOL = { Mercury: '#bdb5a9', Venus: '#f3dca4', Mars: '#e0774c', Jupiter: '#dcb98f', Saturn: '#e6d3a0', Uranus: '#a9e1e6', Neptune: '#6f8ff0' };
  function iconSvg(ic) {
    ic = ic || {}; var k = ic.k, g = '', defs = '', R = 36;
    var disc = function (id, c1, c2, c3) { return '<radialGradient id="' + id + '" cx="38%" cy="34%" r="75%"><stop offset="0" stop-color="' + c1 + '"/><stop offset=".6" stop-color="' + c2 + '"/><stop offset="1" stop-color="' + c3 + '"/></radialGradient>'; };
    if (k === 'full') {
      defs = disc('a', '#fffdf4', '#e9e2cf', '#a9a291');
      g = '<circle cx="48" cy="48" r="' + R + '" fill="url(#a)"/><circle cx="38" cy="40" r="8" fill="#000" opacity=".07"/><circle cx="58" cy="54" r="10" fill="#000" opacity=".06"/><circle cx="46" cy="64" r="5" fill="#000" opacity=".06"/>';
    } else if (k === 'lunar') {
      var cv = Math.max(0, Math.min(1, ic.cover || 0)), dx = (1 - cv) * 2.3 * R;
      defs = disc('a', '#fffdf4', '#e9e2cf', '#a9a291') + disc('b', '#d9623a', '#a63a22', '#4d160f') + '<clipPath id="c"><circle cx="48" cy="48" r="' + R + '"/></clipPath>';
      g = '<circle cx="48" cy="48" r="' + R + '" fill="url(#a)"/><g clip-path="url(#c)"><circle cx="' + (48 - dx) + '" cy="48" r="' + (R * 1.08) + '" fill="' + (ic.red ? 'url(#b)' : '#2a1a1c') + '" opacity="' + (ic.red ? 0.95 : cv > 0.4 ? 0.88 : 0.4) + '"/></g>' + (ic.red ? '<circle cx="48" cy="48" r="' + (R - 0.6) + '" fill="none" stroke="#ffb487" stroke-opacity=".35" stroke-width="1.2"/>' : '');
    } else if (k === 'solar') {
      var cs = Math.max(0, Math.min(1, ic.cover || 0)), dx2 = (1 - cs) * 2.1 * R;
      defs = '<radialGradient id="a" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe6"/><stop offset=".7" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9d3c"/></radialGradient><radialGradient id="h"><stop offset=".55" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>';
      g = '<circle cx="48" cy="48" r="47" fill="url(#h)"/><circle cx="48" cy="48" r="' + R + '" fill="url(#a)"/><circle cx="' + (48 + dx2) + '" cy="48" r="' + (R * 0.98) + '" fill="#06070d"/>';
    } else if (k === 'sun') {
      defs = '<radialGradient id="a" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe6"/><stop offset=".7" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9d3c"/></radialGradient><radialGradient id="h"><stop offset=".5" stop-color="#ffcf7a" stop-opacity=".5"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>';
      g = '<circle cx="48" cy="48" r="47" fill="url(#h)"/><circle cx="48" cy="48" r="28" fill="url(#a)"/>';
    } else if (k === 'pair') {
      var pc = ic.c || '#f4efe2';
      defs = disc('a', '#fffdf4', '#e9e2cf', '#a9a291') + '<radialGradient id="h"><stop offset="0" stop-color="' + pc + '" stop-opacity=".8"/><stop offset="1" stop-color="' + pc + '" stop-opacity="0"/></radialGradient>' + disc('b', '#ffffff', pc, pc);
      g = (ic.moon ? '<circle cx="34" cy="56" r="25" fill="url(#a)"/>' : '<circle cx="34" cy="56" r="14" fill="url(#b)"/>') + '<circle cx="70" cy="30" r="14" fill="url(#h)"/><circle cx="70" cy="30" r="6.5" fill="url(#b)"/>';
    } else if (k === 'planet') {
      var c = ic.c || '#e6d3a0';
      defs = disc('a', '#ffffff', c, '#3b3340');
      var rg = function (op, d) { return '<g transform="rotate(-18 48 48)"><path d="' + d + '" fill="none" stroke="#e8d9b0" stroke-opacity="' + op + '" stroke-width="3.5"/></g>'; };
      g = (ic.ring ? rg(0.45, 'M2 48 A46 12 0 0 1 94 48') : '') + '<circle cx="48" cy="48" r="' + (ic.ring ? 24 : 30) + '" fill="url(#a)"/>' + (ic.ring ? rg(0.9, 'M2 48 A46 12 0 0 0 94 48') : '');
    } else if (k === 'iss') {
      defs = '<radialGradient id="h"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".55"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient>';
      g = '<circle cx="48" cy="48" r="44" fill="url(#h)"/><g transform="rotate(-24 48 48)" fill="#e8eeff"><rect x="8" y="46.5" width="80" height="3" rx="1.5"/><rect x="40" y="40" width="16" height="16" rx="4"/><rect x="10" y="28" width="16" height="12" rx="1.5" opacity=".9"/><rect x="10" y="56" width="16" height="12" rx="1.5" opacity=".9"/><rect x="70" y="28" width="16" height="12" rx="1.5" opacity=".9"/><rect x="70" y="56" width="16" height="12" rx="1.5" opacity=".9"/></g>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs>' + defs + '</defs>' + g + '</svg>';
  }
  var PIMG = { Mercury: './a/e_pl_mercury.png', Venus: './a/e_pl_venus.png', Mars: './a/e_pl_mars.png', Jupiter: './a/e_pl_jupiter.png', Saturn: './a/e_pl_saturn.png', Moon: './a/e_moon_full.png' };
  /* real pictures where we have them: layers are placed in a square box, numbers are percent of the box */
  function layers(ic) {
    ic = ic || {};
    if (ic.k === 'planet' && ic.p && PIMG[ic.p]) return [ic.ring ? { src: PIMG[ic.p], l: 0, t: 0, w: 100 } : { src: PIMG[ic.p], l: 4, t: 4, w: 92 }];
    if (ic.k === 'pair' && ic.a && ic.b && PIMG[ic.a] && PIMG[ic.b]) {
      var big = ic.a === 'Moon' ? 66 : 54;
      return [{ src: PIMG[ic.a], l: -4, t: 38, w: big }, { src: PIMG[ic.b], l: ic.b === 'Saturn' ? 52 : 56, t: ic.b === 'Saturn' ? -2 : 4, w: ic.b === 'Saturn' ? 50 : 40 }];
    }
    if (ic.k === 'full' && PIMG.Moon) return [{ src: PIMG.Moon, l: 4, t: 4, w: 92 }];
    return [{ src: iconUrl(ic), l: 0, t: 0, w: 100 }];
  }
  function iconUrl(ic) { return 'data:image/svg+xml;utf8,' + encodeURIComponent(iconSvg(ic)); }

  /* ---------- named full moons ---------- */
  var FNAME = ['Wolf Moon', 'Snow Moon', 'Worm Moon', 'Pink Moon', 'Flower Moon', 'Strawberry Moon', 'Buck Moon', 'Sturgeon Moon', 'Corn Moon', "Hunter's Moon", 'Beaver Moon', 'Cold Moon'];
  var FBLURB = {
    'Wolf Moon': 'The first full Moon of the year. Named for wolves howling in deep winter.',
    'Snow Moon': 'Named for the heaviest snow of late winter.',
    'Worm Moon': 'Named for the soil warming up and earthworms coming out as spring starts.',
    'Pink Moon': 'Named after pink wildflowers that bloom in early spring. The Moon itself is not pink.',
    'Flower Moon': 'Named for the flowers of late spring.',
    'Strawberry Moon': 'Named for strawberry picking season. It often hangs low and golden.',
    'Buck Moon': 'Named for the time young deer grow new antlers.',
    'Sturgeon Moon': 'Named for the big fish that were easy to catch in late summer.',
    'Corn Moon': 'Named for the corn harvest.',
    'Harvest Moon': 'The full Moon closest to the autumn equinox. It rises soon after sunset on several nights in a row, so farmers could harvest by its light.',
    "Hunter's Moon": 'The full Moon after the Harvest Moon. Named for the time of year when people hunted ahead of winter.',
    'Beaver Moon': 'Named for the time beavers build their winter dams.',
    'Cold Moon': 'The last full Moon of the year, in the coldest, longest nights.'
  };
  function moonDist(date) { var v = A.GeoMoon(date); return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) * KM; }
  function fullMoons(from, days) {
    var out = [], t = from, end = from.getTime() + days * DAY, guard = 0, seen = {};
    // start a month early so "second full Moon of the month" is right
    var s0 = new Date(from.getTime() - 32 * DAY);
    var list = [], cur = s0;
    while (guard++ < 30) { var q; try { q = A.SearchMoonPhase(180, cur, 40); } catch (e) { q = null; } if (!q) break; list.push(q.date); if (q.date.getTime() > end) break; cur = new Date(q.date.getTime() + 5 * DAY); }
    // harvest moon for each year: closest to the September equinox
    var harvest = {};
    list.forEach(function (d) { var y = d.getFullYear(), eq; try { eq = A.Seasons(y).sep_equinox.date; } catch (e) { return; } var diff = Math.abs(d - eq); if (diff < 16 * DAY && (!harvest[y] || diff < harvest[y].diff)) harvest[y] = { diff: diff, t: d.getTime() }; });
    list.forEach(function (d, i) {
      if (d.getTime() < dayStart(from).getTime() || d.getTime() > end) return;
      var y = d.getFullYear(), m = d.getMonth(), name = FNAME[m], tags = [];
      if (harvest[y] && harvest[y].t === d.getTime()) name = 'Harvest Moon';
      else if (harvest[y] && i > 0 && list[i - 1].getTime() === harvest[y].t) name = "Hunter's Moon";
      else if (m === 9 && harvest[y] && new Date(harvest[y].t).getMonth() === 9) name = 'Hunter\'s Moon';
      var dist = moonDist(d);
      var prev = list[i - 1];
      var blue = prev && prev.getFullYear() === d.getFullYear() && prev.getMonth() === d.getMonth();
      if (blue) { tags.push('Blue Moon'); }
      if (dist <= 361500) tags.push('Supermoon'); else if (dist >= 404500) tags.push('Micromoon');
      out.push({ date: d, name: name, tags: tags, dist: dist, blue: !!blue });
    });
    return out;
  }
  function moonNameFor(date) { var l = fullMoons(new Date(date.getTime() - 20 * DAY), 40); for (var i = 0; i < l.length; i++) { if (Math.abs(l[i].date - date) < DAY) return l[i]; } return null; }

  /* ---------- eclipses ---------- */
  var ICON = { full: 'full', lunar: 'lunar', solar: 'solar', planet: 'planet', pair: 'pair', iss: 'iss', sun: 'sun' };
  function lunarEclipses(o, now, horizon) {
    var out = [], e, n = 0, end = now.getTime() + horizon * DAY;
    try { e = A.SearchLunarEclipse(new Date(now.getTime() - DAY)); } catch (er) { return out; }
    while (e && n++ < 8 && e.peak.date.getTime() <= end) {
      var pk = e.peak.date, kind = e.kind, mp = hz(A.Body.Moon, pk, o);
      var pen0 = addMin(pk, -e.sd_penum), pen1 = addMin(pk, e.sd_penum);
      var par0 = e.sd_partial > 0 ? addMin(pk, -e.sd_partial) : null, par1 = e.sd_partial > 0 ? addMin(pk, e.sd_partial) : null;
      var tot0 = e.sd_total > 0 ? addMin(pk, -e.sd_total) : null, tot1 = e.sd_total > 0 ? addMin(pk, e.sd_total) : null;
      var rows = [];
      function row(d, label) { var h = hz(A.Body.Moon, d, o); rows.push({ t: d, time: t12(d), label: label, alt: h.alt, az: h.az, up: h.alt > 0 }); }
      row(pen0, 'Faint shading starts');
      if (par0) row(par0, 'Dark bite starts');
      if (tot0) row(tot0, 'Total eclipse starts');
      row(pk, kind === 'total' ? 'Deepest point' : 'Greatest eclipse');
      if (tot1) row(tot1, 'Total eclipse ends');
      if (par1) row(par1, 'Dark bite ends');
      row(pen1, 'Faint shading ends');
      var upAt = rows.filter(function (r) { return r.up; });
      var visPart = par0 ? (hz(A.Body.Moon, par0, o).alt > 0 || mp.alt > 0 || hz(A.Body.Moon, par1, o).alt > 0) : mp.alt > 0;
      if (!upAt.length || !visPart || (kind === 'penumbral' && mp.alt < 0)) { try { e = A.NextLunarEclipse(e.peak); } catch (er) { break; } continue; }
      var ph = hz(A.Body.Sun, pk, o).alt;
      var name = kind === 'total' ? 'Total lunar eclipse' : kind === 'partial' ? 'Partial lunar' : 'Faint lunar eclipse';
      var verdict, words, chipTxt;
      if (kind === 'total') { verdict = mp.alt >= 15 ? 'Go' : 'Maybe'; words = mp.alt >= 15 ? "Don't miss this one" : 'Low in the sky'; }
      else if (kind === 'partial') { verdict = mp.alt >= 20 ? 'Go' : 'Maybe'; words = mp.alt >= 20 ? 'A clear bite out of the Moon' : 'Low in the sky'; }
      else { verdict = 'Skip'; words = 'Very subtle, hard to notice'; }
      if (mp.alt < 5 && kind !== 'penumbral') { verdict = 'Maybe'; words = 'Low in the sky'; }
      var dur = kind === 'total' ? e.sd_total * 2 : kind === 'partial' ? e.sd_partial * 2 : e.sd_penum * 2;
      var blurb = kind === 'total'
        ? 'The Earth slides between the Sun and the Moon. For a while the Moon sits fully inside Earth\'s shadow and turns a deep red or orange. People call it a Blood Moon. It is safe to look at with your eyes, binoculars or a telescope.'
        : kind === 'partial'
          ? 'Part of the Moon slides into the darkest part of Earth\'s shadow. It looks like a dark bite taken out of the Moon. It is safe to look at with your eyes, binoculars or a telescope.'
          : 'The Moon only passes through the faint outer part of Earth\'s shadow. It dims a little, and most people will not notice. Look for a slight greyness on one edge around the middle of the event.';
      var upRow = rows.filter(function (r) { return !r.up; }).length;
      out.push({
        id: 'lec-' + pk.getTime(), cat: 'eclipse', type: kind === 'total' ? 'Total lunar eclipse' : kind === 'partial' ? 'Partial lunar eclipse' : 'Faint lunar eclipse', name: name, nick: kind === 'total' ? 'Blood Moon' : '',
        kicker: kind === 'total' ? 'Lunar eclipse · Blood Moon' : 'Lunar eclipse', icon: { k: 'lunar', cover: kind === 'total' ? 1 : kind === 'partial' ? 0.55 : 0.15, red: kind === 'total' },
        date: pk, days: dayDiff(pk, now), whenTxt: whenTxt(pk, now), dateTxt: dateTxt(pk), verdict: verdict, verdictWords: words,
        detail: kind === 'total' ? 'Moon turns red · peak ' + t12(pk) + ' · ' + Math.round(mp.alt) + '° high' : 'Peak ' + t12(pk) + ' · Moon ' + Math.round(mp.alt) + '° high',
        rows: rows, tiles: [{ l: 'Lasts', v: mins(dur) }, { l: 'Look', v: ab(mp.az) }, { l: 'Height', v: Math.max(0, Math.round(mp.alt)) + '°' }],
        blurb: blurb, tip: upRow ? 'The Moon is below the horizon for part of this eclipse from your place, so you will see only some of it.' : 'The whole eclipse is above your horizon.',
        safe: true, hasAlt: true, alt: mp.alt, az: mp.az, eclKind: kind
      });
      try { e = A.NextLunarEclipse(e.peak); } catch (er) { break; }
    }
    return out;
  }
  function solarEclipses(o, now, horizon) {
    var out = [], e, n = 0, end = now.getTime() + horizon * DAY;
    try { e = A.SearchLocalSolarEclipse(new Date(now.getTime() - DAY), ob(o)); } catch (er) { return out; }
    while (e && n++ < 6 && e.peak.time.date.getTime() <= end) {
      var pk = e.peak.time.date, kind = e.kind, obsc = e.obscuration;
      if (e.peak.altitude > 0 && obsc >= 0.01) {
        var rows = [];
        function row(ev, label) { if (!ev) return; var d = ev.time.date; rows.push({ t: d, time: t12(d), label: label, alt: ev.altitude, az: 0, up: ev.altitude > 0 }); }
        row(e.partial_begin, 'Partial eclipse starts');
        if (kind === 'total') { row(e.total_begin, 'Total eclipse starts'); } else if (kind === 'annular') { row(e.total_begin, 'Ring of fire starts'); }
        rows.push({ t: pk, time: t12(pk), label: 'Greatest eclipse', alt: e.peak.altitude, az: 0, up: true });
        if (kind === 'total') { row(e.total_end, 'Total eclipse ends'); } else if (kind === 'annular') { row(e.total_end, 'Ring of fire ends'); }
        row(e.partial_end, 'Partial eclipse ends');
        var sp = hz(A.Body.Sun, pk, o), pct = Math.round(obsc * 100);
        var verdict = kind !== 'partial' || pct >= 50 ? 'Go' : pct >= 15 ? 'Maybe' : 'Skip';
        var name = kind === 'total' ? 'Total solar eclipse' : kind === 'annular' ? 'Ring of fire' : 'Partial solar';
        var start = e.partial_begin ? e.partial_begin.time.date : pk, stop = e.partial_end ? e.partial_end.time.date : pk;
        out.push({
          id: 'sec-' + pk.getTime(), cat: 'eclipse', type: name, name: name, nick: '', kicker: 'Solar eclipse', icon: { k: 'solar', cover: Math.min(1, obsc) },
          date: pk, days: dayDiff(pk, now), whenTxt: whenTxt(pk, now), dateTxt: dateTxt(pk), verdict: verdict,
          verdictWords: kind === 'partial' ? (pct >= 50 ? 'A big bite out of the Sun' : pct >= 15 ? 'A small bite, worth a look' : 'Barely noticeable') : (kind === 'total' ? 'Daytime turns to dusk' : 'The Sun becomes a bright ring'),
          detail: pct + '% of the Sun covered · peak ' + t12(pk) + ' · ' + Math.round(e.peak.altitude) + '° high',
          rows: rows, tiles: [{ l: 'Covered', v: pct + '%' }, { l: 'Look', v: ab(sp.az) }, { l: 'Height', v: Math.max(0, Math.round(e.peak.altitude)) + '°' }],
          blurb: kind === 'total' ? 'The Moon covers the whole Sun from where you are. Only during the few minutes of totality is it safe to look without protection.' : kind === 'annular' ? 'The Moon is a little too small to cover the Sun, so a thin bright ring is left around it.' : 'The Moon covers only part of the Sun from where you are. The Sun looks like it has a bite taken out of it.',
          safe: false, hasAlt: true, alt: e.peak.altitude, az: sp.az, eclKind: kind,
          safety: 'Never look straight at the Sun, not even for a moment. Use eclipse glasses marked ISO 12312-2, or watch a projection. Normal sunglasses are not safe.'
        });
      }
      try { e = A.NextLocalSolarEclipse(e.peak.time, ob(o)); } catch (er) { break; }
    }
    return out;
  }

  /* ---------- planets ---------- */
  var PLN = [['Mercury', A.Body.Mercury], ['Venus', A.Body.Venus], ['Mars', A.Body.Mars], ['Jupiter', A.Body.Jupiter], ['Saturn', A.Body.Saturn]];
  function geoV(body, d) { return A.GeoVector(body, d, true); }
  function sepDeg(b1, b2, d) { return A.AngleBetween(geoV(b1, d), geoV(b2, d)); }
  // best moment in the 24 hours around t when the sky is dark and both bodies are above the horizon
  function bestDark(b1, b2, t, o, spanH) {
    var best = null, step = 30 * 60000;
    for (var k = -spanH * 2; k <= spanH * 2; k++) {
      var d = new Date(t.getTime() + k * step), sa = sunAlt(d, o); if (sa > -5) continue;
      var h1 = hz(b1, d, o), h2 = hz(b2, d, o), low = Math.min(h1.alt, h2.alt); if (low < 6) continue;
      var sc = low - Math.abs(k) * 0.05; if (!best || sc > best.sc) best = { sc: sc, d: d, h1: h1, h2: h2 };
    }
    return best;
  }
  function closePairs(o, now, horizon) {
    var out = [], steps = Math.ceil(horizon * 4), pairs = [];
    var moon = A.Body.Moon;
    // Moon with bright planets
    [1, 2, 3, 4].forEach(function (pi) { pairs.push({ a: moon, b: PLN[pi][1], an: 'Moon', bn: PLN[pi][0], moon: true }); });
    // planet with planet
    for (var i = 0; i < 5; i++) for (var j = i + 1; j < 5; j++) pairs.push({ a: PLN[i][1], b: PLN[j][1], an: PLN[i][0], bn: PLN[j][0], moon: false });
    pairs.forEach(function (pr) {
      var stepH = pr.moon ? 6 : 24, n = pr.moon ? Math.ceil(horizon * 24 / 6) : Math.ceil(horizon);
      var maxSep = pr.moon ? 5.5 : 3.0, prev2 = null, prev1 = null, t0 = new Date(now.getTime() - DAY);
      var S = [];
      for (var k = 0; k <= n + 1; k++) { var d = new Date(t0.getTime() + k * stepH * 3600000); S.push({ d: d, s: sepDeg(pr.a, pr.b, d) }); }
      for (var k2 = 1; k2 < S.length - 1; k2++) {
        if (S[k2].s <= S[k2 - 1].s && S[k2].s < S[k2 + 1].s && S[k2].s < (pr.moon ? 9 : 5)) {
          // refine hourly around the minimum
          var bm = S[k2], lo = new Date(S[k2].d.getTime() - stepH * 3600000), hi = new Date(S[k2].d.getTime() + stepH * 3600000);
          for (var th = lo.getTime(); th <= hi.getTime(); th += 3600000) { var dd = new Date(th), ss = sepDeg(pr.a, pr.b, dd); if (ss < bm.s) bm = { d: dd, s: ss }; }
          // pick the dark moment nearest the minimum in the next 36h window around it
          var b = bestDark(pr.a, pr.b, bm.d, o, 14);
          if (!b || b.d.getTime() < now.getTime() - 3 * 3600000) continue;
          var tsep = A.AngleBetween(A.Equator(pr.a, b.d, ob(o), true, true) ? vecEq(pr.a, b.d, o) : null, vecEq(pr.b, b.d, o));
          if (tsep > maxSep) continue;
          out.push({ pr: pr, d: b.d, tsep: tsep, h1: b.h1, h2: b.h2, minD: bm.d });
        }
      }
    });
    return out;
  }
  function vecEq(body, d, o) { var e = A.Equator(body, d, ob(o), true, true), r = e.ra * 15 * D, de = e.dec * D; return { x: Math.cos(de) * Math.cos(r), y: Math.cos(de) * Math.sin(r), z: Math.sin(de), t: A.MakeTime ? undefined : undefined }; }
  function planetEvents(o, now, horizon) {
    var out = [];
    closePairs(o, now, Math.min(horizon, 240)).forEach(function (c) {
      var d = c.d, pr = c.pr, sep = c.tsep, mid = c.h1.alt < c.h2.alt ? c.h1 : c.h2;
      var bright = (pr.moon || pr.an === 'Venus' || pr.bn === 'Venus' || pr.an === 'Jupiter' || pr.bn === 'Jupiter');
      var verdict = sep <= 2 && mid.alt >= 15 ? 'Go' : 'Maybe';
      if (pr.moon && sep > 3.5) verdict = 'Maybe';
      var title = pr.moon ? 'Moon & ' + pr.bn : pr.an + ' & ' + pr.bn;
      var lowEv = (hz(A.Body.Sun, d, o).alt > -12 && hz(A.Body.Sun, d, o).alt < -5);
      var blurb = pr.moon ? 'The Moon passes close to ' + pr.bn + ' in the sky. Easy to spot with your eyes. A great one for a photo, and nothing needed but a clear view.' : 'The two planets look very close together in the sky, even though they are millions of kilometres apart. Binoculars show both in one view.';
      out.push({
        id: 'pl-' + (pr.moon ? 'm' : 'p') + pr.an.slice(0, 3) + pr.bn.slice(0, 3) + '-' + Math.round(d.getTime() / 3600000), cat: 'planet', type: pr.moon ? 'Close pair' : 'Planets meet', name: title, nick: '', kicker: pr.moon ? 'Moon and planet' : 'Planets meet',
        icon: { k: 'pair', moon: !!pr.moon, a: pr.moon ? 'Moon' : pr.an, b: pr.bn, c: PCOL[pr.bn] || '#f4efe2' }, date: d, days: dayDiff(d, now), whenTxt: whenTxt(d, now), dateTxt: dateTxt(d), verdict: verdict,
        verdictWords: verdict === 'Go' ? 'Close and easy to see' : 'Worth a look',
        detail: fixed(sep, 1) + '° apart · best ' + t12(d) + ' · ' + ab(mid.az) + ' sky',
        rows: [{ t: d, time: t12(d), label: 'Best time to look', alt: mid.alt, az: mid.az, up: true }],
        tiles: [{ l: 'Apart', v: fixed(sep, 1) + '°' }, { l: 'Look', v: ab(mid.az) }, { l: 'Height', v: Math.round(mid.alt) + '°' }],
        blurb: blurb, tip: lowEv ? 'It sits in twilight, so look as soon as the sky turns dark enough.' : 'Look ' + dw(mid.az) + ', about ' + Math.round(mid.alt) + '° above the horizon.', hasAlt: true, alt: mid.alt, az: mid.az
      });
    });
    // oppositions
    [['Mars', A.Body.Mars], ['Jupiter', A.Body.Jupiter], ['Saturn', A.Body.Saturn]].forEach(function (p) {
      try {
        var t = A.SearchRelativeLongitude(p[1], 0, new Date(now.getTime() - DAY)), d = t.date; if (!d || d.getTime() > now.getTime() + horizon * DAY) return;
        var mag = A.Illumination(p[1], d).mag, midn = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 30), h = hz(p[1], new Date(d.getTime()), o);
        // best time that night: when it is highest after dark
        var bestH = null; for (var k = 0; k < 16; k++) { var tt = new Date(dayStart(d).getTime() + (18 + k * 0.5) * 3600000); if (sunAlt(tt, o) > -8) continue; var hh = hz(p[1], tt, o); if (!bestH || hh.alt > bestH.h.alt) bestH = { h: hh, t: tt }; }
        if (!bestH || bestH.h.alt < 5) return;
        var dist = A.GeoVector(p[1], d, true); var au = Math.sqrt(dist.x * dist.x + dist.y * dist.y + dist.z * dist.z);
        out.push({
          id: 'opp-' + p[0] + '-' + d.getTime(), cat: 'planet', type: 'Opposition', name: p[0] + ' at best', nick: '', kicker: 'Opposition', icon: { k: 'planet', p: p[0], ring: p[0] === 'Saturn', c: PCOL[p[0]] },
          date: bestH.t, days: dayDiff(d, now), whenTxt: whenTxt(d, now), dateTxt: dateTxt(d), verdict: 'Go', verdictWords: 'Brightest and closest this year',
          detail: 'Up all night · best ' + t12(bestH.t) + ' · ' + ab(bestH.h.az) + ' sky',
          rows: [{ t: bestH.t, time: t12(bestH.t), label: 'Highest after dark', alt: bestH.h.alt, az: bestH.h.az, up: true }],
          tiles: [{ l: 'Brightness', v: (mag > 0 ? '+' : '') + fixed(mag, 1) }, { l: 'Look', v: ab(bestH.h.az) }, { l: 'Height', v: Math.round(bestH.h.alt) + '°' }],
          blurb: p[0] + ' is on the opposite side of Earth from the Sun. It rises at sunset, stays up all night, and is at its closest and brightest. ' + (p[0] === 'Mars' ? 'A telescope shows the dark patches and polar cap.' : p[0] === 'Jupiter' ? 'Binoculars show its four big moons as tiny dots in a line.' : 'A small telescope shows the rings.'),
          tip: 'Look ' + dw(bestH.h.az) + ' at about ' + t12(bestH.t) + '. It is about ' + fixed(au, 1) + ' times the Earth–Sun distance away.', hasAlt: true, alt: bestH.h.alt, az: bestH.h.az
        });
      } catch (er) { }
    });
    // greatest elongation of Mercury and Venus
    [['Mercury', A.Body.Mercury], ['Venus', A.Body.Venus]].forEach(function (p) {
      var from = new Date(now.getTime() - DAY), g = 0;
      while (g++ < 2) {
        try {
          var ev = A.SearchMaxElongation(p[1], from), d = ev.time.date; if (d.getTime() > now.getTime() + horizon * DAY) break; from = new Date(d.getTime() + 25 * DAY);
          if (d.getTime() < now.getTime() - DAY) continue;
          var evening = ev.visibility === 'evening', best = null;
          for (var k = -12; k <= 12; k++) { var tt = new Date(d.getTime() + k * 1800000 + (evening ? 0 : 0)); }
          // look from sunset (evening) or before sunrise (morning) on that day
          var base = dayStart(d); for (var q = 0; q < 24 * 4; q++) { var t2 = new Date(base.getTime() + q * 15 * 60000), sa = sunAlt(t2, o); if (sa > -3 || sa < -12) continue; var hh = hz(p[1], t2, o); if (hh.alt < 4) continue; var sunUpSide = (evening ? q > 48 : q < 48); if (!sunUpSide) continue; if (!best || hh.alt > best.h.alt) best = { t: t2, h: hh }; }
          if (!best) continue;
          var good = p[0] === 'Venus' || ev.elongation >= 20;
          out.push({
            id: 'elo-' + p[0] + '-' + d.getTime(), cat: 'planet', type: 'Farthest from Sun', name: p[0] + ' at best', nick: '', kicker: 'Greatest elongation · ' + (evening ? 'evening' : 'morning'), icon: { k: 'planet', p: p[0], c: PCOL[p[0]] },
            date: best.t, days: dayDiff(d, now), whenTxt: whenTxt(d, now), dateTxt: dateTxt(d), verdict: good && best.h.alt >= 10 ? 'Go' : 'Maybe', verdictWords: p[0] === 'Mercury' ? 'The best chance to spot Mercury' : 'Brilliant in the ' + (evening ? 'evening' : 'morning') + ' sky',
            detail: Math.round(ev.elongation) + '° from the Sun · ' + (evening ? 'after sunset' : 'before sunrise') + ' · ' + ab(best.h.az),
            rows: [{ t: best.t, time: t12(best.t), label: evening ? 'Look soon after sunset' : 'Look before sunrise', alt: best.h.alt, az: best.h.az, up: true }],
            tiles: [{ l: 'From Sun', v: Math.round(ev.elongation) + '°' }, { l: 'Look', v: ab(best.h.az) }, { l: 'Height', v: Math.round(best.h.alt) + '°' }],
            blurb: p[0] + ' only ever stays near the Sun, so it is lost in the glare most of the time. This is when it is as far from the Sun as it gets, which is the best moment to see it in a darker sky.',
            tip: 'Look ' + dw(best.h.az) + ' ' + (evening ? 'soon after sunset.' : 'before sunrise.') + ' You need a clear, low horizon.', hasAlt: true, alt: best.h.alt, az: best.h.az
          });
        } catch (er) { break; }
      }
    });
    return out;
  }
  function seasonEvents(o, now, horizon) {
    var out = [], y = now.getFullYear(), s = [];
    [y, y + 1].forEach(function (yy) { try { var S = A.Seasons(yy); s.push(['March equinox', S.mar_equinox.date, 'Day and night are almost equal. The Sun rises due east and sets due west.'], ['June solstice', S.jun_solstice.date, 'The Sun reaches its highest point in the north. Longest day in the north, shortest in the south.'], ['September equinox', S.sep_equinox.date, 'Day and night are almost equal. The Sun rises due east and sets due west.'], ['December solstice', S.dec_solstice.date, 'The Sun reaches its lowest point in the north. Shortest day in the north, longest in the south.']); } catch (er) { } });
    s.forEach(function (x) {
      var d = x[1]; if (d.getTime() < dayStart(now).getTime() || d.getTime() > now.getTime() + horizon * DAY) return;
      var sol = x[0].indexOf('solstice') > 0, north = o.lat >= 0;
      var nm = x[0].indexOf('March') === 0 ? (north ? 'Spring equinox' : 'Autumn equinox') : x[0].indexOf('September') === 0 ? (north ? 'Autumn equinox' : 'Spring equinox') : x[0].indexOf('June') === 0 ? (north ? 'Summer solstice' : 'Winter solstice') : (north ? 'Winter solstice' : 'Summer solstice');
      var sr = null, ss = null; try { sr = A.SearchRiseSet(A.Body.Sun, ob(o), +1, dayStart(d), 1); ss = A.SearchRiseSet(A.Body.Sun, ob(o), -1, dayStart(d), 1); } catch (er) { }
      var len = sr && ss ? (ss.date - sr.date) / 60000 : null;
      out.push({
        id: 'sea-' + d.getTime(), cat: 'more', type: 'Season', name: nm, nick: '', kicker: 'Sun', icon: { k: 'sun' }, date: d, days: dayDiff(d, now), whenTxt: whenTxt(d, now), dateTxt: dateTxt(d), verdict: 'Info', verdictWords: 'A turning point of the year',
        detail: 'At ' + t12(d) + (len ? ' · daylight ' + mins(len) : ''),
        rows: [{ t: d, time: t12(d), label: nm + ' begins', alt: 0, az: 0, up: true }], tiles: [{ l: 'Daylight', v: len ? Math.floor(len / 60) + ' h ' + Math.round(len % 60) + ' m' : '—' }, { l: 'Sunrise', v: sr ? t12(sr.date) : '—' }, { l: 'Sunset', v: ss ? t12(ss.date) : '—' }],
        blurb: x[2], tip: 'This is not something to watch for in the sky. It marks a change in the seasons.', hasAlt: false, info: true
      });
    });
    return out;
  }

  /* ---------- full moon cards ---------- */
  function moonEvents(o, now, horizon) {
    var out = [];
    fullMoons(dayStart(now), horizon).forEach(function (f) {
      var tags = f.tags, sup = tags.indexOf('Supermoon') >= 0, blue = tags.indexOf('Blue Moon') >= 0, micro = tags.indexOf('Micromoon') >= 0;
      var title = blue ? 'Blue Moon' : f.name;
      var mr = null; try { mr = A.SearchRiseSet(A.Body.Moon, ob(o), +1, new Date(f.date.getTime() - 12 * 3600000), 1); } catch (er) { }
      out.push({
        id: 'fm-' + f.date.getTime(), cat: 'moon', type: 'Full moon', name: title, nick: sup ? 'Supermoon' : '', kicker: 'Full Moon', icon: { k: 'full' }, date: f.date, days: dayDiff(f.date, now), whenTxt: whenTxt(f.date, now), dateTxt: dateTxt(f.date), verdict: 'Info',
        chip: sup ? 'Supermoon' : blue ? 'Rare' : micro ? 'Small' : 'Bright', tags: tags, fname: f.name, dist: f.dist,
        detail: (sup ? 'Closest and biggest this year' : blue ? 'The second full Moon of the month' : micro ? 'Farthest from Earth, a little smaller' : 'Bright all night, faint stars fade') + (mr ? ' · rises ' + t12(mr.date) : ''),
        blurb: (blue ? 'A Blue Moon is the second full Moon in one calendar month. It is not blue in colour. ' : '') + (FBLURB[f.name] || '') + (sup ? ' It is also a Supermoon: the Moon is near its closest point to Earth, so it looks a bit bigger and brighter than usual.' : '') + (micro ? ' It is also near its farthest point from Earth, so it looks a little smaller than usual.' : ''),
        rise: mr ? mr.date : null
      });
    });
    return out;
  }


  /* what is special about a given moment: an eclipse, or a named full Moon. Used by the Tonight and Moon screens. */
  var dnCache = {};
  function dayNote(o, ref) {
    ref = ref || new Date(); var r = ref.getTime();
    var key = Math.round(o.lat * 10) + ',' + Math.round(o.lon * 10) + ',' + Math.floor(r / 600000);
    if (dnCache[key] !== undefined) return dnCache[key];
    var res = null;
    try {
      lunarEclipses(o, new Date(r), 2).forEach(function (e) { if (!res && Math.abs(e.date.getTime() - r) < 14 * 3600000) res = { kind: 'eclipse', title: e.name.indexOf('eclipse') < 0 ? e.name + ' eclipse' : e.name, note: e.detail + '. ' + e.blurb, id: e.id }; });
      if (!res) solarEclipses(o, new Date(r), 2).forEach(function (e) { if (!res && dayStart(e.date).getTime() === dayStart(ref).getTime()) res = { kind: 'eclipse', title: e.name.indexOf('eclipse') < 0 ? e.name + ' eclipse' : e.name, note: e.detail + '. ' + e.blurb, id: e.id }; });
      if (!res) moonEvents(o, new Date(r - DAY), 3).forEach(function (e) { if (!res && (Math.abs(e.date.getTime() - r) < 12 * 3600000 || dayStart(e.date).getTime() === dayStart(ref).getTime())) res = { kind: 'moon', title: e.name, note: e.blurb, id: e.id }; });
    } catch (er) { res = null; }
    dnCache[key] = res; return res;
  }

  /* ---------- everything, in date order ---------- */
  var _evm = {};
  function build(o, now, opts) {
    now = now || new Date();
    var k = o.lat.toFixed(1) + ',' + o.lon.toFixed(1) + ':' + now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();
    if (_evm[k]) return _evm[k].slice();
    var store = {};
    try { var raw = localStorage.getItem('wf_evc'); if (raw) { store = JSON.parse(raw, function (kk, v) { return v && typeof v === 'object' && v.$d !== undefined ? new Date(v.$d) : v; }) || {}; if (store[k]) { _evm[k] = store[k]; return store[k].slice(); } } } catch (e) { store = {}; }
    var v = build0(o, now, opts); _evm[k] = v;
    try { var keys = Object.keys(store); while (keys.length > 2) { delete store[keys.shift()]; } store[k] = v; localStorage.setItem('wf_evc', JSON.stringify(store, function (kk, val) { var x = this[kk]; return x instanceof Date ? { $d: x.getTime() } : val; })); } catch (e) { }
    return v.slice();
  }
  function build0(o, now, opts) {
    now = now || new Date(); opts = opts || {};
    var all = [];
    try { all = all.concat(lunarEclipses(o, now, 430)); } catch (e) { }
    try { all = all.concat(solarEclipses(o, now, 430)); } catch (e) { }
    try { all = all.concat(planetEvents(o, now, 300)); } catch (e) { }
    try { all = all.concat(seasonEvents(o, now, 200)); } catch (e) { }
    all.sort(function (a, b) { return a.date - b.date; });
    return all.filter(function (e) { return e.days >= 0 || (e.date.getTime() > now.getTime() - 6 * 3600000); });
  }
  function find(id, o, now) {
    now = now || new Date();
    var list = build(o, now).concat(moonEvents(o, now, 120)).concat(issCache.list || []);
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ---------- ISS ---------- */
  var issCache = { list: [], tle: null };
  function tleOk(l1, l2) { return l1 && l2 && l1.charAt(0) === '1' && l2.charAt(0) === '2' && l1.length >= 68 && l2.length >= 68; }
  function loadTle(cb) {
    var key = 'wf_iss_tle', cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { }
    if (cached && Date.now() - cached.t < 2 * DAY && tleOk(cached.l1, cached.l2)) { cb(cached, true); return; }
    var done = false;
    function ok(l1, l2, src) { if (done) return; if (!tleOk(l1, l2)) return; done = true; var v = { l1: l1, l2: l2, t: Date.now(), src: src }; try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } cb(v, false); }
    function parseText(tx) { var ls = (tx || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean); var a = ls.filter(function (s) { return s.charAt(0) === '1' && s.length > 60; })[0], b = ls.filter(function (s) { return s.charAt(0) === '2' && s.length > 60; })[0]; return [a, b]; }
    var urls = [['https://api.wheretheiss.at/v1/satellites/25544/tles?format=json', 'json'], ['https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle', 'text']];
    var fails = 0;
    function fail() { fails++; if (fails >= urls.length && !done) { done = true; cb(cached && tleOk(cached.l1, cached.l2) ? cached : null, true); } }
    urls.forEach(function (u) {
      try {
        var c = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(function () { if (c) c.abort(); }, 8000);
        fetch(u[0], c ? { signal: c.signal } : {}).then(function (r) { return u[1] === 'json' ? r.json() : r.text(); }).then(function (x) { clearTimeout(to); if (u[1] === 'json') ok(x.line1, x.line2, 'wheretheiss.at'); else { var p = parseText(x); ok(p[0], p[1], 'celestrak'); } fail0(); }).catch(function () { clearTimeout(to); fail(); });
      } catch (e) { fail(); }
    });
    function fail0() { /* success path, nothing to do */ }
  }
  function issPasses(tle, o, now, days) {
    var S = window.satellite; if (!S || !tle) return [];
    var rec; try { rec = S.twoline2satrec(tle.l1, tle.l2); } catch (e) { return []; }
    var obsG = { latitude: o.lat * D, longitude: o.lon * D, height: 0 };
    function state(d) { var pv = S.propagate(rec, d); if (!pv.position) return null; var gmst = S.gstime(d), ecf = S.eciToEcf(pv.position, gmst), la = S.ecfToLookAngles(obsG, ecf); return { alt: la.elevation / D, az: ((la.azimuth / D) % 360 + 360) % 360, rng: la.rangeSat, eci: pv.position }; }
    function sunVec(d) { var e = A.GeoVector(A.Body.Sun, d, true); var l = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z); return [e.x / l, e.y / l, e.z / l]; }
    function sunlit(p, d) { // cylindrical Earth shadow, positions in km
      var s = sunVec(d), dot = p.x * s[0] + p.y * s[1] + p.z * s[2]; if (dot > 0) return true; var px = p.x - dot * s[0], py = p.y - dot * s[1], pz = p.z - dot * s[2]; return Math.sqrt(px * px + py * py + pz * pz) > 6371; }
    var step = 20000, out = [], t0 = Math.floor(now.getTime() / step) * step, end = t0 + days * DAY, inPass = false, cur = null;
    for (var t = t0; t < end; t += step) {
      var d = new Date(t), st = state(d); if (!st) continue;
      if (st.alt > 0) {
        if (!inPass) { inPass = true; cur = { start: d, maxAlt: st.alt, maxT: d, maxAz: st.az, startAz: st.az, vis: [], lit: false }; }
        if (st.alt > cur.maxAlt) { cur.maxAlt = st.alt; cur.maxT = d; cur.maxAz = st.az; }
        cur.endAz = st.az; cur.end = d;
        var dark = sunAlt(d, o) < -6, lit = sunlit(st.eci, d);
        if (dark && lit && st.alt > 8) { cur.vis.push({ d: d, alt: st.alt, az: st.az }); }
      } else if (inPass) {
        inPass = false;
        if (cur.vis.length >= 3 && cur.maxAlt >= 15) {
          var v0 = cur.vis[0], v1 = cur.vis[cur.vis.length - 1], vm = cur.vis.reduce(function (a, b) { return b.alt > a.alt ? b : a; }, cur.vis[0]);
          out.push({ start: cur.start, end: cur.end, maxAlt: cur.maxAlt, maxT: cur.maxT, v0: v0, v1: v1, vm: vm, startAz: cur.startAz, endAz: cur.endAz, maxAz: cur.maxAz, visSec: cur.vis.length * step / 1000 });
        }
        cur = null;
      }
    }
    return out;
  }
  function issEvents(tle, o, now) {
    var ps = issPasses(tle, o, now, 7), out = [];
    ps.forEach(function (p) {
      var d = p.vm.d, verdict = p.vm.alt >= 45 ? 'Go' : p.vm.alt >= 25 ? 'Maybe' : 'Skip';
      var rows = [{ t: p.v0.d, time: t12s(p.v0.d), label: 'Appears in the ' + dw(p.v0.az) + ', ' + Math.round(p.v0.alt) + '° up', alt: p.v0.alt, az: p.v0.az, up: true }, { t: p.vm.d, time: t12s(p.vm.d), label: 'Highest point, in the ' + dw(p.vm.az), alt: p.vm.alt, az: p.vm.az, up: true }, { t: p.v1.d, time: t12s(p.v1.d), label: 'Fades in the ' + dw(p.v1.az) + ', ' + Math.round(p.v1.alt) + '° up', alt: p.v1.alt, az: p.v1.az, up: true }];
      var dur = Math.round(p.visSec / 60 * 10) / 10;
      out.push({
        id: 'iss-' + Math.round(p.vm.d.getTime() / 1000), cat: 'iss', type: 'Space station', name: 'Space station', nick: '', kicker: 'International Space Station', icon: { k: 'iss' }, date: p.v0.d, days: dayDiff(p.v0.d, now), whenTxt: dateTxt(p.v0.d) + ' · ' + (dayDiff(p.v0.d, now) <= 0 ? 'today' : rel(dayDiff(p.v0.d, now))), dateTxt: dateTxt(p.v0.d), verdict: verdict,
        verdictWords: verdict === 'Go' ? 'High and bright' : verdict === 'Maybe' ? 'A decent pass' : 'Low, may be hidden by buildings',
        detail: t12(p.v0.d) + ' · ' + Math.round(p.vm.alt) + '° high · ' + ab(p.v0.az) + ' to ' + ab(p.v1.az), rows: rows,
        tiles: [{ l: 'Visible', v: dur >= 1 ? fixed(dur, 1).replace(/\.0$/, '') + ' min' : Math.round(p.visSec) + ' sec' }, { l: 'Look', v: ab(p.v0.az) }, { l: 'Height', v: Math.round(p.vm.alt) + '°' }],
        blurb: 'The International Space Station orbits about 400 km up and crosses the sky in a few minutes. It looks like a very bright, steady star moving smoothly across the sky, with no blinking lights. It is only visible when the sky is dark where you are but the station is still in sunlight.',
        tip: 'Look ' + dw(p.v0.az) + ' at ' + t12s(p.v0.d) + '. It crosses the sky and disappears in the ' + dw(p.v1.az) + '. Times shift a little if the orbit is changed.', hasAlt: true, alt: p.vm.alt, az: p.vm.az, passEnd: p.v1.d
      });
    });
    return out;
  }
  function iss(o, now, cb) {
    now = now || new Date();
    loadTle(function (tle, cached) {
      if (!tle) { cb({ ok: false, list: [], reason: 'offline' }); return; }
      var list = []; try { list = issEvents(tle, o, now); } catch (e) { }
      issCache.list = list; issCache.tle = tle; cb({ ok: true, list: list, cached: cached, tleAgeH: Math.round((Date.now() - tle.t) / 3600000) });
    });
  }

  window.WFE = { iconUrl: iconUrl, layers: layers, dayNote: dayNote, build: build, find: find, moonEvents: moonEvents, fullMoons: fullMoons, moonNameFor: moonNameFor, iss: iss, issEvents: issEvents, issPasses: issPasses, _t12: t12, ab: ab, dw: dw };
})();

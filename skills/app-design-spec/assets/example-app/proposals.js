/* Tidewise: visual directions (step 3 of the process).
   Three directions drawn on the same three key screens with the same data, so the
   only difference is the visual language. Each group's tokens are scoped to its
   phones by the shell, so shared classes (proposals.css) pick up each palette.
   For page variants (step 4), use the same shape: one group per screen, items are
   the variants, mark the recommended one with pick:true and a note. */

const type = (display, number) => ({
  largeTitle: { size: 34, line: 41, weight: display === 'serif' ? 500 : 700, font: display },
  title: { size: 22, line: 28, weight: display === 'serif' ? 500 : 700, font: display },
  bigNumber: { size: number.size, line: number.size + 4, weight: number.weight, font: number.font },
  headline: { size: 17, line: 22, weight: 600 },
  callout: { size: 16, line: 21, weight: 400 },
  subhead: { size: 15, line: 20, weight: 400 },
  footnote: { size: 13, line: 18, weight: 400 },
  caption: { size: 12, line: 16, weight: 500 }
});
const space = { xxs: 4, xs: 8, s: 12, m: 16, l: 20, xl: 32 };

/* ——— Shared data: one cosine per spot ——— */
const PERIOD = 12.42, NOW = 14 + 20 / 60;
const SPOTS = [
  { name: 'Gull Cove', area: 'North shore · 2.4 km', hi: 9.8, amp: 2.1, mean: 2.5 },
  { name: 'Harbour Steps', area: 'Old town · 0.6 km', hi: 11.6, amp: 1.8, mean: 2.3 },
  { name: 'North Sands', area: 'Bay road · 5.1 km', hi: 10.5, amp: 2.4, mean: 2.7 },
  { name: 'Kelp Point', area: 'Headland · 8.9 km', hi: 8.9, amp: 2.0, mean: 2.4 }
];
const DAYS = ['Today', 'Mon', 'Tue', 'Wed', 'Thu'];
const SPRING = [0.92, 1, 1.07, 1.12, 1.07];
const heightAt = (s, t) => s.mean + s.amp * SPRING[Math.max(0, Math.min(4, Math.floor(t / 24)))] * Math.cos((2 * Math.PI * (t - s.hi)) / PERIOD);
function events(s, from, to) {
  const out = [];
  for (let k = -3; k < 14; k++) {
    const hi = s.hi + k * PERIOD, lo = hi + PERIOD / 2;
    if (hi >= from && hi < to) out.push({ type: 'High', t: hi, h: heightAt(s, hi) });
    if (lo >= from && lo < to) out.push({ type: 'Low', t: lo, h: heightAt(s, lo) });
  }
  return out.sort((a, b) => a.t - b.t);
}
function clock(t) {
  const m = Math.round((((t % 24) + 24) % 24) * 60), hh = Math.floor(m / 60) % 24, mm = m % 60;
  return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`;
}
const metres = v => `${v.toFixed(1)} m`;
const inHours = dt => { const m = Math.round(dt * 60); return `${Math.floor(m / 60)} h ${m % 60} min`; };
const gull = SPOTS[0];

/* ——— Icons ——— */
const P = {
  waves: '<path d="M2.5 9c2.4 0 2.4-2 4.8-2s2.4 2 4.7 2 2.4-2 4.7-2 2.4 2 4.8 2M2.5 14c2.4 0 2.4-2 4.8-2s2.4 2 4.7 2 2.4-2 4.7-2 2.4 2 4.8 2M2.5 19c2.4 0 2.4-2 4.8-2s2.4 2 4.7 2 2.4-2 4.7-2 2.4 2 4.8 2"/>',
  pin: '<path d="M12 21.5s-6.8-6.2-6.8-11.3a6.8 6.8 0 0 1 13.6 0c0 5.1-6.8 11.3-6.8 11.3z"/><circle cx="12" cy="10.2" r="2.4"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4z"/><path d="M10 21a2.1 2.1 0 0 0 4 0"/>',
  down: '<path d="M12 4.5v15M6 13.5l6 6 6-6"/>',
  up: '<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>',
  back: '<path d="M15 5.5 8.5 12l6.5 6.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};
const icon = n => raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`);
const tabs = active => h`<nav class="pv-tabs" role="tablist">${[['today', 'waves', 'Today'], ['spots', 'pin', 'Spots'], ['alerts', 'bell', 'Alerts']].map(([id, i, l]) => h`<button class="pv-tab" role="tab" aria-selected="${String(id === active)}">${icon(i)}<span>${l}</span></button>`)}</nav>`;
const shell = (dir, body, tab) => h`<div class="pv pv-${dir}"><div class="pv-scroll">${body}</div>${tab ? tabs(tab) : ''}</div>`;

function curve(s, W, H, top, max = 5.2) {
  const x = t => (t / 24) * W, y = v => top + (H - top) * (1 - v / max);
  let d = '';
  for (let t = 0; t <= 24.001; t += 0.25) d += `${t ? 'L' : 'M'}${x(t).toFixed(1)} ${y(heightAt(s, t)).toFixed(1)}`;
  return { d, x, y };
}
function chart(s, { W = 322, H = 120, fill = 0.45, full = false } = {}) {
  const { d, x, y } = curve(s, W, H, 8);
  const nx = x(NOW), ny = y(heightAt(s, NOW));
  return raw(`<div class="pv-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tide today">
    ${full ? [1, 2, 3, 4].map(m => `<path d="M0 ${y(m)}H${W}" stroke="var(--c-hairline)"/>`).join('') : ''}
    <path d="${d}L${W} ${H}L0 ${H}Z" fill="var(--c-water)" fill-opacity="${fill}"/>
    <path d="${d}" fill="none" stroke="var(--c-accent)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M${nx} 8V${H}" stroke="var(--c-text)" stroke-width="1.2"/>
    <circle cx="${nx}" cy="${ny}" r="6" fill="var(--c-surface)" stroke="var(--c-text)" stroke-width="2.5"/></svg>
    <div class="pv-axis t-caption"><span>12 am</span><span>6 am</span><span>Noon</span><span>6 pm</span><span>12 am</span></div></div>`);
}
function eventStrip(s) {
  const ev = events(s, 6, 24).slice(0, 3), next = ev.find(e => e.t > NOW);
  return h`<div class="pv-events">${ev.map(e => h`<div class="pv-event ${e === next ? 'next' : ''}"><p class="t-footnote">${e.type}</p><p class="t-headline pv-num">${clock(e.t)}</p><p class="t-footnote pv-num">${metres(e.h)}</p></div>`)}</div>`;
}
const nowLine = s => { const n = events(s, NOW, 30)[0]; return `${n.type} tide in ${inHours(n.t - NOW)}, ${metres(n.h)} at ${clock(n.t)}`; };
const falling = s => heightAt(s, NOW + 0.1) < heightAt(s, NOW);

/* ——— Today, three ways ——— */
const TODAY = {
  a: () => {
    const s = gull, h0 = heightAt(s, NOW), frac = (h0 - (s.mean - s.amp)) / (2 * s.amp);
    const R = 110, C = 2 * Math.PI * R, arc = (C * 0.75 * frac).toFixed(1);
    return shell('a', h`<div class="pv-navrow"><span></span><button class="pv-round" aria-label="Change spot">${icon('pin')}</button></div>
      <p class="t-footnote pv-muted" style="text-align:center">Sunday 14 June</p><h1 class="t-title" style="text-align:center;margin-top:2px">${s.name}</h1>
      <div class="pv-dial">${raw(`<svg viewBox="0 0 250 250" aria-hidden="true"><g transform="rotate(135 125 125)"><circle cx="125" cy="125" r="${R}" fill="none" stroke="var(--c-surface2)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${(C * 0.75).toFixed(1)} ${C}"/><circle cx="125" cy="125" r="${R}" fill="none" stroke="var(--c-accent)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${arc} ${C}"/></g></svg>`)}
        <div class="pv-inner"><p class="t-bigNumber pv-num">${h0.toFixed(1)}</p><p class="t-subhead pv-muted">metres · ${falling(s) ? 'falling' : 'rising'}</p></div>
        <p class="t-callout">${nowLine(s)}</p></div>
      ${eventStrip(s)}`, 'today');
  },
  b: () => {
    const s = gull, h0 = heightAt(s, NOW);
    return shell('b', h`<div class="pv-navrow"><span></span><button class="pv-round" aria-label="Change spot">${icon('pin')}</button></div>
      <div class="pv-title"><p class="t-footnote pv-muted">Today · Sunday 14 June</p><h1 class="t-largeTitle">${s.name}</h1></div>
      <section class="pv-card" style="padding:20px 20px 16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start"><div><p class="t-subhead pv-muted">Now</p><p class="t-bigNumber pv-num">${h0.toFixed(1)} m</p></div>
          <span class="pv-chip t-footnote">${icon(falling(s) ? 'down' : 'up')}${falling(s) ? 'Falling' : 'Rising'}</span></div>
        <p class="t-callout" style="margin:8px 0 16px">${nowLine(s)}</p>${chart(s)}</section>
      ${eventStrip(s)}`, 'today');
  },
  c: () => {
    const s = gull, h0 = heightAt(s, NOW), ev = events(s, 6, 24);
    return shell('c', h`<div class="pv-pad"><div class="pv-navrow"><span class="t-caption pv-muted">SUN 14 JUNE · NORTH SHORE</span><button class="pv-round" aria-label="Change spot">${icon('pin')}</button></div>
      <h1 class="t-largeTitle" style="margin:4px 0 12px">${s.name}</h1></div><div class="pv-rule"></div>
      <div class="pv-pad" style="display:flex;align-items:baseline;justify-content:space-between;margin-top:14px"><p class="t-bigNumber pv-num">${h0.toFixed(1)} m</p><p class="t-subhead pv-muted">${falling(s) ? 'Falling' : 'Rising'}</p></div>
      <p class="t-callout pv-pad" style="margin-top:4px">${nowLine(s)}</p>
      ${chart(s, { W: 402, H: 150, fill: 0.6, full: true })}
      <div class="pv-table">${ev.map(e => h`<div class="pv-trow"><span class="t-caption">${e.type}</span><span class="t-headline pv-num">${clock(e.t)}</span><span class="t-subhead pv-num">${metres(e.h)}</span></div>`)}</div>`, 'today');
  }
};

/* ——— Spots ——— */
function spotRows(dir) {
  return SPOTS.map(s => {
    const n = events(s, NOW, 30)[0], frac = (heightAt(s, NOW) - (s.mean - s.amp)) / (2 * s.amp);
    return h`<div class="pv-row">${dir === 'c' ? '' : h`<span class="pv-badge">${icon('waves')}</span>`}<div class="pv-grow"><p class="t-headline">${s.name}</p><p class="t-footnote">${s.area}</p>${dir === 'a' ? h`<div class="pv-bar"><i style="width:${Math.round(frac * 100)}%"></i></div>` : ''}</div>
      <div class="pv-trail"><p class="t-subhead pv-num">${n.type} ${clock(n.t)}</p><p class="t-footnote pv-num">${metres(n.h)}</p></div></div>`;
  });
}
const SPOTS_VIEW = dir => shell(dir, h`<div class="${dir === 'c' ? 'pv-pad' : ''}"><div class="pv-navrow"><span></span><button class="pv-round" aria-label="Add spot">${icon('plus')}</button></div>
  <h1 class="t-largeTitle pv-title">Spots</h1></div>${dir === 'c' ? h`<div class="pv-rule"></div><div class="pv-pad" style="margin-top:12px">` : ''}<div class="pv-list">${spotRows(dir)}</div>${dir === 'c' ? raw('</div>') : ''}`, 'spots');

/* ——— Week ——— */
function weekRows(s) {
  return DAYS.map((d, i) => {
    const ev = events(s, i * 24, i * 24 + 24);
    const lo = ev.filter(e => e.type === 'Low'), hi = ev.filter(e => e.type === 'High');
    const cell = list => h`<span>${list.slice(0, 2).map(e => h`<b class="t-subhead pv-num">${clock(e.t)} <small class="t-footnote">${metres(e.h)}</small></b>`)}</span>`;
    return h`<div class="pv-day"><p class="t-headline ${i === 0 ? 'pv-today' : ''}">${d}</p>${cell(lo)}${cell(hi)}</div>`;
  });
}
const WEEK = dir => shell(dir, h`<div class="${dir === 'c' ? 'pv-pad' : ''}"><div class="pv-navrow"><button class="pv-round" aria-label="Back">${icon('back')}</button><button class="pv-round" aria-label="Alerts">${icon('bell')}</button></div>
  <div class="pv-title"><p class="t-footnote pv-muted">${SPOTS[2].area}</p><h1 class="t-largeTitle">${SPOTS[2].name}</h1></div></div>
  <div class="${dir === 'c' ? 'pv-pad' : ''}"><div class="pv-list"><div class="pv-day pv-dayhead t-caption"><span></span><span>Low</span><span>High</span></div>${weekRows(SPOTS[2])}</div></div>`);

const items = dir => [
  { label: 'Today', render: () => TODAY[dir]() },
  { label: 'Spots', render: () => SPOTS_VIEW(dir) },
  { label: 'Spot · this week', render: () => WEEK(dir) }
];

defineProposals({
  title: 'Tidewise · visual directions',
  eyebrow: 'Step 3 · pick one direction',
  intro: 'Three directions for the same three screens and the same tide data. Pick one to carry into the page variants; mixing parts is fine, say which. <b>B</b> is the recommendation.',
  groups: [
    {
      id: 'a', title: 'A · Harbour', blurb: 'Night-harbour navy, one big number in a tide dial. Feels like an instrument; best in the dark, weaker in sun.',
      tokens: {
        color: { bg: '#0B1622', surface: '#13212F', surface2: '#1F3346', text: '#EAF2F8', muted: '#97A9BA', hairline: 'rgba(234,242,248,0.12)', accent: '#5CC8D7', accentSoft: 'rgba(92,200,215,0.16)', low: '#F2B66D', water: '#2A6F86', bar: 'rgba(11,22,34,0.9)' },
        type: type('rounded', { size: 72, weight: 600, font: 'rounded' }), space, radius: { chip: 10, tile: 16, card: 22 }
      },
      items: items('a')
    },
    {
      id: 'b', title: 'B · Sand', pick: true,
      blurb: 'Warm sand page, white cards, sea-teal actions. Chart and next tide on one card.',
      why: 'Reads best in bright sun at the beach, and the card holds both the number and the curve, so Today answers its question without scrolling.',
      tokens: {
        color: { bg: '#F5F1E8', surface: '#FFFFFF', surface2: '#ECE6D9', text: '#13262F', muted: '#56646B', hairline: 'rgba(19,38,47,0.12)', accent: '#0A6C72', accentSoft: '#DCEEEC', low: '#8A4B0F', water: '#8CCFCB', bar: 'rgba(245,241,232,0.92)' },
        type: type('display', { size: 56, weight: 600, font: 'rounded' }), space, radius: { chip: 10, tile: 14, card: 20 }
      },
      items: items('b')
    },
    {
      id: 'c', title: 'C · Chart', blurb: 'Paper white, serif headings, full-width chart and ruled tables, like a printed tide table. Dense and calm; less friendly for a first-time user.',
      tokens: {
        color: { bg: '#FBFAF6', surface: '#FFFFFF', surface2: '#EEEBE3', text: '#1A1A1A', muted: '#5E5B55', hairline: 'rgba(26,26,26,0.14)', accent: '#1F4FA3', accentSoft: '#E3EAF6', low: '#9A3B1B', water: '#BCD0EE', bar: 'rgba(251,250,246,0.94)' },
        type: type('serif', { size: 52, weight: 500, font: 'serif' }), space, radius: { chip: 4, tile: 4, card: 6 }
      },
      items: items('c')
    }
  ]
});

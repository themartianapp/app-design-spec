/* Tidewise: final design spec (worked example and starter).
   Fictional app: tide times for the beaches you actually go to.
   Copy this folder, keep the structure, replace the content.

   Shape: tokens -> data -> small components -> screens (states + notes) -> defineSpec.
   Every state's render(ctx) returns HTML for the full 402 x 874 screen. Use h`...`
   for anything that includes data (it escapes), raw() for trusted markup such as icons. */

const tokens = {
  color: {
    bg: '#F5F1E8',          // sand: page background
    surface: '#FFFFFF',     // cards, lists
    surface2: '#ECE6D9',    // fields, tracks, skeletons
    text: '#13262F',
    muted: '#56646B',
    hairline: 'rgba(19,38,47,0.12)',
    accent: '#0A6C72',      // sea teal: actions, rising water
    accentSoft: '#DCEEEC',
    onAccent: '#FFFFFF',
    low: '#8A4B0F',         // low water, warnings
    lowSoft: '#F6E6D2',
    water: '#8CCFCB',       // chart fill only, never text
    danger: '#B3261E'
  },
  type: {
    largeTitle: { size: 34, line: 41, weight: 700, ios: 'largeTitle', sample: 'Gull Cove' },
    title: { size: 22, line: 28, weight: 700, ios: 'title2', sample: 'This week' },
    bigNumber: { size: 56, line: 60, weight: 600, font: 'rounded', ios: 'rounded56', sample: '1.1 m' },
    headline: { size: 17, line: 22, weight: 600, ios: 'headline', sample: 'Low tide 4:01 pm' },
    body: { size: 17, line: 22, weight: 400, ios: 'body', sample: 'Water below 1 m for three hours.' },
    callout: { size: 16, line: 21, weight: 400, ios: 'callout', sample: 'Low tide in 1 h 41 min' },
    subhead: { size: 15, line: 20, weight: 400, ios: 'subheadline', sample: 'North shore · 2.4 km' },
    footnote: { size: 13, line: 18, weight: 400, ios: 'footnote', sample: 'Saved at 7:02 am' },
    caption: { size: 12, line: 16, weight: 500, ios: 'caption', sample: '6 am   Noon   6 pm' }
  },
  space: { xxs: 4, xs: 8, s: 12, m: 16, l: 20, xl: 32 },
  radius: { chip: 10, tile: 14, button: 14, card: 20 }
};

/* ——— Tide data (one cosine per spot, so every number on every screen agrees) ——— */
const PERIOD = 12.42;                // hours between high tides
const NOW = 14 + 20 / 60;            // 2:20 pm
const DAYS = ['Sun 14', 'Mon 15', 'Tue 16', 'Wed 17', 'Thu 18', 'Fri 19', 'Sat 20'];
const SPRING = [0.92, 1, 1.07, 1.12, 1.07, 1, 0.93]; // range grows towards spring tide on Wednesday
const SPOTS = [
  { id: 'gull', name: 'Gull Cove', area: 'North shore · 2.4 km', hi: 9.8, amp: 2.1, mean: 2.5 },
  { id: 'harbour', name: 'Harbour Steps', area: 'Old town · 0.6 km', hi: 11.6, amp: 1.8, mean: 2.3 },
  { id: 'north', name: 'North Sands', area: 'Bay road · 5.1 km', hi: 10.5, amp: 2.4, mean: 2.7 },
  { id: 'kelp', name: 'Kelp Point', area: 'Headland · 8.9 km', hi: 8.9, amp: 2.0, mean: 2.4 }
];
const day = d => SPRING[Math.max(0, Math.min(6, Math.floor(d / 24)))];
const heightAt = (s, t) => s.mean + s.amp * day(t) * Math.cos((2 * Math.PI * (t - s.hi)) / PERIOD);
function events(s, from, to) {
  const out = [];
  for (let k = -3; k < 20; k++) {
    const hi = s.hi + k * PERIOD, lo = hi + PERIOD / 2;
    if (hi >= from && hi < to) out.push({ type: 'High', t: hi, h: heightAt(s, hi) });
    if (lo >= from && lo < to) out.push({ type: 'Low', t: lo, h: heightAt(s, lo) });
  }
  return out.sort((a, b) => a.t - b.t);
}
function clock(t) {
  let mins = Math.round((((t % 24) + 24) % 24) * 60);
  const hh = Math.floor(mins / 60) % 24, mm = mins % 60;
  if (hh === 12 && mm === 0) return 'Noon';
  return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`;
}
const metres = v => `${v.toFixed(1)} m`;
function inHours(dt) {
  const m = Math.round(dt * 60), hh = Math.floor(m / 60), mm = m % 60;
  return hh ? `${hh} h ${mm} min` : `${mm} min`;
}
function belowWindow(s, limit) {           // first stretch today with water below `limit`
  let start = null;
  for (let t = 0; t <= 24; t += 1 / 60) {
    const below = heightAt(s, t) < limit;
    if (below && start === null && t > 6) start = t;
    if (!below && start !== null) return [start, t];
  }
  return null;
}

/* ——— Icons (stand-ins for SF Symbols; names in data-c) ——— */
const PATHS = {
  'water.waves': '<path d="M2.5 9c2.4 0 2.4-2 4.8-2s2.4 2 4.7 2 2.4-2 4.7-2 2.4 2 4.8 2M2.5 14c2.4 0 2.4-2 4.8-2s2.4 2 4.7 2 2.4-2 4.7-2 2.4 2 4.8 2M2.5 19c2.4 0 2.4-2 4.8-2s2.4 2 4.7 2 2.4-2 4.7-2 2.4 2 4.8 2"/>',
  'mappin': '<path d="M12 21.5s-6.8-6.2-6.8-11.3a6.8 6.8 0 0 1 13.6 0c0 5.1-6.8 11.3-6.8 11.3z"/><circle cx="12" cy="10.2" r="2.4"/>',
  'bell': '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4z"/><path d="M10 21a2.1 2.1 0 0 0 4 0"/>',
  'bell.slash': '<path d="M6 16.5V11a6 6 0 0 1 9.4-4.9M18 11v5.5l1.6 2H8M10 21a2.1 2.1 0 0 0 4 0M3.5 3.5l17 17"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'magnifyingglass': '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 4.8 4.8"/>',
  'chevron.right': '<path d="m9 5.5 6.5 6.5L9 18.5"/>',
  'chevron.left': '<path d="M15 5.5 8.5 12l6.5 6.5"/>',
  'location': '<path d="M20.5 3.5 3.5 10.6l7.3 2.6 2.6 7.3z"/>',
  'location.slash': '<path d="M20.5 3.5 13 6.6M9.6 8 3.5 10.6l7.3 2.6 2.6 7.3 2.4-5.8M3.5 3.5l17 17"/>',
  'arrow.down': '<path d="M12 4.5v15M6 13.5l6 6 6-6"/>',
  'arrow.up': '<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>',
  'wifi.slash': '<path d="M2.5 8.8a14 14 0 0 1 4.6-2.7M11 5.3a14 14 0 0 1 10.5 3.5M5.6 12.2a9.5 9.5 0 0 1 3.5-2M14.6 10.4a9.5 9.5 0 0 1 3.8 1.8M9 15.5a4.8 4.8 0 0 1 6 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/><path d="M3.5 3.5l17 17"/>',
  'arrow.clockwise': '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4.8h-4.8"/>',
  'tortoise': '<path d="M4 15.5c0-3.6 3-6.5 7-6.5s7 2.9 7 6.5zM18 13.5h1.8a1.7 1.7 0 0 0 0-3.4H18M6.5 15.5l-.8 2.5M15.5 15.5l.8 2.5M9 9.5l1.5 6M13 9.5l-1.5 6"/>',
  'moon': '<path d="M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.8 7.8 0 1 0 10.1 10.1z"/>',
  'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'
};
const icon = (name, cls) => raw(`<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`);

/* ——— Components ——— */
function nav({ eyebrow, title, leading, trailing }) {
  return h`<header class="tw-nav" data-c="NavigationStack · large title">
    <div class="tw-navrow">${leading || h`<span></span>`}${trailing || ''}</div>
    <div class="tw-titleblock">${eyebrow ? h`<p class="t-footnote tw-muted">${eyebrow}</p>` : ''}<h1 class="t-largeTitle">${title}</h1></div>
  </header>`;
}
const roundBtn = (sym, label) => h`<button class="tw-round" aria-label="${label}" data-c="Button · ${sym}">${icon(sym)}</button>`;
function tabBar(active) {
  const tab = (id, sym, label) => h`<button class="tw-tab" role="tab" aria-selected="${String(id === active)}" data-c="Tab · ${label}">${icon(sym)}<span>${label}</span></button>`;
  return h`<nav class="tw-tabs" role="tablist" data-c="TabView">${tab('today', 'water.waves', 'Today')}${tab('spots', 'mappin', 'Spots')}${tab('alerts', 'bell', 'Alerts')}</nav>`;
}
function chart(s, { now = NOW, dim = false } = {}) {
  const W = 322, H = 120, top = 8, max = 5.2;
  const x = t => (t / 24) * W, y = v => top + (H - top) * (1 - v / max);
  let line = '';
  for (let t = 0; t <= 24.001; t += 0.25) line += `${t ? 'L' : 'M'}${x(t).toFixed(1)} ${y(heightAt(s, t)).toFixed(1)}`;
  const area = `${line}L${W} ${H}L0 ${H}Z`;
  const past = `M0 0H${x(now).toFixed(1)}V${H}H0Z`;
  const nx = x(now), ny = y(heightAt(s, now));
  const hrs = [6, 12, 18].map(t => `<path d="M${x(t)} ${top}V${H}" stroke="var(--c-hairline)" stroke-dasharray="2 3"/>`).join('');
  return raw(`<div class="tw-chart" data-c="TideChart · Swift Charts AreaMark + LineMark"><svg viewBox="0 0 ${W} ${H + 4}" role="img" aria-label="Tide height through the day">
    ${hrs}<path d="${area}" fill="var(--c-water)" fill-opacity="${dim ? 0.25 : 0.45}"/>
    <path d="${past}" fill="var(--c-bg)" fill-opacity=".55"/>
    <path d="${line}" fill="none" stroke="var(--c-accent)" stroke-width="2.5" stroke-linecap="round" ${dim ? 'stroke-opacity=".5"' : ''}/>
    <path d="M${nx} ${top}V${H}" stroke="var(--c-text)" stroke-width="1.2"/>
    <circle cx="${nx}" cy="${ny}" r="6" fill="var(--c-surface)" stroke="var(--c-text)" stroke-width="2.5"/>
  </svg><div class="tw-axis t-caption"><span>12 am</span><span>6 am</span><span>Noon</span><span>6 pm</span><span>12 am</span></div></div>`);
}
function eventTiles(s) {
  const ev = events(s, 6, 24).slice(0, 3);
  const next = ev.find(e => e.t > NOW);
  return h`<ul class="tw-events" data-c="TideEventTile × 3">${ev.map(e => h`<li class="tw-event ${e.t < NOW ? 'past' : ''} ${e === next ? 'next' : ''}">
    <p class="t-footnote">${icon(e.type === 'High' ? 'arrow.up' : 'arrow.down')}${e.type}</p>
    <p class="t-headline tw-num">${clock(e.t)}</p><p class="t-subhead tw-muted tw-num">${metres(e.h)}</p></li>`)}</ul>`;
}
const page = (body, tabs) => h`<div class="tw-page"><div class="tw-scroll ${tabs ? '' : 'no-tabs'}">${body}</div>${tabs ? tabBar(tabs) : ''}</div>`;

/* ——— Today ——— */
const gull = SPOTS[0];
function todayBody(s, { banner } = {}) {
  const h0 = heightAt(s, NOW), falling = heightAt(s, NOW + 0.1) < h0;
  const next = events(s, NOW, 30)[0];
  const win = belowWindow(s, 1);
  return h`${nav({ eyebrow: 'Today · Sunday 14 June', title: s.name, trailing: roundBtn('mappin', 'Change spot') })}
    ${banner || ''}
    <section class="tw-card tw-hero" data-c="NowCard">
      <div class="tw-hero-top"><div><p class="t-subhead tw-muted">Now</p><p class="tw-big"><span class="t-bigNumber tw-num">${h0.toFixed(1)}</span><span class="t-title">m</span></p></div>
        <span class="tw-chip t-footnote ${falling ? 'low' : ''}" data-c="TrendChip">${icon(falling ? 'arrow.down' : 'arrow.up')}${falling ? 'Falling' : 'Rising'}</span></div>
      <p class="t-callout">${next.type} tide in ${inHours(next.t - NOW)}, ${metres(next.h)} at ${clock(next.t)}</p>
      ${chart(s)}
    </section>
    ${eventTiles(s)}
    ${win ? h`<section class="tw-card tw-window" data-c="WindowCard"><span class="tw-ic">${icon('tortoise')}</span><div><p class="t-headline">Rock pools: ${clock(win[0])} to ${clock(win[1])}</p><p class="t-subhead tw-muted">Water stays below 1 m for ${inHours(win[1] - win[0])}. Back on the sand by ${clock(win[1])}.</p></div></section>` : ''}`;
}
const today = {
  id: 'today', title: 'Today',
  summary: 'Where the water is now at your main spot, and what it does for the rest of the day.',
  code: ['TodayView.swift', 'TideChart.swift'],
  states: [
    { id: 'normal', label: 'Normal', render: () => page(todayBody(gull), 'today') },
    {
      id: 'loading', label: 'Loading', note: 'First launch after install, no saved tides yet. Never shown for more than a moment once tides are saved.',
      render: () => page(h`${nav({ eyebrow: 'Today · Sunday 14 June', title: gull.name, trailing: roundBtn('mappin', 'Change spot') })}
        <section class="tw-card tw-hero" data-c="NowCard · placeholder" aria-busy="true">
          <div class="tw-skel" style="width:52px;height:16px"></div>
          <div class="tw-skel" style="width:130px;height:52px;margin-top:10px;border-radius:12px"></div>
          <div class="tw-skel" style="width:85%;height:16px;margin-top:14px"></div>
          <div class="tw-skel" style="height:120px;margin-top:18px;border-radius:14px"></div>
          <p class="tw-loading t-subhead"><span class="tw-spinner"></span>Getting today’s tides…</p>
        </section>
        <ul class="tw-events">${[0, 1, 2].map(() => h`<li class="tw-event"><div class="tw-skel" style="height:14px;width:40px"></div><div class="tw-skel" style="height:18px;margin-top:8px"></div><div class="tw-skel" style="height:14px;width:48px;margin-top:6px"></div></li>`)}</ul>`, 'today')
    },
    {
      id: 'offline', label: 'Offline', note: 'Tides are predictions, so saved data stays correct for days. Say when it was saved, not that something failed.',
      render: () => page(todayBody(gull, { banner: h`<div class="tw-banner" data-c="OfflineBanner">${icon('wifi.slash')}<div><p class="t-subhead"><b>You’re offline.</b> Showing tides saved at 7:02 am. They’re still right for today.</p></div></div>` }), 'today')
    }
  ],
  notes: [
    { title: 'Now card', body: '<p>Big number is the current height above chart datum, one decimal, <code>.monospacedDigit()</code>. The trend chip reads <b>Rising</b> or <b>Falling</b> from the next 6 minutes of the curve.</p>' },
    { title: 'Chart', body: '<p>Swift Charts: <code>AreaMark</code> + <code>LineMark</code>, 15-minute samples, y from 0 to the week’s highest tide so days compare. Hours already past get a 55% sand wash. VoiceOver reads the next tide, not the curve.</p>' },
    { title: 'Event tiles', body: '<p>Next three tides from 6 am. The next one gets a 1.5 pt accent ring; past ones lose their fill. Text wraps at large sizes; tiles never truncate.</p>' },
    { title: 'Rock-pool window', body: '<p>First stretch after 6 am with water below 1 m. Hidden when there is none. The threshold will be a setting later; keep it a constant for now.</p>' },
    { title: 'Loading and offline', body: '<p>Show the placeholder only when nothing is saved. Offline uses the saved data with a sand banner; no retry button, it refreshes on its own when the network comes back.</p>' }
  ]
};

/* ——— Spots ——— */
function spotRow(s, q) {
  const next = events(s, NOW, 30)[0];
  const name = q ? raw(esc(s.name).replace(new RegExp(`(${q})`, 'i'), '<mark class="tw-mark">$1</mark>')) : s.name;
  return h`<button class="tw-row" data-c="SpotRow"><span class="tw-dot">${icon('water.waves')}</span>
    <span class="tw-grow"><p class="t-headline">${name}</p><p class="t-footnote">${s.area}</p></span>
    <span class="tw-trail"><p class="t-subhead tw-num">${next.type} ${clock(next.t)}</p><p class="t-footnote tw-muted tw-num">${metres(next.h)}</p></span>${icon('chevron.right', 'tw-chev')}</button>`;
}
const spotsNav = () => nav({ title: 'Spots', trailing: h`<button class="tw-textbtn" data-c="Button · Add spot">${icon('plus')}Add</button>` });
const spots = {
  id: 'spots', title: 'Spots',
  summary: 'The beaches you saved, each with its next tide, so you can compare at a glance.',
  code: ['SpotsView.swift', 'SpotRow.swift'],
  states: [
    { id: 'normal', label: 'Normal', render: () => page(h`${spotsNav()}<div class="tw-search" data-c="SearchField">${icon('magnifyingglass')}<span class="t-body">Search spots</span></div><div class="tw-list" data-c="List · inset grouped">${SPOTS.map(s => spotRow(s))}</div><p class="tw-foot t-footnote">Heights are above the lowest tide of the year.</p>`, 'spots') },
    {
      id: 'empty', label: 'Empty', note: 'First run after skipping location. One clear action.',
      render: () => h`<div class="tw-page"><div class="tw-scroll" style="display:flex;flex-direction:column">${spotsNav()}
        <div class="tw-empty" data-c="ContentUnavailableView"><div class="tw-illo">${icon('mappin')}</div><h2 class="t-title">No spots yet</h2>
          <p class="t-body">Add the beaches you go to and Tidewise shows their tides side by side.</p>
          <div class="tw-actions"><button class="tw-btn" data-c="Button · Add a spot">${icon('plus')}Add a spot</button></div></div></div>${tabBar('spots')}</div>`
    },
    {
      id: 'search', label: 'Search', note: 'Matches saved spots first, then nearby places from the tide station list.',
      render: () => page(h`${spotsNav()}<div class="tw-search" data-c="SearchField · focused">${icon('magnifyingglass')}<span class="t-body tw-q">north<span class="tw-caret"></span></span></div>
        <p class="tw-section t-footnote">Saved</p><div class="tw-list">${spotRow(SPOTS[2], 'north')}</div>
        <p class="tw-section t-footnote">Nearby</p><div class="tw-list">${[{ name: 'Northcliff Slipway', area: '11 km · tide station 0412' }, { name: 'North Pier', area: '14 km · tide station 0398' }].map(p => h`<button class="tw-row" data-c="PlaceRow"><span class="tw-dot">${icon('mappin')}</span><span class="tw-grow"><p class="t-headline">${raw(esc(p.name).replace('North', '<mark class="tw-mark">North</mark>'))}</p><p class="t-footnote">${p.area}</p></span>${icon('plus', 'tw-chev')}</button>`)}</div>`, 'spots')
    }
  ],
  notes: [
    { title: 'Row', body: '<p>64 pt minimum, 40 pt icon tile, name in headline, area in footnote. Right side: next tide and height, tabular digits. Swipe left to remove, with the confirm text from the Voice table.</p>' },
    { title: 'Order', body: '<p>Order the user set by dragging (Edit mode). New spots go to the bottom.</p>' },
    { title: 'Search', body: '<p><code>.searchable</code> on the list. Highlight the matched part of the name. Nearby places come from the bundled station list, so search works offline.</p>' },
    { title: 'Empty', body: '<p><code>ContentUnavailableView</code> with one filled button. No illustration beyond the symbol tile.</p>' }
  ]
};

/* ——— Spot detail (week) ——— */
function weekRow(s, d) {
  const ev = events(s, d * 24, d * 24 + 24);
  const low = ev.filter(e => e.type === 'Low'), high = ev.filter(e => e.type === 'High');
  const spring = SPRING[d] === Math.max(...SPRING);
  const cell = e => e ? h`<span class="tw-num"><b class="t-subhead">${clock(e.t)}</b><small class="t-footnote">${metres(e.h)}</small></span>` : h`<span></span>`;
  return h`<div class="tw-day" data-c="DayRow"><div class="tw-when"><p class="t-headline ${d === 0 ? 'tw-today' : ''}">${d === 0 ? 'Today' : DAYS[d].split(' ')[0]}</p><p class="t-caption">${DAYS[d].split(' ')[1]} June</p></div>
    <div><div class="tw-pair">${cell(low[0])}${cell(high[0])}${cell(low[1])}${cell(high[1])}</div>${spring ? h`<span class="tw-spring t-caption">Spring tide · biggest range</span>` : ''}</div></div>`;
}
const weekHead = () => h`<div class="tw-day tw-dayhead t-caption" aria-hidden="true"><span></span><div class="tw-pair"><span>${icon('arrow.down')}Low</span><span>${icon('arrow.up')}High</span></div></div>`;
const backNav = s => nav({ eyebrow: s.area, title: s.name, leading: roundBtn('chevron.left', 'Back'), trailing: roundBtn('bell', 'Alerts for this spot') });
const spot = {
  id: 'spot', title: 'Spot · this week',
  summary: 'Seven days of tides for one spot, for planning a trip.',
  code: ['SpotDetailView.swift', 'WeekTable.swift'],
  states: [
    { id: 'normal', label: 'Normal', render: () => page(h`${backNav(SPOTS[2])}<div class="tw-list" data-c="WeekTable">${weekHead()}${[0, 1, 2, 3, 4, 5, 6].map(d => weekRow(SPOTS[2], d))}</div>`) },
    {
      id: 'error', label: 'Error', note: 'Station list could not be fetched and nothing is saved for this spot yet.',
      render: () => h`<div class="tw-page"><div class="tw-scroll no-tabs" style="display:flex;flex-direction:column">${backNav(SPOTS[3])}
        <div class="tw-empty" data-c="ContentUnavailableView"><div class="tw-illo warn">${icon('wifi.slash')}</div><h2 class="t-title">Can’t load this week</h2>
          <p class="t-body">Tidewise couldn’t reach the tide service. Check your connection and try again.</p>
          <div class="tw-actions"><button class="tw-btn" data-c="Button · Try again">${icon('arrow.clockwise')}Try again</button></div></div></div></div>`
    }
  ],
  notes: [
    { title: 'Day row', body: '<p>Two columns, lows left and highs right, earliest first. A day can have three tides; then the fourth cell stays empty instead of shifting.</p>' },
    { title: 'Spring tides', body: '<p>Mark the day with the biggest range in the week with a sand tag. Do not explain the moon here; the tag is enough.</p>' },
    { title: 'Error', body: '<p>Only when nothing is saved. With saved data, show it and the offline banner from Today instead.</p>' }
  ]
};

/* ——— Alerts ——— */
function toggleRow(title, sub, on, disabled) {
  return h`<div class="tw-row" data-c="Toggle row"><span class="tw-grow"><p class="t-body">${title}</p><p class="t-footnote">${sub}</p></span>
    <button class="tw-switch" role="switch" aria-checked="${String(on)}" ${disabled ? raw('aria-disabled="true"') : ''} aria-label="${title}" data-c="Toggle"></button></div>`;
}
function alertsBody(off) {
  const win = belowWindow(gull, 1);
  return h`${nav({ title: 'Alerts' })}
    ${off ? h`<div class="tw-banner" data-c="PermissionBanner">${icon('bell.slash')}<div><p class="t-subhead"><b>Notifications are off for Tidewise.</b> Turn them on in Settings to get these alerts.</p><button class="tw-link t-subhead" data-c="Button · Open Settings">Open Settings</button></div></div>` : ''}
    <p class="tw-section t-footnote">Gull Cove</p>
    <div class="tw-list">${toggleRow('Before low tide', '30 minutes before, every day', true, off)}${toggleRow('Rock-pool window', `Today ${clock(win[0])} to ${clock(win[1])}`, true, off)}${toggleRow('Evening high tide', 'Only when it is above 4.5 m', false, off)}</div>
    <p class="tw-section t-footnote">All spots</p>
    <div class="tw-list">${toggleRow('Spring tides', 'The day before, at 8 am', true, off)}<button class="tw-row" data-c="Row · Quiet hours"><span class="tw-grow"><p class="t-body">Quiet hours</p><p class="t-footnote">10 pm to 7 am</p></span>${icon('chevron.right', 'tw-chev')}</button></div>
    <p class="tw-foot t-footnote">Alerts use saved tides, so they still arrive when you have no signal at the beach.</p>`;
}
const alerts = {
  id: 'alerts', title: 'Alerts',
  summary: 'Choose which tides to be told about. Alerts are scheduled on the phone from saved tides.',
  code: ['AlertsView.swift', 'AlertScheduler.swift'],
  states: [
    { id: 'normal', label: 'Normal', render: () => page(alertsBody(false), 'alerts') },
    { id: 'off', label: 'Notifications off', note: 'Permission denied in iOS Settings. Toggles keep their values but are dimmed.', render: () => page(alertsBody(true), 'alerts') }
  ],
  notes: [
    { title: 'Scheduling', body: '<p><code>UNCalendarNotificationTrigger</code> for the next 7 days, rebuilt when tides refresh or a toggle changes. Max 64 pending, so drop the furthest first.</p>' },
    { title: 'Permission', body: '<p>Ask the first time a toggle is turned on, not at launch. If denied, show the sand banner; <b>Open Settings</b> uses <code>UIApplication.openNotificationSettingsURLString</code>.</p>' },
    { title: 'Copy', body: '<p>Alert text names the spot and the time: “Low tide at Gull Cove in 30 min (4:01 pm, 0.4 m)”.</p>' }
  ]
};

/* ——— Add a spot (onboarding) ——— */
function addBody(denied) {
  const wave = '<svg viewBox="0 0 362 160" aria-hidden="true"><circle cx="268" cy="62" r="26" fill="var(--c-lowSoft)"/><circle cx="268" cy="62" r="16" fill="var(--c-surface)"/><path d="M0 90c30 0 30-18 60-18s30 18 60 18 30-18 60-18 30 18 60 18 30-18 60-18 30 18 62 18v70H0z" fill="var(--c-water)" fill-opacity=".55"/><path d="M0 118c30 0 30-14 60-14s30 14 60 14 30-14 60-14 30 14 60 14 30-14 60-14 30 14 62 14v42H0z" fill="var(--c-accent)" fill-opacity=".85"/></svg>';
  return h`<div class="tw-page"><div class="tw-scroll no-tabs" style="padding-bottom:0">
      <header class="tw-nav"><div class="tw-navrow"><span></span><button class="tw-textbtn" data-c="Button · Skip">Skip</button></div></header>
      <div class="tw-hero-illo">${raw(wave)}</div>
      <h1 class="t-largeTitle">${denied ? 'Find your beach by name' : 'Tides for your beach'}</h1>
      <p class="t-body tw-muted" style="margin-top:8px">${denied ? 'Location is off for Tidewise. Search for a beach, harbour or town instead. You can turn location on later in Settings.' : 'Tidewise uses your location once to find the nearest tide station. It is not stored or shared.'}</p>
      <div class="tw-points">
        <div class="tw-point"><span class="tw-dot">${icon('clock')}</span><div><p class="t-headline">Next low and high tide</p><p class="t-subhead">With heights, for every saved spot.</p></div></div>
        <div class="tw-point"><span class="tw-dot">${icon('wifi.slash')}</span><div><p class="t-headline">Works without signal</p><p class="t-subhead">A week of tides is saved on the phone.</p></div></div>
      </div>
    </div>
    <div class="tw-bottom" data-c="Bottom actions">
      ${denied
        ? h`<button class="tw-btn" data-c="Button · Search">${icon('magnifyingglass')}Search for a beach</button><button class="tw-btn plain" data-c="Button · Open Settings">Open Settings</button>`
        : h`<button class="tw-btn" data-c="Button · Use my location">${icon('location')}Use my location</button><button class="tw-btn plain" data-c="Button · Search instead">Search instead</button>`}
    </div></div>`;
}
const add = {
  id: 'add', title: 'Add a spot',
  summary: 'First run: find the nearest tide station, or search by name if location is off.',
  code: ['AddSpotView.swift', 'LocationPermission.swift'],
  states: [
    { id: 'ask', label: 'Ask for location', render: () => addBody(false) },
    { id: 'denied', label: 'Location off', note: 'User tapped “Don’t Allow”. Same layout; the main action becomes search.', render: () => addBody(true) }
  ],
  notes: [
    { title: 'Permission', body: '<p>Request <code>whenInUse</code> only after <b>Use my location</b> is tapped. One fix is enough: stop updates after the first location.</p>' },
    { title: 'Buttons', body: '<p>Filled 50 pt button plus a plain one, pinned above the home indicator. The text block scrolls if Large text pushes it down.</p>' }
  ]
};

/* ——— Tokens.swift (generated from the same tokens) ——— */
function tokensSwift(t) {
  const hex = v => {
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m) return `Color(hex: 0x${m[1].toUpperCase()})`;
    const r = /rgba?\(([^)]+)\)/.exec(v);
    if (r) {
      const [R, G, B, A = 1] = r[1].split(',').map(Number);
      return `Color(red: ${(R / 255).toFixed(3)}, green: ${(G / 255).toFixed(3)}, blue: ${(B / 255).toFixed(3)}, opacity: ${A})`;
    }
    return `Color("${v}")`;
  };
  const weight = w => ({ 400: '.regular', 500: '.medium', 600: '.semibold', 700: '.bold' }[w] || '.regular');
  const font = v => v.font === 'rounded'
    ? `Font.system(size: ${v.size}, weight: ${weight(v.weight)}, design: .rounded) // pair with @ScaledMetric`
    : `Font.system(.${v.ios}, weight: ${weight(v.weight)})`;
  const block = (name, rows) => `    enum ${name} {\n${rows.join('\n')}\n    }`;
  return [
    '// Tokens.swift: generated from the Tidewise design spec. Do not edit by hand;',
    '// change the spec and download again.',
    'import SwiftUI',
    '',
    'extension Color {',
    '    init(hex: UInt32) {',
    '        self.init(red: Double((hex >> 16) & 0xFF) / 255,',
    '                  green: Double((hex >> 8) & 0xFF) / 255,',
    '                  blue: Double(hex & 0xFF) / 255)',
    '    }',
    '}',
    '',
    'enum Tide {',
    block('Palette', Object.entries(t.color).map(([k, v]) => `        static let ${k} = ${hex(v)}`)),
    '',
    block('Typography', Object.entries(t.type).map(([k, v]) => `        static let ${k} = ${font(v)}`)),
    '',
    block('Space', Object.entries(t.space).map(([k, v]) => `        static let ${k}: CGFloat = ${v}`)),
    '',
    block('Radius', Object.entries(t.radius).map(([k, v]) => `        static let ${k}: CGFloat = ${v}`)),
    '}',
    ''
  ].join('\n');
}

/* ——— Extra Start page ——— */
const principles = [
  ['One glance', 'Today answers “where is the water now and when is low tide” without scrolling.'],
  ['Numbers you can trust', 'Every height and time on every screen comes from the same prediction. Heights have one decimal, times are local.'],
  ['Works at the beach', 'No signal is normal. Saved tides are shown with when they were saved, never as an error.'],
  ['Plain words', 'Low tide, high tide, spring tide. No datum names or station codes in the main UI.']
];

defineSpec({
  app: { name: 'Tidewise', subtitle: 'iOS design spec · direction B, Sand' },
  tokens,
  voice: [
    { instead: 'Tidal prediction unavailable (ERR_NET)', say: 'Can’t load tides right now', why: 'Say what happened, not the code.' },
    { instead: 'Sync failed', say: 'Showing tides saved at 7:02 am', why: 'Saved predictions are still correct; say how old they are.' },
    { instead: 'MLLW / chart datum', say: 'Above the lowest tide of the year', why: 'Only in footnotes; the main UI just says “m”.' },
    { instead: 'Enable push notifications', say: 'Get a nudge before low tide', why: 'Name the benefit, not the system feature.' },
    { instead: 'Location access denied', say: 'Find your beach by name', why: 'Offer the way forward.' },
    { instead: 'Delete location?', say: 'Remove Gull Cove from your spots?', why: 'Use the spot’s name. “Remove” is accurate: only your list changes.' }
  ],
  foundations: [{
    id: 'principles', title: 'Principles', summary: 'Four rules every screen follows.',
    render: () => h`<div class="ads-grid">${principles.map(([t, b]) => h`<article class="ads-card"><h3>${t}</h3><div>${b}</div></article>`)}</div>`
  }],
  screens: [today, spots, spot, alerts, add],
  downloads: [{ label: 'Download Tokens.swift', filename: 'Tokens.swift', text: tokensSwift }]
});

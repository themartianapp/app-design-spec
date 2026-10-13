/* Deliberately broken fixture for check.py: each state plants one defect class.
   Expected FAILs: clip, overflow, safe-area (top + bottom), contrast,
   large-text-clip, large-text-overflow, network. Expected exit code: 1.
   Build with --allow-url, otherwise build.py rejects the external image (exit 2). */
const scr = (title, body) => h`<div class="bk"><h1 class="t-title">${title}</h1>${body}</div>`;
defineSpec({
  app: { name: 'Broken fixture', subtitle: 'check.py must fail on every state' },
  tokens: {
    color: { bg: '#FFFFFF', text: '#111111', muted: '#555555', accent: '#2457C5', onAccent: '#FFFFFF' },
    type: { title: { size: 28, line: 34, weight: 700 }, body: { size: 17, line: 22, weight: 400 } },
    space: { m: 16 }, radius: { card: 12 }
  },
  screens: [
    {
      id: 'defects', title: 'Defects',
      states: [
        { id: 'clip', label: 'Clipped text', render: () => scr('Clip', h`<p class="t-body bk-clip">This sentence is far too long for its box</p>`) },
        { id: 'overflow', label: 'Overflow', render: () => scr('Overflow', h`<div class="bk-wide t-body">Wider than the screen</div>`) },
        { id: 'safe-top', label: 'Top unsafe', render: () => scr('Top', h`<button class="bk-top t-body">Edit</button>`) },
        { id: 'safe-bottom', label: 'Bottom unsafe', render: () => scr('Bottom', h`<button class="bk-bottom t-body">Continue</button>`) },
        { id: 'contrast', label: 'Low contrast', render: () => scr('Contrast', h`<p class="t-body bk-faint">Hard to read grey text</p>`) },
        { id: 'large-only', label: 'Clips at large text', render: () => scr('Large text', h`<p class="t-body bk-fixed">Fits at 100% only</p>`) },
        { id: 'large-wide', label: 'Overflows at large text', render: () => scr('Large wide', h`<p class="t-body bk-grow">Tap and hold any spot to rename it later</p>`) },
        { id: 'network', label: 'External URL', render: () => scr('Network', h`<img alt="" width="40" height="40" src="https://example.com/logo.png"><p class="t-body">Loads an image from the web.</p>`) }
      ]
    }
  ]
});

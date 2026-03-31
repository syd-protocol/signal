/**
 * SYD / SIGNAL — reader.js v3
 * Archive index (index.html) + chapter reader (reader.html)
 *
 * Mobile  → full-screen fixed overlay carousel (IG-style swipe)
 * Desktop → original scroll reader (unchanged)
 *
 * KEY ARCHITECTURE DECISION:
 * The carousel is a position:fixed overlay appended directly to <body>.
 * It does NOT live inside .shell. This completely avoids the shell's
 * max-width, flex, and height constraints that broke v1 and v2.
 * The overlay top is set by JS to sit exactly below the reader-header.
 *
 * No framework. No build step.
 */

// ─── BASE PATH ────────────────────────────────────────────────────────────────
const BASE_URL = (() => {
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;
    if (src && src.includes('reader.js')) {
      const base = src.replace('reader.js', '');
      console.log('[SYD] BASE_URL (script tag):', base);
      return base;
    }
  }
  const fallback = window.location.href.replace(/\/[^/]*(\?.*)?$/, '/');
  console.log('[SYD] BASE_URL (fallback):', fallback);
  return fallback;
})();


// ─── DEVICE DETECTION ─────────────────────────────────────────────────────────
// Use pointer:coarse (true touch device) OR narrow viewport.
// 'ontouchstart' alone is unreliable — desktop Chrome devtools sets it.
const IS_MOBILE = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
console.log('[SYD] IS_MOBILE:', IS_MOBILE,
  '| innerWidth:', window.innerWidth,
  '| pointer:coarse:', window.matchMedia('(pointer: coarse)').matches);


// ─── HELPERS ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ─── MARKDOWN PARSER ──────────────────────────────────────────────────────────
// Returns { html, slides }
// html   → desktop scroll reader
// slides → array of { type: 'system'|'prose'|'cta'|'hr', ... }
function parseChapter(markdown) {
  console.log('[SYD] parseChapter: raw length', markdown.length);

  // Strip YAML frontmatter (---\n...\n---)
  const body = markdown.replace(/^---[\s\S]*?---\n?/, '').trim();
  console.log('[SYD] parseChapter: body length', body.length);

  const lines     = body.split('\n');
  const slides    = [];
  const htmlParts = [];

  let inSystem  = false;
  let sysBuf    = [];
  let proseBuf  = [];

  function flushProse() {
    if (!proseBuf.length) return;
    const raw = proseBuf.join('\n').trim();
    proseBuf = [];
    if (!raw) return;

    const slideParas = [];

    raw.split(/\n{2,}/).forEach(para => {
      const t = para.trim();
      if (!t) return;

      if (t === '---') {
        htmlParts.push('<hr>');
        slides.push({ type: 'hr' });
        return;
      }

      if (t.startsWith('*The system') || t.startsWith('*The System')) {
        const inner = t.replace(/^\*/, '').replace(/\*$/, '');
        const h = `<p class="chapter-cta">${escapeHtml(inner).replace(
          'syd-protocol.github.io/terminal',
          '<a href="https://syd-protocol.github.io/terminal" target="_blank" rel="noopener">syd-protocol.github.io/terminal</a>'
        )}</p>`;
        htmlParts.push(h);
        slides.push({ type: 'cta', html: h });
        return;
      }

      const h = `<p>${escapeHtml(t).replace(/\n/g, '<br>')}</p>`;
      htmlParts.push(h);
      slideParas.push(h);
    });

    // Group prose into slides of 3 paragraphs each
    for (let i = 0; i < slideParas.length; i += 3) {
      slides.push({ type: 'prose', html: slideParas.slice(i, i + 3).join('') });
    }
  }

  function flushSystem() {
    if (!sysBuf.length) return;
    const raw      = sysBuf.join('\n').trim();
    sysBuf = [];
    const sysLines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const inner    = sysLines.map(l => `<p>${escapeHtml(l)}</p>`).join('');
    htmlParts.push(`<div class="system-block">${inner}</div>`);

    // Split large system blocks into sub-slides of 10 lines each
    for (let i = 0; i < sysLines.length; i += 10) {
      slides.push({ type: 'system', lines: sysLines.slice(i, i + 10) });
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === ':::system') { flushProse();  inSystem = true;  continue; }
    if (line.trim() === ':::'  && inSystem) { flushSystem(); inSystem = false; continue; }
    inSystem ? sysBuf.push(line) : proseBuf.push(line);
  }
  inSystem ? flushSystem() : flushProse();

  console.log('[SYD] parseChapter: done — slides:', slides.length);
  slides.forEach((s, i) =>
    console.log(`[SYD]   slide[${i}] type=${s.type}` + (s.type === 'system' ? ` lines=${s.lines.length}` : ''))
  );

  return { html: htmlParts.join('\n'), slides };
}


// ─── FRONTMATTER ──────────────────────────────────────────────────────────────
function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim();
  });
  return meta;
}


// ─── FETCH ────────────────────────────────────────────────────────────────────
async function fetchChaptersIndex() {
  const url = BASE_URL + 'chapters.json';
  console.log('[SYD] fetch chapters.json:', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`chapters.json ${res.status}`);
  const data = await res.json();
  console.log('[SYD] chapters loaded:', data.length);
  return data;
}

async function fetchChapter(file) {
  const url = BASE_URL + file;
  console.log('[SYD] fetch chapter:', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file} → ${res.status} (${url})`);
  const text = await res.text();
  console.log('[SYD] chapter loaded, chars:', text.length);
  return text;
}


// ─── ARCHIVE PAGE ─────────────────────────────────────────────────────────────
async function loadArchive() {
  console.log('[SYD] loadArchive: start');
  const list    = document.getElementById('transmission-list');
  const countEl = document.getElementById('entry-count');
  if (!list) { console.warn('[SYD] #transmission-list not found'); return; }

  let chapters;
  try {
    chapters = await fetchChaptersIndex();
  } catch (e) {
    console.error('[SYD] loadArchive error:', e);
    list.innerHTML = `<li style="font-family:var(--font-mono);color:var(--text-muted);font-size:0.8rem;padding:1rem 0;">[ ERROR: ARCHIVE UNAVAILABLE — ${e.message} ]</li>`;
    return;
  }

  if (countEl) countEl.textContent = chapters.length;
  list.innerHTML = '';

  chapters.forEach((ch, idx) => {
    const li = document.createElement('li');
    li.className = 'transmission-entry';
    li.style.animationDelay = `${1.9 + idx * 0.2}s`;
    li.innerHTML = `
      <a href="reader.html?id=${encodeURIComponent(ch.id)}">
        <span class="entry-id">${escapeHtml(ch.id)}</span>
        <span class="entry-title">${escapeHtml(ch.title)}</span>
        <span class="entry-date">${escapeHtml(ch.date)}</span>
      </a>`;
    list.appendChild(li);
  });

  console.log('[SYD] loadArchive: rendered', chapters.length, 'entries');
}


// ─── MOBILE CAROUSEL ──────────────────────────────────────────────────────────
function buildCarousel(slides, chapter, chapterIndex, chapters) {
  console.log('[SYD] buildCarousel: start | chapter:', chapter.id, '| slides:', slides.length);

  // ── 1. Inject CSS (once per page load) ────────────────────────────────────
  if (!document.getElementById('syd-carousel-css')) {
    const style = document.createElement('style');
    style.id = 'syd-carousel-css';
    style.textContent = `
      /* Lock body scroll while carousel is open */
      body.carousel-mode { overflow: hidden !important; }

      /* Hide the desktop chapter body and original bottom nav */
      body.carousel-mode .chapter-body      { display: none !important; }
      body.carousel-mode #reader-nav-bottom { display: none !important; }

      /* Compact the reader-header that stays visible above the overlay */
      body.carousel-mode .reader-header {
        padding: 0.75rem 1.2rem 0.6rem !important;
      }
      body.carousel-mode .reader-nav-top {
        margin-bottom: 0.25rem;
        font-size: 0.6rem;
      }
      body.carousel-mode .reader-meta   { margin-bottom: 0.15rem; }
      body.carousel-mode .reader-title  { font-size: 0.85rem; line-height: 1.25; }
      body.carousel-mode .reader-title .cursor { display: none; }

      /* ── OVERLAY (fixed, below header, above everything) ── */
      #syd-carousel {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        /* top is set by JS */
        z-index: 500;
        background: var(--navy);
        display: flex;
        flex-direction: column;
      }

      /* Progress pips */
      #syd-carousel .car-pips {
        display: flex;
        gap: 3px;
        padding: 0.5rem 1.1rem 0.4rem;
        flex-shrink: 0;
        border-bottom: 1px solid var(--navy-border);
      }
      #syd-carousel .car-pip {
        flex: 1;
        height: 2px;
        border-radius: 1px;
        background: var(--navy-border);
        transition: background 0.25s;
      }
      #syd-carousel .car-pip.done   { background: var(--cyan-dim); }
      #syd-carousel .car-pip.active { background: var(--cyan); }

      /* Slide counter */
      #syd-carousel .car-counter {
        font-family: var(--font-mono);
        font-size: 0.55rem;
        color: var(--text-muted);
        letter-spacing: 0.18em;
        text-align: center;
        padding: 0.25rem 0 0.2rem;
        flex-shrink: 0;
      }

      /* ── TRACK WRAPPER: clips the sliding track ── */
      #syd-carousel .car-track-wrap {
        flex: 1;
        min-height: 0;      /* CRITICAL — flex items don't shrink below content without this */
        overflow: hidden;   /* Clips slides that are off-screen */
        position: relative;
      }

      /* ── TRACK: slides laid out horizontally ── */
      #syd-carousel .car-track {
        display: flex;
        height: 100%;       /* Fill the track-wrap height */
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;
      }

      /* ── INDIVIDUAL SLIDE ── */
      #syd-carousel .car-slide {
        min-width: 100%;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 1.1rem 1.3rem 1rem;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        display: flex;
        flex-direction: column;
      }

      /* Title slide */
      #syd-carousel .car-slide.s-title { justify-content: center; }
      .car-title-id   { font-family: var(--font-mono); font-size: 0.65rem; color: var(--cyan-dim); letter-spacing: 0.18em; display: block; margin-bottom: 0.4rem; }
      .car-title-date { font-family: var(--font-mono); font-size: 0.6rem;  color: var(--text-muted); letter-spacing: 0.1em;  display: block; margin-bottom: 1.2rem; }
      .car-title-h    { font-family: var(--font-mono); font-size: 1.15rem; color: var(--cyan); line-height: 1.3; font-weight: 400; letter-spacing: 0.04em; }
      .car-title-hint { font-family: var(--font-mono); font-size: 0.55rem; color: var(--text-muted); letter-spacing: 0.2em; margin-top: 2.2rem; opacity: 0.45; }

      /* System slide */
      #syd-carousel .car-slide.s-system { justify-content: center; }
      #syd-carousel .car-slide.s-system .system-block {
        margin: 0;
        width: 100%;
        padding: 1.1rem 1.2rem;
      }
      #syd-carousel .car-slide.s-system .system-block p {
        font-size: 0.76rem;
        line-height: 1.85;
        margin-bottom: 0.35rem;
      }

      /* Prose slide */
      #syd-carousel .car-slide.s-prose p {
        font-family: var(--font-body);
        font-size: 0.93rem;
        line-height: 1.85;
        color: var(--text-primary);
        font-weight: 300;
        margin-bottom: 1.1rem;
      }
      #syd-carousel .car-slide.s-prose p:last-child { margin-bottom: 0; }

      /* CTA slide */
      #syd-carousel .car-slide.s-cta {
        justify-content: flex-end;
        padding-bottom: 1.2rem;
      }
      #syd-carousel .car-slide.s-cta .chapter-cta {
        border-top: 1px solid var(--navy-border);
        padding-top: 1.2rem;
        margin-top: 0;
      }

      /* ── CHAPTER NAV (prev chapter / archive / next chapter) ── */
      #syd-carousel .car-chapter-nav {
        display: flex;
        gap: 0.4rem;
        padding: 0.5rem 1.1rem 0.65rem;
        flex-shrink: 0;
        border-top: 1px solid var(--navy-border);
      }
      #syd-carousel .car-chapter-nav .nav-btn {
        flex: 1;
        font-size: 0.58rem;
        padding: 0.45rem 0.35rem;
        text-align: center;
        display: block;
      }
    `;
    document.head.appendChild(style);
    console.log('[SYD] buildCarousel: CSS injected');
  }

  // Lock body scroll
  document.body.classList.add('carousel-mode');

  // ── 2. Build slide list (prepend title slide, drop HR slides) ─────────────
  const titleSlide = {
    type: 'title',
    id:    chapter.id,
    date:  chapter.date,
    title: chapter.title
  };
  const allSlides = [titleSlide, ...slides.filter(s => s.type !== 'hr')];
  console.log('[SYD] buildCarousel: allSlides:', allSlides.length);

  let current = 0;

  // ── 3. Create overlay element ─────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'syd-carousel';

  // Progress pips
  const pipsBar = document.createElement('div');
  pipsBar.className = 'car-pips';
  allSlides.forEach(() => {
    const pip = document.createElement('div');
    pip.className = 'car-pip';
    pipsBar.appendChild(pip);
  });
  overlay.appendChild(pipsBar);

  // Counter
  const counter = document.createElement('div');
  counter.className = 'car-counter';
  overlay.appendChild(counter);

  // Track wrapper
  const trackWrap = document.createElement('div');
  trackWrap.className = 'car-track-wrap';

  const track = document.createElement('div');
  track.className = 'car-track';

  // Build slides
  allSlides.forEach((slide, i) => {
    const el = document.createElement('div');
    el.className = `car-slide s-${slide.type}`;
    el.setAttribute('aria-hidden', i !== 0 ? 'true' : 'false');
    el.dataset.slideIdx = i;

    switch (slide.type) {
      case 'title':
        el.innerHTML = `
          <span class="car-title-id">[ ${escapeHtml(slide.id)} ]</span>
          <span class="car-title-date">${escapeHtml(slide.date)}</span>
          <div class="car-title-h">${escapeHtml(slide.title)}</div>
          <div class="car-title-hint">SWIPE TO READ →</div>`;
        break;
      case 'system':
        el.innerHTML = `<div class="system-block">${
          slide.lines.map(l => `<p>${escapeHtml(l)}</p>`).join('')
        }</div>`;
        break;
      case 'prose':
        el.innerHTML = slide.html;
        break;
      case 'cta':
        el.innerHTML = slide.html;
        break;
    }

    track.appendChild(el);
    console.log(`[SYD] buildCarousel: built slide[${i}] type=${slide.type}`);
  });

  trackWrap.appendChild(track);
  overlay.appendChild(trackWrap);

  // Chapter nav bar
  const hasPrev = chapterIndex > 0;
  const hasNext = chapterIndex < chapters.length - 1;

  const chNav = document.createElement('div');
  chNav.className = 'car-chapter-nav';

  const bPrev = document.createElement('button');
  bPrev.className = 'nav-btn';
  bPrev.textContent = '[ ← ]';
  bPrev.disabled = !hasPrev;
  if (hasPrev) bPrev.addEventListener('click', () => {
    console.log('[SYD] nav: prev chapter');
    window.location.href = `reader.html?id=${encodeURIComponent(chapters[chapterIndex - 1].id)}`;
  });

  const bArch = document.createElement('a');
  bArch.className = 'nav-btn';
  bArch.href = 'index.html';
  bArch.textContent = '[ ARCHIVE ]';

  const bNext = document.createElement('button');
  bNext.className = 'nav-btn';
  bNext.textContent = '[ → ]';
  bNext.disabled = !hasNext;
  if (hasNext) bNext.addEventListener('click', () => {
    console.log('[SYD] nav: next chapter');
    window.location.href = `reader.html?id=${encodeURIComponent(chapters[chapterIndex + 1].id)}`;
  });

  chNav.appendChild(bPrev);
  chNav.appendChild(bArch);
  chNav.appendChild(bNext);
  overlay.appendChild(chNav);

  // ── 4. Mount overlay to <body> (NOT inside .shell) ────────────────────────
  document.body.appendChild(overlay);
  console.log('[SYD] buildCarousel: overlay mounted to <body>');

  // ── 5. Position overlay below the reader-header ───────────────────────────
  function positionOverlay() {
    const header = document.querySelector('.reader-header');
    const topPx  = header
      ? Math.round(header.getBoundingClientRect().bottom)
      : 0;
    overlay.style.top = topPx + 'px';
    console.log('[SYD] positionOverlay: top=', topPx,
      '| overlay h=', window.innerHeight - topPx);
  }

  // Run immediately, and again once fonts/layout settle
  positionOverlay();
  requestAnimationFrame(positionOverlay);
  window.addEventListener('resize', positionOverlay);

  // ── 6. goTo() — the single function that drives all navigation ────────────
  const pips = Array.from(pipsBar.querySelectorAll('.car-pip'));
  const slideEls = Array.from(track.querySelectorAll('.car-slide'));

  function goTo(idx) {
    if (idx < 0 || idx >= allSlides.length) {
      console.log('[SYD] goTo: out of bounds', idx);
      return;
    }
    console.log('[SYD] goTo:', idx, '/', allSlides.length - 1,
      '| type:', allSlides[idx].type);

    // Translate the track
    track.style.transform = `translateX(-${idx * 100}%)`;

    // Aria hidden
    slideEls.forEach((el, i) =>
      el.setAttribute('aria-hidden', i !== idx ? 'true' : 'false')
    );

    // Pips
    pips.forEach((pip, i) => {
      pip.className = 'car-pip' +
        (i < idx ? ' done' : i === idx ? ' active' : '');
    });

    // Counter
    counter.textContent = `${idx + 1} / ${allSlides.length}`;

    current = idx;
  }

  // ── 7. Input: touch swipe ─────────────────────────────────────────────────
  let tx0 = 0, ty0 = 0, didSwipe = false;

  overlay.addEventListener('touchstart', e => {
    tx0 = e.touches[0].clientX;
    ty0 = e.touches[0].clientY;
    didSwipe = false;
    console.log('[SYD] touchstart x:', tx0.toFixed(1));
  }, { passive: true });

  overlay.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - tx0;
    const dy = e.touches[0].clientY - ty0;
    // Only flag as horizontal swipe if clearly more horizontal than vertical
    if (!didSwipe && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
      didSwipe = true;
    }
  }, { passive: true });

  overlay.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx0;
    console.log('[SYD] touchend dx:', dx.toFixed(1), 'didSwipe:', didSwipe);
    if (didSwipe && Math.abs(dx) > 45) {
      dx < 0 ? goTo(current + 1) : goTo(current - 1);
    }
    didSwipe = false;
  }, { passive: true });

  // ── 8. Input: tap (left 40% = prev, right 60% = next) ────────────────────
  overlay.addEventListener('click', e => {
    // Ignore taps on the chapter nav bar
    if (e.target.closest('.car-chapter-nav')) return;
    const ratio = e.clientX / overlay.offsetWidth;
    console.log('[SYD] tap ratio:', ratio.toFixed(2), '| current:', current);
    ratio >= 0.4 ? goTo(current + 1) : goTo(current - 1);
  });

  // ── 9. Input: keyboard ────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goTo(current + 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goTo(current - 1);
    }
  });

  // ── 10. Initial render ────────────────────────────────────────────────────
  goTo(0);
  console.log('[SYD] buildCarousel: complete ✓');
}


// ─── READER PAGE (reader.html) ────────────────────────────────────────────────
async function loadReader() {
  console.log('[SYD] loadReader: start | IS_MOBILE:', IS_MOBILE);

  const bodyEl   = document.getElementById('chapter-body');
  const titleEl  = document.getElementById('reader-title');
  const metaEl   = document.getElementById('reader-meta');
  const metaId   = document.getElementById('meta-id');
  const metaDate = document.getElementById('meta-date');
  const btnPrev  = document.getElementById('btn-prev');
  const btnNext  = document.getElementById('btn-next');

  if (!bodyEl) {
    console.error('[SYD] #chapter-body element not found');
    return;
  }

  const params      = new URLSearchParams(window.location.search);
  const requestedId = params.get('id');
  console.log('[SYD] loadReader: requestedId =', requestedId);

  let chapters;
  try {
    chapters = await fetchChaptersIndex();
  } catch (e) {
    console.error('[SYD] chapters index fetch failed:', e);
    bodyEl.innerHTML = `<p style="font-family:var(--font-mono);color:var(--text-muted);">[ ERROR: ARCHIVE UNAVAILABLE — ${escapeHtml(e.message)} ]</p>`;
    return;
  }

  const idx          = requestedId ? chapters.findIndex(ch => ch.id === requestedId) : 0;
  const chapterIndex = idx >= 0 ? idx : 0;
  const chapter      = chapters[chapterIndex];
  console.log('[SYD] loadReader: chapterIndex =', chapterIndex, '| chapter =', chapter?.id);

  if (!chapter) {
    console.error('[SYD] chapter not found:', requestedId);
    bodyEl.innerHTML = `<p style="font-family:var(--font-mono);color:var(--text-muted);">[ TRANSMISSION NOT FOUND ]</p>`;
    return;
  }

  document.title = `SYD / SIGNAL — ${chapter.id}: ${chapter.title}`;

  if (titleEl) {
    titleEl.innerHTML = escapeHtml(chapter.title) + '<span class="cursor" aria-hidden="true"></span>';
    setTimeout(() => {
      const c = titleEl.querySelector('.cursor');
      if (c) c.remove();
    }, 2000);
  }
  if (metaEl)   metaEl.classList.remove('hidden');
  if (metaId)   metaId.textContent   = chapter.id;
  if (metaDate) metaDate.textContent = chapter.date;

  let markdown;
  try {
    markdown = await fetchChapter(chapter.file);
  } catch (e) {
    console.error('[SYD] chapter markdown fetch failed:', e);
    bodyEl.innerHTML = `<p style="font-family:var(--font-mono);color:var(--text-muted);">[ ERROR: TRANSMISSION CORRUPTED — ${escapeHtml(e.message)} ]</p>`;
    return;
  }

  const { html, slides } = parseChapter(markdown);
  console.log('[SYD] loadReader: html =', html.length, 'chars | slides =', slides.length);

  // Brief pause — the "receiving transmission" feel
  await new Promise(r => setTimeout(r, 350));

  // ── MOBILE → carousel ─────────────────────────────────────────────────────
  if (IS_MOBILE) {
    console.log('[SYD] loadReader: → MOBILE carousel mode');
    bodyEl.innerHTML = ''; // clear "receiving" loading state
    buildCarousel(slides, chapter, chapterIndex, chapters);
    return;
  }

  // ── DESKTOP → scroll reader ───────────────────────────────────────────────
  console.log('[SYD] loadReader: → DESKTOP scroll mode');
  bodyEl.classList.add('rendering');
  bodyEl.innerHTML = html;

  const elements = bodyEl.querySelectorAll('p, .system-block, hr');
  console.log('[SYD] loadReader: desktop — animating', elements.length, 'elements');
  elements.forEach((el, i) => { el.style.animationDelay = `${i * 80}ms`; });
  setTimeout(() => {
    bodyEl.classList.remove('rendering');
    elements.forEach(el => { el.style.animationDelay = ''; });
  }, elements.length * 80 + 600);

  if (btnPrev) {
    const hasPrev = chapterIndex > 0;
    btnPrev.disabled = !hasPrev;
    if (hasPrev) btnPrev.addEventListener('click', () => {
      window.location.href = `reader.html?id=${encodeURIComponent(chapters[chapterIndex - 1].id)}`;
    });
  }
  if (btnNext) {
    const hasNext = chapterIndex < chapters.length - 1;
    btnNext.disabled = !hasNext;
    if (hasNext) btnNext.addEventListener('click', () => {
      window.location.href = `reader.html?id=${encodeURIComponent(chapters[chapterIndex + 1].id)}`;
    });
  }

  console.log('[SYD] loadReader: desktop render complete ✓');
}
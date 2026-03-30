/**
 * SYD / SIGNAL — reader.js
 * Handles both the archive index (index.html) and the chapter reader (reader.html).
 * Mobile: swipe-native carousel mode (IG-style, one slide at a time).
 * Desktop: original scroll reader.
 * No framework. No build step.
 */

// ─── BASE PATH ────────────────────────────────────────────────────────────────
const BASE_URL = (() => {
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;
    if (src && src.includes('reader.js')) {
      return src.replace('reader.js', '');
    }
  }
  return window.location.href.replace(/\/[^/]*(\?.*)?$/, '/');
})();

// ─── DEVICE DETECTION ─────────────────────────────────────────────────────────
const IS_MOBILE = window.innerWidth <= 600 || ('ontouchstart' in window);


// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────

/**
 * Full render: returns both HTML string (for desktop) and
 * an array of slide objects (for mobile carousel).
 *
 * Slide types:
 *   { type: 'system', lines: [...] }
 *   { type: 'prose',  html: '...' }
 *   { type: 'hr' }
 *   { type: 'cta',    html: '...' }
 */
function parseChapter(markdown) {
  const body = markdown.replace(/^---[\s\S]*?---\n/, '').trim();
  const lines = body.split('\n');

  const slides = [];     // for mobile carousel
  const htmlOut = [];    // for desktop scroll

  let inSystem = false;
  let systemBuffer = [];
  let proseBuffer = [];

  function flushProse() {
    if (!proseBuffer.length) return;
    const text = proseBuffer.join('\n').trim();
    proseBuffer = [];
    if (!text) return;

    const paras = text.split(/\n{2,}/);
    const slideParas = [];

    paras.forEach(para => {
      const t = para.trim();
      if (!t) return;
      if (t === '---') {
        htmlOut.push('<hr>');
        slides.push({ type: 'hr' });
      } else if (t.startsWith('*The system') || t.startsWith('*The System')) {
        const inner = t.replace(/^\*/, '').replace(/\*$/, '');
        const ctaHtml = `<p class="chapter-cta">${escapeHtml(inner).replace(
          'syd-protocol.github.io/terminal',
          '<a href="https://syd-protocol.github.io/terminal" target="_blank" rel="noopener">syd-protocol.github.io/terminal</a>'
        )}</p>`;
        htmlOut.push(ctaHtml);
        slides.push({ type: 'cta', html: ctaHtml });
      } else {
        const pHtml = `<p>${escapeHtml(t).replace(/\n/g, '<br>')}</p>`;
        htmlOut.push(pHtml);
        slideParas.push(pHtml);
      }
    });

    // Group prose paras into slides of ~3 paragraphs each
    if (slideParas.length) {
      const PARAS_PER_SLIDE = 3;
      for (let i = 0; i < slideParas.length; i += PARAS_PER_SLIDE) {
        const chunk = slideParas.slice(i, i + PARAS_PER_SLIDE).join('');
        slides.push({ type: 'prose', html: chunk });
      }
    }
  }

  function flushSystem() {
    if (!systemBuffer.length) return;
    const content = systemBuffer.join('\n').trim();
    systemBuffer = [];
    const sysLines = content.split('\n').map(l => l.trim()).filter(l => l);
    const inner = sysLines.map(l => `<p>${escapeHtml(l)}</p>`).join('');
    const blockHtml = `<div class="system-block">${inner}</div>`;
    htmlOut.push(blockHtml);

    // Each system block = one slide (split into sub-slides if many lines)
    const LINES_PER_SYS_SLIDE = 12;
    for (let i = 0; i < sysLines.length; i += LINES_PER_SYS_SLIDE) {
      slides.push({ type: 'system', lines: sysLines.slice(i, i + LINES_PER_SYS_SLIDE) });
    }
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === ':::system') {
      flushProse();
      inSystem = true;
      i++; continue;
    }
    if (line.trim() === ':::' && inSystem) {
      flushSystem();
      inSystem = false;
      i++; continue;
    }
    if (inSystem) systemBuffer.push(line);
    else proseBuffer.push(line);
    i++;
  }

  if (inSystem) flushSystem(); else flushProse();

  return { html: htmlOut.join('\n'), slides };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ─── FRONTMATTER PARSER ───────────────────────────────────────────────────────
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


// ─── FETCH HELPERS ────────────────────────────────────────────────────────────
async function fetchChaptersIndex() {
  const url = BASE_URL + 'chapters.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load chapters.json (${res.status})`);
  return res.json();
}

async function fetchChapter(file) {
  const url = BASE_URL + file;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${file} (${res.status} — fetched: ${url})`);
  return res.text();
}


// ─── ARCHIVE (index.html) ─────────────────────────────────────────────────────
async function loadArchive() {
  const list = document.getElementById('transmission-list');
  const countEl = document.getElementById('entry-count');
  if (!list) return;

  let chapters;
  try {
    chapters = await fetchChaptersIndex();
  } catch (e) {
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
      </a>
    `;
    list.appendChild(li);
  });
}


// ─── MOBILE CAROUSEL RENDERER ─────────────────────────────────────────────────

function buildCarousel(slides, chapter, chapterIndex, chapters, bodyEl, titleEl, metaEl, metaId, metaDate) {
  // Inject carousel CSS into document if not already there
  if (!document.getElementById('carousel-style')) {
    const style = document.createElement('style');
    style.id = 'carousel-style';
    style.textContent = `
      /* ── CAROUSEL SHELL ── */
      body.carousel-mode {
        overflow: hidden;
        height: 100vh;
        height: 100dvh;
      }
      body.carousel-mode .shell {
        max-width: 100%;
        padding: 0;
        height: 100vh;
        height: 100dvh;
        display: flex;
        flex-direction: column;
      }
      body.carousel-mode .reader-header {
        padding: 1.2rem 1.5rem 0.8rem;
        border-bottom: 1px solid var(--navy-border);
        flex-shrink: 0;
      }
      body.carousel-mode .reader-nav-top {
        margin-bottom: 0.5rem;
        font-size: 0.65rem;
      }
      body.carousel-mode .reader-meta {
        margin-bottom: 0.25rem;
      }
      body.carousel-mode .reader-title {
        font-size: 1rem;
        line-height: 1.3;
      }

      /* ── SLIDE VIEWPORT ── */
      .carousel-viewport {
        flex: 1;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
      }

      /* ── PROGRESS BAR ── */
      .carousel-progress {
        display: flex;
        gap: 3px;
        padding: 0.6rem 1.5rem 0.5rem;
        flex-shrink: 0;
      }
      .carousel-pip {
        flex: 1;
        height: 2px;
        background: var(--navy-border);
        border-radius: 1px;
        transition: background 0.3s ease;
      }
      .carousel-pip.active {
        background: var(--cyan);
      }
      .carousel-pip.done {
        background: var(--cyan-dim);
      }

      /* ── SLIDE TRACK ── */
      .carousel-track {
        flex: 1;
        display: flex;
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;
        overflow: hidden;
      }
      .carousel-slide {
        min-width: 100%;
        width: 100%;
        padding: 1rem 1.5rem 1rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        box-sizing: border-box;
      }

      /* System slide styling */
      .carousel-slide.type-system {
        justify-content: center;
      }
      .carousel-slide.type-system .system-block {
        margin: 0;
        width: 100%;
      }
      .carousel-slide.type-system .system-block p {
        font-size: 0.8rem;
        line-height: 1.8;
      }

      /* Prose slide styling */
      .carousel-slide.type-prose p {
        font-size: 0.95rem;
        line-height: 1.85;
        margin-bottom: 1.2rem;
      }
      .carousel-slide.type-prose p:last-child {
        margin-bottom: 0;
      }

      /* HR slide */
      .carousel-slide.type-hr {
        justify-content: center;
        align-items: center;
      }
      .carousel-slide.type-hr hr {
        width: 100%;
      }

      /* CTA slide */
      .carousel-slide.type-cta {
        justify-content: flex-end;
        padding-bottom: 2rem;
      }
      .carousel-slide.type-cta .chapter-cta {
        border-top: 1px solid var(--navy-border);
        padding-top: 1.5rem;
        margin-top: 0;
      }

      /* ── SWIPE HIT ZONES ── */
      .carousel-swipe-left,
      .carousel-swipe-right {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 40%;
        z-index: 10;
        -webkit-tap-highlight-color: transparent;
      }
      .carousel-swipe-left  { left: 0; }
      .carousel-swipe-right { right: 0; }

      /* ── BOTTOM NAV (CAROUSEL MODE) ── */
      body.carousel-mode .reader-nav-bottom {
        padding: 0.7rem 1.5rem 0.9rem;
        gap: 0.5rem;
        flex-shrink: 0;
      }
      body.carousel-mode .nav-btn {
        font-size: 0.62rem;
        padding: 0.5rem 0.6rem;
        flex: 1;
        text-align: center;
      }

      /* ── SLIDE COUNTER ── */
      .carousel-counter {
        font-family: var(--font-mono);
        font-size: 0.6rem;
        color: var(--text-muted);
        letter-spacing: 0.15em;
        text-align: center;
        padding: 0 1.5rem 0.3rem;
        flex-shrink: 0;
      }

      /* ── CHAPTER TITLE SLIDE (first slide) ── */
      .carousel-slide.type-title {
        justify-content: center;
        align-items: flex-start;
      }
      .carousel-title-id {
        font-family: var(--font-mono);
        font-size: 0.7rem;
        color: var(--cyan-dim);
        letter-spacing: 0.15em;
        margin-bottom: 0.5rem;
        display: block;
      }
      .carousel-title-date {
        font-family: var(--font-mono);
        font-size: 0.65rem;
        color: var(--text-muted);
        letter-spacing: 0.1em;
        margin-bottom: 1.5rem;
        display: block;
      }
      .carousel-title-text {
        font-family: var(--font-mono);
        font-size: 1.3rem;
        color: var(--cyan);
        line-height: 1.3;
        letter-spacing: 0.04em;
      }
      .carousel-title-hint {
        font-family: var(--font-mono);
        font-size: 0.6rem;
        color: var(--text-muted);
        letter-spacing: 0.12em;
        margin-top: 3rem;
        opacity: 0.6;
      }
    `;
    document.head.appendChild(style);
  }

  // Activate carousel mode on body
  document.body.classList.add('carousel-mode');

  // Hide the regular chapter body — we're replacing it
  bodyEl.style.display = 'none';
  if (document.getElementById('reader-nav-bottom')) {
    document.getElementById('reader-nav-bottom').style.display = 'none';
  }

  // Build full slide list: prepend a title slide
  const titleSlide = {
    type: 'title',
    id: chapter.id,
    date: chapter.date,
    title: chapter.title
  };

  // Filter out pure HR slides (they don't work well as full slides on mobile)
  const filteredSlides = slides.filter(s => s.type !== 'hr');
  const allSlides = [titleSlide, ...filteredSlides];

  let currentSlide = 0;

  // Build carousel HTML
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'carousel-viewport';
  carouselContainer.setAttribute('aria-label', 'Chapter reader carousel');

  // Progress bar
  const progress = document.createElement('div');
  progress.className = 'carousel-progress';
  allSlides.forEach((_, i) => {
    const pip = document.createElement('div');
    pip.className = 'carousel-pip' + (i === 0 ? ' active' : '');
    pip.dataset.idx = i;
    progress.appendChild(pip);
  });
  carouselContainer.appendChild(progress);

  // Counter
  const counter = document.createElement('div');
  counter.className = 'carousel-counter';
  counter.textContent = `1 / ${allSlides.length}`;
  carouselContainer.appendChild(counter);

  // Track
  const track = document.createElement('div');
  track.className = 'carousel-track';

  allSlides.forEach((slide, i) => {
    const el = document.createElement('div');
    el.className = `carousel-slide type-${slide.type}`;
    el.setAttribute('aria-hidden', i !== 0 ? 'true' : 'false');

    if (slide.type === 'title') {
      el.innerHTML = `
        <span class="carousel-title-id">[ ${escapeHtml(slide.id)} ]</span>
        <span class="carousel-title-date">${escapeHtml(slide.date)}</span>
        <div class="carousel-title-text">${escapeHtml(slide.title)}</div>
        <div class="carousel-title-hint">SWIPE TO BEGIN</div>
      `;
    } else if (slide.type === 'system') {
      const inner = slide.lines.map(l => `<p>${escapeHtml(l)}</p>`).join('');
      el.innerHTML = `<div class="system-block">${inner}</div>`;
    } else if (slide.type === 'prose') {
      el.innerHTML = slide.html;
    } else if (slide.type === 'cta') {
      el.innerHTML = slide.html;
    }

    track.appendChild(el);
  });

  carouselContainer.appendChild(track);

  // Swipe zones (tap left = prev, tap right = next)
  const zoneLeft  = document.createElement('div');
  const zoneRight = document.createElement('div');
  zoneLeft.className  = 'carousel-swipe-left';
  zoneRight.className = 'carousel-swipe-right';
  carouselContainer.appendChild(zoneLeft);
  carouselContainer.appendChild(zoneRight);

  // Insert carousel before the nav bottom
  const navBottom = document.getElementById('reader-nav-bottom');
  bodyEl.parentNode.insertBefore(carouselContainer, navBottom || bodyEl.nextSibling);

  // Re-show bottom nav for chapter prev/next (not slide nav)
  const chapterNav = document.createElement('nav');
  chapterNav.className = 'reader-nav-bottom';
  chapterNav.setAttribute('aria-label', 'Chapter navigation');

  const hasPrev = chapterIndex > 0;
  const hasNext = chapterIndex < chapters.length - 1;

  const btnPrev = document.createElement('button');
  btnPrev.className = 'nav-btn';
  btnPrev.textContent = '[ ← PREV ]';
  btnPrev.disabled = !hasPrev;
  if (hasPrev) btnPrev.addEventListener('click', () => {
    window.location.href = `reader.html?id=${encodeURIComponent(chapters[chapterIndex - 1].id)}`;
  });

  const btnArchive = document.createElement('a');
  btnArchive.className = 'nav-btn';
  btnArchive.href = 'index.html';
  btnArchive.textContent = '[ ARCHIVE ]';

  const btnNext = document.createElement('button');
  btnNext.className = 'nav-btn';
  btnNext.textContent = '[ NEXT → ]';
  btnNext.disabled = !hasNext;
  if (hasNext) btnNext.addEventListener('click', () => {
    window.location.href = `reader.html?id=${encodeURIComponent(chapters[chapterIndex + 1].id)}`;
  });

  chapterNav.appendChild(btnPrev);
  chapterNav.appendChild(btnArchive);
  chapterNav.appendChild(btnNext);

  bodyEl.parentNode.insertBefore(chapterNav, null);
  bodyEl.parentNode.appendChild(chapterNav);

  // ── NAVIGATION LOGIC ──────────────────────────────────────────────────────

  function goTo(idx) {
    if (idx < 0 || idx >= allSlides.length) return;

    // Update track position
    track.style.transform = `translateX(-${idx * 100}%)`;

    // Update aria-hidden
    track.querySelectorAll('.carousel-slide').forEach((el, i) => {
      el.setAttribute('aria-hidden', i !== idx ? 'true' : 'false');
    });

    // Update progress pips
    progress.querySelectorAll('.carousel-pip').forEach((pip, i) => {
      pip.className = 'carousel-pip' + (i < idx ? ' done' : i === idx ? ' active' : '');
    });

    // Update counter
    counter.textContent = `${idx + 1} / ${allSlides.length}`;

    currentSlide = idx;
  }

  // Tap zones
  zoneRight.addEventListener('click', () => goTo(currentSlide + 1));
  zoneLeft.addEventListener('click',  () => goTo(currentSlide - 1));

  // Touch swipe
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  carouselContainer.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });

  carouselContainer.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      isSwiping = true;
    }
  }, { passive: true });

  carouselContainer.addEventListener('touchend', e => {
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) goTo(currentSlide + 1); // swipe left = next
      else         goTo(currentSlide - 1); // swipe right = prev
    }
    isSwiping = false;
  }, { passive: true });

  // Keyboard arrows
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentSlide + 1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(currentSlide - 1);
  });

  // Initial render
  goTo(0);
}


// ─── READER (reader.html) ─────────────────────────────────────────────────────
async function loadReader() {
  const bodyEl   = document.getElementById('chapter-body');
  const titleEl  = document.getElementById('reader-title');
  const metaEl   = document.getElementById('reader-meta');
  const metaId   = document.getElementById('meta-id');
  const metaDate = document.getElementById('meta-date');
  const btnPrev  = document.getElementById('btn-prev');
  const btnNext  = document.getElementById('btn-next');

  if (!bodyEl) return;

  const params      = new URLSearchParams(window.location.search);
  const requestedId = params.get('id');

  let chapters;
  try {
    chapters = await fetchChaptersIndex();
  } catch (e) {
    bodyEl.innerHTML = `<p style="font-family:var(--font-mono);color:var(--text-muted);">[ ERROR: ARCHIVE UNAVAILABLE — ${escapeHtml(e.message)} ]</p>`;
    return;
  }

  const idx          = requestedId ? chapters.findIndex(ch => ch.id === requestedId) : 0;
  const chapterIndex = idx >= 0 ? idx : 0;
  const chapter      = chapters[chapterIndex];

  if (!chapter) {
    bodyEl.innerHTML = `<p style="font-family:var(--font-mono);color:var(--text-muted);">[ TRANSMISSION NOT FOUND ]</p>`;
    return;
  }

  document.title = `SYD / SIGNAL — ${chapter.id}: ${chapter.title}`;

  if (titleEl) {
    titleEl.innerHTML = escapeHtml(chapter.title) + '<span class="cursor" aria-hidden="true"></span>';
    setTimeout(() => { const c = titleEl.querySelector('.cursor'); if (c) c.remove(); }, 2000);
  }
  if (metaEl)   metaEl.classList.remove('hidden');
  if (metaId)   metaId.textContent   = chapter.id;
  if (metaDate) metaDate.textContent = chapter.date;

  let markdown;
  try {
    markdown = await fetchChapter(chapter.file);
  } catch (e) {
    bodyEl.innerHTML = `<p style="font-family:var(--font-mono);color:var(--text-muted);">[ ERROR: TRANSMISSION CORRUPTED — ${escapeHtml(e.message)} ]</p>`;
    return;
  }

  const { html, slides } = parseChapter(markdown);

  await new Promise(r => setTimeout(r, 400));

  // ── MOBILE: carousel mode ─────────────────────────────────────────────────
  if (IS_MOBILE) {
    bodyEl.innerHTML = ''; // clear loading indicator
    buildCarousel(slides, chapter, chapterIndex, chapters, bodyEl, titleEl, metaEl, metaId, metaDate);
    return;
  }

  // ── DESKTOP: scroll reader (original behaviour) ───────────────────────────
  bodyEl.classList.add('rendering');
  bodyEl.innerHTML = html;

  const elements = bodyEl.querySelectorAll('p, .system-block, hr');
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
}
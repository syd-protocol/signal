/**
 * SYD / SIGNAL — reader.js
 * Handles both the archive index (index.html) and the chapter reader (reader.html).
 * No framework. No build step.
 */

// ─── BASE PATH ────────────────────────────────────────────────────────────────
// Derives the repo root automatically from the script tag's own src attribute.
// Works on both GitHub Pages (syd-protocol.github.io/signal/) and locally.
// No hardcoding. No regex path hacking.

const BASE_URL = (() => {
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;
    if (src && src.includes('reader.js')) {
      return src.replace('reader.js', '');
    }
  }
  // Fallback: derive from current page location
  return window.location.href.replace(/\/[^/]*(\?.*)?$/, '/');
})();


// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────

/**
 * Converts chapter markdown to HTML.
 * Handles:
 *   - :::system ... ::: blocks → styled terminal overlay
 *   - Paragraph prose
 *   - Horizontal rules (---)
 *   - The chapter CTA note (lines starting with *The system*)
 */
function renderMarkdown(markdown) {
  // Strip frontmatter
  const body = markdown.replace(/^---[\s\S]*?---\n/, '').trim();

  const lines = body.split('\n');
  const output = [];

  let inSystem = false;
  let systemBuffer = [];
  let prosBuffer = [];

  function flushProse() {
    if (prosBuffer.length === 0) return;
    const text = prosBuffer.join('\n').trim();
    if (text) {
      const paras = text.split(/\n{2,}/);
      paras.forEach(para => {
        const trimmed = para.trim();
        if (!trimmed) return;
        if (trimmed === '---') {
          output.push('<hr>');
        } else if (trimmed.startsWith('*The system') || trimmed.startsWith('*The System')) {
          const inner = trimmed.replace(/^\*/, '').replace(/\*$/, '');
          output.push(`<p class="chapter-cta">${escapeHtml(inner).replace(
            'syd-protocol.github.io/terminal',
            '<a href="https://syd-protocol.github.io/terminal" target="_blank" rel="noopener">syd-protocol.github.io/terminal</a>'
          )}</p>`);
        } else {
          output.push(`<p>${escapeHtml(trimmed).replace(/\n/g, '<br>')}</p>`);
        }
      });
    }
    prosBuffer = [];
  }

  function flushSystem() {
    if (systemBuffer.length === 0) return;
    const content = systemBuffer.join('\n').trim();
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    const inner = lines.map(l => `<p>${escapeHtml(l)}</p>`).join('');
    output.push(`<div class="system-block">${inner}</div>`);
    systemBuffer = [];
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === ':::system') {
      flushProse();
      inSystem = true;
      i++;
      continue;
    }

    if (line.trim() === ':::' && inSystem) {
      flushSystem();
      inSystem = false;
      i++;
      continue;
    }

    if (inSystem) {
      systemBuffer.push(line);
    } else {
      prosBuffer.push(line);
    }

    i++;
  }

  if (inSystem) flushSystem();
  else flushProse();

  return output.join('\n');
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
    if (key && rest.length) {
      meta[key.trim()] = rest.join(':').trim();
    }
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


// ─── READER (reader.html) ─────────────────────────────────────────────────────

async function loadReader() {
  const bodyEl = document.getElementById('chapter-body');
  const titleEl = document.getElementById('reader-title');
  const metaEl = document.getElementById('reader-meta');
  const metaId = document.getElementById('meta-id');
  const metaDate = document.getElementById('meta-date');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  if (!bodyEl) return;

  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('id');

  let chapters;
  try {
    chapters = await fetchChaptersIndex();
  } catch (e) {
    bodyEl.innerHTML = `<p style="font-family:var(--font-mono);color:var(--text-muted);">[ ERROR: ARCHIVE UNAVAILABLE — ${escapeHtml(e.message)} ]</p>`;
    return;
  }

  const idx = requestedId
    ? chapters.findIndex(ch => ch.id === requestedId)
    : 0;

  const chapterIndex = idx >= 0 ? idx : 0;
  const chapter = chapters[chapterIndex];

  if (!chapter) {
    bodyEl.innerHTML = `<p style="font-family:var(--font-mono);color:var(--text-muted);">[ TRANSMISSION NOT FOUND ]</p>`;
    return;
  }

  document.title = `SYD / SIGNAL — ${chapter.id}: ${chapter.title}`;

  if (titleEl) {
    titleEl.innerHTML = escapeHtml(chapter.title) + '<span class="cursor" aria-hidden="true"></span>';
    setTimeout(() => {
      const cursor = titleEl.querySelector('.cursor');
      if (cursor) cursor.remove();
    }, 2000);
  }
  if (metaEl) metaEl.classList.remove('hidden');
  if (metaId) metaId.textContent = chapter.id;
  if (metaDate) metaDate.textContent = chapter.date;

  let markdown;
  try {
    markdown = await fetchChapter(chapter.file);
  } catch (e) {
    bodyEl.innerHTML = `<p style="font-family:var(--font-mono);color:var(--text-muted);">[ ERROR: TRANSMISSION CORRUPTED — ${escapeHtml(e.message)} ]</p>`;
    return;
  }

  const html = renderMarkdown(markdown);

  await new Promise(r => setTimeout(r, 400));

  bodyEl.classList.add('rendering');
  bodyEl.innerHTML = html;

  const elements = bodyEl.querySelectorAll('p, .system-block, hr');
  elements.forEach((el, i) => {
    el.style.animationDelay = `${i * 80}ms`;
  });

  setTimeout(() => {
    bodyEl.classList.remove('rendering');
    elements.forEach(el => el.style.animationDelay = '');
  }, elements.length * 80 + 600);

  const hasPrev = chapterIndex > 0;
  const hasNext = chapterIndex < chapters.length - 1;

  if (btnPrev) {
    btnPrev.disabled = !hasPrev;
    if (hasPrev) {
      btnPrev.addEventListener('click', () => {
        window.location.href = `reader.html?id=${encodeURIComponent(chapters[chapterIndex - 1].id)}`;
      });
    }
  }

  if (btnNext) {
    btnNext.disabled = !hasNext;
    if (hasNext) {
      btnNext.addEventListener('click', () => {
        window.location.href = `reader.html?id=${encodeURIComponent(chapters[chapterIndex + 1].id)}`;
      });
    }
  }
}
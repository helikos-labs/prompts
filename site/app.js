// Progressive enhancement for the static pages: theme, search and filters, placeholders, copy.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* storage blocked */ } },
  };
  const STALE_MONTHS = 6;
  const MAX_OPEN_URL = 6000;

  // ── theme: system → light → dark ───────────────────────────────────
  const root = document.documentElement;
  const themeBtn = $('.theme-toggle');
  const themeLabel = () => {
    const t = root.dataset.theme || 'system';
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', `Colour theme: ${t}`);
      themeBtn.title = `Colour theme: ${t} (click to change)`;
    }
  };
  themeLabel();
  themeBtn?.addEventListener('click', () => {
    const next = { system: 'light', light: 'dark', dark: 'system' }[root.dataset.theme || 'system'];
    if (next === 'system') { delete root.dataset.theme; store.set('theme', null); }
    else { root.dataset.theme = next; store.set('theme', next); }
    themeLabel();
  });

  // ── "may be dated": judged against today, not the build date ──────
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - STALE_MONTHS);
  for (const el of $$('[data-tested]')) {
    const stale = new Date(`${el.dataset.tested}T00:00:00Z`) < cutoff;
    el.classList.toggle('stale', stale);
    if (stale) el.title += ` · more than ${STALE_MONTHS} months ago, so newer models may behave differently`;
  }

  // ── home: search, category chips, tag and type filters ────────────
  const grid = $('#grid');
  if (grid) {
    const cards = $$('.card', grid);
    const order = new Map(cards.map((c, i) => [c.dataset.slug, i]));
    const q = $('#q');
    const tagSel = $('#tag');
    const useSel = $('#use');
    const chips = $$('.chip');
    const line = $('#result-line');
    const empty = $('#empty');
    const state = { q: '', c: '', t: '', u: '' };
    let index = null;
    let loading = null;

    const fromCard = (c) => ({
      title: $('.card-title', c).textContent,
      summary: $('.card-summary', c).textContent,
      category: $('.card-cat', c).textContent,
      tags: c.dataset.tags.split(' '),
      text: '',
    });
    const loadIndex = () => {
      if (index || loading) return loading;
      loading = fetch('/search.json')
        .then((r) => (r.ok ? r.json() : []))
        .then((rows) => { index = new Map(rows.map((r) => [r.slug, r])); apply(false); })
        .catch(() => { index = new Map(); });
      return loading;
    };
    const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
    const score = (doc, terms) => {
      const f = {
        title: norm(doc.title), tags: norm(doc.tags.join(' ')), summary: norm(doc.summary),
        category: norm(doc.category), text: norm(doc.text || ''),
      };
      let total = 0;
      for (const t of terms) {
        const s = (f.title.includes(t) ? 6 : 0) + (f.tags.includes(t) ? 4 : 0) + (f.summary.includes(t) ? 3 : 0) +
          (f.category.includes(t) ? 2 : 0) + (f.text.includes(t) ? 1 : 0);
        if (!s) return 0;
        total += s;
      }
      return total;
    };

    function apply(push = true) {
      const terms = norm(state.q).split(/\s+/).filter(Boolean);
      const shown = [];
      for (const c of cards) {
        let ok = (!state.c || c.dataset.category === state.c) &&
          (!state.t || c.dataset.tags.split(' ').includes(state.t)) &&
          (!state.u || c.dataset.use === state.u);
        let s = 1;
        if (ok && terms.length) {
          const doc = (index && index.get(c.dataset.slug)) || fromCard(c);
          s = score(doc, terms);
          ok = s > 0;
        }
        c.hidden = !ok;
        if (ok) shown.push([c, s]);
      }
      if (terms.length) shown.sort((a, b) => b[1] - a[1] || order.get(a[0].dataset.slug) - order.get(b[0].dataset.slug));
      else shown.sort((a, b) => order.get(a[0].dataset.slug) - order.get(b[0].dataset.slug));
      for (const [c] of shown) grid.append(c);
      for (const c of cards) if (c.hidden) grid.append(c);

      const filtered = state.q || state.c || state.t || state.u;
      const blurb = state.c ? chips.find((ch) => ch.dataset.cat === state.c)?.dataset.blurb : '';
      line.textContent = filtered ? `${blurb ? `${blurb} ` : ''}${shown.length} of ${cards.length} prompts` : '';
      if (filtered && shown.length) {
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'link-btn';
        clear.textContent = 'Clear';
        clear.style.marginLeft = '8px';
        clear.addEventListener('click', reset);
        line.append(' · ', clear);
      }
      empty.hidden = shown.length > 0;
      for (const ch of chips) ch.setAttribute('aria-pressed', String(ch.dataset.cat === state.c));
      tagSel.classList.toggle('active', !!state.t);
      useSel.classList.toggle('active', !!state.u);
      if (push) {
        const p = new URLSearchParams();
        for (const k of ['q', 'c', 't', 'u']) if (state[k]) p.set(k, state[k]);
        const qs = p.toString();
        history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
      }
    }
    function reset() {
      Object.assign(state, { q: '', c: '', t: '', u: '' });
      q.value = ''; tagSel.value = ''; useSel.value = '';
      apply();
      q.focus();
    }

    const params = new URLSearchParams(location.search);
    state.q = params.get('q') || '';
    state.c = chips.some((c) => c.dataset.cat === params.get('c')) ? params.get('c') : '';
    state.t = [...tagSel.options].some((o) => o.value === params.get('t')) ? params.get('t') : '';
    state.u = [...useSel.options].some((o) => o.value === params.get('u')) ? params.get('u') : '';
    q.value = state.q; tagSel.value = state.t; useSel.value = state.u;
    if (state.q) loadIndex();
    apply(false);

    let timer;
    q.addEventListener('focus', loadIndex, { once: true });
    q.addEventListener('input', () => {
      loadIndex();
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = q.value.trim(); apply(); }, 80);
    });
    q.addEventListener('keydown', (e) => { if (e.key === 'Escape' && q.value) { q.value = ''; state.q = ''; apply(); } });
    for (const ch of chips) ch.addEventListener('click', () => { state.c = ch.dataset.cat; apply(); });
    tagSel.addEventListener('change', () => { state.t = tagSel.value; apply(); });
    useSel.addEventListener('change', () => { state.u = useSel.value; apply(); });
    $('#clear')?.addEventListener('click', reset);
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); q.focus(); }
    });
  }

  // ── entry page: placeholders, copy, open, expand ──────────────────
  const article = $('.entry-article');
  if (article) {
    const slug = article.dataset.slug;
    const raw = JSON.parse($('#prompt-raw').textContent);
    const fields = $$('[data-fill]');
    const marks = $$('mark.ph');
    const openBtn = $('[data-action="open"]');
    const copyBtn = $('[data-action="copy"]');
    const status = $('.copy-status');
    const KEY = `fill:${slug}`;

    const openHref = (text) => {
      const url = openBtn.dataset.base + encodeURIComponent(text);
      return url.length > MAX_OPEN_URL ? openBtn.dataset.blank : url;
    };
    const values = () => Object.fromEntries(fields.map((f) => [f.dataset.fill, f.value]));
    const filled = () => {
      const v = values();
      return raw.replace(/\{\{([a-z][a-z0-9_]*)\}\}/g, (m, n) => (v[n] && v[n].trim() ? v[n] : m));
    };
    const grow = (t) => { t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 2}px`; };
    const sync = () => {
      const v = values();
      for (const m of marks) {
        const val = v[m.dataset.ph];
        const has = !!(val && val.trim());
        m.textContent = has ? val : `{{${m.dataset.ph}}}`;
        m.classList.toggle('filled', has);
      }
      if (openBtn) openBtn.href = openHref(filled());
      const any = fields.some((f) => f.value.trim());
      store.set(KEY, any ? JSON.stringify(v) : null);
    };

    try {
      const saved = JSON.parse(store.get(KEY) || 'null');
      if (saved) for (const f of fields) if (typeof saved[f.dataset.fill] === 'string') f.value = saved[f.dataset.fill];
    } catch { /* ignore a bad saved value */ }
    for (const f of fields) {
      grow(f);
      f.addEventListener('input', () => { grow(f); sync(); });
    }
    if (fields.length) sync();
    $('[data-action="reset"]')?.addEventListener('click', () => {
      for (const f of fields) { f.value = ''; grow(f); }
      sync();
      fields[0]?.focus();
    });

    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.append(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        ta.remove();
        return ok;
      }
    }
    let resetTimer;
    const flash = (msg, ok = true) => {
      status.textContent = msg;
      if (ok) {
        copyBtn.classList.add('done');
        $('span', copyBtn).textContent = 'Copied';
      }
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copyBtn.classList.remove('done');
        $('span', copyBtn).textContent = 'Copy';
      }, 1800);
    };
    const left = () => (raw.match(/\{\{[a-z][a-z0-9_]*\}\}/g) ? [...new Set(filled().match(/\{\{[a-z][a-z0-9_]*\}\}/g) || [])].length : 0);
    copyBtn?.addEventListener('click', async () => {
      const text = filled();
      const ok = await copyText(text);
      const n = left();
      if (ok) flash(`Copied ${text.length.toLocaleString()} characters${n ? ` · ${n} placeholder${n === 1 ? '' : 's'} still to fill` : ''}.`);
      else flash('Copy was blocked by the browser. Select the prompt and copy it by hand.', false);
    });
    openBtn?.addEventListener('click', () => {
      // Runs before the link opens. A prompt too long for a link is copied, and the link opens an empty chat.
      const text = filled();
      const url = openBtn.dataset.base + encodeURIComponent(text);
      if (url.length <= MAX_OPEN_URL) { openBtn.href = url; return; }
      openBtn.href = openBtn.dataset.blank;
      copyText(text).then((ok) => flash(ok
        ? 'Copied: it is too long to pass in a link, so paste it into the new chat.'
        : 'Too long to pass in a link, and the browser blocked copying. Select the prompt and copy it by hand.', ok));
    });

    const card = $('.prompt-card');
    $('[data-action="expand"]')?.addEventListener('click', (e) => {
      const open = card.classList.toggle('collapsed') === false;
      e.currentTarget.setAttribute('aria-expanded', String(open));
      e.currentTarget.textContent = open ? 'Show less' : `Show all ${raw.split('\n').length} lines`;
      if (!open) card.scrollIntoView({ block: 'nearest' });
    });
  }
})();

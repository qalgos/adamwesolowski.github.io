/* =========================================================
   Page behaviour: navigation, section tracking,
   publication filters, copy-email, footer year.
   Everything here is progressive: the page works without JS.
   ========================================================= */
(() => {
  const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav__toggle');
  const links = [...nav.querySelectorAll('.nav__links a')];

  /* ---------- nav background once you scroll ---------- */
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const setOpen = open => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  links.forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false);
  });

  /* ---------- highlight the section you're reading ---------- */
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const sections = [...byId.keys()].map(id => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.removeAttribute('aria-current'));
        const a = byId.get(entry.target.id);
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => io.observe(s));

    // clear the highlight when back in the hero
    const hero = document.getElementById('top');
    if (hero) new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio > 0.5) links.forEach(a => a.removeAttribute('aria-current'));
    }, { threshold: [0.5] }).observe(hero);
  }

  /* ---------- publication filters ---------- */
  const chips = [...document.querySelectorAll('.chip[data-filter]')];
  const pubs = [...document.querySelectorAll('.pub')];
  const groups = [...document.querySelectorAll('.pub-group')];
  const count = document.getElementById('pub-count');

  const applyFilter = tag => {
    let shown = 0;
    pubs.forEach(p => {
      const tags = (p.dataset.tags || '').split(/\s+/);
      const match = tag === 'all' || tags.includes(tag);
      p.hidden = !match;
      if (match) shown++;
    });
    groups.forEach(g => { g.hidden = !g.querySelector('.pub:not([hidden])'); });
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === tag)));
    if (count) {
      count.textContent = tag === 'all'
        ? `${pubs.length} papers`
        : `${shown} of ${pubs.length} papers`;
    }
  };
  chips.forEach(c => c.addEventListener('click', () => applyFilter(c.dataset.filter)));
  if (chips.length) applyFilter('all');

  /* ---------- copy email ---------- */
  const copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied';
      } catch {
        // fallback: select the address so it can be copied by hand
        const link = document.getElementById('email-link');
        const range = document.createRange();
        range.selectNodeContents(link);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        copyBtn.textContent = 'Press Ctrl+C to copy';
      }
      setTimeout(() => { copyBtn.textContent = 'Copy email'; }, 2200);
    });
  }

  /* ---------- footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

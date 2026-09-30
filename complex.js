/* =========================================================
   Hero background: a live Vietoris–Rips complex.

   A slowly drifting point cloud. Two points are joined by an
   edge when their distance is below ε; three pairwise-joined
   points span a (faintly gilded) triangle. The panel reports
   β₀ (connected components, via union–find), the number of
   edges and triangles, and the Euler characteristic of the
   2-skeleton, χ = V − E + T.

   ε is measured in units of the mean spacing between points,
   so the picture behaves the same on a phone and a wide screen.
   ========================================================= */
(() => {
  const canvas = document.getElementById('complex');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('.hero') || canvas.parentElement;
  const slider = document.getElementById('eps');
  const playBtn = document.getElementById('play');
  const out = {
    eps: document.getElementById('r-eps'),
    b0:  document.getElementById('r-b0'),
    e:   document.getElementById('r-e'),
    t:   document.getElementById('r-t'),
    chi: document.getElementById('r-chi'),
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GOLD = '201,164,92';
  const PARCHMENT = '236,230,214';

  // ε range, in units of mean point spacing
  const F_MIN = 0.3, F_MAX = 1.9;
  const sliderToF = v => F_MIN + (v / 100) * (F_MAX - F_MIN);
  const fToSlider = f => Math.round(((f - F_MIN) / (F_MAX - F_MIN)) * 100);

  let W = 0, H = 0, dpr = 1, spacing = 100;
  let pts = [];
  let pointer = null;
  let f = sliderToF(Number(slider ? slider.value : 45));
  let manual = false;        // user has taken over ε with the slider
  let paused = reduceMotion; // motion of the points and the breathing ε
  let visible = true;
  let rafId = null;
  const tStart = performance.now();
  let lastT = tStart;

  /* ---------- setup ---------- */
  function seed() {
    const n = Math.round(Math.min(70, Math.max(26, (W * H) / 21000)));
    const wide = W > 860;
    pts = Array.from({ length: n }, () => {
      // on wide screens, bias the cloud to the right, away from the name
      const x = wide ? W * (0.3 + 0.7 * Math.random()) : W * Math.random();
      const a = Math.random() * Math.PI * 2;
      const s = 6 + Math.random() * 10; // px per second
      return { x, y: H * Math.random(), vx: Math.cos(a) * s, vy: Math.sin(a) * s };
    });
    spacing = Math.sqrt((W * H * (wide ? 0.7 : 1)) / n);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const oldW = W, oldH = H;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!pts.length || Math.abs(W - oldW) > 80) {
      seed();
    } else if (oldW && oldH) {
      // small change (e.g. mobile address bar): rescale, don't reshuffle
      for (const p of pts) { p.x *= W / oldW; p.y *= H / oldH; }
    }
    if (paused || !visible) draw(performance.now());
  }

  /* ---------- simulation ---------- */
  function step(dt) {
    for (const p of pts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > W) { p.x = W; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > H) { p.y = H; p.vy *= -1; }
    }
  }

  function currentF(now) {
    if (manual) return f;
    const t = (now - tStart) / 1000;
    // breathe between ~0.75 and ~1.65
    const breathe = 1.2 + 0.45 * Math.sin(t / 6.5 - Math.PI / 2);
    // on load, grow from zero so the complex assembles itself
    const intro = reduceMotion ? 1 : Math.min(1, t / 2.6);
    const eased = 1 - Math.pow(1 - intro, 3);
    return breathe * eased;
  }

  /* ---------- geometry + topology ---------- */
  function compute(eps) {
    const V = pointer ? pts.concat([pointer]) : pts;
    const n = V.length;
    const eps2 = eps * eps;
    const adj = new Uint8Array(n * n);
    const edges = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = V[i].x - V[j].x, dy = V[i].y - V[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < eps2) {
          adj[i * n + j] = adj[j * n + i] = 1;
          edges.push([i, j, Math.sqrt(d2)]);
        }
      }
    }
    const tris = [];
    for (const [i, j] of edges) {
      for (let k = j + 1; k < n; k++) {
        if (adj[i * n + k] && adj[j * n + k]) tris.push([i, j, k]);
      }
    }
    // β₀ by union–find
    const parent = Int32Array.from({ length: n }, (_, i) => i);
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    let comps = n;
    for (const [i, j] of edges) {
      const a = find(i), b = find(j);
      if (a !== b) { parent[a] = b; comps--; }
    }
    return { V, edges, tris, comps };
  }

  /* ---------- drawing ---------- */
  let lastReadout = '';
  function draw(now) {
    const fNow = currentF(now);
    const eps = Math.max(0.0001, fNow * spacing);
    const { V, edges, tris, comps } = compute(eps);

    ctx.clearRect(0, 0, W, H);

    // triangles: 2-simplices, a faint gold film
    ctx.fillStyle = `rgba(${GOLD},0.12)`;
    ctx.beginPath();
    for (const [i, j, k] of tris) {
      ctx.moveTo(V[i].x, V[i].y);
      ctx.lineTo(V[j].x, V[j].y);
      ctx.lineTo(V[k].x, V[k].y);
      ctx.closePath();
    }
    ctx.fill();

    // edges: 1-simplices, brighter when short
    ctx.lineWidth = 1;
    for (const [i, j, d] of edges) {
      const a = 0.12 + 0.5 * (1 - d / eps);
      ctx.strokeStyle = `rgba(${GOLD},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(V[i].x, V[i].y);
      ctx.lineTo(V[j].x, V[j].y);
      ctx.stroke();
    }

    // vertices: 0-simplices
    ctx.fillStyle = `rgba(${PARCHMENT},0.85)`;
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // the visitor's own vertex, with its ε/2 ball
    if (pointer) {
      ctx.strokeStyle = `rgba(${GOLD},0.35)`;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, eps / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgb(${GOLD})`;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // readout (only touch the DOM when something changed)
    const chi = V.length - edges.length + tris.length;
    const key = `${fNow.toFixed(2)}|${comps}|${edges.length}|${tris.length}`;
    if (key !== lastReadout) {
      lastReadout = key;
      if (out.eps) out.eps.textContent = fNow.toFixed(2);
      if (out.b0)  out.b0.textContent = comps;
      if (out.e)   out.e.textContent = edges.length;
      if (out.t)   out.t.textContent = tris.length;
      if (out.chi) out.chi.textContent = chi;
      if (slider && !manual) slider.value = fToSlider(Math.max(F_MIN, fNow));
    }
  }

  /* ---------- loop ---------- */
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (!paused) step(dt);
    draw(now);
    rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (rafId || paused || !visible || document.hidden) return;
    lastT = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }
  const redraw = () => { if (!rafId) draw(performance.now()); };

  /* ---------- interaction ---------- */
  hero.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    redraw();
  });
  hero.addEventListener('pointerleave', () => { pointer = null; redraw(); });

  if (slider) {
    slider.addEventListener('input', () => {
      manual = true;
      f = sliderToF(Number(slider.value));
      redraw();
    });
  }

  function setPaused(p) {
    paused = p;
    if (playBtn) {
      playBtn.setAttribute('aria-pressed', String(p));
      playBtn.textContent = p ? 'Resume motion' : 'Pause motion';
    }
    if (p) { stop(); redraw(); }
    else { manual = false; start(); }
  }
  if (playBtn) {
    playBtn.addEventListener('click', () => setPaused(!paused));
    if (reduceMotion) setPaused(true);
  }

  // only animate while the hero is on screen and the tab is visible
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  resize();
  if (reduceMotion) { f = sliderToF(Number(slider ? slider.value : 45)); manual = true; draw(performance.now()); }
  else start();
})();

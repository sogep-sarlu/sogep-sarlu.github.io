/*
 * Composants adaptés de Kokonut UI (https://kokonutui.com), licence MIT,
 * © 2025 kokonutUI / Dorian Baffier. Portés de React vers JavaScript sans dépendance :
 *  - SplitFlap : « Split Flap Text » (tableau d'affichage à volets)
 *  - BackgroundPaths : « Background Paths » (ruban de lignes animées)
 *  - CardFlip : « Card Flip » (cartes retournables)
 */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Split Flap ---------- */
  const CHARSET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-/&!?%';
  const FLIP = 56, STAGGER = 40;
  const clean = v => [...v.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')].map(c => CHARSET.includes(c) ? c : ' ').join('');

  function half(char, pos) {
    const h = document.createElement('span');
    h.className = 'h ' + pos;
    const i = document.createElement('i');
    i.textContent = char;
    h.appendChild(i);
    return h;
  }

  function makeTile() {
    const t = document.createElement('span');
    t.className = 't';
    t.setAttribute('aria-hidden', 'true');
    const top = half(' ', 'top'), bot = half(' ', 'bot');
    const shade = document.createElement('span'); shade.className = 'shade';
    const hinge = document.createElement('span'); hinge.className = 'hinge';
    t.append(top, bot, shade, hinge);
    let shown = ' ', timer = 0;
    function render(front, back) { top.firstChild.textContent = front; bot.firstChild.textContent = back; }
    function flipTo(target, delay) {
      clearTimeout(timer);
      if (reduce) { shown = target; render(target, target); return; }
      const step = () => {
        if (shown === target) return;
        const from = shown, to = CHARSET[(CHARSET.indexOf(from) + 1) % CHARSET.length];
        render(to, from);
        const ft = half(from, 'top'), fb = half(to, 'bot');
        ft.style.transformOrigin = '50% 100%';
        fb.style.transformOrigin = '50% 0%';
        fb.style.transform = 'rotateX(90deg)';
        t.insertBefore(ft, shade); t.insertBefore(fb, shade);
        const hh = FLIP / 2;
        ft.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], { duration: hh, easing: 'cubic-bezier(0.5,0,0.9,0.6)', fill: 'forwards' });
        fb.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], { duration: hh, delay: hh, easing: 'cubic-bezier(0.2,0.6,0.3,1)', fill: 'both' });
        shade.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: FLIP });
        timer = setTimeout(() => { ft.remove(); fb.remove(); shown = to; render(to, to); step(); }, FLIP);
      };
      timer = setTimeout(step, delay);
    }
    return { el: t, flipTo };
  }

  function SplitFlap(el, words, interval) {
    const list = words.map(clean);
    const size = Math.max(...list.map(w => w.length));
    const tiles = Array.from({ length: size }, makeTile);
    tiles.forEach(t => el.appendChild(t.el));
    let idx = 0, id = 0;
    const show = w => [...w.padEnd(size, ' ')].forEach((c, i) => tiles[i].flipTo(c, i * STAGGER));
    return {
      start() { show(list[0]); if (list.length > 1) id = setInterval(() => { idx = (idx + 1) % list.length; show(list[idx]); }, interval || 3200); },
      stop() { clearInterval(id); }
    };
  }

  /* ---------- Background Paths ---------- */
  const SAMPLES = 64, OVERSCAN = 0.06, DRAW_MS = 1400, DRAW_STAGGER_MS = 40, PART_RADIUS = 150, PART_PUSH = 56;
  const LAYERS = [
    { width: 1, opacity: 0.16, phase: 0.6, pace: 0.7, part: 0.45 },
    { width: 1.25, opacity: 0.26, phase: 0.3, pace: 0.85, part: 0.75 },
    { width: 1.5, opacity: 0.4, phase: 0, pace: 1, part: 1 }
  ];
  const EASE_OUT = t => 1 - (1 - t) ** 3;

  function lineY(s, u, layer, f, shape, band) {
    const t = f.time * layer.pace, x = u * f.width;
    const center = f.height * 0.5 + shape.slope * (x - f.width / 2) + band * 0.1 * Math.sin(Math.PI * 2 * (0.75 * u + 0.1) + layer.phase + t * 0.35);
    const turn = 0.22 + 0.09 * Math.sin(t * 0.21 + layer.phase);
    const breathe = 0.3 * Math.sin(t * 0.5 + s * 4 + layer.phase);
    const twist = Math.cos(Math.PI * (u - turn) + s * (0.6 + breathe) + layer.phase);
    return center + s * shape.spread * band * twist;
  }
  function partY(x, y, f, strength) {
    const p = f.pointer; if (p.amount < 0.001) return y;
    const dx = x - p.x, dy = y - p.y;
    const fall = Math.exp(-(dx * dx + dy * dy) / (PART_RADIUS * PART_RADIUS));
    return y + (dy / (Math.abs(dy) + 24)) * fall * PART_PUSH * strength * p.amount;
  }
  function drawLines(ctx, f, shape, color) {
    const { width, height } = f;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const band = Math.min(height, width * 1.1);
    const per = Math.max(1, Math.round(shape.count / LAYERS.length));
    const xs = new Float32Array(SAMPLES + 1), ys = new Float32Array(SAMPLES + 1);
    LAYERS.forEach((layer, li) => {
      ctx.lineWidth = layer.width;
      for (let i = 0; i < per; i++) {
        const drawn = f.drawn[li * per + i] ?? 1; if (drawn <= 0) continue;
        const s = per === 1 ? 0 : i / (per - 1) - 0.5;
        const last = Math.max(1, Math.ceil(SAMPLES * drawn));
        for (let k = 0; k <= last; k++) {
          const u = -OVERSCAN + (k / SAMPLES) * (1 + OVERSCAN * 2), x = u * width, y = lineY(s, u, layer, f, shape, band);
          xs[k] = x; ys[k] = shape.interactive ? partY(x, y, f, layer.part) : y;
        }
        ctx.globalAlpha = layer.opacity * (0.45 + 0.55 * (1 - Math.abs(s) * 2));
        ctx.beginPath(); ctx.moveTo(xs[0], ys[0]);
        for (let k = 1; k < last; k++) ctx.quadraticCurveTo(xs[k], ys[k], (xs[k] + xs[k + 1]) / 2, (ys[k] + ys[k + 1]) / 2);
        ctx.lineTo(xs[last], ys[last]); ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  function BackgroundPaths(canvas, opts) {
    const o = Object.assign({ count: 42, spread: 1, angle: -8, speed: 1, interactive: true }, opts);
    const root = canvas.parentElement, ctx = canvas.getContext('2d'); if (!ctx) return;
    const shape = { count: o.count, spread: o.spread, slope: Math.tan(o.angle * Math.PI / 180), interactive: o.interactive && !reduce };
    const per = Math.max(1, Math.round(o.count / LAYERS.length));
    const f = { width: 0, height: 0, time: 40, drawn: new Array(per * LAYERS.length).fill(reduce ? 1 : 0), pointer: { x: 0, y: 0, amount: 0, on: false } };
    const color = getComputedStyle(canvas).color;
    let start = 0, last = 0, raf = 0, visible = false, entered = false;
    const paint = () => drawLines(ctx, f, shape, color);
    const resize = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      f.width = r.width; f.height = r.height;
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); paint();
    };
    const loop = now => {
      raf = 0;
      if (!start) { start = now; last = now; }
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      f.time += dt * o.speed;
      const el = now - start;
      for (let i = 0; i < f.drawn.length; i++) if (f.drawn[i] < 1) f.drawn[i] = EASE_OUT(Math.min(Math.max((el - (i % per) * DRAW_STAGGER_MS) / DRAW_MS, 0), 1));
      f.pointer.amount += ((f.pointer.on ? 1 : 0) - f.pointer.amount) * 0.08;
      paint();
      if (visible) raf = requestAnimationFrame(loop);
    };
    const play = () => { if (!raf && visible && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    resize();
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; if (visible) { entered = true; play(); } }).observe(root);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden && entered; play(); });
    root.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !shape.interactive) return;
      const r = canvas.getBoundingClientRect(); f.pointer.x = e.clientX - r.left; f.pointer.y = e.clientY - r.top; f.pointer.on = true; play();
    });
    root.addEventListener('pointerleave', () => { f.pointer.on = false; });
  }

  /* ---------- Card Flip ---------- */
  function CardFlip(card) {
    const btns = card.querySelectorAll('.turn');
    const front = card.querySelector('.front'), back = card.querySelector('.back');
    const set = on => {
      card.classList.toggle('on', on);
      front.inert = on; back.inert = !on;
      btns.forEach(b => b.setAttribute('aria-expanded', String(on)));
    };
    set(false);
    btns.forEach(b => b.addEventListener('click', () => { const on = !card.classList.contains('on'); set(on); (on ? back : front).querySelector('.turn').focus({ preventScroll: true }); }));
    // un clic n'importe où sur la photo ou le texte retourne aussi la carte
    front.addEventListener('click', e => { if (!e.target.closest('.turn')) { set(true); back.querySelector('.turn').focus({ preventScroll: true }); } });
  }

  window.Kokonut = { SplitFlap, BackgroundPaths, CardFlip };
})();

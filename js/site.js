/* SOGEP-SARLU — animations (anime.js + Motion) et interactions */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = window.Motion || null;
  const A = window.anime || null;
  const K = window.Kokonut || null;
  const html = document.documentElement;
  const EN = html.lang === 'en';

  /* ---------- 1. Écran d'accueil (anime.js) puis ouverture ---------- */
  const splash = $('.splash');
  const showSplash = !reduce && A && splash && !html.classList.contains('no-splash');
  let heroDelay = 0;
  if (showSplash) {
    try { sessionStorage.setItem('sogep-splash', '1'); } catch (e) {}
    heroDelay = 1500;
    A.timeline({ easing: 'easeOutCubic' })
      .add({ targets: '.splash rect', strokeDashoffset: [240, 0], duration: 650 })
      .add({ targets: '.splash .t', opacity: [0, 1], scale: [0.5, 1], duration: 350, easing: 'easeOutBack' }, '-=150')
      .add({ targets: '.splash .name', clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'], duration: 500 }, '-=250')
      .add({ targets: '.splash', translateY: ['0%', '-100%'], duration: 700, easing: 'cubicBezier(.7,0,.2,1)', delay: 250, complete: () => splash.remove() });
  } else if (splash) {
    splash.remove();
  }

  /* titre mot par mot (anime.js) */
  const h1 = $('.hero h1');
  if (h1 && A && !reduce) {
    (function wrap(node) {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const o = document.createElement('span'); o.className = 'hw';
            const i = document.createElement('span'); i.textContent = p; o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    })(h1);
    A.set('.hw > span', { translateY: '110%' });
    A.set(['.hero .kicker', '.hero .lead', '.hero .acts', '.hero .board'], { opacity: 0, translateY: 24 });
    A.set('.hero figure', { opacity: 0, translateX: 40 });
    A.set('.hero .tag', { opacity: 0, translateY: -16 });
    A.set('.hero .ed', { opacity: 0, translateX: -24 });
    const heroTl = A.timeline({ easing: 'easeOutExpo', autoplay: false });
    heroTl
      .add({ targets: '.hero .kicker', opacity: 1, translateY: 0, duration: 700 })
      .add({ targets: '.hw > span', translateY: '0%', duration: 900, delay: A.stagger(60) }, '-=500')
      .add({ targets: '.hero figure', opacity: 1, translateX: 0, duration: 1100 }, '-=900')
      .add({ targets: '.hero .lead', opacity: 1, translateY: 0, duration: 700 }, '-=800')
      .add({ targets: '.hero .acts', opacity: 1, translateY: 0, duration: 700 }, '-=550')
      .add({ targets: '.hero .board', opacity: 1, translateY: 0, duration: 700 }, '-=550')
      .add({ targets: '.hero .tag', opacity: 1, translateY: 0, duration: 600 }, '-=700')
      .add({ targets: '.hero .ed', opacity: 1, translateX: 0, duration: 600 }, '-=500');
    setTimeout(() => heroTl.play(), heroDelay);
  }
  window.dispatchEvent(new CustomEvent('sogep:hero', { detail: { delay: heroDelay } }));

  /* tableau à volets (Kokonut UI) */
  const flapEl = $('#flap');
  if (flapEl && K) {
    const words = flapEl.dataset.words.split('|');
    const board = K.SplitFlap(flapEl, words, 2600);
    setTimeout(() => board.start(), heroDelay + 900);
  }

  /* menu sur téléphone et tablette */
  const mbtn = $('.menu-btn');
  if (mbtn && hdrEl()) {
    const setOpen = o => { hdrEl().classList.toggle('open', o); mbtn.setAttribute('aria-expanded', String(o)); mbtn.setAttribute('aria-label', o ? (mbtn.dataset.close || 'Fermer le menu') : (mbtn.dataset.open || 'Ouvrir le menu')); };
    mbtn.addEventListener('click', () => setOpen(mbtn.getAttribute('aria-expanded') !== 'true'));
    $$('nav.menu a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }
  function hdrEl() { return $('header.top'); }

  /* ---------- 2. Barre de progression, en-tête, menu actif (Motion) ---------- */
  const bar = $('#progress'), hdr = $('header.top');
  if (M && M.scroll && bar && !reduce) {
    M.scroll(M.animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
  }
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const links = $$('nav.menu a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(a => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
  }

  /* ---------- 3. Chiffres qui défilent (anime.js, déclenchés par Motion inView) ---------- */
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  function countUp(el) {
    if (!('count' in el.dataset)) return;
    const end = +el.dataset.count, suf = el.dataset.suffix || '', pre = el.dataset.prefix || '';
    if (!A || reduce) { el.textContent = pre + fmt(end) + suf; return; }
    const o = { v: 0 };
    A({ targets: o, v: end, duration: 1400, easing: 'easeOutExpo', update: () => { el.textContent = pre + fmt(o.v) + suf; } });
  }

  /* ---------- 4. Apparitions au défilement (Motion) ---------- */
  function reveal(selector, opts = {}) {
    const els = $$(selector); if (!els.length) return;
    if (!M || !M.inView || reduce) { if (opts.done) els.forEach(opts.done); return; }
    els.forEach(el => {
      // seuls les éléments encore sous la ligne de flottaison partent cachés
      if (el.getBoundingClientRect().top < innerHeight) { if (opts.done) opts.done(el); return; }
      const kf = Object.assign({}, opts.kf || { y: [36, 0] });
      delete kf.opacity; // le contenu reste lisible avant l'animation (robots, aperçus, défilement rapide)
      M.inView(el, () => {
        M.animate(el, kf, { duration: 0.8, delay: (opts.stagger || 0) * (els.indexOf(el) % (opts.mod || 3)), ease: [0.2, 0.7, 0.2, 1] });
        if (opts.done) opts.done(el);
      }, { amount: opts.amount || 0.25 });
    });
  }
  reveal('.stat b', { kf: { opacity: [0, 1], y: [20, 0] }, stagger: 0.1, mod: 4, done: countUp });
  reveal('.head', { amount: 0.4 });
  reveal('.about .txt > *', { stagger: 0.08, mod: 4 });
  reveal('.side > *', { kf: { opacity: [0, 1], x: [40, 0] }, stagger: 0.12, mod: 2 });
  reveal('.sector', { kf: { opacity: [0, 1], y: [30, 0], scale: [0.94, 1] }, stagger: 0.07, mod: 5 });
  reveal('.fiche dt, .fiche dd', { kf: { opacity: [0, 1], x: [-16, 0] }, stagger: 0.03, mod: 18, amount: 0.1 });
  reveal('.dossier', { kf: { opacity: [0, 1], x: [40, 0] } });
  reveal('.pole-h', { kf: { opacity: [0, 1], x: [-30, 0] } });
  reveal('.flip', { kf: { opacity: [0, 1], y: [50, 0], rotateX: [12, 0] }, stagger: 0.1, mod: 3, amount: 0.15 });
  reveal('.more', { kf: { opacity: [0, 1], scale: [0.96, 1] } });
  reveal('.svc', { stagger: 0.1 });
  reveal('.cond > *', { stagger: 0.12, mod: 2 });
  reveal('.pledge', { kf: { opacity: [0, 1], y: [40, 0] }, stagger: 0.08, mod: 3 });
  reveal('.decl > div, .ethic > div', { stagger: 0.06, mod: 3, amount: 0.3 });
  reveal('.clause', { kf: { opacity: [0, 1], x: [-30, 0] } });
  reveal('.contact .wrap > *', { stagger: 0.15, mod: 2 });

  /* étapes : la ligne dorée se trace, puis chaque pastille apparaît (anime.js) */
  const stepsWrap = $('.steps-wrap');
  if (stepsWrap) {
    const vertical = () => matchMedia('(max-width:900px)').matches;
    const run = () => {
      if (!A || reduce) { $('#stepline').style.transform = 'none'; return; }
      A.timeline({ easing: 'easeOutCubic' })
        .add({ targets: '#stepline', [vertical() ? 'scaleY' : 'scaleX']: [0, 1], duration: 1400 })
        .add({ targets: '.steps .dot', scale: [0.6, 1], rotate: ['-90deg', '0deg'], duration: 600, delay: A.stagger(220), easing: 'easeOutBack' }, 0)
        .add({ targets: '.steps li > :not(.dot)', translateY: [14, 0], duration: 500, delay: A.stagger(70) }, 150);
    };
    if (M && M.inView && !reduce && A && stepsWrap.getBoundingClientRect().top > innerHeight) {
      A.set('.steps .dot', { scale: 0.6 });
      M.inView(stepsWrap, run, { amount: 0.35 });
    } else run();
  }

  /* survol à ressort (Motion spring) */
  if (M && !reduce && matchMedia('(hover:hover)').matches) {
    $$('.pledge, .svc, .sector').forEach(el => {
      el.addEventListener('pointerenter', () => M.animate(el, { y: -8, scale: 1.015 }, { type: 'spring', stiffness: 320, damping: 18 }));
      el.addEventListener('pointerleave', () => M.animate(el, { y: 0, scale: 1 }, { type: 'spring', stiffness: 320, damping: 22 }));
    });
  }

  /* ---------- 5. Composants Kokonut UI ---------- */
  if (K) {
    $$('.flip').forEach(K.CardFlip);
    const paths = $('#paths'); if (paths) K.BackgroundPaths(paths, { count: 42, angle: -8 });
  }
  if (reduce) html.classList.add('reduce');

  /* le bouton WhatsApp flottant attend que l'ouverture soit passée, pour ne pas couvrir ses boutons */
  (function () {
    const fl = document.querySelector('.wa-float'), top = document.querySelector('.hero, .ghero');
    if (!fl || !top || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([en]) => fl.classList.toggle('away', en.isIntersecting), { threshold: 0.35 }).observe(top);
  })();

  /* ---------- 6. Contact ---------- */
  const nom = $('#f-nom'), ent = $('#f-ent'), gam = $('#f-gamme'), bes = $('#f-besoin'), wa = $('#wa-link');
  function upd() {
    const L = EN ? ['Hello SOGEP-SARLU, I would like a quote.', 'Name: ', 'Company: ', 'Range: ', 'Requirement: ']
                 : ['Bonjour SOGEP-SARLU, je souhaite une cotation.', 'Nom : ', 'Entreprise : ', 'Gamme : ', 'Besoin : '];
    const l = [L[0]];
    if (nom.value.trim()) l.push(L[1] + nom.value.trim());
    if (ent.value.trim()) l.push(L[2] + ent.value.trim());
    if (gam.value) l.push(L[3] + gam.value);
    if (bes.value.trim()) l.push(L[4] + bes.value.trim());
    wa.href = 'https://wa.me/224626298419?text=' + encodeURIComponent(l.join('\n'));
  }
  if (wa) { [nom, ent, gam, bes].forEach(e => e.addEventListener('input', upd)); upd(); $('#devis').addEventListener('submit', e => e.preventDefault()); }
  let tt;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 2200); };
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.copy), txt = el.textContent.trim();
    const sel = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(EN ? 'Text selected' : 'Texte sélectionné'); };
    try { navigator.clipboard.writeText(txt).then(() => toast((EN ? 'Copied: ' : 'Copié : ') + txt), sel); } catch (e) { sel(); }
  }));
})();

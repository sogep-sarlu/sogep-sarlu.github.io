/* SOGEP-SARLU — pages de gammes : menu sur téléphone */
(function () {
  const hdr = document.querySelector('header.top'), btn = document.querySelector('.menu-btn');
  if (!hdr || !btn) return;
  const setOpen = o => {
    hdr.classList.toggle('open', o);
    btn.setAttribute('aria-expanded', String(o));
    btn.setAttribute('aria-label', o ? btn.dataset.close : btn.dataset.open);
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  document.querySelectorAll('nav.menu a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  /* le bouton WhatsApp flottant attend que l'ouverture soit passée, pour ne pas couvrir ses boutons */
  (function () {
    const fl = document.querySelector('.wa-float'), top = document.querySelector('.hero, .ghero');
    if (!fl || !top || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([en]) => fl.classList.toggle('away', en.isIntersecting), { threshold: 0.35 }).observe(top);
  })();
  addEventListener('scroll', () => hdr.classList.toggle('scrolled', scrollY > 10), { passive: true });
})();

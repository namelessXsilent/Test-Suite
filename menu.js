// Shared slide-in side-menu behavior for all pages.
(function () {
  "use strict";
  const btn      = document.getElementById('menu-btn');
  const drawer   = document.getElementById('drawer');
  const overlay  = document.getElementById('overlay');
  const closeBtn = document.getElementById('drawer-close');
  if (!btn || !drawer || !overlay || !closeBtn) return;

  function openMenu() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  }
  function closeMenu() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }

  btn.addEventListener('click', () =>
    btn.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu());
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
})();

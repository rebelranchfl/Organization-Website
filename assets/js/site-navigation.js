document.querySelectorAll('[data-nav-toggle]').forEach((toggle) => {
  const header = toggle.closest('[data-site-nav]') || document;
  const menu = header.querySelector('[data-nav-menu]');
  if (!menu) return;

  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('data-open', 'false');
  };
  const open = () => {
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('data-open', 'true');
  };

  toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') close();
    else open();
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      close();
      toggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (header.contains(event.target)) return;
    close();
  });
});

(() => {
  const page = window.location.pathname.split('/').pop();

  if (page === 'business-fixes.html') {
    const unlistedProblemLink = document.querySelector('.hero-actions a[href="contact.html"]');
    if (unlistedProblemLink) {
      unlistedProblemLink.href = 'business-request.html?service=general-business-service';
    }
  }

  const button = document.getElementById('ham');
  const menu = document.getElementById('menu');

  if (!button || !menu) return;

  const closeMenu = () => {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
    menu.classList.remove('open');
  };

  button.addEventListener('click', () => {
    const willOpen = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(willOpen));
    button.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
    menu.classList.toggle('open', willOpen);
  });

  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !button.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
      button.focus();
    }
  });
})();
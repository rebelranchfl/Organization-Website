(() => {
  const script = document.currentScript;
  const mounts = document.querySelectorAll('[data-creation-station-footer]');

  if (!script || !mounts.length) return;

  const componentUrl = new URL('footer.html', script.src);
  const stylesheetUrl = new URL('footer.css', script.src);
  stylesheetUrl.searchParams.set('v', '20260803-1');

  if (!document.querySelector('link[data-creation-station-footer-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = stylesheetUrl.href;
    stylesheet.dataset.creationStationFooterStyles = '';
    document.head.append(stylesheet);
  }

  mounts.forEach((mount) => mount.setAttribute('aria-busy', 'true'));

  fetch(componentUrl)
    .then((response) => {
      if (!response.ok) throw new Error('Creation Station footer could not be loaded.');
      return response.text();
    })
    .then((markup) => {
      mounts.forEach((mount) => {
        mount.innerHTML = markup;
        mount.removeAttribute('aria-busy');
      });
    })
    .catch(() => {
      mounts.forEach((mount) => {
        mount.innerHTML = '<p class="cs-footer__load-error"><a href="creation.html">Return to Creation Station</a></p>';
        mount.removeAttribute('aria-busy');
      });
    });
})();

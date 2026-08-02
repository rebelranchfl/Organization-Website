(() => {
  const root = document.body;
  if (!root || root.dataset.publicShellReady === 'true') return;
  root.dataset.publicShellReady = 'true';
  root.classList.add('rrm-public-shell');
  const supportHref = root.classList.contains('rrm-phase-one')
    ? 'https://www.paypal.com/ncp/payment/QM7MMH9V4LDBY'
    : 'support.html';

  const header = document.createElement('header');
  header.className = 'rrm-public-header';
  header.innerHTML = `<nav class="rrm-public-nav" aria-label="Primary"><a class="rrm-public-brand" href="index.html"><img src="assets/brand/rrm-logo-white.png" alt=""><span><strong>Rebel Ranch Ministries</strong><small>Faith &middot; Family &middot; Freedom</small></span></a><button class="rrm-public-menu" type="button" aria-expanded="false" aria-label="Open navigation">&#9776;</button><div class="rrm-public-links"><a href="index.html">Home</a><a href="index.html#start">What We&rsquo;re Building</a><a href="align-interest.html">Partner With Us</a><a href="${supportHref}">Support the Mission</a><a class="rrm-contact" href="contact.html">Contact</a></div></nav>`;
  const oldHeader = document.querySelector('header.site-header, header.public-header, body > .rr-page > nav.nav, body > nav.nav, .rr-page > nav.nav');
  if (oldHeader) oldHeader.replaceWith(header); else root.prepend(header);
  document.querySelectorAll('.rr-page > nav.nav, body > nav.nav').forEach((nav) => nav.remove());
  const toggle = header.querySelector('.rrm-public-menu');
  toggle.addEventListener('click', () => { const isOpen = header.dataset.open === 'true'; header.dataset.open = String(!isOpen); toggle.setAttribute('aria-expanded', String(!isOpen)); });

  const footer = document.createElement('footer');
  footer.className = 'rrm-public-footer';
  footer.innerHTML = `<div class="rrm-public-footer-inner"><a class="rrm-footer-brand" href="index.html"><img src="assets/brand/rrm-logo-white.png" alt=""><span><strong>Rebel Ranch Ministries</strong><small>Faith &middot; Family &middot; Freedom</small></span></a><nav class="rrm-footer-links" aria-label="Footer"><a href="contact.html">Contact</a><a href="privacy-policy.html">Privacy Policy</a><a href="legal-disclosures.html">Legal Disclosures</a></nav><div class="rrm-socials" aria-label="Social media"><a href="https://www.facebook.com/rebelranchministries" target="_blank" rel="noopener" aria-label="Facebook">f</a><a href="https://www.instagram.com/rebel_ranch_fl" target="_blank" rel="noopener" aria-label="Instagram">&#9678;</a><a href="https://www.youtube.com/@RebelRanchMinistries" target="_blank" rel="noopener" aria-label="YouTube">&#9654;</a></div><p class="rrm-footer-legal">Rebel Ranch Ministries is a ministry program of Faith, Family &amp; Nature Church, Inc.</p><p class="rrm-copyright">&copy; 2026 Faith, Family &amp; Nature Church, Inc.</p></div>`;
  const existingFooters = document.querySelectorAll('footer');
  const oldFooter = existingFooters[existingFooters.length - 1];
  if (oldFooter) oldFooter.replaceWith(footer); else root.append(footer);
})();



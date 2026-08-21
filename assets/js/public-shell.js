(() => {
  const root = document.body;
  if (!root || root.dataset.publicShellReady === 'true') return;
  root.dataset.publicShellReady = 'true';
  root.classList.add('rrm-public-shell');
  const header = document.createElement('header');
  header.className = 'rrm-public-header';
  header.innerHTML = `<nav class="rrm-public-nav" aria-label="Primary"><a class="rrm-public-brand" href="index.html"><img src="assets/brand/Rebel%20Ranch%20Ministries/rrm-logo-white.png" alt=""><span><strong>Rebel Ranch Ministries</strong><small>Faith &middot; Family &middot; Freedom</small></span></a><button class="rrm-public-menu" type="button" aria-expanded="false" aria-label="Open navigation">&#9776;</button><div class="rrm-public-links"><a href="index.html">Home</a><a href="merch.html">Shop</a><div class="rrm-nav-dropdown"><button type="button" class="rrm-nav-dropdown-toggle" aria-expanded="false">Programs <span class="caret">&#9662;</span></button><div class="rrm-nav-dropdown-menu"><a href="index.html#business-freedom">Business Freedom</a><a href="creation.html">Creation Station</a><a href="https://academy.rebelranchministries.org">Rebel Ranch Academy</a><a href="marketplace.html">Marketplace</a><a href="align-interest.html">Partner With Us</a></div></div><a href="support.html">Support the Mission</a><a href="account.html">My Account</a><a href="contact.html">Contact</a></div></nav>`;
  const oldHeader = document.querySelector('header.site-header, header.public-header, body > .rr-page > nav.nav, body > nav.nav, .rr-page > nav.nav');
  if (oldHeader) oldHeader.replaceWith(header); else root.prepend(header);
  document.querySelectorAll('.rr-page > nav.nav, body > nav.nav').forEach((nav) => nav.remove());
  const toggle = header.querySelector('.rrm-public-menu');
  toggle.addEventListener('click', () => { const isOpen = header.dataset.open === 'true'; header.dataset.open = String(!isOpen); toggle.setAttribute('aria-expanded', String(!isOpen)); });

  const dropdown = header.querySelector('.rrm-nav-dropdown');
  const dropdownToggle = header.querySelector('.rrm-nav-dropdown-toggle');
  const closeDropdown = () => { dropdown.dataset.open = 'false'; dropdownToggle.setAttribute('aria-expanded', 'false'); };
  dropdownToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = dropdown.dataset.open === 'true';
    dropdown.dataset.open = String(!isOpen);
    dropdownToggle.setAttribute('aria-expanded', String(!isOpen));
  });
  document.addEventListener('click', (event) => { if (dropdown.dataset.open === 'true' && !dropdown.contains(event.target)) closeDropdown(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && dropdown.dataset.open === 'true') closeDropdown(); });

  const footer = document.createElement('footer');
  footer.className = 'rrm-public-footer';
  footer.innerHTML = `<div class="rrm-public-footer-inner"><a class="rrm-footer-brand" href="index.html"><img src="assets/brand/Rebel%20Ranch%20Ministries/rrm-logo-white.png" alt=""><span><strong>Rebel Ranch Ministries</strong><small>Faith &middot; Family &middot; Freedom</small></span></a><nav class="rrm-footer-links" aria-label="Footer"><a href="contact.html">Contact</a><a href="privacy-policy.html">Privacy Policy</a><a href="legal-disclosures.html">Legal Disclosures</a></nav><div class="rrm-footer-bottom"><div class="rrm-socials" aria-label="Social media"><a href="https://www.facebook.com/rebelranchministries" target="_blank" rel="noopener" aria-label="Facebook">f</a><a href="https://www.instagram.com/rebel_ranch_fl" target="_blank" rel="noopener" aria-label="Instagram">&#9678;</a><a href="https://www.youtube.com/@RebelRanchMinistries" target="_blank" rel="noopener" aria-label="YouTube">&#9654;</a></div><p class="rrm-copyright">&copy; 2026 Faith, Family &amp; Nature Church, Inc.</p></div><p class="rrm-footer-legal">Rebel Ranch Ministries is a ministry program of Faith, Family &amp; Nature Church, Inc.</p></div>`;
  const existingFooters = document.querySelectorAll('footer');
  const oldFooter = existingFooters[existingFooters.length - 1];
  if (oldFooter) oldFooter.replaceWith(footer); else root.append(footer);

  if (window.location.pathname.endsWith('/account.html') || window.location.pathname === '/account.html') {
    const addAdminOperationsPath = () => {
      const roleLine = document.getElementById('dashboard-roles');
      const pathGrid = document.querySelector('#dashboard .path-grid');
      if (!roleLine || !pathGrid) return;
      if (!/administrator/i.test(roleLine.textContent || '')) return;

      if (!document.getElementById('admin-operations-review-path')) {
        const card = document.createElement('a');
        card.id = 'admin-operations-review-path';
        card.className = 'path-card';
        card.href = 'operations-review.html';
        card.innerHTML = `<h3>Operations Review</h3><p>Owner control for Academy content development, live agent progress, source review, revisions, and approval decisions.</p><span class="path-link-text">Open Operations Review</span>`;
        pathGrid.append(card);
      }

      if (!document.getElementById('admin-store-manager-path')) {
        const storeCard = document.createElement('a');
        storeCard.id = 'admin-store-manager-path';
        storeCard.className = 'path-card';
        storeCard.href = 'store-manager.html';
        storeCard.innerHTML = `<h3>Store Manager</h3><p>Owner control for what's visible and featured on the Rebel Ranch store, independent of Printify.</p><span class="path-link-text">Open Store Manager</span>`;
        pathGrid.append(storeCard);
      }
    };

    addAdminOperationsPath();
    const roleLine = document.getElementById('dashboard-roles');
    if (roleLine) {
      const observer = new MutationObserver(addAdminOperationsPath);
      observer.observe(roleLine, { childList: true, characterData: true, subtree: true });
    } else {
      const accountObserver = new MutationObserver(() => {
        const loadedRoleLine = document.getElementById('dashboard-roles');
        if (!loadedRoleLine) return;
        addAdminOperationsPath();
        accountObserver.disconnect();
        const roleObserver = new MutationObserver(addAdminOperationsPath);
        roleObserver.observe(loadedRoleLine, { childList: true, characterData: true, subtree: true });
      });
      accountObserver.observe(root, { childList: true, subtree: true });
    }
  }
})();


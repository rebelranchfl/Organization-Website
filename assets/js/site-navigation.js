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

const demoOverlay = document.getElementById('demoOverlay');
if (demoOverlay) {
  document.querySelectorAll('[data-start-demo]').forEach((button) => {
    button.addEventListener('click', () => {
      demoOverlay.hidden = false;
      demoOverlay.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        window.location.href = 'creation-station-experience.html';
      }, 1600);
    });
  });
}

/*
 * Creation Station Live Sessions copy correction.
 * Current Club sessions are open creative gatherings, not guided project instruction.
 * Keep this narrowly scoped to the live-sessions page so checkout and paperwork remain untouched.
 */
if (document.body.classList.contains('live-sessions-page')) {
  const setText = (selector, text) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  };

  setText('.hero-card-copy', 'Each week, kids can bring whatever they are already making or choose something new to work on. They create, talk, ask questions, share ideas, and spend an hour with other kids who get it.');

  const heroProof = document.querySelectorAll('.hero-proof span');
  if (heroProof[2]) heroProof[2].textContent = 'Bring your own project';

  setText('.pulse-item:nth-child(3) span', 'Bring what you are already making.');

  setText('.reason-card:nth-child(1) p', 'Kids can talk about what they are making without feeling “different” or having to explain why their hobbies matter. They meet other kids who draw, bead, paint, sew, sculpt, write, craft, and experiment too.');
  setText('.reason-card:nth-child(3) h3', 'They have a place to keep their ideas moving.');
  setText('.reason-card:nth-child(3) p', 'Bring a project already in progress, start something new, ask questions, brainstorm, and create alongside other kids.');

  setText('.experience-card:nth-child(2) h3', 'Settle into a project');
  setText('.experience-card:nth-child(2) p', 'Each child chooses what they want to work on. The group gives them a creative hour, conversation, and encouragement to keep it moving.');

  setText('.host-callout strong', 'Peer-led. Supported by an adult moderator.');

  setText('.purchase-card.club li:nth-child(2)', 'Bring-your-own-project participation');
  setText('.purchase-card.single li:nth-child(2)', 'Bring whatever you want to work on');
}

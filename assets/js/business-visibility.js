(() => {
  const channels = {
    search: {
      icon: '#bv-icon-search',
      image: 'assets/brand/Business%20Freedom/business-visibility-search-detail-v1.webp',
      kicker: 'Discovery doorway',
      title: 'Search & Maps',
      copy: 'Customers often search by the service they need—not by a business name they have never heard before.',
      impact: 'No useful search presence can make a nearby business look unavailable.'
    },
    website: {
      icon: '#bv-icon-web',
      image: 'assets/brand/Business%20Freedom/business-visibility-website-detail-v2.webp',
      kicker: 'Trust doorway',
      title: 'Website',
      copy: 'A clear home base helps customers confirm who you are, what you do, and what to do next.',
      impact: 'Without one dependable source, scattered profiles have to carry the whole story.'
    },
    social: {
      icon: '#bv-icon-social',
      image: 'assets/brand/Business%20Freedom/business-visibility-social-detail-v2.webp',
      kicker: 'One doorway',
      title: 'Social media',
      copy: 'Social is only one doorway. People who do not follow you—or search somewhere else—may never find you.',
      impact: 'Familiarity with one platform can hide how many customers use another.'
    },
    contact: {
      icon: '#bv-icon-phone',
      image: 'assets/brand/Business%20Freedom/business-visibility-contact-detail-v1.webp',
      kicker: 'Action doorway',
      title: 'Contact information',
      copy: 'Once customers are interested, they need a current phone number, email, or other clear way to reach you.',
      impact: 'Missing or conflicting details turn interest into doubt.'
    },
    booking: {
      icon: '#bv-icon-chat',
      image: 'assets/brand/Business%20Freedom/business-visibility-booking-detail-v2.webp',
      kicker: 'Response doorway',
      title: 'Messages & Booking',
      copy: 'Some customers want to message, request an estimate, or choose a time without making a phone call.',
      impact: 'Extra steps give busy customers more chances to leave.'
    },
    services: {
      icon: '#bv-icon-services',
      image: 'assets/brand/Business%20Freedom/business-visibility-services-detail-v1.webp',
      kicker: 'Decision doorway',
      title: 'Services & Area',
      copy: 'Customers need to recognize their problem in your words and know whether you serve their location.',
      impact: 'A visible business can still be passed over when its offer is unclear.'
    }
  };

  const buttons = [...document.querySelectorAll('.bv-channel')];
  const kicker = document.getElementById('channel-kicker');
  const title = document.getElementById('channel-title');
  const copy = document.getElementById('channel-copy');
  const impact = document.getElementById('channel-impact');
  const detailIcon = document.querySelector('.bv-detail-icon use');
  const detailIconWrap = document.querySelector('.bv-detail-icon');
  const detailImage = document.getElementById('channel-image');

  if (!buttons.length || !kicker || !title || !copy || !impact || !detailIcon || !detailIconWrap || !detailImage) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const channel = channels[button.dataset.channel];
      if (!channel) return;

      buttons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });

      kicker.textContent = channel.kicker;
      title.textContent = channel.title;
      copy.textContent = channel.copy;
      impact.innerHTML = `<strong>The missed connection:</strong> ${channel.impact}`;
      detailIcon.setAttribute('href', channel.icon);
      detailImage.src = channel.image;
      detailImage.hidden = false;
      detailIconWrap.hidden = true;
    });
  });
})();

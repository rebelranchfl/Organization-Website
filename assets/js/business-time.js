document.querySelectorAll('[data-explorer]').forEach((explorer) => {
    const track = explorer.querySelector('.explorer-track');
    const cards = [...track.querySelectorAll('.explorer-card')];
    const previous = explorer.querySelector('[data-previous]');
    const next = explorer.querySelector('[data-next]');
    const count = explorer.querySelector('.explorer-count');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let active = 0;

    const update = (index, move = true) => {
      active = Math.max(0, Math.min(index, cards.length - 1));
      if (move) {
        const card = cards[active];
        const left = card.offsetLeft - track.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
        track.scrollTo({left, behavior: reduceMotion ? 'auto' : 'smooth'});
      }
      count.textContent = `${active + 1} of ${cards.length}`;
      previous.disabled = active === 0;
      next.disabled = active === cards.length - 1;
    };

    previous.addEventListener('click', () => update(active - 1));
    next.addEventListener('click', () => update(active + 1));
    track.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); update(active - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); update(active + 1); }
    });
    track.addEventListener('scroll', () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let distance = Infinity;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft - track.offsetLeft + card.offsetWidth / 2;
        const current = Math.abs(cardCenter - center);
        if (current < distance) { distance = current; nearest = index; }
      });
      if (nearest !== active) update(nearest, false);
    }, {passive:true});
    update(0, false);
  });

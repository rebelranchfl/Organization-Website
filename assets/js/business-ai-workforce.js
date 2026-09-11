(() => {
  const base = 'assets/brand/Business%20Freedom/Custom%20AI%20Workforce/';
  const states = {
    knowledge: {
      title: 'One role versus broad capability',
      person: 'One person usually brings experience and training for one main position.',
      agent: 'One custom agent can combine broad knowledge and use many connected digital tools.',
      image: `${base}compare-knowledge.png`,
      alt: 'One employee facing unfamiliar work compared with an AI agent using broad digital knowledge'
    },
    training: {
      title: 'Your rules checked every time',
      person: 'People need paid training, practice, reminders, and retraining as procedures change.',
      agent: 'The agent checks each job against your rules, corrects failures, and checks again before delivery.',
      image: `${base}compare-training.png`,
      alt: 'Employee training compared with an AI agent applying business rules through repeated checks'
    },
    availability: {
      title: 'Work does not have to wait',
      person: 'Sick days, vacations, lateness, and family emergencies can interrupt the work.',
      agent: 'The agent can keep approved digital work moving around the clock.',
      image: `${base}compare-availability.png`,
      alt: 'An owner handling an employee call-out compared with an AI agent working from day through night'
    },
    cost: {
      title: 'Real employee costs keep coming',
      person: 'Wages, payroll taxes, workers’ compensation, recruiting, paid training, and retraining.',
      agent: 'Custom build, software, maintenance, and updates—without recurring employee costs.',
      image: `${base}compare-cost.png`,
      alt: 'Human employee cost burdens compared with an AI agent working smoothly'
    },
    management: {
      title: 'Manage the work—not the people problems',
      person: 'Scheduling changes, staff conflict, turnover, replacement, and personnel paperwork take the owner’s time.',
      agent: 'No staff disputes, call-outs, or turnover. Maintain and update the system as the business changes.',
      image: `${base}compare-management.png`,
      alt: 'Owner handling employee conflict compared with an AI agent coordinating digital work'
    },
    work: {
      title: 'From unfinished tasks to finished work',
      person: 'One person switches between jobs. Delays and rework pile up.',
      agent: 'The agent completes every step, checks the work, corrects failures, and delivers the finished result.',
      image: `${base}compare-work.png`,
      alt: 'Human task switching and rework compared with an AI agent completing checked steps'
    }
  };

  const buttons = [...document.querySelectorAll('.aiw-signal')];
  const scene = document.getElementById('aiw-scene');
  const title = document.getElementById('aiw-result-title');
  const person = document.getElementById('aiw-person-text');
  const agent = document.getElementById('aiw-agent-text');
  let transitionTimer;

  const show = key => {
    const state = states[key];
    if (!state) return;
    buttons.forEach(button => button.setAttribute('aria-selected', String(button.dataset.key === key)));
    window.clearTimeout(transitionTimer);
    scene.classList.add('is-changing');
    transitionTimer = window.setTimeout(() => {
      scene.src = state.image;
      scene.alt = state.alt;
      scene.classList.remove('is-changing');
    }, 90);
    title.textContent = state.title;
    person.textContent = state.person;
    agent.textContent = state.agent;
  };

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => show(button.dataset.key));
    button.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      else next = (index - 1 + buttons.length) % buttons.length;
      buttons[next].focus();
      show(buttons[next].dataset.key);
    });
    button.addEventListener('pointerenter', () => {
      if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) show(button.dataset.key);
    });
  });
})();

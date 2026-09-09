(function () {
  const explanations = {
    automatic: '<strong>Automatic:</strong> Repetitive handoffs and updates continue after the system receives the authorized trigger.',
    scheduled: '<strong>Scheduled:</strong> Approved bills, transfers, and recurring payments can be set to run on the dates you choose.',
    approval: '<strong>Approval required:</strong> Sensitive or variable payments wait for your confirmation before the connected process continues.'
  };

  const controls = [...document.querySelectorAll('.pp-rule')];
  const detail = document.getElementById('pp-rule-detail');
  if (!controls.length || !detail) return;

  controls.forEach((control) => {
    control.addEventListener('click', () => {
      const key = control.dataset.rule;
      controls.forEach((item) => {
        const active = item === control;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      detail.innerHTML = explanations[key];
    });
  });
})();

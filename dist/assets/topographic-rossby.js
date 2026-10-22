(() => {
  const tabs = [...document.querySelectorAll('[data-rossby-case]')];
  const panels = [...document.querySelectorAll('[data-rossby-panel]')];
  if (!tabs.length || !panels.length) return;

  function showCase(name, focus = false) {
    tabs.forEach(tab => {
      const active = tab.dataset.rossbyCase === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.rossbyPanel !== name; });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showCase(tab.dataset.rossbyCase));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      showCase(tabs[next].dataset.rossbyCase, true);
    });
  });

  showCase('east');
})();

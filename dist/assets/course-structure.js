(() => {
  const stage = document.getElementById('assignmentStage');
  const tabs = [...document.querySelectorAll('[data-assignment]')];
  const test1 = document.getElementById('test1');
  const test2 = document.getElementById('geostrophy');
  const story = document.getElementById('story-ctw');
  const test3 = stage?.querySelector('[data-assignment-panel="test3"]');

  if (stage) {
    const sources = [[test1, 'test1'], [test2, 'test2'], [test3, 'test3'], [story, 'story']];
    sources.forEach(([element, name]) => {
      if (!element) return;
      element.dataset.assignmentPanel = name;
      element.classList.add('assignment-panel-source');
      stage.appendChild(element);
    });
  }

  const panels = [...document.querySelectorAll('[data-assignment-panel]')];

  function selectAssignment(name, scroll = false) {
    tabs.forEach(tab => {
      const active = tab.dataset.assignment === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      const active = panel.dataset.assignmentPanel === name;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
    if (scroll) document.getElementById('course-work')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectAssignment(tab.dataset.assignment));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      tabs[next].focus();
      selectAssignment(tabs[next].dataset.assignment);
    });
  });

  document.querySelectorAll('a[href="#test1"], a[href="#geostrophy"], a[href="#story-ctw"], [data-open-assignment]').forEach(link => {
    link.addEventListener('click', event => {
      const explicit = link.dataset.openAssignment;
      const target = explicit || (link.hash === '#test1' ? 'test1' : link.hash === '#story-ctw' ? 'story' : 'test2');
      event.preventDefault();
      selectAssignment(target, true);
    });
  });

  selectAssignment('test2');

  const textbook = document.getElementById('textbook');
  const exitTicket = document.getElementById('exit-ticket');
  if (textbook && exitTicket) textbook.insertAdjacentElement('afterend', exitTicket);
})();

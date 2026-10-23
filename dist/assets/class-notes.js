(() => {
  const cards = [...document.querySelectorAll('.lesson-card')];
  const buttons = [...document.querySelectorAll('[data-lesson-target]')];

  function selectLesson(id, scroll = false) {
    const target = document.getElementById(id);
    if (!target) return;
    cards.forEach(card => { card.open = card === target; });
    buttons.forEach(button => button.classList.toggle('active', button.dataset.lessonTarget === id));
    if (scroll) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  cards.forEach(card => card.addEventListener('toggle', () => {
    if (!card.open) return;
    cards.forEach(other => { if (other !== card) other.open = false; });
    buttons.forEach(button => button.classList.toggle('active', button.dataset.lessonTarget === card.id));
  }));
  buttons.forEach(button => button.addEventListener('click', () => selectLesson(button.dataset.lessonTarget, true)));

  const form = document.getElementById('peerReviewForm');
  if (!form) return;
  const reviewer = document.getElementById('peerReviewer');
  const date = document.getElementById('peerDate');
  const retelling = document.getElementById('peerRetelling');
  const structure = document.getElementById('peerStructure');
  const status = document.getElementById('peerReviewStatus');
  const storageKey = 'dpo-story-peer-review-v1';

  function statusMarkup(saved) {
    status.classList.toggle('saved', saved);
    status.classList.toggle('pending', !saved);
    status.innerHTML = saved
      ? '<span class="zh-only">已记录 · 待教师确认</span><span class="en-only">Recorded · awaiting instructor confirmation</span>'
      : '<span class="zh-only">待实际验证</span><span class="en-only">Awaiting a real review</span>';
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { language: document.body.dataset.language || 'zh' } }));
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved) {
      reviewer.value = saved.reviewer || '';
      date.value = saved.date || '';
      retelling.value = saved.retelling || '';
      structure.checked = Boolean(saved.structure);
      statusMarkup(Boolean(saved.retelling && saved.structure));
    }
  } catch (_) {}

  form.addEventListener('submit', event => {
    event.preventDefault();
    const completed = Boolean(retelling.value.trim() && structure.checked);
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        reviewer: reviewer.value.trim(),
        date: date.value,
        retelling: retelling.value.trim(),
        structure: structure.checked,
        savedAt: new Date().toISOString()
      }));
    } catch (_) {}
    statusMarkup(completed);
  });
})();

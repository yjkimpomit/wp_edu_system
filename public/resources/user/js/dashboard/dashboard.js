(() => {
 'use strict';
 const initialize = () => {
  const section = document.querySelector('[data-assessments]');
  if (!section) return;
  const group = section.querySelector('.content-switcher');
  if (!group) return;
  const items = [...section.querySelectorAll('[data-assessment-state]')];
  const status = section.querySelector('[data-filter-status]');
  const applyFilter = (button, announce = false) => {
   const filter = button.dataset.filter;
   items.forEach(item => { item.hidden = filter !== 'all' && item.dataset.assessmentState !== filter; });
   if (announce && status) status.textContent = button.textContent.trim() + ' 평가 ' + items.filter(item => !item.hidden).length + '건';
  };
  group.addEventListener('content-switcher:change', event => {
   if (event.target === group) applyFilter(event.detail.button, true);
  });
  const initial = group.querySelector('button[aria-pressed="true"]:not(:disabled)') || group.querySelector('button:not(:disabled)');
  if (initial) applyFilter(initial);
 };
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
 else initialize();
})();

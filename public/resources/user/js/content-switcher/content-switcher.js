(() => {
 'use strict';
 const initialize = () => {
  document.querySelectorAll('.content-switcher').forEach(group => {
   const buttons = [...group.children].filter(element => element.matches('button'));
   const enabled = button => !button.disabled && button.getAttribute('aria-disabled') !== 'true';
   const select = button => buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
   const initial = buttons.find(button => enabled(button) && button.getAttribute('aria-pressed') === 'true') || buttons.find(enabled);
   if (initial) select(initial);
   group.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!buttons.includes(button) || !enabled(button) || button.getAttribute('aria-pressed') === 'true') return;
    select(button);
    group.dispatchEvent(new CustomEvent('content-switcher:change', { bubbles: true, detail: { button } }));
   });
  });
 };
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
 else initialize();
})();

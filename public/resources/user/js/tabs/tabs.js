(() => {
	'use strict';

	const initialize = () => {
		document.querySelectorAll('[data-tabs] [role="tablist"]').forEach(tablist => {
			const buttons = [...tablist.querySelectorAll('[role="tab"]')]
				.filter(button => button.closest('[role="tablist"]') === tablist);
			const items = buttons.map(button => ({
				button,
				panel: document.getElementById(button.getAttribute('aria-controls'))
			}));
			if (!items.length || items.some(item => !item.panel)) return;
			items.forEach(item => {
				item.button.tabIndex = -1;
				item.panel.tabIndex = 0;
			});

			const activate = button => {
				items.forEach(item => {
					const selected = item.button === button;
					item.button.setAttribute('aria-selected', String(selected));
					item.button.tabIndex = selected ? 0 : -1;
					item.button.classList.toggle('active', selected);
					item.panel.hidden = !selected;
					item.panel.classList.toggle('active', selected);
				});
			};
			const enabled = buttons.filter(button => !button.disabled && button.getAttribute('aria-disabled') !== 'true');
			if (!enabled.length) return;
			activate(enabled.find(button => button.getAttribute('aria-selected') === 'true') || enabled[0]);

			enabled.forEach((button, index) => {
				button.addEventListener('click', () => activate(button));
				button.addEventListener('keydown', event => {
					const vertical = tablist.getAttribute('aria-orientation') === 'vertical';
					let next;
					if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = (index + 1) % enabled.length;
					if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = (index + enabled.length - 1) % enabled.length;
					if (event.key === 'Home') next = 0;
					if (event.key === 'End') next = enabled.length - 1;
					if (next === undefined) return;
					event.preventDefault();
					activate(enabled[next]);
					enabled[next].focus();
				});
			});
		});
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize, { once: true });
	} else {
		initialize();
	}
})();

(() => {
	'use strict';
	const enableToggle = () => {
		const toggle = document.querySelector('[data-sidebar-toggle]');
		if (toggle && document.getElementById('user-sidebar')) toggle.disabled = false;
		document.querySelectorAll('.sidebar nav a[href]').forEach(link => {
			const selected = new URL(link.href).pathname === location.pathname;
			if (selected) link.setAttribute('aria-current', 'page');
			else link.removeAttribute('aria-current');
		});
	};
	document.addEventListener('includes:loaded', enableToggle);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', enableToggle, { once: true });
	} else {
		enableToggle();
	}
	const menuSelector = '.sidebar .sidebar-link';
	let flyout;
	let owner;
	let hideTimer;
	const hide = () => {
		clearTimeout(hideTimer);
		if (flyout) flyout.hidden = true;
		owner = null;
	};
	const scheduleHide = () => {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			if (owner === document.activeElement || flyout?.contains(document.activeElement)) return;
			hide();
		}, 180);
	};
	const setExpanded = expanded => {
		hide();
		const sidebar = document.getElementById('user-sidebar');
		if (!sidebar) return;
		sidebar.dataset.expanded = String(expanded);
		const toggle = document.querySelector('[data-sidebar-toggle]');
		if (toggle) {
			toggle.setAttribute('aria-expanded', String(expanded));
			toggle.setAttribute('aria-label', expanded ? '메뉴 접기' : '메뉴 펼치기');
		}
	};
	const show = menu => {
		if (!menu || menu.closest('.sidebar').dataset.expanded !== 'false') return;
		clearTimeout(hideTimer);
		if (owner === menu && flyout && !flyout.hidden) return;
		if (!flyout) {
			flyout = document.createElement('nav');
			flyout.className = 'sidebar-flyout';
			flyout.addEventListener('pointerenter', () => clearTimeout(hideTimer));
			flyout.addEventListener('pointerleave', scheduleHide);
			flyout.addEventListener('focusout', event => {
				if (!flyout.contains(event.relatedTarget)) scheduleHide();
			});
			document.body.append(flyout);
		}
		owner = menu;
		const title = document.createElement('strong');
		title.textContent = menu.querySelector('span').textContent;
		flyout.setAttribute('aria-label', title.textContent + ' 하위 메뉴');
		flyout.replaceChildren(title);
		const submenu = menu.parentElement.querySelector(':scope > .sidebar-submenu-list');
		if (submenu) {
			const list = submenu.cloneNode(true);
			list.removeAttribute('id');
			list.hidden = false;
			list.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
			flyout.append(list);
		}
		flyout.hidden = false;
		const bounds = menu.getBoundingClientRect();
		flyout.style.left = Math.max(8, Math.min(bounds.right + 8, innerWidth - flyout.offsetWidth - 8)) + 'px';
		flyout.style.top = Math.max(8, Math.min(bounds.top, innerHeight - flyout.offsetHeight - 8)) + 'px';
	};
	document.addEventListener('pointerover', event => {
		const menu = event.target.closest(menuSelector);
		if (menu && !menu.contains(event.relatedTarget)) show(menu);
	});
	document.addEventListener('pointerout', event => {
		const menu = event.target.closest(menuSelector);
		if (menu && !menu.contains(event.relatedTarget)) scheduleHide();
	});
	document.addEventListener('focusin', event => show(event.target.closest(menuSelector)));
	document.addEventListener('focusout', event => {
		if (event.target === owner && !flyout?.contains(event.relatedTarget)) scheduleHide();
	});
	window.addEventListener('resize', hide);
	document.addEventListener('scroll', event => {
		if (!flyout?.contains(event.target)) hide();
	}, true);
	document.addEventListener('click', event => {
		const sidebar = document.getElementById('user-sidebar');
		if (!sidebar) return;
		if (event.target.closest('[data-sidebar-toggle]')) {
			setExpanded(sidebar.dataset.expanded !== 'true');
			return;
		}
		const disclosure = event.target.closest('.sidebar [data-submenu-toggle]');
		if (disclosure) {
			const expanded = disclosure.getAttribute('aria-expanded') !== 'true';
			disclosure.setAttribute('aria-expanded', String(expanded));
			const label = disclosure.parentElement.querySelector('a > span').textContent;
			disclosure.setAttribute('aria-label', label + ' 하위 메뉴 ' + (expanded ? '접기' : '펼치기'));
			document.getElementById(disclosure.getAttribute('aria-controls')).hidden = !expanded;
			return;
		}
		const menu = event.target.closest(menuSelector);
		if (menu && sidebar.dataset.expanded === 'false') {
			const first = menu.parentElement.querySelector(':scope > .sidebar-submenu-list a[href]');
			if (first) menu.href = first.href;
		}
		const insideFlyout = flyout?.contains(event.target);
		hide();
		if (sidebar.dataset.expanded === 'true' && !sidebar.contains(event.target) && !insideFlyout) setExpanded(false);
	});
	document.addEventListener('keydown', event => {
		if (event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) {
			const menu = event.target.closest(menuSelector);
			if (menu?.closest('.sidebar').dataset.expanded === 'false') {
				const menus = [...document.querySelectorAll(menuSelector)];
				const target = event.shiftKey ? menus[menus.indexOf(menu) - 1] : menu;
				if (target) show(target);
				const links = target ? [...flyout.querySelectorAll('a[href]')] : [];
				const destination = event.shiftKey ? links.at(-1) : links[0];
				if (destination) {
					event.preventDefault();
					destination.focus();
				} else {
					hide();
				}
			} else if (flyout && !flyout.hidden && flyout.contains(event.target)) {
				const links = [...flyout.querySelectorAll('a[href]')];
				if ((event.shiftKey && event.target === links[0]) || (!event.shiftKey && event.target === links.at(-1))) {
					const previous = owner;
					if (event.shiftKey) event.preventDefault();
					previous?.focus();
					hide();
				}
			}
		}
		if (event.key === 'ArrowRight' && event.target.matches(menuSelector) && event.target.closest('.sidebar').dataset.expanded === 'false') {
			show(event.target);
			const first = flyout?.querySelector('a');
			if (first) { event.preventDefault(); first.focus(); }
		}
		if (event.key !== 'Escape') return;
		if (flyout && !flyout.hidden) {
			const previous = owner;
			hide();
			previous?.focus();
			hide();
			return;
		}
		const sidebar = document.getElementById('user-sidebar');
		if (sidebar?.dataset.expanded === 'true') {
			setExpanded(false);
			document.querySelector('[data-sidebar-toggle]')?.focus();
		}
	});
})();

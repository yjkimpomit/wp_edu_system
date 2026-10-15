/* HTML publishing only: shared fragment loader. */
(() => {
	'use strict';
	const load = async host => {
		try {
			const response = await fetch(new URL(host.dataset.include, document.baseURI));
			if (!response.ok) throw new Error('HTTP ' + response.status);
			host.innerHTML = await response.text();
		} catch (error) {
			const message = document.createElement('p');
			message.setAttribute('role', 'alert');
			message.textContent = '화면을 불러오지 못했습니다. 새로고침해 주세요.';
			host.replaceChildren(message);
			console.error('화면 구성요소 로드 실패:', error);
		}
	};
	const initialize = async () => {
		await Promise.all([...document.querySelectorAll('[data-include]')].map(load));

		const menu = document.querySelector('.sidebar-list');
		if (menu && !menu.querySelector('[data-publishing-components]')) {
			const item = document.createElement('li');
			item.className = 'sidebar-item';
			const link = document.createElement('a');
			link.className = 'sidebar-link';
			link.href = '/WEB-INF/html/user/components.html';
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			link.dataset.icon = 'widgets';
			link.dataset.publishingComponents = '';
			link.setAttribute('aria-label', 'UI 컴포넌트 (새 창)');
			const label = document.createElement('span');
			label.textContent = 'UI 컴포넌트';
			link.append(label);
			item.append(link);
			menu.append(item);
		}
		document.dispatchEvent(new CustomEvent('includes:loaded'));
		
	};
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize, { once: true });
	} else {
		initialize();
	}
})();

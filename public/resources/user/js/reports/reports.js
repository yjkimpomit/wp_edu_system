(() => {
	'use strict';

	const initialize = () => {
		const main = document.querySelector('#reports-content');
		if (!main) return;

		main.querySelector('.filter').addEventListener('submit', event => event.preventDefault());
		const status = main.querySelector('[data-reports-status]');
		const filter = main.querySelector('[data-result-filter]');
		const rows = [...main.querySelectorAll('tbody tr[data-result]')];
		main.querySelector('.reports-table tbody').addEventListener('click', event => {
			const selected = event.target.closest('tr[data-result]');
			if (!rows.includes(selected)) return;
			rows.forEach(row => {
				row.classList.toggle('is-selected', row === selected);
				row.querySelector('button').setAttribute('aria-pressed', String(row === selected));
			});
		});
		filter.addEventListener('content-switcher:change', () => {
			const selected = filter.querySelector('[aria-pressed="true"]').dataset.filter;
			rows.forEach(row => { row.hidden = selected !== 'all' && row.dataset.result !== selected; });
			status.textContent = `문항 ${rows.filter(row => !row.hidden).length}건이 표시됩니다.`;
		});

		const canvas = main.querySelector('#analysis-rate-chart');
		if (!canvas) return;
		if (typeof Chart === 'undefined') {
			canvas.parentElement.hidden = true;
			return;
		}
		const rate = parseFloat(main.querySelector('#analysis-rate').textContent);
		const tokens = getComputedStyle(document.documentElement);
		const color = name => tokens.getPropertyValue(name).trim();
		const gradient = (context, startToken, endToken) => {
			const area = context.chart.chartArea;
			if (!area) return color(startToken);
			const fill = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
			fill.addColorStop(0, color(startToken));
			fill.addColorStop(1, color(endToken));
			return fill;
		};
		new Chart(canvas, {
			type: 'bar',
			data: {
				labels: ['정답률'],
				datasets: [
					{
						data: [rate],
						backgroundColor: context => gradient(context, '--bg-success-strong', '--bg-success-stronger'),
						barThickness: 8,
						order: 0
					},
					{
						data: [100],
						backgroundColor: context => gradient(context, '--bg-neutral-subtlest', '--bg-neutral-subtle'),
						barThickness: 16,
						order: 1
					}
				]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				events: [],
				datasets: { bar: { grouped: false, borderSkipped: false, borderRadius: 999 } },
				plugins: { legend: { display: false }, tooltip: { enabled: false } },
				scales: {
					x: { display: false, min: 0, max: 100 },
					y: { display: false }
				}
			}
		});
	};

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
	else initialize();
})();

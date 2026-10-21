(() => {
 'use strict';
 const root = document.querySelector('[data-learning-page]');
 if (!root) return;
 const $ = selector => root.querySelector(selector);
 const page = root.dataset.learningPage;
 // 실제 서비스에서는 로그인 계정의 권한과 브랜치를 서버에서 검증한다.
 const account = { branch: '평택', id: 'publishing-user' };
 const storageKey = 'wp-learning-flow-v1-' + account.id;
 const startup = ['기동 전 점검', '보조전원 확인', '냉각수 계통 확인', '윤활유 계통 확인', '급수 계통 준비', '연료 계통 준비', '보일러 예열', '통풍 계통 준비', '점화 준비', '보일러 점화', '증기 조건 확인', '터빈 예열', '터빈 기동', '회전수 확인', '발전기 동기 확인', '계통 병입', '부하 상승'];
 const courses = [
  { id: 'cold-btg1', name: '냉간 기동 · BTG1', kind: 'regular', period: '2026년 2차 정기평가', procedures: startup },
  { id: 'cold-btg2', name: '냉간 기동 · BTG2', kind: 'regular', period: '2026년 2차 정기평가', procedures: startup },
  { id: 'cold-stop', name: '냉간 정지 · 공통', kind: 'regular', period: '2026년 1차 정기평가', procedures: ['정지 절차'] },
  { id: 'warm-start', name: '온간 기동', kind: 'ongoing', period: '상시평가', procedures: ['온간 기동 절차'] }
 ];
 const steps = ['운전 조건 확인', '대상 설비 조작', '조작 결과 확인'];
 const stepCopy = ['해당 절차의 운전 조건과 대상 설비의 상태를 확인합니다.', '대상 설비의 조작 항목을 선택하고 절차에 따라 조작합니다.', '조작 후 상태와 연계 계통의 반영 결과를 확인합니다.'];
 const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
 const link = (target, course, extra = '') => `../${target}?course=${encodeURIComponent(course.id)}${extra}`;
 const label = course => `${account.branch} ${course.name}`;
 const question = (course, number) => ({ id: `${course.id}-q${number + 1}`, procedure: number % course.procedures.length, variant: Math.floor(number / course.procedures.length) });
 const bank = course => Array.from({ length: Math.max(34, course.procedures.length * 2) }, (_, i) => question(course, i));
 const blank = () => ({ learned: [], review: [], reviewLearned: {}, initial: [], passed: [], attempts: [], draft: null });
 const seed = () => {
  const state = { courses: {}, stats: {} };
  courses.forEach(course => { state.courses[course.id] = blank(); });
  const cold = state.courses['cold-btg1'];
  cold.learned = startup.flatMap((_, p) => [0, 1, 2].map(s => `${p}-${s}`));
  cold.initial = bank(courses[0]).slice(0, 20);
  cold.passed = cold.initial.slice(0, 15).map(q => q.id);
  cold.review = [...new Set(cold.initial.slice(15).map(q => q.procedure))];
  cold.attempts = [
   { date: '2026-10-20T10:00:00+09:00', total: 20, correct: 12, cumulative: 12, wrong: cold.initial.slice(12).map(q => q.id), seconds: 1200 },
   { date: '2026-10-21T09:00:00+09:00', total: 8, correct: 3, cumulative: 15, wrong: cold.initial.slice(15).map(q => q.id), seconds: 420 }
  ];
  const ready = state.courses['cold-btg2'];
  ready.learned = startup.flatMap((_, p) => [0, 1, 2].map(s => `${p}-${s}`));
  const done = state.courses['cold-stop'];
  done.learned = ['0-0', '0-1', '0-2'];
  done.initial = bank(courses[2]).slice(0, 20);
  done.passed = done.initial.map(q => q.id);
  done.attempts = [
   { date: '2026-10-18T10:00:00+09:00', total: 20, correct: 18, cumulative: 18, wrong: done.initial.slice(18).map(q => q.id), seconds: 900 },
   { date: '2026-10-19T10:00:00+09:00', total: 2, correct: 2, cumulative: 20, wrong: [], seconds: 120 }
  ];
  // 예시 통계도 회차 기록으로부터 계산한다. 실제 통계는 브랜치별 서버 데이터 사용.
  courses.forEach(course => {
   const record = state.courses[course.id];
   record.attempts.forEach((attempt, index) => {
    const items = index === 0 ? record.initial : record.initial.filter(q => record.attempts[index - 1].wrong.includes(q.id));
    items.forEach(q => {
     const stat = state.stats[q.id] ||= { first: 0, firstWrong: 0, retry: 0, retryWrong: 0 };
     const prefix = index === 0 ? 'first' : 'retry';
     stat[prefix]++;
     if (attempt.wrong.includes(q.id)) stat[prefix + 'Wrong']++;
    });
   });
  });
  return state;
 };
 let state;
 let storageAvailable = true;
 try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  const valid = saved && saved.courses && saved.stats && courses.every(course => {
   const r = saved.courses[course.id];
   return r && ['learned', 'review', 'initial', 'passed', 'attempts'].every(key => Array.isArray(r[key]));
  });
  state = valid ? saved : seed();
 } catch { state = seed(); storageAvailable = false; }
 const announce = text => { $('#flow-status').textContent = text; };
 const save = () => {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); }
  catch { storageAvailable = false; announce('브라우저 저장 공간을 사용할 수 없습니다. 화면 이동 시 진행 상황이 유지되지 않을 수 있습니다.'); }
 };
 save();
 const record = course => state.courses[course.id];
 const remaining = course => record(course).initial.filter(q => !record(course).passed.includes(q.id));
 const completed = course => record(course).initial.length === 20 && record(course).passed.length === 20;
 const educationReady = course => {
  const r = record(course);
  return r.learned.length === course.procedures.length * 3 && r.review.length === 0;
 };
 const courseState = course => completed(course) ? 'completed' : educationReady(course) ? 'retest' : 'education';
 const stateText = course => completed(course) ? '전체 통과 · 합격' : record(course).draft ? '평가 작성 중' : record(course).attempts.length ? educationReady(course) ? '재시험 응시 가능' : '보완 학습 필요' : educationReady(course) ? '최초 평가 응시 가능' : '최초 교육 필요';
 const badge = course => `<span class="badge badge-outlined ${completed(course) ? 'badge-success' : educationReady(course) ? 'badge-neutral' : 'badge-warning'}">${stateText(course)}</span>`;
 const progress = course => {
  const count = record(course).passed.length;
  return `<div class="flow-progress-copy"><span>누적 ${count} / 20문항 통과</span><strong>${count * 5}%</strong></div><progress class="flow-progress" value="${count}" max="20" aria-label="${label(course)} 누적 통과">${count * 5}%</progress>`;
 };
 const stats = entries => entries.map(([name, value, details]) => `<div class="flow-stat"><dt class="flow-note">${name}</dt><dd class="flow-stat-value">${value}</dd>${details ? `<dd class="flow-stat-details">${details}</dd>` : ''}</div>`).join('');
 const action = course => {
  const target = completed(course) ? 'reports/learning.html' : educationReady(course) ? 'assessment/index.html' : 'education/index.html';
  const text = completed(course) ? '결과 보기' : educationReady(course) ? record(course).draft ? '평가 이어하기' : record(course).attempts.length ? `재시험 ${remaining(course).length}문항 응시` : '최초 평가 시작' : record(course).attempts.length ? '보완 학습 시작' : '교육 시작';
  return `<a class="btn btn-primary btn-lg" href="${link(target, course)}">${text}</a>`;
 };
 let selected = courses.find(c => c.id === new URLSearchParams(location.search).get('course')) || courses[0];
 const setupCourseSelect = callback => {
  const select = $('#course-select');
  select.innerHTML = courses.map(c => `<option value="${c.id}">${label(c)} · ${c.period}</option>`).join('');
  select.value = selected.id;
  select.addEventListener('change', () => {
   selected = courses.find(c => c.id === select.value);
   const url = new URL(location.href); url.searchParams.set('course', selected.id); url.searchParams.delete('procedure');
   history.replaceState(null, '', url);
   callback();
  });
 };
 const procedureButtons = (course, current, learning = false) => course.procedures.map((name, index) => {
  const r = record(course);
  const count = [0, 1, 2].filter(s => r.learned.includes(`${index}-${s}`)).length;
  const suffix = learning ? r.review.includes(index) ? '재학습 필요' : count === 3 ? '교육 완료' : `${count}/3` : '';
  return `<li class="flow-procedure-item"><button class="flow-select-button" type="button" aria-pressed="${index === current}" data-procedure="${index}"><span>${String(index + 1).padStart(2, '0')}. ${name}</span><span>${suffix}</span></button></li>`;
 }).join('');
 const equipment = (course, procedure, mode, active = -1) => `<p class="flow-note">${label(course)} / ${course.procedures[procedure]}</p><p class="title-h4">운전 화면 샘플 · P${String(procedure + 1).padStart(2, '0')}</p><div class="flow-equipment-list">${steps.map((name, index) => mode === 'education' ? `<div class="flow-equipment-item"${active === index ? ' aria-current="true"' : ''}><span class="flow-note">P${procedure + 1}-OP${index + 1}</span><strong>${name}</strong><span>${active === index ? '현재 학습 단계' : '연계 조작 항목'}</span></div>` : `<div class="flow-equipment-item" draggable="true" data-drag-item="${procedure}-${index}"><span class="flow-note">P${procedure + 1}-OP${index + 1}</span><strong>${name}</strong><button class="btn btn-secondary btn-md flow-equipment-button" type="button" data-add="${procedure}-${index}" aria-label="${course.procedures[procedure]} ${name} 답안에 추가">답안에 추가</button></div>`).join('')}</div>`;
 const weakGroups = course => {
  const groups = new Map();
  remaining(course).forEach(q => {
   const group = groups.get(q.procedure) || { count: 0, max: 0 };
   group.count++;
   group.max = Math.max(group.max, record(course).attempts.filter(a => a.wrong.includes(q.id)).length);
   groups.set(q.procedure, group);
  });
  return [...groups].sort((a, b) => b[1].max - a[1].max);
 };
 const dashboard = () => {
  const active = courses.find(c => !completed(c) && record(c).initial.length) || courses.find(c => !completed(c)) || courses[0];
  const passedCourses = courses.filter(completed);
  const passedDetails = passedCourses.length ? `<ul class="flow-stat-list">${passedCourses.map(course => `<li class="flow-stat-item"><a class="link" href="${link('reports/learning.html', course)}">${label(course)}</a><p class="flow-note">${course.period}</p><p class="flow-note">평가 ID: ${course.id}</p></li>`).join('')}</ul>` : '';
  $('#flow-priority').innerHTML = `<p class="priority-label">오늘의 우선 학습 · ${active.period}</p><h2 class="title-h2 priority-title" id="priority-title">${label(active)}</h2><p>${stateText(active)}${record(active).initial.length ? ` · ${record(active).passed.length} / 20문항 통과` : ''}</p><div class="btn-group">${action(active)}<a class="btn btn-secondary-ondark btn-lg" href="${link('reports/learning.html', active)}">진행 이력</a></div>`;
  $('#flow-summary').innerHTML = stats([
   ['진행 중인 평가', `${courses.filter(c => !completed(c)).length}건`],
   ['보완 학습 필요', `${courses.filter(c => !completed(c) && record(c).review.length).length}건`],
   ['미통과 문항', `${courses.reduce((sum, c) => sum + (record(c).attempts.length ? remaining(c).length : 0), 0)}문항`],
   ['합격한 평가', `${passedCourses.length}건`, passedDetails]
  ]);
  let filter = 'all';
  const renderList = () => {
   const kind = $('#kind-filter').value;
   const shown = courses.filter(c => (kind === 'all' || c.kind === kind) && (filter === 'all' || courseState(c) === filter));
   $('#course-list').innerHTML = shown.map(c => {
    const r = record(c);
    const learned = c.procedures.filter((_, p) => [0, 1, 2].every(s => r.learned.includes(`${p}-${s}`))).length;
    return `<li class="flow-course-item"><div class="flow-stack"><div class="badge-group"><span class="badge badge-light">${c.period}</span>${badge(c)}</div><h3 class="title-h4">${label(c)}</h3><p class="flow-note">평가 ID: ${c.id}</p><p class="flow-note">교육 ${learned} / ${c.procedures.length}절차 완료${r.review.length ? ` · 보완 학습 ${r.review.length}절차` : ''}</p>${r.initial.length ? progress(c) : '<p class="flow-note">최초 평가 미응시 · 교육을 모두 마치면 20문항에 응시합니다.</p>'}</div><div class="btn-group">${action(c)}</div></li>`;
   }).join('');
   $('#filter-status').textContent = shown.length ? `${shown.length}건의 평가가 표시됩니다.` : '해당 조건의 평가가 없습니다.';
  };
  $('#kind-filter').addEventListener('change', renderList);
  $('#state-filter').addEventListener('click', event => {
   const button = event.target.closest('[data-state]'); if (!button) return;
   filter = button.dataset.state;
   $('#state-filter').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
   renderList();
  });
  renderList();
  $('#weak-list').innerHTML = courses.filter(c => record(c).attempts.length).flatMap(c => weakGroups(c).map(([p, group]) => `<li class="flow-guide-item"><div class="flow-toolbar"><div><strong>${c.procedures[p]}</strong><p class="flow-note">${label(c)} · 미통과 ${group.count}문항</p><p class="flow-danger">동일 문항 최대 ${group.max}회 오답</p></div><a class="btn btn-neutral btn-md" href="${link('education/index.html', c, '&procedure=' + p)}">${record(c).review.includes(p) ? '보완 학습' : '다시 보기'}</a></div></li>`)).join('') || '<li class="flow-guide-item">현재 미통과 문항이 없습니다.</li>';
  const review = courses.find(c => completed(c) && record(c).attempts.some(a => a.wrong.length));
  $('#review-content').innerHTML = review ? `<div class="flow-stack"><span class="badge badge-outlined badge-success">합격 상태 유지</span><h3 class="title-h4">${label(review)}</h3><p class="flow-note">통과 전 틀렸던 문항의 절차를 다시 학습할 수 있습니다.</p><a class="btn btn-neutral btn-md" href="${link('education/index.html', review)}">절차 복습</a></div>` : '<p class="flow-note">복습을 권장할 완료 평가가 없습니다.</p>';
 };
 const education = () => {
  let procedure = Number(new URLSearchParams(location.search).get('procedure')) || 0;
  if (procedure < 0 || procedure >= selected.procedures.length) procedure = 0;
  let step = 0;
  let reviewSteps = record(selected).reviewLearned ||= {};
  const render = () => {
   const r = record(selected);
   const needed = r.review.includes(procedure);
   const reviewTotal = Object.keys(reviewSteps).length ? new Set([...Object.keys(reviewSteps).map(Number), ...r.review]).size * 3 : r.review.length * 3;
   const reviewedCount = Object.values(reviewSteps).reduce((sum, items) => sum + items.length, 0);
   $('#education-summary').innerHTML = `<div class="flow-toolbar"><h3 class="title-h4">${label(selected)}</h3>${badge(selected)}</div><p class="flow-note">${selected.period} · ${selected.procedures.length}개 교육 절차 · ${r.learned.length} / ${selected.procedures.length * 3}단계 최초 교육 완료${reviewTotal ? ` · 보완 학습 ${reviewedCount}/${reviewTotal}단계 (${r.review.length}절차 남음)` : ''}</p><progress class="flow-progress" value="${reviewTotal ? reviewedCount : r.learned.length}" max="${reviewTotal || selected.procedures.length * 3}" aria-label="${reviewTotal ? '보완 학습' : '교육 단계'} 완료 현황"></progress>`;
   $('#procedure-list').innerHTML = procedureButtons(selected, procedure, true);
   $('#selected-procedure').textContent = selected.procedures[procedure];
   $('#step-list').innerHTML = steps.map((name, index) => {
    const done = needed ? (reviewSteps[procedure] || []).includes(index) : r.learned.includes(`${procedure}-${index}`);
    return `<li class="flow-step-item"><button type="button" class="flow-step-button" data-step="${index}" aria-pressed="${step === index}"><strong>${index + 1}. ${name}</strong><p class="flow-note">${stepCopy[index]}</p><span class="flow-note">${done ? '학습 완료' : needed ? '재학습 필요' : '학습 대기'}</span></button></li>`;
   }).join('');
   $('#education-viewer').innerHTML = equipment(selected, procedure, 'education', step);
   const done = needed ? (reviewSteps[procedure] || []).includes(step) : r.learned.includes(`${procedure}-${step}`);
   $('#complete-step').disabled = done;
   $('#complete-step').textContent = done ? '이 단계 학습 완료됨' : needed ? '이 단계 재학습 완료' : '이 단계 학습 완료';
   const ready = educationReady(selected);
   $('#education-gate').textContent = completed(selected) ? '이미 모든 문항을 통과한 평가입니다. 자유롭게 복습할 수 있습니다.' : ready ? '모든 필수 교육을 완료했습니다. 평가에 응시할 수 있습니다.' : '필수 단계와 보완 학습을 모두 완료하면 평가에 응시할 수 있습니다.';
   const next = $('#education-next');
   next.href = link(completed(selected) ? 'reports/learning.html' : 'assessment/index.html', selected);
   next.textContent = completed(selected) ? '평가 결과 보기' : ready ? r.attempts.length ? `재시험 ${remaining(selected).length}문항 응시` : '최초 평가 시작' : '평가 준비 현황';
  };
  setupCourseSelect(() => { procedure = 0; step = 0; reviewSteps = record(selected).reviewLearned ||= {}; render(); });
  $('#procedure-list').addEventListener('click', event => {
   const button = event.target.closest('[data-procedure]'); if (!button) return;
   procedure = Number(button.dataset.procedure); step = 0; render();
   $('#procedure-list').querySelector(`[data-procedure="${procedure}"]`).focus();
  });
  $('#step-list').addEventListener('click', event => {
   const button = event.target.closest('[data-step]'); if (!button) return;
   step = Number(button.dataset.step); render();
   $('#step-list').querySelector(`[data-step="${step}"]`).focus();
  });
  $('#complete-step').addEventListener('click', () => {
   const r = record(selected); const key = `${procedure}-${step}`;
   if (!r.learned.includes(key)) r.learned.push(key);
   if (r.review.includes(procedure)) {
    const reviewed = reviewSteps[procedure] ||= [];
    if (!reviewed.includes(step)) reviewed.push(step);
    if (reviewed.length === 3) r.review = r.review.filter(p => p !== procedure);
   }
   save();
   announce(`${selected.procedures[procedure]} ${step + 1}단계 학습이 완료되었습니다.`);
   if (step < 2) step++;
   render();
  });
  render();
 };
 // 순차 가중 추출: 최초 응시 오답률을 사용하고, 표본이 없으면 기본 가중치 1.
 const drawQuestions = course => {
  const pool = bank(course); const result = [];
  while (result.length < 20) {
   const weights = pool.map(q => { const s = state.stats[q.id]; return 1 + (s?.first ? s.firstWrong / s.first : 0); });
   let point = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
   let index = 0;
   while (index < weights.length - 1 && (point -= weights[index]) >= 0) index++;
   result.push(pool.splice(index, 1)[0]);
  }
  return result;
 };
 const assessment = () => {
  let questionIndex = 0;
  let procedure = 0;
  const draft = () => record(selected).draft;
  const activeQuestion = () => draft()?.questions[questionIndex];
  const answers = () => draft().answers[activeQuestion().id] ||= [];
  const persistDraft = () => { draft().index = questionIndex; save(); };
  const answerComplete = answer => Array.isArray(answer) && answer.length === 3;
  const renderGate = () => {
   const r = record(selected);
   const ready = educationReady(selected);
   $('#assessment-gate').innerHTML = `<div class="flow-toolbar"><h3 class="title-h4">${label(selected)}</h3>${badge(selected)}</div><p class="flow-note">${selected.period} · ${r.attempts.length ? `누적 ${r.passed.length}/20문항 통과 · 남은 ${remaining(selected).length}문항` : '최초 평가 20문항 · 전 문항 통과 시 합격'}</p>${completed(selected) ? `<p>이미 모든 문항을 통과했습니다.</p><div>${action(selected)}</div>` : !ready ? `<p>교육 ${r.learned.length}/${selected.procedures.length * 3}단계 완료${r.review.length ? ` · 보완 학습 ${r.review.length}절차 필요` : ''}</p><div><a class="btn btn-primary btn-lg" href="${link('education/index.html', selected)}">필수 교육 이어하기</a></div>` : `<div><button class="btn btn-primary btn-lg" type="button" id="start-exam">${r.draft ? '작성 중인 평가 이어하기' : r.attempts.length ? `재시험 ${remaining(selected).length}문항 시작` : '최초 평가 20문항 시작'}</button></div>`}`;
   $('#exam-workspace').hidden = true;
   $('#course-select').disabled = false;
   if (ready && !completed(selected)) $('#start-exam').addEventListener('click', start);
  };
  const renderAnswers = (focusIndex = null, focusAction = 'up') => {
   const list = answers();
   $('#answer-empty').hidden = list.length > 0;
   $('#answer-list').innerHTML = list.map((item, index) => `<li class="flow-answer-item"><strong>${index + 1}. ${selected.procedures[item.procedure]} · ${steps[item.step]}</strong><div class="flow-answer-actions"><button class="btn btn-neutral btn-sm" type="button" data-answer-action="up" data-answer-index="${index}" aria-label="${index + 1}번째 답안 위로"${index === 0 ? ' disabled' : ''}>위로</button><button class="btn btn-neutral btn-sm" type="button" data-answer-action="down" data-answer-index="${index}" aria-label="${index + 1}번째 답안 아래로"${index === list.length - 1 ? ' disabled' : ''}>아래로</button><button class="btn btn-neutral btn-sm" type="button" data-answer-action="remove" data-answer-index="${index}" aria-label="${index + 1}번째 답안 삭제">삭제</button></div></li>`).join('');
   const d = draft();
   const filled = d.questions.filter(q => answerComplete(d.answers[q.id])).length;
   $('#answer-count').textContent = `답안 배치 ${filled} / ${d.questions.length}문항`;
   $('#submit-exam').disabled = filled !== d.questions.length;
   $('#question-list').querySelectorAll('[data-question]').forEach(button => {
    const index = Number(button.dataset.question);
    const filled = answerComplete(d.answers[d.questions[index].id]);
    button.textContent = `${index + 1}${filled ? ' ·' : ''}`;
    button.setAttribute('aria-label', `${index + 1}번 문항, ${filled ? '답안 배치 완료' : '미작성'}`);
   });
   $('#exam-viewer').querySelectorAll('[data-add]').forEach(button => {
    const [p, s] = button.dataset.add.split('-').map(Number);
    const added = list.some(a => a.procedure === p && a.step === s);
    button.disabled = added || list.length >= 3;
    button.textContent = added ? '추가됨' : '답안에 추가';
   });
   if (focusIndex !== null) {
    const target = $('#answer-list').querySelector(`[data-answer-index="${focusIndex}"][data-answer-action="${focusAction}"]:not(:disabled)`)
     || $('#answer-list').querySelector(`[data-answer-index="${focusIndex}"][data-answer-action="remove"]`);
    (target || $('#question-heading')).focus();
   }
  };
  const renderViewer = () => {
   $('#exam-procedure-list').innerHTML = procedureButtons(selected, procedure);
   $('#exam-viewer').innerHTML = equipment(selected, procedure, 'assessment');
   renderAnswers();
  };
  const renderQuestion = (focus = false) => {
   const d = draft(); const q = activeQuestion();
   $('#question-heading').textContent = `문항 ${questionIndex + 1} / ${d.questions.length}`;
   $('#question-copy').textContent = `${selected.procedures[q.procedure]}: ${q.variant % 2 ? '운전 상태를 확인한 뒤' : '작업을 시작하기 전'} 수행할 조작 항목 3개를 절차 순서대로 배치하세요. (예시 문항 ${q.id.split('-q')[1]})`;
   $('#exam-round').textContent = record(selected).attempts.length ? `${record(selected).attempts.length}차 재시험` : '최초 평가';
   $('#question-list').innerHTML = d.questions.map((item, index) => `<li class="flow-question-item"><button class="flow-question-button" type="button" data-question="${index}" aria-label="${index + 1}번 문항"${index === questionIndex ? ' aria-current="step"' : ''}>${index + 1}</button></li>`).join('');
   procedure = q.procedure;
   $('#previous-question').disabled = questionIndex === 0;
   $('#next-question').disabled = questionIndex === d.questions.length - 1;
   renderViewer(); persistDraft();
   if (focus) $('#question-heading').focus();
  };
  function start() {
   if (!educationReady(selected) || completed(selected)) return;
   const r = record(selected);
   if (!r.draft) {
    if (!r.initial.length) r.initial = drawQuestions(selected);
    r.draft = { questions: remaining(selected), answers: {}, index: 0, started: Date.now() };
   }
   questionIndex = Math.min(r.draft.index || 0, r.draft.questions.length - 1);
   save(); $('#exam-workspace').hidden = false; $('#course-select').disabled = true;
   $('#start-exam').disabled = true; $('#start-exam').textContent = '평가 응시 중';
   renderQuestion(true);
  }
  const add = (p, s) => {
   if (!draft() || !Number.isInteger(p) || p < 0 || p >= selected.procedures.length || !Number.isInteger(s) || s < 0 || s > 2) return;
   const list = answers();
   if (list.length >= 3 || list.some(item => item.procedure === p && item.step === s)) return;
   list.push({ procedure: p, step: s }); persistDraft(); renderAnswers(); announce(`답안 ${list.length}번째에 ${selected.procedures[p]} ${steps[s]} 추가됨`);
  };
  setupCourseSelect(() => { questionIndex = 0; renderGate(); });
  $('#exam-procedure-list').addEventListener('click', event => {
   const button = event.target.closest('[data-procedure]'); if (!button) return;
   procedure = Number(button.dataset.procedure); renderViewer();
   $('#exam-procedure-list').querySelector(`[data-procedure="${procedure}"]`).focus();
  });
  $('#exam-viewer').addEventListener('click', event => {
   const button = event.target.closest('[data-add]'); if (!button) return;
   add(...button.dataset.add.split('-').map(Number));
  });
  $('#exam-viewer').addEventListener('dragstart', event => {
   const item = event.target.closest('[data-drag-item]'); if (!item || !event.dataTransfer) return;
   event.dataTransfer.setData('application/x-wp-operation', item.dataset.dragItem); event.dataTransfer.effectAllowed = 'copy';
  });
  $('#answer-zone').addEventListener('dragover', event => {
   if (event.dataTransfer.types.includes('application/x-wp-operation')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }
  });
  $('#answer-zone').addEventListener('drop', event => {
   event.preventDefault(); const value = event.dataTransfer.getData('application/x-wp-operation');
   if (/^\d+-[012]$/.test(value)) add(...value.split('-').map(Number));
  });
  $('#answer-list').addEventListener('click', event => {
   const button = event.target.closest('[data-answer-action]'); if (!button) return;
   const index = Number(button.dataset.answerIndex); const list = answers(); const action = button.dataset.answerAction;
   const next = action === 'up' ? index - 1 : index + 1;
   if (action === 'remove') list.splice(index, 1);
   else if (next >= 0 && next < list.length) [list[index], list[next]] = [list[next], list[index]];
   persistDraft(); renderAnswers(action === 'remove' ? Math.max(0, index - 1) : next, action);
   announce(action === 'remove' ? '답안을 삭제했습니다.' : '답안 순서를 변경했습니다.');
  });
  $('#question-list').addEventListener('click', event => {
   const button = event.target.closest('[data-question]'); if (!button) return;
   questionIndex = Number(button.dataset.question); renderQuestion(true);
  });
  $('#previous-question').addEventListener('click', () => { if (questionIndex > 0) { questionIndex--; renderQuestion(true); } });
  $('#next-question').addEventListener('click', () => { if (questionIndex < draft().questions.length - 1) { questionIndex++; renderQuestion(true); } });
  const dialog = $('#submit-dialog');
  $('#submit-exam').addEventListener('click', () => {
   if (draft().questions.every(q => answerComplete(draft().answers[q.id]))) dialog.showModal();
  });
  $('#cancel-submit').addEventListener('click', () => dialog.close());
  $('#confirm-submit').addEventListener('click', () => {
   const r = record(selected); const d = r.draft;
   if (!d || !d.questions.every(q => answerComplete(d.answers[q.id]))) return;
   $('#confirm-submit').disabled = true;
   const wrong = []; let correct = 0;
   d.questions.forEach(q => {
    const answer = d.answers[q.id];
    const pass = answer.every((item, index) => item.procedure === q.procedure && item.step === index);
    const stat = state.stats[q.id] ||= { first: 0, firstWrong: 0, retry: 0, retryWrong: 0 };
    const prefix = r.attempts.length ? 'retry' : 'first'; stat[prefix]++;
    if (pass) { if (!r.passed.includes(q.id)) r.passed.push(q.id); correct++; }
    else { wrong.push(q.id); stat[prefix + 'Wrong']++; }
   });
   r.attempts.push({ date: new Date().toISOString(), total: d.questions.length, correct, cumulative: r.passed.length, wrong, seconds: Math.floor((Date.now() - d.started) / 1000) });
   r.reviewLearned = {};
   r.review = [...new Set(r.initial.filter(q => wrong.includes(q.id)).map(q => q.procedure))];
   r.draft = null; save();
   location.href = link('reports/learning.html', selected);
  });
  const timer = setInterval(() => {
   if (!draft() || $('#exam-workspace').hidden) return;
   const seconds = Math.max(0, Math.floor((Date.now() - draft().started) / 1000));
   $('#elapsed-time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }, 1000);
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
  renderGate();
 };
 const reports = () => {
  const rate = (wrong, total) => total ? `${Math.round(wrong / total * 100)}% (${wrong}/${total})` : '응시 없음';
  const render = () => {
   const r = record(selected); const hasResult = r.attempts.length > 0;
   $('#report-overview').innerHTML = `<div class="flow-toolbar"><h3 class="title-h2">${label(selected)}</h3>${badge(selected)}</div><p class="flow-note">${selected.period} · ${completed(selected) ? '최초 20문항 모두 통과하여 최종 합격했습니다.' : hasResult ? '이번 회차 응시는 종료되었습니다. 남은 문항을 모두 통과하면 최종 합격합니다.' : '아직 제출한 응시 결과가 없습니다.'}</p>${hasResult ? progress(selected) : ''}<div class="btn-group">${action(selected)}<a class="btn btn-neutral btn-lg" href="../dashboard/learning.html">대시보드</a></div>`;
   const latest = r.attempts.at(-1);
   $('#report-summary').innerHTML = stats([['누적 통과', `${r.passed.length}/20문항`], ['남은 문항', hasResult ? `${remaining(selected).length}문항` : '미응시'], ['응시 횟수', `${r.attempts.length}회`], ['최근 회차 통과', latest ? `${latest.correct}/${latest.total}문항` : '미응시']]);
   $('#history-body').innerHTML = r.attempts.map((a, i) => `<tr><th scope="row">${i ? `${i}차 재시험` : '최초 평가'}</th><td><time datetime="${escape(a.date)}">${new Date(a.date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</time></td><td>${a.total}문항</td><td>${a.correct}문항</td><td>${a.wrong.length}문항</td><td>${a.cumulative}/20</td></tr>`).join('') || '<tr><td colspan="6">응시 이력이 없습니다. 필수 교육 후 평가에 응시하세요.</td></tr>';
   $('#result-list').innerHTML = (hasResult ? r.initial : []).map((q, index) => {
    const pass = r.passed.includes(q.id); const wrongCount = r.attempts.filter(a => a.wrong.includes(q.id)).length;
    const s = state.stats[q.id] || {};
    return `<li class="flow-guide-item"><div class="flow-toolbar"><div><strong>${index + 1}. ${selected.procedures[q.procedure]}</strong> <span class="${pass ? 'flow-success' : 'flow-danger'}">${pass ? '통과' : '미통과'}</span><p class="flow-note">문항 ${q.id.split('-q')[1]} · 오답 ${wrongCount}회</p></div><a class="btn btn-neutral btn-md" href="${link('education/index.html', selected, '&procedure=' + q.procedure)}">${pass ? '절차 복습' : '보완 학습'}</a></div><details class="flow-details"><summary class="flow-details-title">해설 및 오답 기록</summary><p class="flow-detail-copy">예시 정답: ${steps.join(' → ')}. 해당 절차의 항목을 선택하고 이 순서대로 배치합니다.</p><p class="flow-note">최초 응시 오답률 ${rate(s.firstWrong, s.first)} · 재시험 오답률 ${rate(s.retryWrong, s.retry)}</p><p class="flow-note">현재 예시 계정의 기록입니다. 전체 응시자 통계는 서버 연동 후 제공됩니다.</p></details></li>`;
   }).join('') || '<li class="flow-guide-item">평가 제출 후 문항별 결과가 표시됩니다.</li>';
  };
  setupCourseSelect(render); render();
 };
 ({ dashboard, education, assessment, reports }[page] || (() => {}))();
 // 새 시안의 대체 경로에서도 공통 메뉴의 현재 위치를 표시한다.
 document.addEventListener('includes:loaded', () => {
  const routes = {
   '/WEB-INF/html/user/dashboard/index.html': '/WEB-INF/html/user/dashboard/learning.html',
   '/WEB-INF/html/user/reports/index.html': '/WEB-INF/html/user/reports/learning.html'
  };
  const path = routes[`/WEB-INF/html/user/${page}/index.html`] || `/WEB-INF/html/user/${page}/index.html`;
  document.querySelectorAll('.sidebar a[href]').forEach(a => {
   const url = new URL(a.href);
   if (routes[url.pathname]) { url.pathname = routes[url.pathname]; a.href = url.href; }
   if (!a.closest('nav')) return;
   if (url.pathname === path) a.setAttribute('aria-current', 'page');
   else a.removeAttribute('aria-current');
  });
 });
 if (!storageAvailable) announce('브라우저 저장 공간을 사용할 수 없어 화면 이동 시 진행 상황이 유지되지 않을 수 있습니다.');
})();

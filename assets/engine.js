/* Shared engine for the interactive modules of «مقدمة في الذكاء الاصطناعي» — د. سميرة عبدوس
   A module calls Course.init(config). Config:
   { slug, lectures:{ar,en}, title:{ar,en}, sub:{ar,en}, how:{ar:[..],en:[..]}, sections:[...], final:{rows:{ar,en}, question:{ar,en}} }
   Section: { id, n, t:{ar,en}, y:{ar,en}, story:{ar:[html..],en:[..]}, ev:{ar:[[y,t,s]..],en:[..]}, lesson:{ar,en}, note:{ar,en},
              terms:[{en,fr,ar,s:{ar,en},c:{ar,en}}], activity:{id, title:{ar,en}, ...data}, qs:[{k:'mcq'|'tf'|'order'|'multi', q:{ar,en}, o:{ar:[],en:[]}, a, w:{ar,en}}] }
   Widgets register with Course.widget(id, (el, data, ctx) => {...}); ctx.done(score, max) marks the activity complete. */
window.Course = (function () {
  const UI = {
    ar: { eyebrow: 'مقدمة في الذكاء الاصطناعي', byline: 'من إعداد الدكتورة عبدوس سميرة', home: '⌂ فهرس الوحدات',
      nameLabel: 'اكتب اسمك لتبدأ (المراحل مقفلة حتى تكتبه)', namePh: 'مثال: ياسمين بن علي', start: 'ابدأ', points: 'نقاط', stars: 'نجوم', stages: 'مراحل', howTitle: 'كيف تعمل هذه الوحدة؟',
      locked: 'أكمل المرحلة السابقة أولًا', needName: 'اكتب اسمك أولًا', lockedAria: '(مقفلة)', reset: 'إعادة الوحدة من البداية', resetArm: 'اضغط مرة أخرى للتأكيد: سيُمحى تقدمك في هذه الوحدة',
      stage: 'المرحلة', close: 'إغلاق ✕', tStory: 'الشرح', tTerms: 'المصطلحات', tAct: 'النشاط', tQuiz: 'التحدي', lesson: 'الدرس:', toTerms: 'إلى المصطلحات ←', toAct: 'إلى النشاط ←', toQuiz: 'إلى التحدي ←',
      termsHint: 'اضغط البطاقة لقلبها: الوجه الأمامي الاسم بثلاث لغات، والخلفي الشرح البسيط وما لا تخلط بينه.', simple: 'بكلمات بسيطة:', confuse: 'لا تخلط بينه وبين:',
      kinds: { mcq: 'اختيار من متعدد', tf: 'صح أم خطأ', order: 'رتّب', multi: 'اختر كل ما ينطبق' }, tfOpts: ['صحيح', 'خطأ'], check: 'تحقق', clear: 'مسح الترتيب',
      correct: 'صحيح', wrong: 'ليس صحيحًا.', retry: 'حاول مرة أخرى.', wellDone: 'أحسنت!', opened: 'المرحلة مكتملة', nextOpen: 'المرحلة التالية صارت متاحة.', endRoad: 'أكملت الوحدة. انظر إلى الخلاصة أسفل القائمة.', back: 'العودة إلى القائمة',
      actPending: 'أكمل النشاط لفتح المرحلة التالية.', actDone: 'النشاط مكتمل', actScore: 'نتيجة النشاط',
      greets: ['أهلًا بك. تقدمك يُحفظ على هذا الجهاز، والخطأ ليس عقوبة بل شرح ومحاولة أخرى.', 'مرحبًا. اقرأ الشرح، اقلب المصطلحات، جرّب النشاط، ثم اختبر نفسك.'],
      hello: 'مرحبًا', resume: (d, n, s) => `واصل من حيث توقفت: أكملت ${d} من ${n} مراحل برصيد ${s} نقطة.`, chgName: 'تغيير الاسم',
      finalTitle: (n, sc, st) => `${n ? n + '، ' : ''}أكملت الوحدة: ${sc} نقطة · ${st} نجمة`, finalIntro: 'الخلاصة التي تحفظها:', finalH: ['المحور', 'الجملة'], finalQ: 'سؤال للنقاش في الحصة:',
      foot: 'د. سميرة عبدوس · جامعة أمحمد بوقرة بومرداس' },
    en: { eyebrow: 'Introduction to Artificial Intelligence', byline: 'Prepared by Dr. Samira Abdous', home: '⌂ Module index',
      nameLabel: 'Type your name to start (stages stay locked until you do)', namePh: 'e.g. Yasmine Benali', start: 'Start', points: 'points', stars: 'stars', stages: 'stages', howTitle: 'How this module works',
      locked: 'Complete the previous stage first', needName: 'Type your name first', lockedAria: '(locked)', reset: 'Restart this module', resetArm: 'Tap again to confirm: your progress in this module will be erased',
      stage: 'Stage', close: 'Close ✕', tStory: 'Explanation', tTerms: 'Terms', tAct: 'Activity', tQuiz: 'Challenge', lesson: 'Lesson:', toTerms: 'To the terms →', toAct: 'To the activity →', toQuiz: 'To the challenge →',
      termsHint: 'Tap a card to flip it: the front shows the name in three languages, the back the plain explanation and what not to confuse it with.', simple: 'In plain words:', confuse: 'Do not confuse with:',
      kinds: { mcq: 'Multiple choice', tf: 'True or false', order: 'Put in order', multi: 'Select all that apply' }, tfOpts: ['True', 'False'], check: 'Check', clear: 'Clear order',
      correct: 'Correct', wrong: 'Not quite.', retry: 'Try again.', wellDone: 'Well done!', opened: 'Stage complete', nextOpen: 'The next stage is now open.', endRoad: 'Module complete. See the summary below the list.', back: 'Back to the list',
      actPending: 'Complete the activity to unlock the next stage.', actDone: 'Activity complete', actScore: 'Activity score',
      greets: ['Welcome. Your progress is saved on this device, and a mistake is not a penalty but an explanation and another try.', 'Hello. Read the explanation, flip the terms, try the activity, then test yourself.'],
      hello: 'Welcome', resume: (d, n, s) => `Pick up where you left off: ${d} of ${n} stages done, ${s} points.`, chgName: 'Change name',
      finalTitle: (n, sc, st) => `${n ? n + ', ' : ''}module complete: ${sc} points · ${st} stars`, finalIntro: 'The summary to remember:', finalH: ['Topic', 'Sentence'], finalQ: 'Question for class discussion:',
      foot: "Dr. Samira Abdous · University M'hamed Bougara of Boumerdes" }
  };
  const AB = { ar: ['أ', 'ب', 'ج', 'د', 'هـ', 'و'], en: ['A', 'B', 'C', 'D', 'E', 'F'] };
  const widgets = {};
  let cfg, lang = 'ar', st, cur = null, tab = 'story', run = null, KEY;
  const T = () => UI[lang];
  const L = x => (x && typeof x === 'object' && !Array.isArray(x) && ('ar' in x || 'en' in x)) ? (x[lang] ?? x.ar ?? x.en) : x;
  const $ = id => document.getElementById(id);

  function load() {
    st = { done: {}, stars: {}, act: {}, score: 0 };
    try {
      const r = localStorage.getItem(KEY); if (r) { const o = JSON.parse(r); if (o && typeof o === 'object') st = Object.assign(st, o); }
      const l = localStorage.getItem('course:lang'); if (l === 'en' || l === 'ar') lang = l;
      st.name = localStorage.getItem('course:name') || '';
    } catch (e) { st.name = st.name || ''; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); localStorage.setItem('course:lang', lang); localStorage.setItem('course:name', st.name || ''); } catch (e) {} }
  const S = () => cfg.sections;
  function unlockedIndex() { let i = 0; while (i < S().length - 1 && st.done[S()[i].id]) i++; return i; }
  const named = () => !!(st.name || '').trim();

  // ---------- shell ----------
  function shell() {
    document.body.innerHTML = `
<div class="wrap">
  <div class="topbar"><a class="home" href="../../" id="homeLink"></a>
    <div class="langbar" role="group" aria-label="Language"><button type="button" data-lang="ar">العربية</button><button type="button" data-lang="en">English</button></div></div>
  <header class="top"><span class="eyebrow" id="uiEyebrow"></span><h1 id="uiTitle"></h1><p class="byline" id="uiByline"></p><p class="sub" id="uiSub"></p></header>
  <section class="welcome"><form id="nameForm" class="nameForm"><label for="studentName" id="uiNameLabel"></label>
    <div class="nameRow"><input id="studentName" type="text" maxlength="40" autocomplete="off" required><button class="btn" type="submit" id="uiStart"></button></div></form>
    <div id="greet" class="greet" hidden></div></section>
  <div class="bar"><i id="bar"></i></div>
  <div class="hud"><div><b id="hScore">0</b><span id="uiPoints"></span></div><div><b id="hStars">0</b><span id="uiStars"></span></div><div><b id="hDone">0</b><span id="uiStages"></span></div></div>
  <details class="howto"><summary id="uiHow"></summary><ol id="howList"></ol></details>
  <div class="steps" id="steps"></div>
  <section class="final" id="final" hidden aria-live="polite"></section>
  <div class="foot"><span id="uiFoot"></span><button class="linkbtn" id="reset" type="button"></button></div>
</div>
<div class="panel" id="panel" hidden role="dialog" aria-modal="true" aria-labelledby="pTitle"><div class="sheet" id="sheet"></div></div>`;
    document.querySelectorAll('.langbar button').forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; save(); applyLang(); renderWelcome(); renderSteps(); if (cur !== null) renderPanel(); }));
    $('nameForm').addEventListener('submit', e => { e.preventDefault(); const v = $('studentName').value.trim(); if (!v) return; st.name = v; save(); renderWelcome(); renderSteps(); });
    $('panel').addEventListener('click', e => { if (e.target === $('panel')) closeP(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('panel').hidden) closeP(); });
    $('reset').addEventListener('click', () => {
      const b = $('reset');
      if (b.dataset.arm) { st = { done: {}, stars: {}, act: {}, score: 0, name: st.name }; save(); b.textContent = T().reset; delete b.dataset.arm; renderWelcome(); renderSteps(); }
      else { b.dataset.arm = '1'; b.textContent = T().resetArm; setTimeout(() => { delete b.dataset.arm; b.textContent = T().reset; }, 4000); }
    });
  }
  function applyLang() {
    const t = T();
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = L(cfg.title);
    $('homeLink').textContent = t.home; $('uiEyebrow').textContent = t.eyebrow + ' · ' + L(cfg.lectures); $('uiTitle').textContent = L(cfg.title); $('uiByline').textContent = t.byline; $('uiSub').textContent = L(cfg.sub);
    $('uiNameLabel').textContent = t.nameLabel; $('studentName').placeholder = t.namePh; $('uiStart').textContent = t.start;
    $('uiPoints').textContent = t.points; $('uiStars').textContent = t.stars + ' / ' + (S().length * 3); $('uiStages').textContent = t.stages;
    $('uiHow').textContent = t.howTitle; $('howList').innerHTML = L(cfg.how).map(x => `<li>${x}</li>`).join('');
    $('uiFoot').textContent = t.foot; $('reset').textContent = t.reset;
    document.querySelectorAll('.langbar button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }
  function renderWelcome() {
    const t = T(), f = $('nameForm'), g = $('greet'), n = (st.name || '').trim();
    if (n) {
      const doneN = Object.keys(st.done).length; const msg = doneN ? t.resume(doneN, S().length, st.score) : t.greets[n.length % t.greets.length];
      g.innerHTML = `<p><b>${t.hello} ${n}</b><br>${msg}</p><button type="button" class="linkbtn" id="chgName">${t.chgName}</button>`; g.hidden = false; f.hidden = true;
      $('chgName').addEventListener('click', () => { st.name = ''; save(); renderWelcome(); renderSteps(); $('studentName').focus(); });
    } else { g.hidden = true; f.hidden = false; }
  }
  function toast(el, msg) { const old = el.querySelector('.tt'); if (old) old.remove(); const s = document.createElement('span'); s.className = 'tt'; s.textContent = msg; el.appendChild(s); setTimeout(() => s.remove(), 1600); }
  function renderSteps() {
    const t = T(), box = $('steps'); box.innerHTML = '';
    const u = unlockedIndex(), nm = named();
    S().forEach((s, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'step';
      const unlocked = i <= u, done = !!st.done[s.id];
      if (!unlocked || !nm) b.classList.add('locked'); else if (done) b.classList.add('done'); else if (i === u) b.classList.add('cur');
      const stars = st.stars[s.id] ? '★'.repeat(st.stars[s.id]) : '';
      b.innerHTML = `<span class="n">${unlocked && nm ? s.n : '🔒'}</span><span><span class="t">${L(s.t)}</span><span class="y">${L(s.y)}</span></span><span class="stars">${stars}</span>`;
      b.setAttribute('aria-label', `${L(s.t)}${unlocked && nm ? '' : ' ' + t.lockedAria}`);
      b.addEventListener('click', () => {
        if (!nm) { toast(b, t.needName); $('studentName').focus(); $('studentName').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
        if (unlocked) open(i); else toast(b, t.locked);
      });
      box.appendChild(b);
    });
    const doneN = Object.keys(st.done).length, starsN = Object.values(st.stars).reduce((a, b) => a + b, 0);
    $('hScore').textContent = st.score; $('hStars').textContent = starsN; $('hDone').textContent = doneN + ' / ' + S().length;
    $('bar').style.width = (doneN / S().length * 100) + '%';
    renderFinal();
  }
  function renderFinal() {
    const t = T(), f = $('final'); const all = S().every(s => st.done[s.id]);
    if (!all || !cfg.final) { f.hidden = true; f.innerHTML = ''; return; }
    const starsN = Object.values(st.stars).reduce((a, b) => a + b, 0);
    f.hidden = false;
    f.innerHTML = `<h2>${t.finalTitle(st.name, st.score, starsN)}</h2><p>${t.finalIntro}</p>
    <table><tr><th>${t.finalH[0]}</th><th>${t.finalH[1]}</th></tr>${L(cfg.final.rows).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>
    ${cfg.final.question ? `<p class="hint" style="margin-top:8px"><b>${t.finalQ}</b> ${L(cfg.final.question)}</p>` : ''}`;
  }

  // ---------- panel ----------
  function open(i) { cur = i; tab = 'story'; run = { answered: {}, tries: {}, flips: {} }; renderPanel(); $('panel').hidden = false; $('sheet').scrollTop = 0; $('sheet').querySelector('.close').focus(); }
  function closeP() { $('panel').hidden = true; cur = null; renderSteps(); }
  function sectionComplete(s) { const quizOk = s.qs.every((q, qi) => run.answered[qi]); const actOk = !s.activity || (st.act[s.id] && st.act[s.id].done); return quizOk && actOk; }
  function starsFor(s) {
    let miss = 0; s.qs.forEach((q, qi) => { if ((run.tries[qi] || 1) > 1) miss++; });
    let stars = miss === 0 ? 3 : miss === 1 ? 2 : 1;
    if (s.activity && st.act[s.id]) { const r = st.act[s.id].max ? st.act[s.id].score / st.act[s.id].max : 1; if (r < 0.5) stars = Math.min(stars, 1); else if (r < 0.8) stars = Math.min(stars, 2); }
    return stars;
  }
  function maybeComplete(s) { if (sectionComplete(s) && !st.done[s.id]) { st.done[s.id] = true; st.stars[s.id] = starsFor(s); save(); } }
  function renderPanel() {
    const t = T(), s = S()[cur], sheet = $('sheet');
    const hasT = s.terms && s.terms.length > 0, hasA = !!s.activity;
    let h = `<div class="head"><div><span class="eyebrow">${t.stage} ${s.n} · ${L(s.y)}</span><h2 id="pTitle">${L(s.t)}</h2></div><button class="close" type="button" id="closeBtn">${t.close}</button></div>
    <div class="tabs" role="tablist">
      <button role="tab" aria-selected="${tab === 'story'}" data-t="story">${t.tStory}</button>
      <button role="tab" aria-selected="${tab === 'terms'}" data-t="terms" ${hasT ? '' : 'disabled'}>${t.tTerms}${hasT ? ' (' + s.terms.length + ')' : ''}</button>
      <button role="tab" aria-selected="${tab === 'act'}" data-t="act" ${hasA ? '' : 'disabled'}>${t.tAct}</button>
      <button role="tab" aria-selected="${tab === 'quiz'}" data-t="quiz">${t.tQuiz} (${s.qs.length})</button>
    </div>`;
    const next = tab === 'story' ? (hasT ? 'terms' : hasA ? 'act' : 'quiz') : tab === 'terms' ? (hasA ? 'act' : 'quiz') : 'quiz';
    const nextLabel = { terms: t.toTerms, act: t.toAct, quiz: t.toQuiz }[next];
    if (tab === 'story') {
      h += `<div class="card">${(L(s.story) || []).map(p => `<p>${p}</p>`).join('')}${s.ev ? `<div>${L(s.ev).map(e => `<div class="ev"><b>${e[0]}</b><div>${e[1]}<small>${e[2]}</small></div></div>`).join('')}</div>` : ''}</div>`;
      if (s.lesson) h += `<div class="lesson"><b>${t.lesson}</b> ${L(s.lesson)}</div>`;
      if (s.note) h += `<div class="note">${L(s.note)}</div>`;
      h += `<div class="row"><button class="btn" type="button" data-go="${next}">${nextLabel}</button></div>`;
    } else if (tab === 'terms') {
      h += `<p class="hint">${t.termsHint}</p><div class="terms">` + s.terms.map((x, k) => `<button class="term" type="button" data-flip="${k}" aria-expanded="${!!run.flips[k]}"><span class="en">${x.en}</span><span class="fr">${x.fr || ''}</span><span class="ar">${x.ar}</span>${run.flips[k] ? `<div class="back"><p><b>${t.simple}</b> ${L(x.s)}</p>${x.c ? `<p><b>${t.confuse}</b> ${L(x.c)}</p>` : ''}</div>` : ''}</button>`).join('') + `</div><div class="row"><button class="btn" type="button" data-go="${next}">${nextLabel}</button></div>`;
    } else if (tab === 'act') {
      const a = st.act[s.id];
      h += `<div class="act"><h3>${L(s.activity.title)}</h3>${s.activity.intro ? `<p class="hint">${L(s.activity.intro)}</p>` : ''}<div id="actMount"></div>
      ${a && a.done ? `<p class="fb ok">${t.actDone}: ${a.score} / ${a.max}</p>` : ''}</div><div class="row"><button class="btn" type="button" data-go="quiz">${t.toQuiz}</button></div>`;
    } else {
      h += s.qs.map((q, qi) => renderQ(s, q, qi)).join('');
      const quizOk = s.qs.every((q, qi) => run.answered[qi]);
      if (quizOk) {
        const actOk = !s.activity || (st.act[s.id] && st.act[s.id].done);
        if (actOk) { const stars = st.stars[s.id] || starsFor(s); h += `<div class="result"><b>${t.opened}</b><span class="s">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span><div>${cur < S().length - 1 ? t.nextOpen : t.endRoad}</div></div>`; }
        else h += `<div class="note">${t.actPending}</div><div class="row"><button class="btn" type="button" data-go="act">${t.toAct}</button></div>`;
        h += `<div class="row"><button class="btn ghost" type="button" id="backMap">${t.back}</button></div>`;
      }
    }
    sheet.innerHTML = h;
    sheet.querySelector('#closeBtn').addEventListener('click', closeP);
    sheet.querySelectorAll('[role=tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; renderPanel(); }));
    sheet.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.go; renderPanel(); sheet.scrollTop = 0; }));
    sheet.querySelectorAll('[data-flip]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.flip; run.flips[k] = !run.flips[k]; renderPanel(); }));
    const bm = sheet.querySelector('#backMap'); if (bm) bm.addEventListener('click', closeP);
    if (tab === 'act') mountActivity(s);
    bindQ(s);
  }
  function mountActivity(s) {
    const el = $('actMount'); const w = widgets[s.activity.id]; if (!w) { el.textContent = 'widget missing: ' + s.activity.id; return; }
    const ctx = { lang, L, T: T(), state: st.act[s.id] || {}, save: () => { st.act[s.id] = Object.assign(st.act[s.id] || {}, ctx.state); save(); },
      done: (score, max) => { st.act[s.id] = Object.assign(st.act[s.id] || {}, ctx.state, { done: true, score, max }); if (!st.act[s.id].awarded) { st.score += score; st.act[s.id].awarded = true; } maybeComplete(s); save(); renderPanel(); },
      AB: AB[lang] };
    w(el, s.activity, ctx);
  }
  function renderQ(s, q, qi) {
    const t = T(), Lb = AB[lang], done = run.answered[qi], kind = t.kinds[q.k]; let body = '';
    const opts = q.k === 'tf' ? t.tfOpts : L(q.o);
    if (q.k === 'mcq' || q.k === 'tf') {
      body = `<div class="opts">${opts.map((o, oi) => { let cls = 'opt'; if (done) { const correct = q.k === 'tf' ? (oi === (q.a ? 0 : 1)) : oi === q.a; if (correct) cls += ' ok'; else if (run.last && run.last[qi] === oi) cls += ' bad'; } return `<button class="${cls}" type="button" data-q="${qi}" data-o="${oi}" ${done ? 'disabled' : ''}><span class="k">${Lb[oi]}</span><span>${o}</span></button>`; }).join('')}</div>`;
    } else if (q.k === 'multi') {
      const sel = run.sel && run.sel[qi] || [];
      body = `<div class="opts">${opts.map((o, oi) => { let cls = 'opt'; if (sel.includes(oi)) cls += ' sel'; if (done && q.a.includes(oi)) cls = cls.replace('sel', '') + ' ok'; return `<button class="${cls}" type="button" data-q="${qi}" data-m="${oi}" ${done ? 'disabled' : ''}><span class="k">${sel.includes(oi) ? '✓' : '○'}</span><span>${o}</span></button>`; }).join('')}</div>
      <div class="row"><button class="btn" type="button" data-check="${qi}" ${done || sel.length !== q.a.length ? 'disabled' : ''}>${t.check} (${sel.length}/${q.a.length})</button></div>`;
    } else if (q.k === 'order') {
      const seq = run.seq && run.seq[qi] || [];
      body = `<div class="opts ord">${opts.map((o, oi) => { const pos = seq.indexOf(oi); let cls = 'opt'; if (pos >= 0) cls += ' sel'; if (done) cls += ' ok'; return `<button class="${cls}" type="button" data-q="${qi}" data-s="${oi}" ${done ? 'disabled' : ''}><span class="k">${pos >= 0 ? pos + 1 : ''}</span><span>${o}</span></button>`; }).join('')}</div>
      <div class="row"><button class="btn ghost" type="button" data-clear="${qi}" ${done ? 'disabled' : ''}>${t.clear}</button><button class="btn" type="button" data-check="${qi}" ${done || seq.length !== opts.length ? 'disabled' : ''}>${t.check}</button></div>`;
    }
    const fb = run.fb && run.fb[qi] ? `<div class="fb ${run.fb[qi].ok ? 'ok' : 'bad'}">${run.fb[qi].msg}</div>` : '';
    return `<div class="q"><span class="kind">${kind} · ${qi + 1}/${s.qs.length}</span><p class="qt">${L(q.q)}</p>${body}${fb}</div>`;
  }
  function bindQ(s) {
    const sheet = $('sheet');
    sheet.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => { const qi = +b.dataset.q, oi = +b.dataset.o, q = s.qs[qi]; const ok = q.k === 'tf' ? (oi === (q.a ? 0 : 1)) : oi === q.a; run.last = run.last || {}; run.last[qi] = oi; grade(s, qi, ok, q); }));
    sheet.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { const qi = +b.dataset.q, oi = +b.dataset.m; run.sel = run.sel || {}; const a = run.sel[qi] || []; const j = a.indexOf(oi); if (j >= 0) a.splice(j, 1); else a.push(oi); run.sel[qi] = a; renderPanel(); }));
    sheet.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => { const qi = +b.dataset.q, oi = +b.dataset.s; run.seq = run.seq || {}; const a = run.seq[qi] || []; if (!a.includes(oi)) a.push(oi); run.seq[qi] = a; renderPanel(); }));
    sheet.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', () => { const qi = +b.dataset.clear; run.seq = run.seq || {}; run.seq[qi] = []; renderPanel(); }));
    sheet.querySelectorAll('[data-check]').forEach(b => b.addEventListener('click', () => {
      const qi = +b.dataset.check, q = s.qs[qi]; let ok;
      if (q.k === 'multi') { const a = (run.sel[qi] || []).slice().sort((x, y) => x - y), c = q.a.slice().sort((x, y) => x - y); ok = a.length === c.length && a.every((v, i) => v === c[i]); if (!ok) run.sel[qi] = []; }
      else { const a = run.seq[qi] || []; ok = a.length === q.a.length && a.every((v, i) => v === q.a[i]); if (!ok) run.seq[qi] = []; }
      grade(s, qi, ok, q);
    }));
  }
  function grade(s, qi, ok, q) {
    const t = T(); run.tries[qi] = (run.tries[qi] || 0) + 1; run.fb = run.fb || {};
    if (ok) {
      const pts = run.tries[qi] === 1 ? 10 : 5; run.answered[qi] = true; run.fb[qi] = { ok: true, msg: `${t.correct} (+${pts}). ${L(q.w)}` };
      if (!st.done[s.id]) st.score += pts;
      maybeComplete(s); save();
    } else run.fb[qi] = { ok: false, msg: `${t.wrong} ${L(q.w)} ${t.retry}` };
    renderPanel();
    const el = $('sheet').querySelectorAll('.q')[qi]; if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function init(config) {
    cfg = config; KEY = 'course:' + cfg.slug;
    shell(); load(); applyLang(); renderWelcome(); renderSteps();
  }
  return { init, widget: (id, fn) => { widgets[id] = fn; }, L, lang: () => lang, esc: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) };
})();

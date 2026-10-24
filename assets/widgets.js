/* Shared activity widgets — د. سميرة عبدوس */
(function () {
  const esc = Course.esc;
  const W = {
    ar: { pick: 'اضغط عنصرًا ثم اضغط السلة المناسبة.', check: 'تحقق', next: 'الجولة التالية ←', again: 'أعد ما أخطأت فيه', round: 'الجولة', of: 'من', placed: 'موضوعة', result: (c, n) => `أصبت ${c} من ${n}.`, why: 'لماذا؟', remaining: 'عناصر لم توضع بعد', finish: 'إنهاء النشاط', done: 'انتهى النشاط' },
    en: { pick: 'Tap an item, then tap the right bucket.', check: 'Check', next: 'Next round →', again: 'Redo the wrong ones', round: 'Round', of: 'of', placed: 'placed', result: (c, n) => `You got ${c} of ${n}.`, why: 'Why?', remaining: 'items not placed yet', finish: 'Finish activity', done: 'Activity finished' }
  };
  /* Sorter: data.rounds[{title, intro, buckets[{id,t,hint}], items[{t,b,why}]}] */
  Course.widget('sorter', function (el, data, ctx) {
    const L = ctx.L, w = W[ctx.lang]; const S = ctx.state; S.round = S.round || 0; S.total = S.total || 0; S.max = S.max || 0;
    let sel = null, placed = {}, checked = false, locked = {};
    function render() {
      const r = data.rounds[S.round]; if (!r) { el.innerHTML = `<p class="fb ok">${w.done}</p>`; return; }
      const items = r.items, left = items.filter((it, i) => placed[i] === undefined);
      let h = `<p class="hint"><b>${w.round} ${S.round + 1} ${w.of} ${data.rounds.length}:</b> ${L(r.title)}</p>${r.intro ? `<p class="hint">${L(r.intro)}</p>` : ''}<p class="hint">${w.pick}</p>`;
      h += `<div class="chips" id="pool">${items.map((it, i) => placed[i] === undefined ? `<button type="button" class="chip ${sel === i ? 'sel' : ''}" data-i="${i}">${L(it.t)}</button>` : '').join('')}</div>`;
      if (!left.length && !checked) h += ``;
      h += `<div class="buckets">${r.buckets.map(b => `<div class="bucket ${sel !== null ? 'target' : ''}" data-b="${b.id}" role="button" tabindex="0"><h4>${L(b.t)}</h4>${b.hint ? `<div class="hint">${L(b.hint)}</div>` : ''}<div class="items">${items.map((it, i) => placed[i] === b.id ? `<div class="it ${checked ? (it.b === b.id ? 'ok' : 'bad') : ''}"><span>${L(it.t)}</span>${checked ? '' : `<button type="button" class="linkbtn" data-rm="${i}">✕</button>`}</div>` : '').join('')}</div></div>`).join('')}</div>`;
      if (checked) {
        const wrong = items.map((it, i) => ({ it, i })).filter(x => placed[x.i] !== x.it.b);
        const c = items.length - wrong.length;
        h += `<div class="fb ${wrong.length ? 'bad' : 'ok'}">${w.result(c, items.length)}</div>`;
        if (wrong.length) h += `<div class="card" style="margin-top:8px">${wrong.map(x => `<p><b>${L(x.it.t)}</b> → ${L(r.buckets.find(b => b.id === x.it.b).t)}. ${L(x.it.why)}</p>`).join('')}</div>`;
        const last = S.round >= data.rounds.length - 1;
        h += `<div class="row"><button type="button" class="btn" id="nextR">${last ? w.finish : w.next}</button></div>`;
      } else {
        h += `<div class="row"><span class="hint">${left.length} ${w.remaining}</span><button type="button" class="btn" id="checkR" ${left.length ? 'disabled' : ''}>${w.check}</button></div>`;
      }
      el.innerHTML = h;
      el.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { sel = sel === +b.dataset.i ? null : +b.dataset.i; render(); }));
      el.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); delete placed[+b.dataset.rm]; render(); }));
      el.querySelectorAll('[data-b]').forEach(b => { const go = () => { if (sel === null || checked) return; placed[sel] = b.dataset.b; sel = null; render(); }; b.addEventListener('click', go); b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
      const ck = el.querySelector('#checkR'); if (ck) ck.addEventListener('click', () => { checked = true; const c = items.filter((it, i) => placed[i] === it.b).length; S.total += c; S.max += items.length; ctx.save(); render(); });
      const nx = el.querySelector('#nextR'); if (nx) nx.addEventListener('click', () => { if (S.round >= data.rounds.length - 1) { ctx.done(S.total, S.max); } else { S.round++; placed = {}; checked = false; sel = null; ctx.save(); render(); } });
    }
    if (S.done) { el.innerHTML = `<p class="fb ok">${w.done} — ${S.total} / ${S.max}</p>`; return; }
    render();
  });

  /* Ranker: order items (data.items[{t, why}], data.answer = [indices in correct order]) */
  Course.widget('ranker', function (el, data, ctx) {
    const L = ctx.L, w = W[ctx.lang]; let seq = [], checked = false;
    function render() {
      let h = `<p class="hint">${L(data.intro)}</p><div class="opts ord">${data.items.map((it, i) => { const pos = seq.indexOf(i); return `<button type="button" class="opt ${pos >= 0 ? 'sel' : ''} ${checked ? (data.answer[pos] === i ? 'ok' : 'bad') : ''}" data-i="${i}" ${checked ? 'disabled' : ''}><span class="k">${pos >= 0 ? pos + 1 : ''}</span><span>${L(it.t)}</span></button>`; }).join('')}</div>`;
      if (checked) { const c = seq.filter((v, p) => data.answer[p] === v).length; h += `<div class="fb ${c === data.items.length ? 'ok' : 'bad'}">${w.result(c, data.items.length)}</div><div class="card" style="margin-top:8px">${data.answer.map((i, p) => `<p><b>${p + 1}. ${L(data.items[i].t)}</b> — ${L(data.items[i].why)}</p>`).join('')}</div>`; }
      else h += `<div class="row"><button type="button" class="btn ghost" id="clr">${W[ctx.lang === 'ar' ? 'ar' : 'en'] && (ctx.lang === 'ar' ? 'مسح' : 'Clear')}</button><button type="button" class="btn" id="ck" ${seq.length === data.items.length ? '' : 'disabled'}>${w.check}</button></div>`;
      el.innerHTML = h;
      el.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i; if (!seq.includes(i)) seq.push(i); render(); }));
      const c = el.querySelector('#clr'); if (c) c.addEventListener('click', () => { seq = []; render(); });
      const k = el.querySelector('#ck'); if (k) k.addEventListener('click', () => { checked = true; const sc = seq.filter((v, p) => data.answer[p] === v).length; render(); ctx.done(sc, data.items.length); });
    }
    if (ctx.state.done) { el.innerHTML = `<p class="fb ok">${w.done} — ${ctx.state.score} / ${ctx.state.max}</p>`; return; }
    render();
  });

  /* Claims: mark each claim keep/verify (data.claims[{t, bad:boolean, why}]) — "hallucination hunt" */
  Course.widget('claims', function (el, data, ctx) {
    const L = ctx.L, w = W[ctx.lang]; const lab = ctx.lang === 'ar' ? { ok: 'موثوق', bad: 'يحتاج تحققًا', intro: 'اقرأ النص ثم قرر لكل ادعاء: موثوق كما هو، أم يحتاج تحققًا قبل الاعتماد؟' } : { ok: 'Reliable', bad: 'Needs checking', intro: 'Read the text, then decide for each claim: reliable as is, or needs checking before use?' };
    let marks = {}, checked = false;
    function render() {
      let h = `<p class="hint">${lab.intro}</p>${data.text ? `<div class="card" style="margin-bottom:8px;font-size:14px">${L(data.text)}</div>` : ''}<div class="card">${data.claims.map((c, i) => `<div class="claim ${checked ? ((marks[i] === 'bad') === !!c.bad ? 'ok' : 'bad') : ''}"><div class="cb"><button type="button" class="${marks[i] === 'ok' ? 'sel' : ''}" data-i="${i}" data-m="ok" ${checked ? 'disabled' : ''}>${lab.ok}</button><button type="button" class="${marks[i] === 'bad' ? 'sel' : ''}" data-i="${i}" data-m="bad" ${checked ? 'disabled' : ''}>${lab.bad}</button></div><div>${L(c.t)}${checked ? `<div class="hint">${L(c.why)}</div>` : ''}</div></div>`).join('')}</div>`;
      const all = data.claims.every((c, i) => marks[i]);
      if (checked) { const sc = data.claims.filter((c, i) => (marks[i] === 'bad') === !!c.bad).length; h += `<div class="fb ${sc === data.claims.length ? 'ok' : 'bad'}">${w.result(sc, data.claims.length)}</div>`; }
      else h += `<div class="row"><button type="button" class="btn" id="ck" ${all ? '' : 'disabled'}>${w.check}</button></div>`;
      el.innerHTML = h;
      el.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { marks[+b.dataset.i] = b.dataset.m; render(); }));
      const k = el.querySelector('#ck'); if (k) k.addEventListener('click', () => { checked = true; const sc = data.claims.filter((c, i) => (marks[i] === 'bad') === !!c.bad).length; render(); ctx.done(sc, data.claims.length); });
    }
    if (ctx.state.done) { el.innerHTML = `<p class="fb ok">${w.done} — ${ctx.state.score} / ${ctx.state.max}</p>`; return; }
    render();
  });

  /* Scenario: branching decisions. data.scenes[{text, choices[{t, fx:{a,b,c}, why, good:boolean}]}], data.meters[{id,t}] */
  Course.widget('scenario', function (el, data, ctx) {
    const L = ctx.L; const lab = ctx.lang === 'ar' ? { next: 'المشهد التالي ←', finish: 'النتيجة النهائية', score: 'قرارات موفقة', restart: 'إعادة اللعب' } : { next: 'Next scene →', finish: 'Final result', score: 'Sound decisions', restart: 'Play again' };
    let i = 0, meters = {}, chosen = null, good = 0; data.meters.forEach(m => meters[m.id] = m.start ?? 50);
    function clamp(v) { return Math.max(0, Math.min(100, v)); }
    function render() {
      const sc = data.scenes[i];
      let h = `<div class="gauge">${data.meters.map(m => `<div>${L(m.t)}<b>${meters[m.id]}</b></div>`).join('')}</div>`;
      if (!sc) { h += `<div class="result"><b>${lab.finish}</b><div>${lab.score}: ${good} / ${data.scenes.length}</div><div style="margin-top:6px">${L(data.ending(meters, good))}</div></div>`; el.innerHTML = h; return; }
      h += `<div class="scene"><span class="hint">${i + 1} / ${data.scenes.length}</span><p>${L(sc.text)}</p><div class="choices">${sc.choices.map((c, k) => `<button type="button" class="opt choice ${chosen === k ? (c.good ? 'ok' : 'bad') : ''}" data-k="${k}" ${chosen !== null ? 'disabled' : ''}><span class="k">${ctx.AB[k]}</span><span>${L(c.t)}</span></button>`).join('')}</div>
      ${chosen !== null ? `<div class="fb ${sc.choices[chosen].good ? 'ok' : 'bad'}">${L(sc.choices[chosen].why)}</div><div class="row"><button type="button" class="btn" id="nx">${i < data.scenes.length - 1 ? lab.next : lab.finish}</button></div>` : ''}</div>`;
      el.innerHTML = h;
      el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { chosen = +b.dataset.k; const c = sc.choices[chosen]; Object.keys(c.fx || {}).forEach(k => meters[k] = clamp(meters[k] + c.fx[k])); if (c.good) good++; render(); }));
      const nx = el.querySelector('#nx'); if (nx) nx.addEventListener('click', () => { i++; chosen = null; if (i >= data.scenes.length) { render(); ctx.done(good, data.scenes.length); } else render(); });
    }
    if (ctx.state.done) { el.innerHTML = `<p class="fb ok">${lab.finish}: ${ctx.state.score} / ${ctx.state.max}</p>`; return; }
    render();
  });
})();

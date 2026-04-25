// JS injecté côté client dans page.tsx, avant </body>, après génération Claude.
// Placé DANS le document → s'exécute toujours, quel que soit le contexte.

export const PLAI_SCRIPT = `<script>
(function() {
  var cur = 0;
  var score = 0, answered = 0;
  var startTime = Date.now();
  var wrongAnswers = []; // {mod, q, wrong, correct}

  // goTo exposé globalement pour onclick="window.goTo(n)" dans la remédiation
  window.goTo = function(n) {
    var mods = document.querySelectorAll('.module');
    if (!mods.length) return;
    mods[cur].classList.remove('active');
    cur = Math.max(0, Math.min(n, mods.length - 1));
    mods[cur].classList.add('active');
    updateNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function updateNav() {
    var mods = document.querySelectorAll('.module');
    var total = mods.length;
    var prev = document.getElementById('nav-prev');
    var next = document.getElementById('nav-next');
    var count = document.getElementById('nav-count');
    var bar = document.getElementById('progress-bar');
    if (prev) prev.disabled = cur === 0;
    if (next) next.disabled = cur === total - 1;
    if (count) count.textContent = (cur + 1) + ' / ' + total;
    if (bar) bar.style.width = (total > 1 ? Math.round(cur / (total - 1) * 100) : 100) + '%';
  }

  function uid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function handleQuiz(btn) {
    var quiz = btn.closest('.quiz');
    if (!quiz || quiz.dataset.done) return;
    quiz.dataset.done = '1';
    answered++;
    var correct = btn.dataset.correct === 'true';
    quiz.querySelectorAll('[data-correct]').forEach(function(b) { b.disabled = true; });
    var fb = quiz.querySelector('.quiz-fb');
    var exp = quiz.querySelector('.quiz-exp');
    var correctBtn = quiz.querySelector('[data-correct="true"]');
    var qEl = quiz.querySelector('.quiz-q');

    if (correct) {
      score++;
      btn.style.background = '#16A34A'; btn.style.color = '#fff';
      if (fb) { fb.textContent = '\\u2705 Correct !'; fb.style.color = '#16A34A'; fb.style.display = 'block'; }
    } else {
      btn.style.background = '#D94F30'; btn.style.color = '#fff';
      if (correctBtn) { correctBtn.style.background = '#16A34A'; correctBtn.style.color = '#fff'; }
      // Approche socratique — hint fourni par Claude via data-hint
      var hint = quiz.dataset.hint || '';
      if (fb) {
        fb.innerHTML = '\\u274C Pas tout à fait.' +
          (hint ? '<br>\\uD83D\\uDCA1 ' + hint : '') +
          (correctBtn ? '<br><span style="font-size:0.9em;color:#555">Réponse correcte : <strong>' + correctBtn.textContent.trim() + '</strong></span>' : '');
        fb.style.color = '#D94F30'; fb.style.display = 'block';
      }
      wrongAnswers.push({
        mod: cur,
        q: qEl ? qEl.textContent.trim() : '?',
        wrong: btn.textContent.trim(),
        correct: correctBtn ? correctBtn.textContent.trim() : '?'
      });
    }
    if (exp) exp.style.display = 'block';

    var total_q = document.querySelectorAll('.quiz').length;
    if (answered === total_q) {
      var pct = Math.round(score / total_q * 100);
      var el = document.getElementById('score-final');
      if (el) el.textContent = score + '/' + total_q + ' (' + pct + '%)';

      // Feature 2 — Remédiation adaptive si score < 60 %
      if (pct < 60 && wrongAnswers.length) {
        var rem = document.getElementById('remediation');
        if (rem) {
          var modNums = wrongAnswers.map(function(w) { return w.mod; })
            .filter(function(v, i, a) { return a.indexOf(v) === i; });
          rem.innerHTML =
            '<div style="background:#FFF3CD;border:1px solid #FBBF24;border-radius:12px;padding:16px;margin-top:16px">' +
            '<p style="font-weight:600;margin:0 0 10px">\\uD83D\\uDD04 Score inférieur à 60 % — modules à revoir :</p>' +
            '<ul style="margin:0;padding-left:1.2em">' +
            modNums.map(function(n) {
              return '<li style="margin-bottom:8px">' +
                '<button type="button" onclick="window.goTo(' + n + ')" ' +
                'style="background:#D94F30;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.9em">' +
                '\\u2190 Retour au module ' + n + '</button></li>';
            }).join('') +
            '</ul></div>';
          rem.style.display = 'block';
        }
      }
    }
  }

  // Feature 5 — Export résultats enseignant
  var btnResults = document.getElementById('btn-results');
  if (btnResults) btnResults.addEventListener('click', function() {
    var nameEl = document.getElementById('student-name');
    var name = nameEl && nameEl.value.trim() ? nameEl.value.trim() : 'Élève';
    var mins = Math.round((Date.now() - startTime) / 60000);
    var total_q = document.querySelectorAll('.quiz').length;
    var pct = total_q ? Math.round(score / total_q * 100) : 0;
    var out = document.getElementById('results-output');
    if (!out) return;
    var scoreColor = pct >= 60 ? '#16A34A' : '#D94F30';
    var html =
      '<div style="background:#f8f9fa;border:1px solid #ddd;border-radius:12px;padding:20px;margin-top:16px">' +
      '<h3 style="margin:0 0 12px">\\uD83D\\uDCCA Résultats — ' + name + '</h3>' +
      '<table style="border-collapse:collapse;width:100%;margin-bottom:14px">' +
      '<thead><tr>' +
      '<th style="border:1px solid #ddd;padding:8px;background:#f1f3f5;text-align:left">Élève</th>' +
      '<th style="border:1px solid #ddd;padding:8px;background:#f1f3f5;text-align:left">Score</th>' +
      '<th style="border:1px solid #ddd;padding:8px;background:#f1f3f5;text-align:left">Temps</th>' +
      '</tr></thead><tbody><tr>' +
      '<td style="border:1px solid #ddd;padding:8px">' + name + '</td>' +
      '<td style="border:1px solid #ddd;padding:8px;font-weight:600;color:' + scoreColor + '">' + score + '/' + total_q + ' (' + pct + '%)</td>' +
      '<td style="border:1px solid #ddd;padding:8px">' + mins + ' min</td>' +
      '</tr></tbody></table>';
    if (wrongAnswers.length) {
      html += '<p style="font-weight:600;margin:0 0 6px">Points à retravailler :</p><ul style="margin:0;padding-left:1.2em">';
      wrongAnswers.forEach(function(w) {
        html += '<li style="margin-bottom:6px">Q : ' + w.q +
          '<br><span style="color:#D94F30">Répondu : ' + w.wrong + '</span>' +
          ' → <span style="color:#16A34A">Correct : ' + w.correct + '</span></li>';
      });
      html += '</ul>';
    }
    html += '<button onclick="window.print()" style="margin-top:14px;background:#1E1E2E;color:#fff;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;font-size:0.9em">\\uD83D\\uDDA8\\uFE0F Imprimer</button></div>';
    out.innerHTML = html;
    out.style.display = 'block';
  });

  // Feature 1 — Export vers FlashFWB
  var btnFlash = document.getElementById('btn-flash');
  if (btnFlash) btnFlash.addEventListener('click', function() {
    var cards = [];
    var h1 = document.querySelector('h1');
    var titre = h1 ? h1.textContent.trim() : 'Cours PLAI';
    document.querySelectorAll('.quiz').forEach(function(quiz) {
      var qEl = quiz.querySelector('.quiz-q');
      var aEl = quiz.querySelector('[data-correct="true"]');
      if (qEl && aEl) {
        cards.push({
          id: uid(),
          question: qEl.textContent.trim(),
          answer: aEl.textContent.trim(),
          box: 1,
          lastSeen: new Date().toISOString(),
          qImg: null, aImg: null, qAud: null, aAud: null
        });
      }
    });
    if (!cards.length) { alert('Aucune question de quiz trouvée dans ce cours.'); return; }
    var deck = { id: uid(), name: titre, langQ: 'fr', langA: 'fr', tts: '', cards: cards };
    var enc = btoa(unescape(encodeURIComponent(JSON.stringify(deck))));
    window.open('https://flashfwb-cd2m.vercel.app/#share=' + enc, '_blank');
  });

  // ── Init DOM ────────────────────────────────────────────────────────────
  console.log('[PLAI] init — modules:', document.querySelectorAll('.module').length);

  // Navbar arrows
  var prevBtn = document.getElementById('nav-prev');
  var nextBtn = document.getElementById('nav-next');
  if (prevBtn) prevBtn.addEventListener('click', function() { window.goTo(cur - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { window.goTo(cur + 1); });

  // Bouton "Commencer" — 3 stratégies
  var startDone = false;
  document.querySelectorAll('[data-nav="start"], .nav-start, .btn-start').forEach(function(btn) {
    btn.addEventListener('click', function() { window.goTo(1); });
    startDone = true;
  });
  if (!startDone) {
    document.querySelectorAll('.module button').forEach(function(btn) {
      if (/commencer|d\\u00e9marrer|start/i.test(btn.textContent) && !btn.hasAttribute('data-correct')) {
        btn.addEventListener('click', function() { window.goTo(1); });
      }
    });
  }

  // Boutons "Module suivant" — 3 stratégies
  var nextDone = false;
  document.querySelectorAll('[data-nav="next"], .nav-next, .btn-next, .btn-nav').forEach(function(btn) {
    btn.addEventListener('click', function() { window.goTo(cur + 1); });
    nextDone = true;
  });
  if (!nextDone) {
    document.querySelectorAll('.module button').forEach(function(btn) {
      if (/suivant|next/i.test(btn.textContent) && !btn.hasAttribute('data-correct')) {
        btn.addEventListener('click', function() { window.goTo(cur + 1); });
      }
    });
  }

  // Quiz
  document.querySelectorAll('[data-correct]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleQuiz(btn); });
  });

  // Tooltips
  var tt = document.createElement('div');
  tt.style.cssText = 'position:fixed;background:#1E1E2E;color:#fff;padding:8px 12px;border-radius:8px;font-size:13px;max-width:280px;z-index:9999;display:none;pointer-events:none;line-height:1.4';
  document.body.appendChild(tt);
  document.querySelectorAll('.tip[data-tip]').forEach(function(el) {
    el.addEventListener('mouseenter', function(e) {
      tt.textContent = el.dataset.tip; tt.style.display = 'block';
      tt.style.left = Math.min(e.clientX + 12, window.innerWidth - 300) + 'px';
      tt.style.top = (e.clientY - 40) + 'px';
    });
    el.addEventListener('mouseleave', function() { tt.style.display = 'none'; });
    el.addEventListener('click', function(e) {
      tt.textContent = el.dataset.tip;
      tt.style.display = tt.style.display === 'none' ? 'block' : 'none';
      tt.style.left = Math.min(e.clientX + 12, window.innerWidth - 300) + 'px';
      tt.style.top = (e.clientY - 40) + 'px';
    });
  });

  updateNav();
})();
</script>`;

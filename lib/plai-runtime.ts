// JS injecté côté client dans page.tsx, avant </body>, après génération Claude.
// Placé DANS le document → s'exécute toujours, quel que soit le contexte.

export const PLAI_SCRIPT = `<script>
(function() {
  var cur = 0;

  function goTo(n) {
    var mods = document.querySelectorAll('.module');
    if (!mods.length) return;
    mods[cur].classList.remove('active');
    cur = Math.max(0, Math.min(n, mods.length - 1));
    mods[cur].classList.add('active');
    updateNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  var score = 0, answered = 0;

  function handleQuiz(btn) {
    var quiz = btn.closest('.quiz');
    if (!quiz || quiz.dataset.done) return;
    quiz.dataset.done = '1';
    answered++;
    var correct = btn.dataset.correct === 'true';
    quiz.querySelectorAll('[data-correct]').forEach(function(b) { b.disabled = true; });
    var fb = quiz.querySelector('.quiz-fb');
    var exp = quiz.querySelector('.quiz-exp');
    if (correct) {
      score++;
      btn.style.background = '#16A34A'; btn.style.color = '#fff';
      if (fb) { fb.textContent = '✅ Correct !'; fb.style.color = '#16A34A'; fb.style.display = 'block'; }
    } else {
      btn.style.background = '#D94F30'; btn.style.color = '#fff';
      if (fb) { fb.textContent = '❌ Incorrect.'; fb.style.color = '#D94F30'; fb.style.display = 'block'; }
    }
    if (exp) exp.style.display = 'block';
    var total_q = document.querySelectorAll('.quiz').length;
    if (answered === total_q) {
      var pct = Math.round(score / total_q * 100);
      var el = document.getElementById('score-final');
      if (el) el.textContent = score + '/' + total_q + ' (' + pct + '%)';
    }
  }

  // Script avant </body> — DOM complet, appel direct sans DOMContentLoaded
  console.log('[PLAI] init — modules:', document.querySelectorAll('.module').length);

  // Navbar arrows
  var prev = document.getElementById('nav-prev');
  var next = document.getElementById('nav-next');
  if (prev) prev.addEventListener('click', function() { goTo(cur - 1); });
  if (next) next.addEventListener('click', function() { goTo(cur + 1); });

  // Bouton "Commencer" — 3 stratégies
  var startDone = false;
  document.querySelectorAll('[data-nav="start"], .nav-start, .btn-start').forEach(function(btn) {
    btn.addEventListener('click', function() { goTo(1); });
    startDone = true;
  });
  if (!startDone) {
    document.querySelectorAll('.module button').forEach(function(btn) {
      if (/commencer|démarrer|start/i.test(btn.textContent) && !btn.hasAttribute('data-correct')) {
        btn.addEventListener('click', function() { goTo(1); });
      }
    });
  }

  // Boutons "Module suivant" — 3 stratégies
  var nextDone = false;
  document.querySelectorAll('[data-nav="next"], .nav-next, .btn-next, .btn-nav').forEach(function(btn) {
    btn.addEventListener('click', function() { goTo(cur + 1); });
    nextDone = true;
  });
  if (!nextDone) {
    document.querySelectorAll('.module button').forEach(function(btn) {
      if (/suivant|next/i.test(btn.textContent) && !btn.hasAttribute('data-correct')) {
        btn.addEventListener('click', function() { goTo(cur + 1); });
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

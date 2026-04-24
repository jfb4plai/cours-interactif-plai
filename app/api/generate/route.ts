import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
export const runtime = 'nodejs';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Tu es un expert en création de ressources pédagogiques numériques pour la Fédération Wallonie-Bruxelles (FWB).

MISSION : Transformer le contenu de cours fourni par l'enseignant en un fichier HTML UNIQUE, COMPLET et AUTONOME, prêt à être distribué aux élèves du secondaire.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES TECHNIQUES ABSOLUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Le fichier commence OBLIGATOIREMENT par <!DOCTYPE html> et se termine par </html>
• CSS uniquement dans <style> dans le <head> — aucun fichier externe sauf Google Fonts
• ⚠️ NE GÉNÈRE AUCUN JAVASCRIPT — le JS est injecté automatiquement par le système
• Ne mets AUCUN <script> dans le HTML généré
• Compatible Chrome, Firefox, Edge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
:root {
  --bg: #FAF7F2; --white: #fff; --dark: #2C2A28; --muted: #6B7280;
  --red: #D94F30; --blue: #2563EB; --amber: #D97706; --green: #16A34A;
  --red-light: rgba(217,79,48,0.1); --blue-light: rgba(37,99,235,0.1);
  --amber-light: rgba(217,119,6,0.1); --green-light: rgba(22,163,74,0.1);
  --radius: 16px; --shadow: 0 2px 12px rgba(0,0,0,0.08);
}

Google Fonts (@import en début de <style>) :
  'Bricolage Grotesque' pour les titres, 'DM Sans' pour le texte

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE DE NAVIGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CSS OBLIGATOIRE :
  .module { display: none; }
  .module.active { display: flex; flex-direction: column; min-height: 100vh; padding: 80px 24px 40px; }

CLASSES HTML :
• Le PREMIER module : class="module active"
• Tous les autres : class="module"

NAVBAR FIXE (position:fixed; top:0; z-index:100; width:100%) :
  <nav id="navbar">
    <div class="nav-left"><span class="nav-logo">PLAI</span><span class="nav-title">TITRE_ICI</span></div>
    <div class="nav-center">
      <div class="progress-track"><div id="progress-bar"></div></div>
      <span id="nav-count">1 / N</span>
    </div>
    <div class="nav-right">
      <button id="nav-prev" type="button">←</button>
      <button id="nav-next" type="button">→</button>
    </div>
  </nav>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE DES MODULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 0 — Accueil (class="module active")
• Grand titre du cours (h1, rouge, Bricolage Grotesque 3rem)
• Pastille : matière + niveau
• Liste des objectifs avec ✓
• Bouton : <button class="nav-start" type="button">Commencer le cours →</button>

MODULES 1 à N — Contenu (class="module")
Chaque module DOIT contenir :
  1. En-tête : pastille numéro + titre h2
  2. Contenu : explications claires, listes, exemples concrets
  3. Encadré coloré ("À retenir" / "Attention !" / "Exemple")
  4. Quiz interactif (voir spec ci-dessous)
  5. Tooltips sur les termes techniques
  6. Bouton : <button class="nav-next" type="button">Module suivant →</button>

MODULE FINAL — Révision (class="module")
• Récapitulatif visuel (cartes par module)
• Quiz de révision (4-6 questions)
• Score final : <span id="score-final"></span>
• Message animé si score ≥ 60%
• Mention PLAI en bas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUIZ — HTML UNIQUEMENT (pas de JS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  <div class="quiz">
    <p class="quiz-q">Question ici ?</p>
    <div class="quiz-opts">
      <button class="quiz-option" type="button" data-correct="false">Option A</button>
      <button class="quiz-option" type="button" data-correct="true">Option B — bonne réponse</button>
      <button class="quiz-option" type="button" data-correct="false">Option C</button>
    </div>
    <div class="quiz-fb"></div>
    <p class="quiz-exp">Explication de la bonne réponse.</p>
  </div>

  data-correct="true" sur LA bonne réponse, data-correct="false" sur les autres.
  NE PAS mettre de onclick sur les boutons quiz.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOOLTIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  <span class="tip" data-tip="Définition courte">terme</span>
  CSS : .tip { border-bottom: 2px dotted var(--blue); cursor: help; }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE RÉDACTIONNEL FWB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tutoyer les élèves
• Phrases courtes, paragraphes aérés
• Exemples concrets du métier/matière
• Emojis discrets comme repères (💡 ⚠️ ✅ 🔑)
• Ton encourageant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT DE RÉPONSE — CRITIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Commence DIRECTEMENT par <!DOCTYPE html>
• Termine par </html>
• AUCUN texte avant ou après
• AUCUNE balise markdown (\`\`\`html ou \`\`\`)
• HTML complet, riche, avec contenu réel issu du cours fourni`;

const INJECTED_JS = `
<script>
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
    quiz.querySelectorAll('.quiz-option').forEach(function(b) { b.disabled = true; });
    var fb = quiz.querySelector('.quiz-fb');
    var exp = quiz.querySelector('.quiz-exp');
    if (correct) {
      score++;
      btn.style.background = 'var(--green)'; btn.style.color = '#fff';
      if (fb) { fb.textContent = '✅ Correct !'; fb.style.color = 'var(--green)'; fb.style.display = 'block'; }
    } else {
      btn.style.background = 'var(--red)'; btn.style.color = '#fff';
      if (fb) { fb.textContent = '❌ Incorrect.'; fb.style.color = 'var(--red)'; fb.style.display = 'block'; }
    }
    if (exp) exp.style.display = 'block';
    var total_q = document.querySelectorAll('.quiz').length;
    if (answered === total_q) {
      var pct = Math.round(score / total_q * 100);
      var el = document.getElementById('score-final');
      if (el) el.textContent = score + '/' + total_q + ' (' + pct + '%)';
    }
  }

  // Ce script est injecté après </html> : DOMContentLoaded a déjà tiré.
  // init() est appelé directement — readyState vérifié par sécurité.
  function init() {
    var prev = document.getElementById('nav-prev');
    var next = document.getElementById('nav-next');
    if (prev) prev.addEventListener('click', function() { goTo(cur - 1); });
    if (next) next.addEventListener('click', function() { goTo(cur + 1); });
    document.querySelectorAll('.nav-start').forEach(function(btn) {
      btn.addEventListener('click', function() { goTo(1); });
    });
    document.querySelectorAll('.nav-next').forEach(function(btn) {
      btn.addEventListener('click', function() { goTo(cur + 1); });
    });
    document.querySelectorAll('.quiz-option').forEach(function(btn) {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { titre, matiere, niveau, enseignant, objectifs, contenu } = body;

  if (!titre || !contenu) {
    return Response.json(
      { error: 'Le titre et le contenu du cours sont obligatoires.' },
      { status: 400 }
    );
  }

  if (contenu.length < 50) {
    return Response.json(
      { error: 'Le contenu du cours est trop court.' },
      { status: 400 }
    );
  }

  const userMessage = `
COURS À TRANSFORMER EN INTERACTIF :

Titre : ${titre}
Matière : ${matiere || 'Non précisée'}
Niveau : ${niveau || 'Secondaire'}
Enseignant(e) : ${enseignant || 'PLAI'}

Objectifs :
${objectifs || 'À déterminer selon le contenu.'}

━━━━━━━━━━━━━━━━━━━━━━━
CONTENU DU COURS :
━━━━━━━━━━━━━━━━━━━━━━━
${contenu}

Génère maintenant le fichier HTML complet et interactif.
Commence DIRECTEMENT par <!DOCTYPE html> — aucun texte avant.`;

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const response = client.messages.stream({
          model,
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        });

        response.on('text', (text) => {
          controller.enqueue(encoder.encode(text));
        });

        await response.finalMessage();

        // Injection du JS après la réponse Claude (fonctionne même après </html>)
        controller.enqueue(encoder.encode(INJECTED_JS));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        controller.enqueue(encoder.encode(`ERREUR_GENERATION: ${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}

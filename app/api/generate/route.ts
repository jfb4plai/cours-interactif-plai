import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 120;
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
NOMBRE DE MODULES — RÈGLE ABSOLUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tu dois générer EXACTEMENT cette séquence de <div class="module"> :
  • 1 module d'accueil   → class="module active"
  • 4 à 7 modules de contenu → class="module"  (un par grand thème du cours)
  • 1 module de révision → class="module"

TOTAL : minimum 6 <div class="module">, maximum 9.
⛔ Ne génère JAMAIS un cours avec 1 seul module.
⛔ Ne t'arrête PAS avant d'avoir fermé le dernier </div> du module de révision et le </body></html> final.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE DES MODULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 0 — Accueil (class="module active")
• Grand titre du cours (h1, rouge, Bricolage Grotesque 3rem)
• Pastille : matière + niveau
• Liste des objectifs avec ✓
• Bouton : <button data-nav="start" type="button">Commencer le cours →</button>

MODULES 1 à N — Contenu (class="module")
⚠️ CRITIQUE : TOUT LE TEXTE PÉDAGOGIQUE DOIT ÊTRE RÉDIGÉ DANS LE HTML.
Ne laisse AUCUN module vide. AUCUN placeholder. AUCUN commentaire vide.
Tu dois écrire le contenu complet du cours dans chaque module.

Chaque module DOIT contenir (100 à 150 mots max de contenu pédagogique réel) :
  1. En-tête : pastille numéro + titre h2
  2. TEXTE RÉEL : 2 paragraphes <p> + une liste <ul> avec 3 à 4 points concrets
  3. Un encadré court ("À retenir" / "Attention !" / "Exemple") — 1 à 2 phrases
  4. Quiz interactif (voir spec ci-dessous) — 1 seule question par module de contenu
  5. Tooltips sur 2-3 termes techniques clés
  6. Bouton : <button data-nav="next" type="button">Module suivant →</button>

MODULE FINAL — Révision (class="module")
• Récapitulatif visuel (cartes par module, texte réel)
• Quiz de révision (4-6 questions)
• Score final : <span id="score-final"></span>
• Message animé si score ≥ 60%
• Bloc interactif OBLIGATOIRE — copie exactement ce HTML :
  <div class="recap-tools" style="margin-top:28px;border-top:1px solid #eee;padding-top:20px">
    <p style="font-weight:600;margin-bottom:10px">📝 Tes résultats</p>
    <input id="student-name" type="text" placeholder="Ton prénom" style="border:1px solid #ddd;border-radius:8px;padding:8px 14px;font-size:1em;width:200px;margin-right:10px">
    <button id="btn-results" type="button" style="background:#2C2A28;color:#fff;border:none;border-radius:8px;padding:9px 18px;cursor:pointer;font-size:0.9em">📊 Voir mes résultats</button>
    <div id="results-output" style="display:none"></div>
    <div id="remediation" style="display:none"></div>
    <hr style="margin:20px 0;border:none;border-top:1px solid #eee">
    <button id="btn-flash" type="button" style="background:#D94F30;color:#fff;border:none;border-radius:8px;padding:9px 18px;cursor:pointer;font-size:0.9em">📚 Envoyer les questions vers FlashFWB</button>
    <p style="font-size:0.8em;color:#888;margin-top:6px">Toutes les questions du cours seront importées dans FlashFWB pour la révision espacée.</p>
  </div>
• Mention PLAI en bas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUIZ — HTML UNIQUEMENT (pas de JS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  <div class="quiz" data-hint="Question socratique ou indice qui guide sans donner la réponse">
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
  data-hint : formule une question qui fait réfléchir l'élève sans lui donner la réponse.
    Exemples : "Rappelle-toi la définition vue en début de module." /
               "Quelle est la différence entre X et Y ?" /
               "Quel critère dois-tu vérifier en premier ?"
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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { titre, matiere, niveau, enseignant, objectifs, contenu, accessible } = body;

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
Commence DIRECTEMENT par <!DOCTYPE html> — aucun texte avant.${accessible ? `

━━━━━━━━━━━━━━━━━━━━━━━
⚠️ MODE ACCESSIBLE ACTIVÉ
━━━━━━━━━━━━━━━━━━━━━━━
Adapte tout le HTML pour des élèves en difficulté de lecture (dyslexie, TDAH) :
• Police : 'Lexend' (via Google Fonts) à la place de 'DM Sans' — plus lisible pour les dys
• Taille de texte corps : 18px minimum
• Interligne (line-height) : 1.9
• Letter-spacing : 0.03em — espacement légèrement augmenté
• Paragraphes : 1 à 2 phrases MAXIMUM par <p>
• Listes : maximum 3 items par <ul>
• Fond des modules : blanc pur (#fff), contraste maximum
• Boutons : taille 18px, padding généreux, contour visible
• 1 seul quiz par module de contenu (pas plus)
• Phrases : 12 mots maximum par phrase
• Texte aligné à gauche (text-align:left partout — jamais justify)
• Mots complexes : toujours accompagnés d'un tooltip .tip[data-tip]` : ''}`;

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const response = client.messages.stream({
          model,
          max_tokens: 64000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        });

        response.on('text', (text) => {
          controller.enqueue(encoder.encode(text));
        });

        await response.finalMessage();
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

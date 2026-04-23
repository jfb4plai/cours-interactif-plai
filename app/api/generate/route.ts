import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
export const runtime = 'nodejs';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Tu es un expert en création de ressources pédagogiques numériques pour la Fédération Wallonie-Bruxelles (FWB).

MISSION : Transformer le contenu de cours fourni par l'enseignant en un fichier HTML UNIQUE, COMPLET et AUTONOME, prêt à être distribué aux élèves du secondaire. Ce fichier HTML doit être interactif, engageant et pédagogiquement solide.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES TECHNIQUES ABSOLUES — NE PAS DÉROGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Le fichier commence par <!DOCTYPE html> et se termine par </html>
• 100% autonome : CSS et JS inclus dans le fichier — aucun fichier externe sauf Google Fonts
• Fonctionne sans serveur : s'ouvre directement dans un navigateur (double-clic sur le .html)
• Compatible Chrome, Firefox, Edge (navigateurs courants en FWB)
• Responsive : s'adapte aux tablettes iPad courantes dans les établissements
• Taille maximale : générer un cours complet et riche, ne pas tronquer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM — APPLIQUER STRICTEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Variables CSS à déclarer dans :root {
  --bg-main: #FAF7F2;
  --bg-white: #FFFFFF;
  --bg-module-alt: #F0EDE8;
  --text-main: #2C2A28;
  --text-muted: #6B7280;
  --accent-red: #D94F30;
  --accent-blue: #2563EB;
  --accent-amber: #D97706;
  --accent-green: #16A34A;
  --accent-red-light: rgba(217,79,48,0.1);
  --accent-blue-light: rgba(37,99,235,0.1);
  --accent-amber-light: rgba(217,119,6,0.1);
  --accent-green-light: rgba(22,163,74,0.1);
  --shadow: 0 2px 12px rgba(0,0,0,0.08);
  --radius: 16px;
  --radius-sm: 10px;
}

Google Fonts (via @import au début du <style>) :
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
→ Titres et labels : 'Bricolage Grotesque'
→ Corps de texte : 'DM Sans'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE DE LA PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NAVBAR FIXE (position: fixed; top: 0; z-index: 100)
• Gauche : logo "PLAI" en rouge + titre du cours (tronqué si long)
• Centre : barre de progression ("Module X / N") + barre CSS animée
• Droite : boutons ← Précédent / Suivant → (désactivés si premier/dernier module)

SECTION ACCUEIL (#module-0)
• min-height: 100dvh ; display: flex; align-items: center
• Fond : var(--bg-main)
• Contenu centré (max-width: 720px; margin: auto)
• Titre du cours : font-size 3rem, font-weight 800, Bricolage Grotesque, couleur var(--accent-red)
• Sous-titre : matière + niveau + nom de l'enseignant
• Pastille colorée par matière (couleur générée selon la matière)
• Liste des objectifs d'apprentissage avec icône ✓ en vert
• Grand bouton « Commencer le cours → » (var(--accent-red), padding généreux, border-radius: 50px)

MODULES 1 à N (classes .module, id="module-X")
• min-height: 100dvh
• padding-top: 80px (espace pour navbar)
• Alternance fond : var(--bg-main) / var(--bg-white)
• max-width: 800px centré
• Chaque module CONTIENT OBLIGATOIREMENT :
  1. En-tête : numéro de module (pastille rouge) + titre (h2, Bricolage Grotesque)
  2. Introduction : 2-3 phrases contextualisantes
  3. Contenu principal : explications, listes, schémas textuels
  4. UN encadré coloré (À retenir / Attention ! / Bon à savoir / Exemple concret)
  5. UN quiz interactif minimum (voir spécifications quiz ci-dessous)
  6. Tooltips sur les termes techniques (voir spécifications tooltips)

MODULE FINAL (#module-fin)
• Récapitulatif visuel des points essentiels (cartes colorées)
• Quiz de révision globale (minimum 4 questions, une par module vu)
• Compteur de score total (toutes questions confondues)
• Message de félicitations animé si score ≥ 60% (animation CSS keyframes)
• Bouton "Imprimer ce résumé" (window.print())
• Crédits : "Cours généré avec Cours Interactif PLAI — FWB"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPÉCIFICATIONS QUIZ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Structure HTML type :
<div class="quiz" data-quiz-id="q1">
  <p class="quiz-question">Question ici</p>
  <div class="quiz-options">
    <button class="quiz-option" data-correct="false" onclick="checkAnswer(this)">Option A</button>
    <button class="quiz-option" data-correct="true" onclick="checkAnswer(this)">Option B (bonne réponse)</button>
    <button class="quiz-option" data-correct="false" onclick="checkAnswer(this)">Option C</button>
  </div>
  <div class="quiz-feedback" style="display:none"></div>
  <p class="quiz-explanation" style="display:none">Explication de la bonne réponse ici.</p>
</div>

Comportement JS (à implémenter) :
• Clic sur une option → feedback immédiat (vert si correct, rouge si incorrect)
• Afficher l'explication après validation
• Empêcher de changer la réponse une fois validée
• Compteur global de score mis à jour
• Sur mobile : boutons larges, faciles à toucher

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPÉCIFICATIONS TOOLTIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Termes techniques : <span class="tooltip" data-tip="Définition courte">terme</span>
• Style : souligné en pointillés, curseur help
• Au survol desktop : bulle positionnée avec position: fixed (pas de clipping)
• Au clic mobile : même comportement
• Le JS gérant les tooltips doit être inclus et fonctionnel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉLÉMENTS VISUELS INTERACTIFS (choisir selon le contenu)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Accordéons cliquables pour détails supplémentaires
• Flashcards (clic = retourner la carte, recto = terme, verso = définition)
• Schéma de processus animé (étapes qui s'allument en séquence via JS)
• Drag & drop simple (associer un terme à sa définition)
• Liste de vérification interactive (cases à cocher avec feedback)
• Animation CSS de type "conversation" entre deux personnages/éléments
• Comparaison avant/après (deux colonnes avec toggle)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAVIGATION JS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const modules = document.querySelectorAll('.module');
let current = 0;

function showModule(index) {
  modules.forEach((m, i) => m.style.display = i === index ? 'flex' : 'none');
  current = index;
  updateProgress();
  window.scrollTo(0, 0);
}
// Boutons Précédent/Suivant + points de navigation cliquables en bas de chaque module

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE RÉDACTIONNEL — FWB SECONDAIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tutoyer les élèves systématiquement
• Phrases courtes (15 mots max idéalement)
• Paragraphes courts (3-4 lignes max)
• Exemples concrets liés au métier ou à la matière indiquée
• Emojis comme repères visuels (💡 ⚠️ ✅ 🔑 📌) — max 1-2 par section
• Éviter le jargon sans explication immédiate
• Ton encourageant et bienveillant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT — FORMAT DE RÉPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Génère UNIQUEMENT le code HTML.
Commence DIRECTEMENT par <!DOCTYPE html>.
N'écris AUCUN texte avant ou après le code HTML.
N'utilise PAS de balises markdown (pas de \`\`\`html).`;

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
      { error: 'Le contenu du cours est trop court. Collez au minimum quelques paragraphes.' },
      { status: 400 }
    );
  }

  const userMessage = `
COURS À TRANSFORMER EN INTERACTIF :

Titre du cours : ${titre}
Matière : ${matiere || 'Non précisée'}
Niveau : ${niveau || 'Secondaire'}
Enseignant(e) : ${enseignant || 'PLAI'}

Objectifs d'apprentissage :
${objectifs || 'À déterminer selon le contenu ci-dessous.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENU DU COURS À TRANSFORMER :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${contenu}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Génère maintenant le fichier HTML complet et interactif selon toutes les règles définies.
Commence directement par <!DOCTYPE html>.
`;

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const response = client.messages.stream({
          model,
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        });

        response.on('text', (text) => {
          controller.enqueue(encoder.encode(text));
        });

        await response.finalMessage();
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erreur inconnue';
        controller.enqueue(
          encoder.encode(`ERREUR_GENERATION: ${message}`)
        );
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

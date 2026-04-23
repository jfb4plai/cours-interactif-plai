# Mode d'emploi — Cours Interactif PLAI

## C'est quoi ?

Un outil qui transforme vos notes ou votre texte de cours en un fichier interactif pour vos élèves.
Vous collez votre cours. L'IA génère un document HTML avec des quiz, des explications et des activités.
Les élèves ouvrent le fichier dans leur navigateur. Aucune installation. Aucun compte.

---

## Ce qu'il vous faut

- Un compte Anthropic (gratuit pour commencer) et une clé API
- Un accès à votre site Cours Interactif PLAI (lien fourni par votre coordinateur)
- Vos notes de cours (texte, peu importe la source)

---

## Étape 1 — Remplir les infos de base

Quand vous ouvrez le site, vous voyez un formulaire en 3 étapes.

**Étape 1 du formulaire :**
- Titre du cours → tapez le titre exact (ex : "Les outils de coiffure")
- Matière → la section ou le cours (ex : "Coiffure", "Français", "Sciences")
- Niveau → choisissez dans la liste (S3, S4, professionnel…)
- Votre nom → optionnel, il apparaîtra sur la page d'accueil du cours

Cliquez sur **Suivant →**

---

## Étape 2 — Coller votre contenu

**Comment copier votre cours :**

Depuis Word :
1. Ouvrez votre document Word
2. Ctrl+A (sélectionner tout)
3. Ctrl+C (copier)
4. Revenez sur le site et cliquez dans la grande zone de texte
5. Ctrl+V (coller)

Depuis un PDF ouvert dans votre navigateur :
1. Ctrl+A dans le PDF
2. Ctrl+C
3. Ctrl+V dans la zone de texte

Depuis vos notes :
Tapez directement. Plus c'est détaillé, mieux c'est.

**Les objectifs (optionnel) :**
Tapez 2 ou 3 phrases du type "À la fin de ce cours, l'élève sait…"
Ces phrases apparaîtront sur la page d'accueil du cours.

Cliquez sur **Générer le cours →**

---

## Étape 3 — Attendre (30 à 60 secondes)

L'IA travaille. Ne fermez pas la fenêtre.
Vous voyez un compteur qui augmente — c'est le cours qui se construit.

---

## Étape 4 — Télécharger et distribuer

Quand c'est terminé, deux boutons apparaissent :

**⬇ Télécharger le cours (.html)**
Cliquez. Un fichier se télécharge sur votre ordinateur.
Ce fichier s'appelle quelque chose comme "les-outils-de-coiffure-cours-interactif.html"

**👁 Aperçu dans un nouvel onglet**
Cliquez pour voir à quoi ressemble le cours avant de le distribuer.

---

## Distribuer le cours à vos élèves

**Par Teams :**
Joignez le fichier .html à un message Teams comme vous joignez n'importe quel document.
Les élèves cliquent sur le fichier → il s'ouvre dans leur navigateur.

**Par Moodle / ENT :**
Déposez le fichier dans un devoir ou une ressource de cours.

**Par email :**
Joignez le fichier à un email. Attention : certains serveurs bloquent les .html.
Dans ce cas, compressez-le d'abord (clic droit → "Compresser en .zip") avant d'envoyer.

**Par clé USB :**
Copiez le fichier sur une clé. Les élèves l'ouvrent directement depuis la clé.

---

## Ce que voient vos élèves

Le cours s'ouvre dans le navigateur (Chrome, Firefox, Edge).
Il contient :
- Une page d'accueil avec les objectifs
- Des modules de contenu avec des explications
- Des quiz avec correction immédiate
- Des mots-clés avec définition au survol
- Un quiz de révision à la fin avec score

Les élèves naviguent avec les boutons Précédent / Suivant.
Tout fonctionne sans connexion internet une fois le fichier ouvert.

---

## Problèmes fréquents

**Le cours ne se génère pas / erreur :**
→ Vérifiez que la clé API Anthropic est bien configurée sur le site.
→ Contactez votre coordinateur PLAI.

**Le fichier .html ne s'ouvre pas chez l'élève :**
→ L'élève doit faire clic droit sur le fichier → "Ouvrir avec" → choisir Chrome ou Firefox.

**Le cours est trop court / ne couvre pas tout le contenu :**
→ Ajoutez plus de détail dans votre texte de départ.
→ Relancez une génération avec un contenu plus complet.

**Je veux modifier le cours généré :**
→ Ouvrez le fichier .html avec Bloc-notes ou Notepad++ et modifiez le texte directement.
→ Ou relancez une génération avec un contenu corrigé.

---

## Configuration initiale (une seule fois — pour le coordinateur)

1. Créez un compte sur https://console.anthropic.com
2. Dans "API Keys", créez une clé (commence par "sk-ant-")
3. Sur Vercel (votre tableau de bord du site), allez dans Settings → Environment Variables
4. Ajoutez : ANTHROPIC_API_KEY = votre clé
5. Redéployez le site (bouton "Redeploy")

La clé coûte selon l'usage (environ 0,01 € par cours généré avec claude-sonnet).

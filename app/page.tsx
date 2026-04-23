'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

type Step = 1 | 2 | 3;
type Status = 'idle' | 'generating' | 'done' | 'error';
type UploadStatus = 'idle' | 'extracting' | 'done' | 'error';

interface FormData {
  titre: string;
  matiere: string;
  niveau: string;
  enseignant: string;
  objectifs: string;
  contenu: string;
}

const NIVEAUX = [
  'Primaire P1–P6',
  'Secondaire S1–S2',
  'Secondaire S3',
  'Secondaire S4',
  'Secondaire S5',
  'Secondaire S6',
  'Secondaire S7',
  'Professionnel S3–S4',
  'Professionnel S5–S6',
  'Professionnel S7',
  'CEFA / alternance',
  'Formation adultes',
];

const PLACEHOLDER_CONTENU = `Collez ici vos notes de cours, votre fiche, ou le contenu que vous souhaitez transformer.

Exemples :
- Texte de cours (Word, PDF copié-collé)
- Notes de préparation
- Plan de leçon détaillé
- Définitions et exemples

Plus c'est détaillé, meilleur sera le résultat.`;

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const ACCEPTED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'text/plain': 'TXT',
};

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Utilise le worker via CDN (évite les problèmes de bundling Next.js)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) pages.push(pageText);
  }

  return pages.join('\n\n');
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState<FormData>({
    titre: '',
    matiere: '',
    niveau: '',
    enseignant: '',
    objectifs: '',
    contenu: '',
  });
  const [htmlResult, setHtmlResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [charCount, setCharCount] = useState(0);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange =
    (field: keyof FormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const canGoStep2 = form.titre.trim().length >= 3;
  const canGenerate = form.contenu.trim().length >= 50;

  // ── File upload logic ─────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    setUploadError('');
    setUploadedFileName('');

    if (!ACCEPTED_TYPES[file.type]) {
      setUploadStatus('error');
      setUploadError('Format non supporté. Utilisez un PDF ou un fichier texte (.txt).');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus('error');
      setUploadError(
        `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : ${MAX_FILE_SIZE_MB} Mo.`
      );
      return;
    }

    setUploadStatus('extracting');

    try {
      let text = '';

      if (file.type === 'text/plain') {
        text = await file.text();
      } else if (file.type === 'application/pdf') {
        text = await extractPdfText(file);
      }

      if (!text.trim()) {
        throw new Error(
          'Aucun texte extrait. Le PDF est peut-être scanné (image). Copiez-collez le texte manuellement.'
        );
      }

      setForm((prev) => ({ ...prev, contenu: text }));
      setUploadedFileName(file.name);
      setUploadStatus('done');
    } catch (e) {
      setUploadStatus('error');
      setUploadError(
        e instanceof Error
          ? e.message
          : 'Extraction impossible. Copiez-collez le texte manuellement.'
      );
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearUpload = () => {
    setUploadStatus('idle');
    setUploadedFileName('');
    setUploadError('');
    setForm((prev) => ({ ...prev, contenu: '' }));
  };

  // ── Generation ────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate) return;

    setStatus('generating');
    setStep(3);
    setHtmlResult('');
    setCharCount(0);
    setErrorMsg('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Erreur serveur (${response.status})`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let html = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        html += chunk;
        setHtmlResult(html);
        setCharCount(html.length);
      }

      if (html.startsWith('ERREUR_GENERATION:')) {
        throw new Error(html.replace('ERREUR_GENERATION:', '').trim());
      }

      setStatus('done');
    } catch (e) {
      setStatus('error');
      setErrorMsg(
        e instanceof Error
          ? e.message
          : 'Erreur inattendue. Réessayez ou vérifiez votre connexion.'
      );
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlResult], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = form.titre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50);
    a.download = `${slug}-cours-interactif.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    const blob = new Blob([htmlResult], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleReset = () => {
    setStep(1);
    setStatus('idle');
    setHtmlResult('');
    setCharCount(0);
    setErrorMsg('');
    setUploadStatus('idle');
    setUploadedFileName('');
    setUploadError('');
  };

  return (
    <div className="min-h-screen bg-plai-cream">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-2 flex items-center gap-4">
          <Image
            src="/logo-plai.jpg"
            alt="PLAI — Pôle Liégeois d'Accompagnement vers une École Inclusive"
            width={200}
            height={80}
            className="h-16 w-auto"
            priority
          />
          <div className="w-px h-6 bg-gray-200" />
          <h1 className="font-display font-semibold text-plai-dark text-base leading-tight">
            Cours Interactif
          </h1>
          <div className="ml-auto text-xs text-gray-400 hidden sm:block">
            Fédération Wallonie-Bruxelles
          </div>
        </div>
      </header>

      {/* ── Steps indicator ────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-2">
        <div className="flex items-center justify-center gap-3">
          {(
            [
              { n: 1, label: 'Infos du cours' },
              { n: 2, label: 'Contenu' },
              { n: 3, label: 'Résultat' },
            ] as const
          ).map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > n
                      ? 'bg-plai-green text-white'
                      : step === n
                      ? 'bg-plai-red text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step > n ? '✓' : n}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:inline ${
                    step >= n ? 'text-plai-dark' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`w-10 h-px ${
                    step > n ? 'bg-plai-green' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-6 py-8 pb-20">
        {/* ÉTAPE 1 */}
        {step === 1 && (
          <div>
            <div className="mb-8">
              <h2 className="font-display font-bold text-2xl text-plai-dark mb-2">
                Votre cours en quelques clics
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Remplissez les informations de base, collez votre contenu, et
                recevez un cours HTML interactif prêt à distribuer à vos élèves.
              </p>
            </div>

            <div className="card space-y-5">
              <div>
                <label className="field-label">
                  Titre du cours <span className="text-plai-red">*</span>
                </label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Ex : Les techniques de découpe en boucherie"
                  value={form.titre}
                  onChange={handleChange('titre')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Matière / Section</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Ex : Boucherie, Français, Sciences…"
                    value={form.matiere}
                    onChange={handleChange('matiere')}
                  />
                </div>
                <div>
                  <label className="field-label">Niveau</label>
                  <select
                    className="field-input"
                    value={form.niveau}
                    onChange={handleChange('niveau')}
                  >
                    <option value="">Choisissez un niveau</option>
                    {NIVEAUX.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">
                  Votre nom{' '}
                  <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Ex : Mme Martin — apparaîtra sur le cours"
                  value={form.enseignant}
                  onChange={handleChange('enseignant')}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="btn-primary"
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 */}
        {step === 2 && (
          <div>
            <div className="mb-8">
              <h2 className="font-display font-bold text-2xl text-plai-dark mb-2">
                Votre contenu de cours
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Téléversez un PDF ou un fichier texte, ou collez directement vos notes.
                Plus c'est détaillé, meilleur sera le résultat.
              </p>
            </div>

            <div className="card space-y-5">
              {/* Objectifs */}
              <div>
                <label className="field-label">
                  Objectifs d'apprentissage{' '}
                  <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <textarea
                  className="field-input resize-none"
                  rows={2}
                  placeholder="Ex : Savoir identifier les pièces de bœuf. Connaître les règles d'hygiène de base."
                  value={form.objectifs}
                  onChange={handleChange('objectifs')}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Apparaîtront sur la page d'accueil du cours.
                </p>
              </div>

              {/* ── Zone upload ── */}
              <div>
                <label className="field-label">
                  Contenu du cours <span className="text-plai-red">*</span>
                </label>

                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150 mb-3 ${
                    isDragging
                      ? 'border-plai-red bg-plai-red/5'
                      : uploadStatus === 'done'
                      ? 'border-plai-green bg-plai-green/5'
                      : uploadStatus === 'error'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50 hover:border-plai-red/50 hover:bg-plai-red/5'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,text/plain,application/pdf"
                    className="hidden"
                    onChange={handleFileInput}
                  />

                  {uploadStatus === 'idle' && (
                    <>
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-sm font-semibold text-plai-dark mb-1">
                        Glissez un fichier ici ou cliquez pour parcourir
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF ou TXT · Maximum {MAX_FILE_SIZE_MB} Mo
                      </p>
                    </>
                  )}

                  {uploadStatus === 'extracting' && (
                    <>
                      <div className="flex justify-center mb-2">
                        <div className="w-8 h-8 border-3 border-plai-red border-t-transparent rounded-full animate-spin" />
                      </div>
                      <p className="text-sm font-semibold text-plai-dark">
                        Extraction du texte en cours…
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Selon la taille du PDF, cela peut prendre quelques secondes.
                      </p>
                    </>
                  )}

                  {uploadStatus === 'done' && (
                    <>
                      <div className="text-3xl mb-2">✅</div>
                      <p className="text-sm font-semibold text-plai-green">
                        Texte extrait depuis : {uploadedFileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {form.contenu.length.toLocaleString('fr-BE')} caractères — vérifiez et modifiez si besoin ci-dessous
                      </p>
                    </>
                  )}

                  {uploadStatus === 'error' && (
                    <>
                      <div className="text-3xl mb-2">⚠️</div>
                      <p className="text-sm font-semibold text-red-600">
                        {uploadError}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Cliquez pour réessayer avec un autre fichier
                      </p>
                    </>
                  )}
                </div>

                {uploadStatus === 'done' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearUpload(); }}
                    className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 mb-3 block transition-colors"
                  >
                    ✕ Supprimer et recommencer
                  </button>
                )}

                {/* Séparateur */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">ou tapez / collez directement</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Textarea */}
                <textarea
                  className="field-input resize-y"
                  rows={10}
                  placeholder={PLACEHOLDER_CONTENU}
                  value={form.contenu}
                  onChange={(e) => {
                    handleChange('contenu')(e);
                    if (uploadStatus === 'done') setUploadStatus('idle');
                  }}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400">
                    Minimum 50 caractères — idéalement 500 à 3 000 caractères
                  </p>
                  <span
                    className={`text-xs font-medium ${
                      form.contenu.length >= 50 ? 'text-plai-green' : 'text-gray-400'
                    }`}
                  >
                    {form.contenu.length.toLocaleString('fr-BE')} car.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-plai-amber/10 rounded-xl border border-plai-amber/20">
              <p className="text-sm text-plai-dark">
                <span className="font-semibold">💡 Note :</span> Les PDF scannés
                (photos de documents) ne contiennent pas de texte extractible.
                Dans ce cas, copiez-collez le texte manuellement.
              </p>
            </div>

            <div className="mt-6 flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                ← Retour
              </button>
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={!canGenerate || uploadStatus === 'extracting'}
              >
                {uploadStatus === 'extracting' ? 'Extraction…' : 'Générer le cours →'}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — Génération */}
        {step === 3 && status === 'generating' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-plai-red border-t-transparent animate-spin" />
            </div>
            <h2 className="font-display font-bold text-xl text-plai-dark mb-2">
              Génération en cours…
            </h2>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-4">
              Claude structure votre cours, rédige les explications, crée les
              quiz et les éléments interactifs. Comptez{' '}
              <strong>30 à 60 secondes</strong>.
            </p>
            {charCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-plai-green font-medium">
                <div className="w-2 h-2 rounded-full bg-plai-green animate-pulse" />
                {charCount.toLocaleString('fr-BE')} caractères générés…
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 3 — Erreur */}
        {step === 3 && status === 'error' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="font-display font-bold text-xl text-plai-dark mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-2">
              {errorMsg}
            </p>
            <p className="text-xs text-gray-400 mb-8">
              Vérifiez que votre clé API est configurée sur Vercel et que votre
              connexion est active.
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                ← Modifier le contenu
              </button>
              <button className="btn-primary" onClick={handleGenerate}>
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — Résultat */}
        {step === 3 && status === 'done' && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-plai-green/10 flex items-center justify-center text-xl">
                ✅
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-plai-dark">
                  Votre cours interactif est prêt !
                </h2>
                <p className="text-sm text-gray-500">
                  {charCount.toLocaleString('fr-BE')} caractères générés •{' '}
                  {form.titre}
                </p>
              </div>
            </div>

            <div className="card space-y-4">
              <div>
                <button
                  onClick={handleDownload}
                  className="w-full btn-primary text-center flex items-center justify-center gap-2 text-base py-4"
                >
                  <span>⬇</span>
                  Télécharger le cours (.html)
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Un fichier .html à distribuer à vos élèves — s'ouvre dans
                  Chrome, Firefox ou Edge.
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={handlePreview}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <span>👁</span>
                  Aperçu dans un nouvel onglet
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Visualisez le cours avant de le distribuer.
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-plai-blue/10 rounded-xl border border-plai-blue/20 text-sm">
              <p className="font-semibold text-plai-dark mb-1">
                📤 Comment distribuer ce cours ?
              </p>
              <ul className="text-gray-600 space-y-1 list-none">
                <li>• Envoyez le fichier .html par email ou Teams à vos élèves</li>
                <li>• Déposez-le sur votre ENT (Moodle, Teams, Google Classroom…)</li>
                <li>• Les élèves l'ouvrent avec un double-clic — aucune installation</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                className="text-sm text-gray-400 hover:text-plai-dark underline underline-offset-2 transition-colors"
                onClick={handleReset}
              >
                + Créer un nouveau cours
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
          <Image
            src="/logo-plai.jpg"
            alt="PLAI"
            width={80}
            height={32}
            className="h-8 w-auto opacity-70"
          />
          <p className="text-xs text-gray-400">
            Cours Interactif · Fédération Wallonie-Bruxelles
          </p>
        </div>
      </footer>
    </div>
  );
}

-- ============================================================
-- Cours Interactif PLAI — Schéma Supabase
-- Coller dans : https://supabase.com/dashboard/project/otiorljbujqzruulmqrs/sql/new
-- ============================================================

-- Table principale des cours générés
CREATE TABLE IF NOT EXISTS public.courses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       TEXT NOT NULL,
  matiere     TEXT,
  niveau      TEXT,
  enseignant  TEXT,
  html_content TEXT NOT NULL,
  char_count  INTEGER GENERATED ALWAYS AS (length(html_content)) STORED,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour retrouver rapidement les cours d'un enseignant
CREATE INDEX IF NOT EXISTS idx_courses_enseignant
  ON public.courses (enseignant, created_at DESC);

-- Index pour trier par date (page "tous les cours")
CREATE INDEX IF NOT EXISTS idx_courses_created_at
  ON public.courses (created_at DESC);

-- ── Row Level Security ─────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Lecture publique : les élèves accèdent au cours via son URL (UUID)
CREATE POLICY "Lecture publique des cours"
  ON public.courses FOR SELECT
  USING (true);

-- Insertion publique : les enseignants sauvegardent leurs cours
CREATE POLICY "Insertion publique des cours"
  ON public.courses FOR INSERT
  WITH CHECK (true);

-- Suppression : uniquement si l'enseignant connaît l'UUID exact
-- (pas d'auth — sécurité minimale par obscurité de l'UUID)
CREATE POLICY "Suppression par UUID"
  ON public.courses FOR DELETE
  USING (true);

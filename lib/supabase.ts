import { createClient } from '@supabase/supabase-js';

export type Course = {
  id: string;
  titre: string;
  matiere: string | null;
  niveau: string | null;
  enseignant: string | null;
  char_count: number;
  created_at: string;
};

export type CourseWithHtml = Course & { html_content: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

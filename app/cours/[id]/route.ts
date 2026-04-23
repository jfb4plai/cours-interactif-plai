import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('courses')
    .select('html_content, titre')
    .eq('id', id)
    .single();

  if (error || !data) {
    return new Response(
      `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Cours introuvable</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FAF7F2}
      .box{text-align:center;padding:2rem}.title{font-size:2rem;color:#D94F30;margin-bottom:1rem}</style></head>
      <body><div class="box"><div class="title">404</div><p>Ce cours est introuvable ou a été supprimé.</p>
      <a href="/" style="color:#2563EB">← Retour à l'accueil</a></div></body></html>`,
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  return new Response(data.html_content, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

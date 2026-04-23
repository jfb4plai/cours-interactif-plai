'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase, type Course } from '@/lib/supabase';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-BE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSize(chars: number) {
  if (chars < 1000) return `${chars} car.`;
  return `${(chars / 1000).toFixed(0)} k car.`;
}

export default function MesCours() {
  const [filter, setFilter] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCourses = useCallback(async (enseignant: string) => {
    setLoading(true);
    let query = supabase
      .from('courses')
      .select('id, titre, matiere, niveau, enseignant, char_count, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (enseignant.trim()) {
      query = query.ilike('enseignant', `%${enseignant.trim()}%`);
    }

    const { data } = await query;
    setCourses(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCourses('');
  }, [fetchCourses]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCourses(filter), 350);
    return () => clearTimeout(timer);
  }, [filter, fetchCourses]);

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/cours/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Supprimer ce cours définitivement ?')) return;
    setDeletingId(id);
    await supabase.from('courses').delete().eq('id', id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-plai-cream">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-2 flex items-center gap-4">
          <Link href="/">
            <Image
              src="/logo-plai.jpg"
              alt="PLAI"
              width={200}
              height={80}
              className="h-16 w-auto"
              priority
            />
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <h1 className="font-display font-semibold text-plai-dark text-base">
            Mes cours
          </h1>
          <div className="ml-auto">
            <Link href="/" className="btn-secondary text-sm py-2 px-4">
              + Nouveau cours
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 pb-20">
        {/* Filtres */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-plai-dark">
              Tous les cours générés
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading ? '…' : `${courses.length} cours`}
            </p>
          </div>
          <input
            type="text"
            className="field-input w-full sm:w-72"
            placeholder="Filtrer par enseignant…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-plai-red rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-4">📚</div>
            <p className="font-semibold text-plai-dark mb-1">
              {filter ? 'Aucun cours pour ce nom' : 'Aucun cours enregistré'}
            </p>
            <p className="text-sm">
              {filter
                ? 'Vérifiez l'orthographe du nom.'
                : 'Générez votre premier cours depuis l'accueil.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="card flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-plai-dark text-base leading-tight truncate">
                    {course.titre}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {course.matiere && (
                      <span className="text-xs bg-plai-amber/10 text-plai-amber font-medium px-2 py-0.5 rounded-full">
                        {course.matiere}
                      </span>
                    )}
                    {course.niveau && (
                      <span className="text-xs bg-plai-blue/10 text-plai-blue font-medium px-2 py-0.5 rounded-full">
                        {course.niveau}
                      </span>
                    )}
                    {course.enseignant && (
                      <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                        {course.enseignant}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(course.created_at)} · {formatSize(course.char_count)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <a
                    href={`/cours/${course.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm py-2 px-4"
                  >
                    Ouvrir
                  </a>
                  <button
                    onClick={() => copyLink(course.id)}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    {copiedId === course.id ? '✓ Copié !' : '🔗 Lien'}
                  </button>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    disabled={deletingId === course.id}
                    className="text-sm py-2 px-3 text-gray-400 hover:text-red-500 rounded-xl border border-transparent hover:border-red-200 transition-all"
                  >
                    {deletingId === course.id ? '…' : '🗑'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          <Image src="/logo-plai.jpg" alt="PLAI" width={80} height={32} className="h-8 w-auto opacity-70" />
          <p className="text-xs text-gray-400">Cours Interactif · Fédération Wallonie-Bruxelles</p>
        </div>
      </footer>
    </div>
  );
}

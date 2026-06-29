import { allWorks } from 'content-collections';
import { notFound } from 'next/navigation';
import { MDXContent } from '@content-collections/mdx/react';
import Link from 'next/link';
import { DiffView } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view.css';

export function generateStaticParams() {
  return allWorks.map((work) => ({
    slug: work._meta.path,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const work = allWorks.find((w) => w._meta.path === resolvedParams.slug);
  if (!work) return {};

  return {
    title: `${work.title} | Root Cause`,
    description: work.issue,
  };
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const work = allWorks.find((w) => w._meta.path === resolvedParams.slug);

  if (!work) {
    notFound();
  }

  // Sort works by date for prev/next navigation
  const sortedWorks = [...allWorks].sort(
    (a, b) => new Date(a.dateCompleted).getTime() - new Date(b.dateCompleted).getTime()
  );
  const currentIndex = sortedWorks.findIndex((w) => w._meta.path === resolvedParams.slug);
  const prevWork = currentIndex > 0 ? sortedWorks[currentIndex - 1] : null;
  const nextWork = currentIndex < sortedWorks.length - 1 ? sortedWorks[currentIndex + 1] : null;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-paper)]">
      {/* Fixed Header */}
      <header className="flex-none p-6 border-b border-[var(--color-hairline)] flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <Link
              href="/"
              className="inline-block mb-4 text-sm font-sans font-medium text-[var(--color-mist)] hover:text-[var(--color-violet)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-violet)] rounded"
            >
              ← Back to Scene
            </Link>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-sm text-[var(--color-violet)] bg-[var(--color-violet)]/10 px-3 py-1 rounded-full border border-[var(--color-violet)]/20">
                {work.repo}
              </span>
              <a
                href={work.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[var(--color-mist)] hover:text-[var(--color-violet)] transition-colors flex items-center gap-1"
              >
                #{work.prNumber} ↗
              </a>
              <span className="font-mono text-xs text-[var(--color-mist)]/50">
                {work.dateCompleted}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight">{work.title}</h1>
          </div>

          {/* Prev / Next Navigation */}
          <nav className="flex items-center gap-8 text-right">
            {prevWork && (
              <Link
                href={`/work/${prevWork._meta.path}`}
                className="group flex flex-col items-end text-right"
              >
                <span className="font-mono text-[10px] text-[var(--color-mist)] uppercase tracking-widest mb-1">
                  ← Previous
                </span>
                <span className="font-sans text-sm font-medium text-[var(--color-mist)] group-hover:text-[var(--color-violet)] transition-colors">
                  {prevWork.title}
                </span>
              </Link>
            )}
            {nextWork && (
              <Link
                href={`/work/${nextWork._meta.path}`}
                className="group flex flex-col items-start text-left"
              >
                <span className="font-mono text-[10px] text-[var(--color-mist)] uppercase tracking-widest mb-1">
                  Next →
                </span>
                <span className="font-sans text-sm font-medium text-[var(--color-mist)] group-hover:text-[var(--color-violet)] transition-colors">
                  {nextWork.title}
                </span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* 4-Quadrant Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 grid-rows-4 lg:grid-rows-2 gap-4 p-4 min-h-0 overflow-y-auto lg:overflow-hidden">
        
        {/* Quadrant 1: The Issue */}
        <section className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-2 border-rose-500/30 rounded-xl p-6 overflow-y-auto custom-scrollbar flex flex-col shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all hover:shadow-[0_0_25px_rgba(244,63,94,0.25)]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-rose-600 font-bold mb-4 flex-none sticky top-0 bg-[var(--color-paper)]/90 backdrop-blur pb-2 z-10">
            1. The issue
          </h2>
          <p className="text-base leading-relaxed flex-1">{work.issue}</p>
        </section>

        {/* Quadrant 2: Root Cause */}
        <section className="bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 border-2 border-fuchsia-500/30 rounded-xl p-6 overflow-y-auto custom-scrollbar flex flex-col shadow-[0_0_15px_rgba(217,70,239,0.15)] transition-all hover:shadow-[0_0_25px_rgba(217,70,239,0.25)]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-fuchsia-600 font-bold mb-4 flex-none sticky top-0 bg-[var(--color-paper)]/90 backdrop-blur pb-2 z-10">
            2. Root cause
          </h2>
          <p className="text-base leading-relaxed font-medium flex-1">{work.rootCause}</p>
        </section>

        {/* Quadrant 3: The Plan */}
        <section className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-xl p-6 overflow-y-auto custom-scrollbar flex flex-col shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold mb-4 flex-none sticky top-0 bg-[var(--color-paper)]/90 backdrop-blur pb-2 z-10">
            3. The plan
          </h2>
          <p className="text-base leading-relaxed flex-1">{work.plan}</p>
          
          {'impact' in work && work.impact && (
            <div className="mt-8 pt-6 border-t border-[var(--color-hairline)]">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--color-mist)] mb-4">
                Expected Impact
              </h3>
              <p className="text-sm text-[var(--color-mist)] leading-relaxed">{work.impact}</p>
            </div>
          )}
        </section>

        {/* Quadrant 4: The Fix */}
        <section className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-xl p-6 overflow-y-auto custom-scrollbar flex flex-col shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-emerald-600 font-bold mb-4 flex-none sticky top-0 bg-[var(--color-paper)]/90 backdrop-blur pb-2 z-10">
            4. The fix
          </h2>
          <div className="flex-1 space-y-6">
            <p className="text-base leading-relaxed">{work.fix}</p>

            {work.mdx && (
              <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-[var(--color-hairline)]">
                <MDXContent code={work.mdx} />
              </div>
            )}

            {work.diffOld && work.diffNew && (
              <div className="border border-[var(--color-hairline)] rounded-md overflow-hidden bg-black/40">
                <DiffView
                  data={{
                    oldFile: { content: work.diffOld, fileName: 'Before' },
                    newFile: { content: work.diffNew, fileName: 'After' },
                    hunks: [],
                  }}
                />
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

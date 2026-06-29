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

export function generateMetadata({ params }: { params: { slug: string } }) {
  const work = allWorks.find((w) => w._meta.path === params.slug);
  if (!work) return {};

  return {
    title: `${work.title} | Root Cause`,
    description: work.issue,
  };
}

export default function WorkPage({ params }: { params: { slug: string } }) {
  const work = allWorks.find((w) => w._meta.path === params.slug);

  if (!work) {
    notFound();
  }

  // Sort works by date for prev/next navigation
  const sortedWorks = [...allWorks].sort(
    (a, b) => new Date(a.dateCompleted).getTime() - new Date(b.dateCompleted).getTime()
  );
  const currentIndex = sortedWorks.findIndex((w) => w._meta.path === params.slug);
  const prevWork = currentIndex > 0 ? sortedWorks[currentIndex - 1] : null;
  const nextWork = currentIndex < sortedWorks.length - 1 ? sortedWorks[currentIndex + 1] : null;

  return (
    <article className="p-8 max-w-3xl mx-auto pb-24">
      <Link
        href="/"
        className="inline-block mb-8 text-sm font-sans font-medium hover:text-[var(--color-violet)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-violet)] rounded"
      >
        ← Back
      </Link>

      {/* Header with repo chip + PR link */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="font-mono text-sm text-[var(--color-violet)] bg-[var(--color-violet)]/8 px-3 py-1 rounded-full">
            {work.repo}
          </span>
          <span className="font-mono text-xs text-[var(--color-mist)]">
            #{work.prNumber}
          </span>
          <span className="font-mono text-xs text-[var(--color-mist)]">
            {work.dateCompleted}
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight">{work.title}</h1>
      </header>

      <div className="space-y-12">
        {/* The Issue */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-mist)] mb-4">
            The issue
          </h2>
          <p className="text-lg leading-relaxed">{work.issue}</p>
        </section>

        {/* Root Cause — hero section with violet left border */}
        <section className="border-l-[3px] border-[var(--color-violet)] pl-6 py-1">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-violet)] mb-4">
            Root cause
          </h2>
          <p className="text-lg leading-relaxed font-medium">{work.rootCause}</p>
        </section>

        {/* The Plan */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-mist)] mb-4">
            The plan
          </h2>
          <p className="text-lg leading-relaxed">{work.plan}</p>
        </section>

        {/* The Fix */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-mist)] mb-4">
            The fix
          </h2>
          <p className="text-lg leading-relaxed mb-6">{work.fix}</p>

          <div className="prose prose-slate max-w-none">
            <MDXContent code={work.mdx} />
          </div>

          {work.diffOld && work.diffNew && (
            <div className="mt-8 border border-[var(--color-hairline)] rounded-md overflow-hidden">
              <DiffView
                data={{
                  oldFile: { content: work.diffOld, fileName: 'Before' },
                  newFile: { content: work.diffNew, fileName: 'After' },
                  hunks: [],
                }}
              />
            </div>
          )}
        </section>

        {/* The Impact */}
        {'impact' in work && work.impact && (
          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-mist)] mb-4">
              The impact
            </h2>
            <p className="text-lg leading-relaxed">{work.impact}</p>
          </section>
        )}

        {/* View on GitHub */}
        <div className="pt-4">
          <a
            href={work.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-sm text-[var(--color-violet)] hover:text-[var(--color-deep-violet)] transition-colors border border-[var(--color-violet)]/30 hover:border-[var(--color-violet)] px-4 py-2.5 rounded-md"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            View PR #{work.prNumber} on GitHub
          </a>
        </div>

        {/* Prev / Next Navigation */}
        <nav className="flex justify-between items-start pt-8 border-t border-[var(--color-hairline)]">
          {prevWork ? (
            <Link
              href={`/work/${prevWork._meta.path}`}
              className="group text-left max-w-[45%]"
            >
              <span className="font-mono text-xs text-[var(--color-mist)] uppercase tracking-widest block mb-1">
                ← Previous
              </span>
              <span className="font-sans text-sm font-medium group-hover:text-[var(--color-violet)] transition-colors">
                {prevWork.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {nextWork ? (
            <Link
              href={`/work/${nextWork._meta.path}`}
              className="group text-right max-w-[45%]"
            >
              <span className="font-mono text-xs text-[var(--color-mist)] uppercase tracking-widest block mb-1">
                Next →
              </span>
              <span className="font-sans text-sm font-medium group-hover:text-[var(--color-violet)] transition-colors">
                {nextWork.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </div>
    </article>
  );
}

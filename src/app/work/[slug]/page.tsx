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

  return (
    <article className="p-8 max-w-3xl mx-auto pb-24">
      <Link
        href="/"
        className="inline-block mb-8 text-sm font-sans font-medium hover:text-[var(--color-violet)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-violet)] rounded"
      >
        ← Back
      </Link>

      <header className="mb-12">
        <div className="font-mono text-sm text-[var(--color-violet)] mb-4">{work.repo}</div>
        <h1 className="font-display text-4xl font-bold leading-tight">{work.title}</h1>
      </header>

      <div className="space-y-12">
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-mist)] mb-4">
            The issue
          </h2>
          <p className="text-lg leading-relaxed">{work.issue}</p>
        </section>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-mist)] mb-4">
            Root cause
          </h2>
          <p className="text-lg leading-relaxed">{work.rootCause}</p>
        </section>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-mist)] mb-4">
            The plan
          </h2>
          <p className="text-lg leading-relaxed">{work.plan}</p>
        </section>

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
                oldFile={{ content: work.diffOld, fileName: 'Before' }}
                newFile={{ content: work.diffNew, fileName: 'After' }}
              />
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

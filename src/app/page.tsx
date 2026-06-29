import { allWorks } from 'content-collections';
import Link from 'next/link';
import ClientRingField from '@/components/ClientRingField';

export default function Home() {
  const sortedWorks = [...allWorks].sort(
    (a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime(),
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Hero text */}
      <div className="absolute top-1/2 -translate-y-1/2 left-12 z-20 pointer-events-none">
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-ink)] max-w-2xl mb-4 pointer-events-auto">
          I read other people&apos;s stack traces for fun.
        </h1>
        <p className="font-mono text-sm text-[var(--color-mist)] uppercase tracking-widest pointer-events-auto">
          Not just what changed. Why it changed.
        </p>
      </div>

      {/* Accessible fallback link list (visually hidden but focusable) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <Link
          href="/archive"
          className="sr-only focus:not-sr-only bg-[var(--color-ink)] text-[var(--color-paper)] px-4 py-2 rounded font-sans text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-violet)]"
        >
          Skip the 3D showcase → view all contributions
        </Link>
      </div>

      <div className="sr-only">
        <h2>All Contributions</h2>
        <ul>
          {sortedWorks.map((work) => (
            <li key={work._meta.path}>
              <Link href={`/work/${work._meta.path}`}>
                {work.title} - {work.repo}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-10 pointer-events-auto" aria-hidden="true">
        <ClientRingField />
      </div>
    </div>
  );
}

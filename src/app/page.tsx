import { allWorks } from 'content-collections';
import Link from 'next/link';
import ClientRingField from '@/components/ClientRingField';

export default function Home() {
  const sortedWorks = [...allWorks].sort(
    (a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime(),
  );

  const uniqueRepos = new Set(sortedWorks.map((w) => w.repo));

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Hero text — left side */}
      <div className="absolute top-1/2 -translate-y-1/2 left-12 z-20 pointer-events-none max-w-xl">
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-ink)] mb-4 pointer-events-auto leading-[1.05]">
          I read other people&apos;s stack traces for fun.
        </h1>
        <p className="font-mono text-sm text-[var(--color-mist)] uppercase tracking-widest pointer-events-auto mb-6">
          Not just what changed. Why it changed.
        </p>
        <p className="font-sans text-sm text-[var(--color-mist)]/70 pointer-events-auto">
          Click any disk to see the issue, the cause, and the fix.
        </p>
      </div>

      {/* Bottom-left stats row */}
      <div className="absolute bottom-8 left-12 z-20 pointer-events-none">
        <div className="flex items-center gap-6 font-mono text-xs text-[var(--color-mist)] tracking-wider">
          <span>
            <span className="text-[var(--color-ink)] font-medium text-sm">{sortedWorks.length}</span>{' '}
            PRs merged
          </span>
          <span className="text-[var(--color-hairline)]">·</span>
          <span>
            <span className="text-[var(--color-ink)] font-medium text-sm">{uniqueRepos.size}</span>{' '}
            repos touched
          </span>
          <span className="text-[var(--color-hairline)]">·</span>
          <span>
            <span className="text-[var(--color-ink)] font-medium text-sm">21</span>{' '}
            orgs
          </span>
        </div>
      </div>

      {/* Bottom-right scroll hint */}
      <div className="absolute bottom-8 right-12 z-20 pointer-events-none">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-mist)]/50 tracking-wider animate-pulse">
          <span>scroll the stack</span>
          <svg
            width="12"
            height="16"
            viewBox="0 0 12 16"
            fill="none"
            className="opacity-50"
          >
            <path
              d="M6 1L6 15M6 1L2 5M6 1L10 5M6 15L2 11M6 15L10 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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

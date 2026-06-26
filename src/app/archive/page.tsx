import { allWorks } from 'content-collections';
import Link from 'next/link';

export const metadata = {
  title: 'Archive | Root Cause',
  description: 'A complete archive of all open-source contributions.',
};

export default function ArchivePage() {
  const sortedWorks = allWorks.sort(
    (a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime(),
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-4xl font-bold mb-8">Archive</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] text-[var(--color-mist)] text-sm font-medium">
              <th className="pb-4 pr-4">Date</th>
              <th className="pb-4 pr-4">Repository</th>
              <th className="pb-4 pr-4">Title</th>
              <th className="pb-4">Tags</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sortedWorks.map((work) => (
              <tr
                key={work._meta.path}
                className="border-b border-[var(--color-hairline)] last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 pr-4 font-mono text-[var(--color-mist)] whitespace-nowrap">
                  {work.dateCompleted}
                </td>
                <td className="py-4 pr-4 font-mono text-[var(--color-violet)] whitespace-nowrap">
                  {work.repo}
                </td>
                <td className="py-4 pr-4 font-medium">
                  <Link
                    href={`/work/${work._meta.path}`}
                    className="hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-violet)] rounded"
                  >
                    {work.title}
                  </Link>
                </td>
                <td className="py-4">
                  <div className="flex gap-2 flex-wrap">
                    {work.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-[var(--color-mist)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

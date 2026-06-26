import { MetadataRoute } from 'next';
import { allWorks } from 'content-collections';

export default function sitemap(): MetadataRoute.Sitemap {
  const works = allWorks.map((work) => ({
    url: `https://rootcause.dev/work/${work._meta.path}`,
    lastModified: new Date(work.dateCompleted),
  }));

  return [
    {
      url: 'https://rootcause.dev',
      lastModified: new Date(),
    },
    {
      url: 'https://rootcause.dev/archive',
      lastModified: new Date(),
    },
    ...works,
  ];
}

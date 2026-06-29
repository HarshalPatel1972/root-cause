import { defineCollection, defineConfig } from '@content-collections/core';
import { compileMDX } from '@content-collections/mdx';
import { z } from 'zod';

const works = defineCollection({
  name: 'works',
  directory: 'content/work',
  include: '*.mdx',
  schema: z.object({
    title: z.string(),
    repo: z.string(),
    prUrl: z.string().url(),
    prNumber: z.number(),
    dateCompleted: z.string().date(),
    tags: z.array(z.string()),
    issue: z.string(),
    rootCause: z.string(),
    plan: z.string(),
    fix: z.string(),
    diffOld: z.string().optional(),
    diffNew: z.string().optional(),
    diffLanguage: z.string().optional(),
    impact: z.string().optional(),
    content: z.string(),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document);
    return {
      ...document,
      mdx,
    };
  },
});

export default defineConfig({
  content: [works],
});

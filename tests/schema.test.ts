import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const workSchema = z.object({
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
});

describe('Frontmatter Schema Validation', () => {
  it('should validate correct frontmatter', () => {
    const validData = {
      title: 'Fix issue',
      repo: 'user/repo',
      prUrl: 'https://github.com/user/repo/pull/1',
      prNumber: 1,
      dateCompleted: '2024-01-01',
      tags: ['bug'],
      issue: 'issue',
      rootCause: 'cause',
      plan: 'plan',
      fix: 'fix',
    };
    expect(() => workSchema.parse(validData)).not.toThrow();
  });

  it('should fail on invalid URL', () => {
    const invalidData = {
      title: 'Fix issue',
      repo: 'user/repo',
      prUrl: 'not-a-url',
      prNumber: 1,
      dateCompleted: '2024-01-01',
      tags: ['bug'],
      issue: 'issue',
      rootCause: 'cause',
      plan: 'plan',
      fix: 'fix',
    };
    expect(() => workSchema.parse(invalidData)).toThrow();
  });
});

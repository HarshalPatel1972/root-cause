import { test, expect } from '@playwright/test';

test('has title and accessible link list', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Root Cause/);

  const skipLink = page.getByRole('link', { name: /Skip the 3D showcase/i });
  await expect(skipLink).toBeAttached();
});

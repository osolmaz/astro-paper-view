import { expect, test } from '@playwright/test';

test('one live article survives mode changes, reload, keyboard use, and print', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/?view=web');
  await page.getByLabel('Your note').fill('Keep my note');
  await page.getByRole('button', { name: 'Count 0' }).click();
  await page.getByRole('button', { name: 'Paper view', exact: true }).click();
  const reader = page.getByRole('dialog', { name: 'Paper view' });
  await expect(reader).toBeVisible();
  await expect(page.locator('#article-content')).toHaveCount(1);
  await expect(reader.getByLabel('Your note')).toHaveValue('Keep my note');
  await reader.getByRole('button', { name: 'Count 1' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.locator('#paper-zoom-level')).toHaveText('110%');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.paper-viewer__toolbar')).toBeHidden();
  await expect(page.locator('.paper-title')).toBeVisible();
  await expect(page.locator('body > main')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.keyboard.press('Escape');
  await expect(reader).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Paper view', exact: true }),
  ).toBeFocused();
  await expect(page.getByRole('button', { name: 'Count 2' })).toBeVisible();
  await page.reload();
  await expect(reader).toBeHidden();
});

test('desktop default and mobile explicit paper fit the sheet and load local fonts', async ({
  page,
}) => {
  const missing: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) missing.push(response.url());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: 'Paper view', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  const bounds = await page.locator('#paper-sheet').boundingBox();
  expect(bounds?.width).toBeLessThanOrEqual(390);
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  await expect(
    page.getByRole('button', { name: 'Web view', exact: false }),
  ).toBeInViewport();
  await expect(
    page.getByRole('button', { name: 'Print / PDF' }),
  ).toBeInViewport();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(
    await page.evaluate(() =>
      document.fonts.check('14px "Paper Latin Modern"'),
    ),
  ).toBe(true);
  expect(missing).toEqual([]);
});

test('paper prose is left-aligned on desktop, mobile, and print', async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/?view=paper');
    for (const media of ['screen', 'print'] as const) {
      await page.emulateMedia({ media });
      await expect(page.locator('.paper-abstract p')).toHaveCSS(
        'text-align',
        'left',
      );
      await expect(page.locator('.paper-content p').first()).toHaveCSS(
        'text-align',
        'left',
      );
    }
  }
});

test('abstract slots preserve links and escape text expressions', async ({
  page,
}) => {
  await page.goto('/?view=paper');
  const abstract = page.locator('.paper-abstract');
  const link = abstract.getByRole('link', { name: 'experiment', exact: true });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/?view=web#experiment');
  await expect(abstract).toContainText('<em>literal text</em>');
  await expect(abstract.locator('em')).toHaveCount(0);
  await expect(abstract.locator('p')).toHaveCount(1);
  await link.focus();
  await expect(link).toBeFocused();
  await link.click();
  await expect(page).toHaveURL(/\?view=web#experiment$/);
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('an omitted abstract leaves no empty heading', async ({ page }) => {
  await page.goto('/no-abstract?view=paper');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.paper-abstract')).toHaveCount(0);
});

test('without JavaScript the complete article is readable', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4330/?view=paper');
  await expect(page.locator('#article-content')).toBeVisible();
  await expect(page.locator('#paper-viewer')).toBeHidden();
  await context.close();
});

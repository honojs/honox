import { test } from '@playwright/test'

test('test counter', async ({ page }) => {
  await page.goto('/interaction', { waitUntil: 'domcontentloaded' })
  await page.getByText('Count: 5').click()
  await page.getByRole('button', { name: 'Increment' }).click({
    clickCount: 1,
  })
  await page.getByText('Count: 6').click()
})

import { test } from '@playwright/test'

test('test counter', async ({ page }) => {
  await page.goto('/interaction')
  await page.waitForSelector('body[data-client-loaded]')

  await page.getByText('Count: 5').click()
  await page.getByRole('button', { name: 'Increment' }).click({
    clickCount: 1,
  })
  await page.getByText('Count: 6').click()
})

test('children - sync', async ({ page }) => {
  await page.goto('/interaction/children')
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=sync')
  await container.locator('button').click()
  await container.getByText('Count: 1').click()
  await container.getByText('Sync child').click()
})

test('children - async', async ({ page }) => {
  await page.goto('/interaction/children')
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=async')
  await container.locator('button').click()
  await container.getByText('Count: 3').click()
  await container.getByText('Async child').click()
})

test('suspense', async ({ page }) => {
  await page.goto('/interaction/suspense', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('body[data-client-loaded]')
  const container = page.locator('id=suspense')
  await container.locator('button').click()
  await container.getByText('Count: 5').click()
  await container.getByText('Suspense child').click()
})

test('suspense never resolved', async ({ page }) => {
  await page.goto('/interaction/suspense-never', { timeout: 1 }).catch(() => {}) // proceed test as soon as possible
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=suspense-never')
  await container.locator('button').click()
  await container.getByText('Count: 7').click()
  await container.getByText('Loading...').click()
})

test('error-boundary', async ({ page }) => {
  await page.goto('/interaction/error-boundary', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('body[data-client-loaded]')
  const container = page.locator('id=error-boundary-success')
  await container.locator('button').click()
  await container.getByText('Count: 3').click()
  await container.getByText('Suspense child').click()
})

test('error-boundary failure', async ({ page }) => {
  await page.goto('/interaction/error-boundary', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('body[data-client-loaded]')
  const container = page.locator('id=error-boundary-failure')
  await container.locator('button').click()
  await container.getByText('Count: 5').click()
  await container.getByText('Something went wrong').click()
})
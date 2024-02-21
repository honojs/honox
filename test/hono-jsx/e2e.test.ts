import { test, expect } from '@playwright/test'

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
  const div = await container.locator('div')
  expect(await div.innerHTML()).toBe(
    '<h3 id="sync-header">Sync</h3><span data-content="Sync child">Sync child</span>'
  )
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
  const div = await container.locator('div')
  expect(await div.innerHTML()).toBe('<span class="error">Something went wrong</span>')
})

test('sets variables and bindings from wrangler.toml', async ({ page }) => {
  const res = await page.goto('/env', { waitUntil: 'domcontentloaded' })
  expect(res?.ok()).toBe(true)
  const json = await res?.json()
  expect(json).toBeTruthy()
  expect(json.env).toStrictEqual({ DB: expect.any(Object), TEST_VARIABLE: 'TEST_VARIABLE_VALUE' })
})

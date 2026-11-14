import { expect, test } from '@playwright/test'

test('homepage exposes coordinate search and supported FOV options', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('infrared universe')
  await expect(page.getByLabel('Right Ascension (RA)')).toBeVisible()
  await expect(page.getByLabel('Declination (Dec)')).toBeVisible()

  const fov = page.getByLabel('Field of view')
  await expect(fov.locator('option')).toHaveCount(4)
  await expect(fov.locator('option').nth(0)).toHaveText('5 arcmin')
  await expect(fov.locator('option').nth(1)).toHaveText('15 arcmin')
  await expect(fov.locator('option').nth(2)).toHaveText('30 arcmin')
  await expect(fov.locator('option').nth(3)).toHaveText('60 arcmin')
})

test('out-of-range coordinates display errors and disable search', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Right Ascension (RA)').fill('400')
  await page.getByLabel('Declination (Dec)').fill('95')

  await expect(page.getByText('Coordinate is outside the allowed range.')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Search' })).toBeDisabled()
  await expect(page).toHaveURL(/\/$/)
})

test('valid sexagesimal coordinates navigate to the empty DEMO DATA result', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Right Ascension (RA)').fill('10:12:45.3')
  await page.getByLabel('Declination (Dec)').fill('-12:34:56.7')
  await page.getByLabel('Field of view').selectOption('30')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page).toHaveURL(/\/explore\?/)
  const params = new URL(page.url()).searchParams
  expect(params.get('ra')).toBe('153.188750')
  expect(params.get('dec')).toBe('-12.582417')
  expect(params.get('fov')).toBe('30')

  await expect(page.getByRole('heading', { name: 'No observations found' })).toBeVisible()
  await expect(page.getByText('DEMO DATA')).toBeVisible()
})

test('search another position returns to the homepage', async ({ page }) => {
  await page.goto('/explore?ra=153.188750&dec=-12.582417&fov=15')

  await expect(page.getByRole('heading', { name: 'No observations found' })).toBeVisible()
  await page.getByRole('link', { name: 'Search another position' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByLabel('Right Ascension (RA)')).toBeVisible()
})

test('invalid routes display the not-found page', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

test('guided tour moves between its steps', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Take a guided tour' }).click()
  await expect(page.getByRole('heading', { name: 'Search a position' })).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'Explore observations' })).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Search a position' })).toBeVisible()
})


test('homepage has no horizontal overflow at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
  await expect(page.getByLabel('Right Ascension (RA)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
})

test('homepage remains usable at tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/')

  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
  await expect(page.getByLabel('Field of view')).toBeVisible()
})

test('starfield animation respects reduced-motion preferences', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const animationName = await page.locator('.starfield-glow').evaluate((element) =>
    getComputedStyle(element, '::before').animationName,
  )
  expect(animationName).toBe('none')
})

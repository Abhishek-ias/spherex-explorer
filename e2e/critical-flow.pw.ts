import { expect, test } from '@playwright/test'

test('homepage reports the active mock API connection', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('status', { name: 'Mock API' })).toBeVisible()
  await expect(page.getByText('v2.0.0')).toBeVisible()
})

test('preset targets display all five backend-provided records', async ({ page }) => {
  await page.goto('/')

  for (const name of [
    'WISE 0855-0714',
    "Barnard's Star",
    'Epsilon Indi Ba/Bb',
    'RW Aurigae',
    'R Draconis',
  ]) {
    await expect(page.getByRole('button').filter({ hasText: name })).toHaveCount(1)
  }

  await expect(page.getByText('Verified observation fixture available')).toBeVisible()
  await expect(page.getByText('Preset coordinates available · observation export pending')).toHaveCount(4)
})

test('WISE 0855 opens its verified two-frame observation workspace', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /WISE 0855-0714/ }).click()

  await expect(page).toHaveURL(/\/explore\?/)
  await expect(page.getByRole('heading', { name: 'Observation Explorer' })).toBeVisible()
  await expect(page.getByText(/2 observations/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Observation timeline' })).toBeVisible()
  await expect(page.getByText('2 of 2 frames')).toBeVisible()
  await expect(page.getByText('2025W19_1B_0116_2D6').first()).toBeVisible()
  await expect(page.getByText('2025W19_1B_0138_1D6').first()).toBeVisible()
})

test('preset without observation export reports the backend fixture gap', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /Barnard's Star/ }).click()

  await expect(page).toHaveURL(/\/explore\?/)
  await expect(page.getByRole('heading', { name: 'Search failed' })).toBeVisible()
  await expect(page.getByText(/verified observation export for Barnard's Star was not included/i)).toBeVisible()
})

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

  await page.getByRole('button', { name: 'Previous tour step' }).click()
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


test('invalid shared URLs provide coordinate-specific feedback', async ({ page }) => {
  await page.goto('/explore?ra=360&dec=0&fov=15')

  await expect(page.getByRole('alert')).toContainText('invalid coordinates or settings')
  await expect(page.getByRole('alert')).toContainText('less than 360')
  await expect(page.getByRole('link', { name: 'Return to coordinate search' })).toBeVisible()
})


test('coordinate inputs expose keyboard focus and associated validation feedback', async ({ page }) => {
  await page.goto('/')

  const ra = page.getByLabel('Right Ascension (RA)')
  await ra.focus()
  await expect(ra).toBeFocused()
  await ra.fill('400')

  await expect(ra).toHaveAttribute('aria-invalid', 'true')
  await expect(ra).toHaveAttribute('aria-describedby', 'coordinate-search-help ra-error')
  await expect(page.locator('#ra-error')).toHaveText('Coordinate is outside the allowed range.')
  await expect(page.getByRole('button', { name: 'Search' })).toBeDisabled()
})

test('coordinate search can be submitted with the keyboard', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Right Ascension (RA)').fill('153.188750')
  const dec = page.getByLabel('Declination (Dec)')
  await dec.fill('-12.582417')
  await dec.press('Enter')

  await expect(page).toHaveURL(/\/explore\?/)
  await expect(page.getByRole('heading', { name: 'No observations found' })).toBeVisible()
})

test('About page explains data sources and scientific limitations', async ({ page }) => {
  await page.goto('/about')

  await expect(page.getByRole('heading', { name: 'About SPHEREx Explorer' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data sources' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Scientific limitations' })).toBeVisible()
  await expect(page.getByText(/not confirmed discoveries/i)).toBeVisible()
})


test('skip link moves keyboard users to the main content landmark', async ({ page }) => {
  await page.goto('/')
  const skipLink = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skipLink).toBeAttached()
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  await skipLink.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await expect(page.getByRole('main')).toBeVisible()
})

test('coordinate fields announce helper guidance and validation errors', async ({ page }) => {
  await page.goto('/')
  const ra = page.getByLabel('Right Ascension (RA)')
  const dec = page.getByLabel('Declination (Dec)')
  await expect(ra).toHaveAttribute('required', '')
  await expect(dec).toHaveAttribute('required', '')
  await expect(ra).toHaveAttribute('aria-describedby', 'coordinate-search-help')
  await expect(dec).toHaveAttribute('aria-describedby', 'coordinate-search-help')
  await ra.fill('400')
  await expect(ra).toHaveAttribute('aria-describedby', 'coordinate-search-help ra-error')
  await expect(page.locator('#ra-error')).toHaveAttribute('aria-live', 'polite')
})

test('homepage and empty explorer do not overflow at key screen widths', async ({ page }) => {
  for (const width of [320, 375, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const home = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(home.content, `homepage overflow at ${width}px`).toBeLessThanOrEqual(home.viewport)

    await page.goto('/explore?ra=153.188750&dec=-12.582417&fov=15', { waitUntil: 'domcontentloaded' })
    const explorer = await page.evaluate(() => {
      const viewport = window.innerWidth
      const overflowingElements = Array.from(document.body.querySelectorAll('*'))
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            className: typeof element.className === 'string' ? element.className : '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
          }
        })
        .filter((element) =>
          element.right > viewport + 1 ||
          element.left < -1 ||
          element.scrollWidth > element.clientWidth + 1,
        )
        .sort((left, right) =>
          (right.right - viewport) - (left.right - viewport),
        )
        .slice(0, 20)

      return {
        viewport,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        rootScrollWidth: document.getElementById('root')?.scrollWidth ?? 0,
        overflowingElements,
      }
    })
    expect(
      explorer.documentScrollWidth,
      `explorer overflow at ${width}px: ${JSON.stringify(explorer.overflowingElements)}`,
    ).toBeLessThanOrEqual(explorer.viewport)
    await expect(page.getByRole('heading', { name: 'No observations found' })).toBeVisible()
  }
})

test('About page fits narrow and wide screens', async ({ page }) => {
  for (const width of [320, 375, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/about', { waitUntil: 'domcontentloaded' })
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content, `about page overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport)
    await expect(page.getByRole('heading', { name: 'About SPHEREx Explorer' })).toBeVisible()
  }
})

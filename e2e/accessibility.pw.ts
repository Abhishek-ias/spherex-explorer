import { expect, test } from '@playwright/test'

type AxeViolation = {
  id: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null
  help: string
  nodes: Array<{
    target: string[]
    failureSummary?: string
  }>
}

type AxeRunner = {
  run: (
    context: Document,
    options: {
      runOnly: {
        type: 'tag'
        values: string[]
      }
    },
  ) => Promise<{ violations: AxeViolation[] }>
}

const axeScriptUrl =
  'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js'

const routes = [
  { path: '/', name: 'homepage' },
  { path: '/about', name: 'About page' },
  {
    path: '/explore?ra=153.188750&dec=-12.582417&fov=15',
    name: 'empty Explorer page',
  },
]

test('primary routes pass axe WCAG 2.1/2.2 A and AA checks', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route.path)
    await page.evaluate(() => document.fonts.ready)
    await page.addScriptTag({ url: axeScriptUrl })

    const violations = await page.evaluate(async () => {
      const axe = (window as Window & { axe?: AxeRunner }).axe
      if (!axe) throw new Error('axe-core did not load in the browser.')

      const result = await axe.run(document, {
        runOnly: {
          type: 'tag',
          values: [
            'wcag2a',
            'wcag2aa',
            'wcag21a',
            'wcag21aa',
            'wcag22aa',
          ],
        },
      })

      return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          failureSummary: node.failureSummary,
        })),
      }))
    })

    expect(
      violations,
      `axe accessibility violations on the ${route.name}: ${JSON.stringify(violations, null, 2)}`,
    ).toEqual([])
  }
})

import { test, expect } from '@playwright/test'

test.describe('Homepage — page structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page title contains brand name', async ({ page }) => {
    await expect(page).toHaveTitle(/The White Mustang/)
  })

  test('h1 is visible', async ({ page }) => {
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    await expect(h1).not.toBeEmpty()
  })

  test('hero uses the front-left Mustang image', async ({ page }) => {
    await expect(page.getByTestId('hero-image')).toHaveAttribute('src', /mustang-frontleft\.webp/)
    await expect(page.getByTestId('hero-image')).toHaveAttribute('fetchpriority', 'high')
  })

  test('all public landmarks and sections are present', async ({ page }) => {
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.getByTestId('storefront-nav')).toBeVisible()
    await expect(page.getByTestId('section-hero')).toBeVisible()
    await expect(page.getByTestId('section-gallery')).toBeVisible()
    await expect(page.getByTestId('section-calendar')).toBeVisible()
    await expect(page.getByTestId('storefront-footer')).toBeVisible()
  })

  test('slideshow contains the 6 production Mustang images', async ({ page }) => {
    const expectedImages = [
      'mustang-frontleft.webp',
      'mustang-frontright-cab.webp',
      'mustang-backleft-cab.webp',
      'mustang-backright.webp',
      'mustang-interior-side.webp',
      'mustang-interior.webp',
    ]

    await page.getByTestId('section-gallery').scrollIntoViewIfNeeded()
    for (const [index, expectedSrc] of expectedImages.entries()) {
      await expect(page.getByTestId(`gallery-image-${index + 1}`)).toHaveAttribute('src', new RegExp(expectedSrc))
      await expect(page.getByTestId(`gallery-image-${index + 1}`)).toHaveAttribute('loading', 'lazy')
    }
  })

  test('specs panel shows engine stats', async ({ page }) => {
    await page.getByTestId('section-gallery').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('specs-engine-title')).toBeVisible()
    await expect(page.getByTestId('specs-engine-title')).toContainText('5.0 V8')
  })

  test('pricing legend shows all 4 tiers', async ({ page }) => {
    await page.getByTestId('section-calendar').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('pricing-legend')).toBeVisible()
    await expect(page.getByTestId('legend-standard')).toBeVisible()
    await expect(page.getByTestId('legend-weekend')).toBeVisible()
    await expect(page.getByTestId('legend-peak')).toBeVisible()
    await expect(page.getByTestId('legend-wedding')).toBeVisible()
  })

  test('renders crawlable locale and structured-data SEO tags', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'de-CH')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://thewhitemustang.ch')
    await expect(page.locator('link[rel="alternate"][hreflang="en-US"]')).toHaveAttribute('href', 'https://thewhitemustang.ch/en')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://thewhitemustang.ch/images/mustang-frontleft.webp')
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')

    const schemaText = await page.locator('script[type="application/ld+json"]').textContent()
    expect(schemaText).not.toBeNull()
    const schema = JSON.parse(schemaText!)
    expect(schema['@type']).toBe('LocalBusiness')
    expect(schema.image).toBe('https://thewhitemustang.ch/images/mustang-frontleft.webp')
  })
})

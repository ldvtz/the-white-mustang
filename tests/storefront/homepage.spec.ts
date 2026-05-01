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
    await expect(page.getByTestId('hero-image')).toHaveAttribute('src', '/images/mustang-frontleft.png')
  })

  test('all five sections are present', async ({ page }) => {
    await expect(page.getByTestId('storefront-nav')).toBeVisible()
    await expect(page.getByTestId('section-hero')).toBeVisible()
    await expect(page.getByTestId('section-gallery')).toBeVisible()
    await expect(page.getByTestId('section-calendar')).toBeVisible()
    await expect(page.getByTestId('storefront-footer')).toBeVisible()
  })

  test('slideshow contains the 6 production Mustang images', async ({ page }) => {
    const expectedImages = [
      '/images/mustang-frontleft.png',
      '/images/mustang-frontright-cab.png',
      '/images/mustang-backleft-cab.png',
      '/images/mustang-backright.png',
      '/images/mustang-interior-side.jpeg',
      '/images/mustang-interior.jpeg',
    ]

    await page.getByTestId('section-gallery').scrollIntoViewIfNeeded()
    for (const [index, expectedSrc] of expectedImages.entries()) {
      await expect(page.getByTestId(`gallery-image-${index + 1}`)).toHaveAttribute('src', expectedSrc)
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
})

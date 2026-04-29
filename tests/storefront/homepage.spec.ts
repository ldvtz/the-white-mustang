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

  test('all five sections are present', async ({ page }) => {
    await expect(page.getByTestId('storefront-nav')).toBeVisible()
    await expect(page.getByTestId('section-hero')).toBeVisible()
    await expect(page.getByTestId('section-gallery')).toBeVisible()
    await expect(page.getByTestId('section-calendar')).toBeVisible()
    await expect(page.getByTestId('storefront-footer')).toBeVisible()
  })

  test('slideshow contains 4 images with non-empty src', async ({ page }) => {
    await page.getByTestId('section-gallery').scrollIntoViewIfNeeded()
    for (let i = 1; i <= 4; i++) {
      const img = page.getByTestId(`gallery-image-${i}`)
      const src = await img.getAttribute('src')
      expect(src).toBeTruthy()
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

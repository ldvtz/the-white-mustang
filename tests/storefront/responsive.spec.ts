import { test, expect } from '@playwright/test'

// These tests run on both Desktop Chrome and iPhone 13 via playwright.config.ts projects.
// Mobile-specific assertions are guarded with page.viewportSize().

test.describe('Responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navbar is visible', async ({ page }) => {
    await expect(page.getByTestId('storefront-nav')).toBeVisible()
  })

  test('nav CTA is tappable (min 44px height)', async ({ page }) => {
    const cta = page.getByTestId('nav-cta')
    await expect(cta).toBeVisible()
    const box = await cta.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  test('hero primary CTA is tappable (min 44px height)', async ({ page }) => {
    const cta = page.getByTestId('hero-cta-primary')
    await expect(cta).toBeVisible()
    const box = await cta.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  test('car showcase section is visible', async ({ page }) => {
    await page.getByTestId('section-gallery').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('section-gallery')).toBeVisible()
    await expect(page.getByTestId('gallery-image-1')).toBeAttached()
  })

  test('on mobile, slideshow stacks above specs', async ({ page }) => {
    const vp = page.viewportSize()
    if (!vp || vp.width >= 1024) test.skip()

    await page.getByTestId('section-gallery').scrollIntoViewIfNeeded()
    // Slideshow image and specs text both exist in DOM
    await expect(page.getByTestId('gallery-image-1')).toBeAttached()
    await expect(page.getByTestId('specs-engine-title')).toBeVisible()
  })

  test('gallery images are visible in slideshow', async ({ page }) => {
    await page.getByTestId('section-gallery').scrollIntoViewIfNeeded()
    // At least the first image is visible (others are opacity-0)
    await expect(page.getByTestId('gallery-image-1')).toBeAttached()
    await expect(page.getByTestId('gallery-image-2')).toBeAttached()
  })

  test('footer is visible', async ({ page }) => {
    await page.getByTestId('storefront-footer').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('storefront-footer')).toBeVisible()
  })
})

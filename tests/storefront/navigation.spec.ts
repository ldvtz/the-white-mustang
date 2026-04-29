import { test, expect } from '@playwright/test'

test.describe('Navigation — navbar & CTAs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navbar is visible on load', async ({ page }) => {
    await expect(page.getByTestId('storefront-nav')).toBeVisible()
  })

  test('book CTA in navbar is visible and links to #calendar', async ({ page }) => {
    const cta = page.getByTestId('nav-cta')
    await expect(cta).toBeVisible()
    const href = await cta.getAttribute('href')
    expect(href).toBe('#calendar')
  })

  test('hero primary CTA scrolls to calendar section', async ({ page }) => {
    const cta = page.getByTestId('hero-cta-primary')
    await expect(cta).toBeVisible()
    await cta.click()
    // Calendar section should be in viewport after click
    const calSection = page.getByTestId('section-calendar')
    await expect(calSection).toBeInViewport({ ratio: 0.2 })
  })

  test('hero secondary CTA links to gallery/showcase section', async ({ page }) => {
    const cta = page.getByTestId('hero-cta-secondary')
    await expect(cta).toBeVisible()
    const href = await cta.getAttribute('href')
    expect(href).toBe('#gallery')
  })

  test('navbar CTA has minimum touch target height', async ({ page }) => {
    const cta = page.getByTestId('nav-cta')
    const box = await cta.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })
})

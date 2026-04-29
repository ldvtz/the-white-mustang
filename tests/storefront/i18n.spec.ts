import { test, expect } from '@playwright/test'

test.describe('i18n — language switching', () => {
  test('default language is German', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByTestId('nav-cta')
    await expect(cta).toHaveText('Jetzt buchen')
  })

  test('English locale route shows English text', async ({ page }) => {
    // Navigate directly to /en — the EN locale route
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    const cta = page.getByTestId('nav-cta')
    await expect(cta).toHaveText('Book Now')
  })

  test('lang switcher shows both locale options', async ({ page }) => {
    await page.goto('/')
    const langSwitcher = page.getByTestId('lang-switcher')
    await expect(langSwitcher.getByText('DE')).toBeVisible()
    await expect(langSwitcher.getByText('EN')).toBeVisible()
  })

  test('English URL route shows English text', async ({ page }) => {
    await page.goto('/en')
    const cta = page.getByTestId('nav-cta')
    await expect(cta).toHaveText('Book Now')
  })

  test('German default URL has no locale prefix', async ({ page }) => {
    await page.goto('/')
    expect(page.url()).not.toMatch(/\/de\//)
  })
})

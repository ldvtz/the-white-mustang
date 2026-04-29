import { test, expect } from '@playwright/test'

test.describe('Pricing calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Scroll to calendar section so ClientOnly content hydrates
    await page.getByTestId('section-calendar').scrollIntoViewIfNeeded()
  })

  test('pricing calendar section is visible', async ({ page }) => {
    await expect(page.getByTestId('pricing-calendar')).toBeVisible()
  })

  test('FullCalendar grid renders with day cells', async ({ page }) => {
    // Wait for FullCalendar to mount
    const grid = page.locator('.fc-daygrid-body')
    await expect(grid).toBeVisible({ timeout: 10_000 })
    // At least one day cell present
    const dayCells = page.locator('.fc-daygrid-day')
    await expect(dayCells.first()).toBeVisible()
  })

  test('calendar toolbar shows month title', async ({ page }) => {
    const title = page.locator('.fc-toolbar-title')
    await expect(title).toBeVisible({ timeout: 10_000 })
    await expect(title).not.toBeEmpty()
  })

  test('navigating to next month changes the title', async ({ page }) => {
    const title = page.locator('.fc-toolbar-title')
    await expect(title).toBeVisible({ timeout: 10_000 })
    const initialMonth = await title.textContent()

    await page.locator('.fc-next-button').click()
    const nextMonth = await title.textContent()
    expect(nextMonth).not.toBe(initialMonth)
  })

  test('pricing legend shows all four tiers', async ({ page }) => {
    await expect(page.getByTestId('legend-standard')).toBeVisible()
    await expect(page.getByTestId('legend-weekend')).toBeVisible()
    await expect(page.getByTestId('legend-peak')).toBeVisible()
    await expect(page.getByTestId('legend-wedding')).toBeVisible()
  })
})

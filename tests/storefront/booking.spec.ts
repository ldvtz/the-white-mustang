import { expect, test } from '@playwright/test'

function isoDaysFromNow(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

test.describe('Booking request', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('section-calendar').scrollIntoViewIfNeeded()
  })

  test('booking form is visible without payment controls', async ({ page }) => {
    await expect(page.getByTestId('booking-form')).toBeVisible()
    await expect(page.getByTestId('booking-submit')).toBeVisible()
    await expect(page.getByTestId('payment-method')).toHaveCount(0)
  })

  test('date range updates the price estimate', async ({ page }) => {
    await page.getByTestId(`pricing-calendar-day-${isoDaysFromNow(1)}`).click()
    await page.getByTestId(`pricing-calendar-day-${isoDaysFromNow(2)}`).click()

    await expect(page.getByTestId('booking-price-estimate')).toContainText('CHF')
  })

  test('submit shows validation errors before sending', async ({ page }) => {
    await page.getByTestId('booking-submit').scrollIntoViewIfNeeded()
    await page.getByTestId('booking-submit').click()

    await expect(page.getByTestId('booking-date-error')).toBeVisible()
    await expect(page.getByTestId('booking-name-error')).toBeVisible()
  })
})

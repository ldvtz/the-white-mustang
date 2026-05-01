import { expect, test, type APIRequestContext } from '@playwright/test'
import { canCancelBooking } from '../../shared/booking'

function isoDaysFromNow(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const runDateSeed = Math.floor(Math.random() * 10000)

function uniqueFutureRange(workerIndex: number, projectName: string, offset: number) {
  const projectOffset = projectName === 'mobile-safari' ? 500 : 0
  const startOffset = 365 + runDateSeed + projectOffset + workerIndex * 20 + offset
  return {
    startDate: isoDaysFromNow(startOffset),
    endDate: isoDaysFromNow(startOffset + 1),
  }
}

async function createBooking(request: APIRequestContext, workerIndex: number, projectName: string, offset: number) {
  const range = uniqueFutureRange(workerIndex, projectName, offset)
  const response = await request.post('/api/bookings', {
    data: {
      useCase: 'joyride',
      ...range,
      name: 'E2E Reservation',
      email: `e2e-${projectName}-${workerIndex}-${offset}-${Date.now()}@example.com`,
      phone: '+41790000000',
      age: 35,
      locale: 'en',
    },
  })
  expect(response.ok()).toBeTruthy()
  return await response.json() as {
    id: string
    status: string
    managementUrl: string
  }
}

test.describe('Booking request', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('section-calendar').scrollIntoViewIfNeeded()
  })

  test('booking form is visible without payment method controls', async ({ page }) => {
    await expect(page.getByTestId('booking-form')).toBeVisible()
    await expect(page.getByTestId('booking-submit')).toBeVisible()
    await expect(page.getByTestId('payment-method')).not.toBeAttached()
  })

  test('date range updates the price estimate', async ({ page }) => {
    await expect(page.getByTestId('booking-form')).toHaveAttribute('data-ready', 'true')
    await page.waitForFunction(() => {
      const start = document.querySelector('[data-testid="booking-start-date"]') as HTMLInputElement & { _flatpickr?: unknown }
      const end = document.querySelector('[data-testid="booking-end-date"]') as HTMLInputElement & { _flatpickr?: unknown }
      return Boolean(start?._flatpickr && end?._flatpickr)
    })
    await page.getByTestId('booking-start-date').evaluate((input, value) => {
      const picker = (input as HTMLInputElement & { _flatpickr?: { setDate: (date: string, triggerChange: boolean) => void } })._flatpickr
      picker?.setDate(value as string, true)
    }, isoDaysFromNow(45))
    await page.getByTestId('booking-end-date').evaluate((input, value) => {
      const picker = (input as HTMLInputElement & { _flatpickr?: { setDate: (date: string, triggerChange: boolean) => void } })._flatpickr
      picker?.setDate(value as string, true)
    }, isoDaysFromNow(46))

    await expect(page.getByTestId('booking-price-estimate')).toContainText('CHF')
  })

  test('submit shows validation errors before sending', async ({ page }) => {
    await page.getByTestId('booking-submit').scrollIntoViewIfNeeded()
    await page.getByTestId('booking-submit').click()

    await expect(page.getByTestId('booking-date-error')).toBeVisible()
    await expect(page.getByTestId('booking-name-error')).toBeVisible()
  })

  test('booking API creates a reservation with pending status', async ({ request }, testInfo) => {
    const booking = await createBooking(request, testInfo.workerIndex, testInfo.project.name, 1)
    expect(booking.status).toBe('pending')
    expect(booking.managementUrl).toBeTruthy()
  })

  test('booking API creates a same-day booking', async ({ request }, testInfo) => {
    const { startDate } = uniqueFutureRange(testInfo.workerIndex, testInfo.project.name, 9)
    const response = await request.post('/api/bookings', {
      data: {
        useCase: 'joyride',
        startDate,
        endDate: startDate,
        name: 'E2E same-day',
        email: `e2e-same-day-${testInfo.project.name}-${testInfo.workerIndex}-${Date.now()}@example.com`,
        phone: '+41790000000',
        age: 35,
        locale: 'en',
      },
    })

    const body = await response.json()
    expect(response.ok(), JSON.stringify(body)).toBeTruthy()
    expect(body.startDate).toBe(startDate)
    expect(body.endDate).toBe(startDate)
    expect(body.totalPrice).toBeGreaterThan(0)
  })

  test('management link supports comments and cancellation', async ({ request }, testInfo) => {
    const booking = await createBooking(request, testInfo.workerIndex, testInfo.project.name, 7)
    const managePath = new URL(booking.managementUrl).pathname.replace('/booking/manage/', '/api/bookings/manage/')

    const loaded = await request.get(managePath)
    expect(loaded.ok()).toBeTruthy()
    const loadedBody = await loaded.json()
    expect(loadedBody.cancellation.canCancel).toBe(true)

    const comment = await request.post(`${managePath}/comments`, {
      data: { message: 'Please confirm pickup timing.' },
    })
    expect(comment.ok()).toBeTruthy()

    const cancelled = await request.post(`${managePath}/cancel`, {
      data: { note: 'Customer cancellation test.' },
    })
    expect(cancelled.ok()).toBeTruthy()
    const cancelledBody = await cancelled.json()
    expect(cancelledBody.booking.status).toBe('cancelled')
  })

  test('cancellation cutoff blocks bookings inside the configured window', () => {
    expect(canCancelBooking('confirmed', isoDaysFromNow(2), 3)).toBe(false)
    expect(canCancelBooking('confirmed', isoDaysFromNow(3), 3)).toBe(true)
    expect(canCancelBooking('declined', isoDaysFromNow(10), 3)).toBe(false)
  })
})

export type BookingUseCase = 'joyride' | 'wedding'
export type PriceTier = 'standard' | 'weekend' | 'peak' | 'wedding'
export type PaymentMethod = 'twint' | 'bank_transfer' | 'cash'

export type BookingPrice = {
  total: number
  days: number
  tier: PriceTier
}

export type BookingValidationResult =
  | { ok: true }
  | { ok: false; errorKey: string }

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const STANDARD_RATE = 490
const WEEKEND_RATE = 590
const PEAK_RATE = 690
const WEDDING_RATE = 890

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false
  const date = parseIsoDate(value)
  return Boolean(date && toIsoDate(date) === value)
}

export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_RE.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function todayIso(): string {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b)
}

export function addDaysIso(date: string, days: number): string {
  const parsed = parseIsoDate(date)
  if (!parsed) return date
  parsed.setUTCDate(parsed.getUTCDate() + days)
  return toIsoDate(parsed)
}

export function listIsoDateRange(startDate: string, endDate: string): string[] {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  if (!start || !end || compareIsoDates(startDate, endDate) > 0) return []

  const dates: string[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    dates.push(toIsoDate(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

export function getPriceTier(date: string): Exclude<PriceTier, 'wedding'> {
  const parsed = parseIsoDate(date)
  if (!parsed) return 'standard'

  const month = parsed.getUTCMonth() + 1
  const day = parsed.getUTCDay()

  if (month === 7 || month === 8) return 'peak'
  if (day === 0 || day === 5 || day === 6) return 'weekend'
  return 'standard'
}

export function getDailyRate(date: string): number {
  const tier = getPriceTier(date)
  if (tier === 'peak') return PEAK_RATE
  if (tier === 'weekend') return WEEKEND_RATE
  return STANDARD_RATE
}

export function calculateBookingPrice(
  startDate: string,
  endDate: string,
  useCase: BookingUseCase,
): BookingPrice | null {
  const dates = listIsoDateRange(startDate, endDate)
  if (dates.length === 0) return null

  if (useCase === 'wedding') {
    return {
      total: WEDDING_RATE,
      days: dates.length,
      tier: 'wedding',
    }
  }

  const total = dates.reduce((sum, date) => sum + getDailyRate(date), 0)
  const tiers = new Set(dates.map(getPriceTier))

  return {
    total,
    days: dates.length,
    tier: tiers.size === 1 ? [...tiers][0] : 'standard',
  }
}

export function validateBookingDates(
  startDate: string,
  endDate: string,
  unavailableDates: ReadonlySet<string> = new Set(),
): BookingValidationResult {
  if (!startDate || !endDate) return { ok: false, errorKey: 'storefront.booking.errors.datesRequired' }
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return { ok: false, errorKey: 'storefront.booking.errors.invalidDate' }
  if (compareIsoDates(startDate, todayIso()) < 0) return { ok: false, errorKey: 'storefront.booking.errors.pastDate' }
  if (compareIsoDates(endDate, startDate) < 0) return { ok: false, errorKey: 'storefront.booking.errors.dateOrder' }

  const requestedDates = listIsoDateRange(startDate, endDate)
  if (requestedDates.some((date) => unavailableDates.has(date))) {
    return { ok: false, errorKey: 'storefront.booking.errors.unavailable' }
  }

  return { ok: true }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PHONE_CHARS_RE = /^[+\d\s()-]+$/

export function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim()
  if (!PHONE_CHARS_RE.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export function isValidBookingUseCase(value: unknown): value is BookingUseCase {
  return value === 'joyride' || value === 'wedding'
}

export function isValidPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'twint' || value === 'bank_transfer' || value === 'cash'
}

export function canCancelBooking(
  status: string,
  startDate: string,
  cutoffDays: number,
  today: string = todayIso(),
): boolean {
  if (status !== 'pending' && status !== 'awaiting_payment' && status !== 'confirmed') return false
  return compareIsoDates(today, addDaysIso(startDate, -cutoffDays)) <= 0
}

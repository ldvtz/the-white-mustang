export const MAX_REASON_LENGTH = 180

export function parseDateInput(value: unknown, today: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError({ statusCode: 400, message: 'Date must use YYYY-MM-DD format' })
  }
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw createError({ statusCode: 400, message: 'Invalid calendar date' })
  }
  if (value < today) {
    throw createError({ statusCode: 400, message: 'Cannot block dates in the past' })
  }
  return value
}

export function parseReasonInput(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'Reason must be text' })
  }
  const reason = value.trim()
  if (!reason) return null
  if (reason.length > MAX_REASON_LENGTH) {
    throw createError({ statusCode: 400, message: `Reason must be ${MAX_REASON_LENGTH} characters or fewer` })
  }
  return reason
}

export function todayInZurich(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })
}

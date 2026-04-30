import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'

const MAX_REASON_LENGTH = 180
const MAX_RANGE_DAYS = 366

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const body = await readBody<{ startDate: unknown; endDate: unknown; reason?: unknown }>(event)
  const today = todayInZurich()

  const startDate = parseDateInput(body?.startDate, today)
  const endDate = parseDateInput(body?.endDate, today)
  const reason = parseReasonInput(body?.reason)

  if (endDate < startDate) {
    throw createError({ statusCode: 400, message: 'endDate must be on or after startDate' })
  }

  const dates = generateDates(startDate, endDate)

  if (dates.length > MAX_RANGE_DAYS) {
    throw createError({ statusCode: 400, message: `Range cannot exceed ${MAX_RANGE_DAYS} days` })
  }

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { error } = await supabase
    .from('blocked_dates')
    .upsert(
      dates.map((date) => ({ date, reason })),
      { onConflict: 'date', ignoreDuplicates: true },
    )

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { blocked: dates.length }
})

function generateDates(start: string, end: string): string[] {
  const dates: string[] = []
  const current = new Date(start + 'T00:00:00Z')
  const last = new Date(end + 'T00:00:00Z')
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

function parseDateInput(value: unknown, today: string): string {
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

function parseReasonInput(value: unknown): string | null {
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

function todayInZurich(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })
}

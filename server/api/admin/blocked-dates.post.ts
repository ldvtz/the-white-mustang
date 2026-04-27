import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'

const MAX_REASON_LENGTH = 180

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const body = await readBody<{ date: string; reason?: string }>(event)

  const date = parseDateInput(body?.date)
  const reason = parseReasonInput(body?.reason)

  const supabase = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await supabase
    .from('blocked_dates')
    .insert({ date, reason })
    .select('id, date, reason, created_at')
    .single()

  if (error?.code === '23505') {
    throw createError({ statusCode: 409, message: 'Date is already blocked' })
  }

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})

function parseDateInput(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError({ statusCode: 400, message: 'Date must use YYYY-MM-DD format' })
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw createError({ statusCode: 400, message: 'Invalid calendar date' })
  }

  if (value < todayInZurich()) {
    throw createError({ statusCode: 400, message: 'Cannot block dates in the past' })
  }

  return value
}

function parseReasonInput(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'Reason must be text' })
  }

  const reason = value.trim()
  if (!reason) return null

  if (reason.length > MAX_REASON_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `Reason must be ${MAX_REASON_LENGTH} characters or fewer`,
    })
  }

  return reason
}

function todayInZurich(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })
}

import { serverSupabaseAdminClient } from '../../../utils/supabaseAdmin'
import type { Database } from '@@/types/supabase'

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

  const supabase = serverSupabaseAdminClient<Database>(event)

  const { data, error } = await supabase
    .from('blocked_dates')
    .upsert(
      dates.map((date) => ({ date, reason })),
      { onConflict: 'date', ignoreDuplicates: true },
    )
    .select('date')

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { requested: dates.length, blocked: (data ?? []).length }
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

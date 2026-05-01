import { serverSupabaseAdminClient } from '../../utils/supabaseAdmin'
import type { Database } from '@@/types/supabase'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const body = await readBody<{ date: string; reason?: string }>(event)
  const date = parseDateInput(body?.date, todayInZurich())
  const reason = parseReasonInput(body?.reason)

  const supabase = serverSupabaseAdminClient<Database>(event)
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

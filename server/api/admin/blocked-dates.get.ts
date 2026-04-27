import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const supabase = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('id, date, reason, created_at')
    .order('date', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})

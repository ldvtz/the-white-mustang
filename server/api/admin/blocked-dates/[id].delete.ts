import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const supabase = serverSupabaseServiceRole<Database>(event)
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id)

  if (error) throw createError({ statusCode: 500, message: error.message })
  setResponseStatus(event, 204)
  return null
})

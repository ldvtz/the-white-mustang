import { serverSupabaseUser } from '#supabase/server'
import { hasAdminRole } from '@@/shared/adminAuth'
import type { User } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export async function requireAdminUser(event: H3Event): Promise<User> {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  if (!hasAdminRole(user.app_metadata)) {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  return user
}

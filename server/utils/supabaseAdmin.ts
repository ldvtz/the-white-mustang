import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

type SupabaseAdminEventContext<T> = H3Event['context'] & {
  _whiteMustangSupabaseAdmin?: SupabaseClient<T>
}

export function serverSupabaseAdminClient<T>(event: H3Event): SupabaseClient<T> {
  const context = event.context as SupabaseAdminEventContext<T>

  if (context._whiteMustangSupabaseAdmin) {
    return context._whiteMustangSupabaseAdmin
  }

  const config = useRuntimeConfig(event)
  const supabaseConfig = config.supabase as {
    secretKey?: string
    serviceKey?: string
  } | undefined
  const publicSupabaseConfig = config.public.supabase as {
    url?: string
  } | undefined

  const url = publicSupabaseConfig?.url || process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serverKey =
    supabaseConfig?.secretKey
    || supabaseConfig?.serviceKey
    || process.env.NUXT_SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NUXT_SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SERVICE_KEY

  if (!url || !serverKey) {
    console.error('Supabase admin client is not configured', {
      hasRuntimeUrl: Boolean(publicSupabaseConfig?.url),
      hasPublicUrlEnv: Boolean(process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      hasRuntimeSecretKey: Boolean(supabaseConfig?.secretKey),
      hasRuntimeServiceKey: Boolean(supabaseConfig?.serviceKey),
      hasSecretEnv: Boolean(
        process.env.NUXT_SUPABASE_SECRET_KEY
        || process.env.SUPABASE_SECRET_KEY
        || process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      hasLegacyServiceEnv: Boolean(process.env.NUXT_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY),
    })
    throw createError({
      statusCode: 500,
      message: 'Supabase admin client is not configured',
    })
  }

  context._whiteMustangSupabaseAdmin = createClient<T>(url, serverKey, {
    auth: {
      detectSessionInUrl: false,
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return context._whiteMustangSupabaseAdmin
}

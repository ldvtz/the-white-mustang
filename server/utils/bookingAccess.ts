import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import type { Database } from '@@/types/supabase'
import { serverSupabaseAdminClient } from './supabaseAdmin'

export const MANAGEMENT_TOKEN_DAYS = 180

export function createManagementToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashManagementToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function managementTokenExpiry(): string {
  const expiresAt = new Date()
  expiresAt.setUTCDate(expiresAt.getUTCDate() + MANAGEMENT_TOKEN_DAYS)
  return expiresAt.toISOString()
}

export function getManagementUrl(event: H3Event, token: string): string {
  const origin = getRequestURL(event).origin
  return `${origin}/booking/manage/${encodeURIComponent(token)}`
}

export function parseCutoffDays(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return 3
  return parsed
}

export async function getManagedBooking(event: H3Event, token: string) {
  const supabase = serverSupabaseAdminClient<Database>(event)
  const tokenHash = hashManagementToken(token)

  const { data: tokenRow, error: tokenError } = await supabase
    .from('booking_management_tokens')
    .select('booking_id')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (tokenError || !tokenRow) {
    throw createError({ statusCode: 401, message: 'Booking access link is invalid or expired' })
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, customer_id, start_date, end_date, status, payment_method, total_price, deposit_paid, payment_received_at, cancelled_at, cancelled_by, cancellation_note, refund_handling_required, created_at, customers(name, email)')
    .eq('id', tokenRow.booking_id)
    .single()

  if (bookingError || !booking) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  return { supabase, booking }
}

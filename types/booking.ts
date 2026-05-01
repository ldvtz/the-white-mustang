import type { Enums, Tables } from '@@/types/supabase'

export type BookingStatus = Enums<'booking_status'>
export type BlockedDate = Tables<'blocked_dates'>
export type Booking = Tables<'bookings'>
export type Customer = Tables<'customers'>
export type BookingComment = Tables<'booking_comments'>

export type BookingWithCustomer = Booking & {
  customers: Pick<Customer, 'name' | 'email' | 'phone' | 'nationality' | 'age'>
  booking_comments?: Pick<
    BookingComment,
    'id' | 'author_type' | 'message' | 'visible_to_customer' | 'created_at'
  >[]
}

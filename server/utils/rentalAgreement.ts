import type { H3Event } from 'h3'
import type { RentalAgreementData } from './rentalAgreementContent'

export type AgreementBooking = {
  id: string
  start_date: string
  end_date: string
  total_price: number
  locale: string
  customers: { name: string; email: string; phone: string; age: number | null }
}

/**
 * Assembles the full {@link RentalAgreementData} from a booking row and the
 * configured rental-agreement runtime config. Shared by the reservation
 * confirmation email and the admin PDF preview so both render an identical PDF.
 */
export function buildRentalAgreementData(event: H3Event, booking: AgreementBooking): RentalAgreementData {
  const cfg = useRuntimeConfig(event).rentalAgreement

  return {
    bookingId: booking.id,
    customerName: booking.customers.name,
    customerEmail: booking.customers.email,
    customerPhone: booking.customers.phone,
    customerAge: booking.customers.age,
    startDate: booking.start_date,
    endDate: booking.end_date,
    totalPrice: booking.total_price,
    locale: booking.locale,
    companyName: cfg.companyName,
    companyAddress: cfg.companyAddress,
    jurisdiction: cfg.jurisdiction,
    vehiclePlate: cfg.vehiclePlate,
    vehicleVin: cfg.vehicleVin,
    depositChf: Number(cfg.depositChf),
    selfRetentionChf: Number(cfg.selfRetentionChf),
    includedKmPerDay: Number(cfg.includedKmPerDay),
    extraKmChf: Number(cfg.extraKmChf),
    minAge: Number(cfg.minAge),
    minLicenseYears: Number(cfg.minLicenseYears),
  }
}

export function rentalAgreementFilename(booking: Pick<AgreementBooking, 'id' | 'locale'>): string {
  return booking.locale === 'en'
    ? `rental-agreement-${booking.id}.pdf`
    : `mietvereinbarung-${booking.id}.pdf`
}

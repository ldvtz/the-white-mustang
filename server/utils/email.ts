// TODO: Replace stub with Resend when API key is available:
//   import { Resend } from 'resend'
//   const resend = new Resend(process.env.RESEND_API_KEY)
//   await resend.emails.send({ from: 'no-reply@thewhitemustang.ch', to, subject, html })

export async function sendBookingConfirmation(
  to: string,
  name: string,
  startDate: string,
  endDate: string,
  totalPrice: number,
  locale: string,
): Promise<void> {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', { dateStyle: 'medium' }).format(new Date(d))
  const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(totalPrice)

  const subject = locale === 'en'
    ? 'Your booking is confirmed — The White Mustang'
    : 'Ihre Buchung ist bestätigt — The White Mustang'

  const body = locale === 'en'
    ? `Dear ${name},\n\nYour booking from ${fmt(startDate)} to ${fmt(endDate)} (${chf}) has been confirmed.\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nIhre Buchung vom ${fmt(startDate)} bis ${fmt(endDate)} (${chf}) wurde bestätigt.\n\nIhr White Mustang Team`

  // Stub: log to console until Resend is wired up
  console.log('[email stub]', { to, subject, body })
}

export async function sendBookingRequestReceived(
  to: string,
  name: string,
  startDate: string,
  endDate: string,
  totalPrice: number,
  paymentMethod: string,
  managementUrl: string,
  locale: string,
): Promise<void> {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', { dateStyle: 'medium' }).format(new Date(d))
  const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(totalPrice)

  const subject = locale === 'en'
    ? 'Your booking request — The White Mustang'
    : 'Ihre Buchungsanfrage — The White Mustang'

  const body = locale === 'en'
    ? `Dear ${name},\n\nWe received your booking request from ${fmt(startDate)} to ${fmt(endDate)} (${chf}). Payment method: ${paymentMethod}.\n\nManage or cancel your booking here: ${managementUrl}\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nWir haben Ihre Buchungsanfrage vom ${fmt(startDate)} bis ${fmt(endDate)} (${chf}) erhalten. Zahlungsmethode: ${paymentMethod}.\n\nBuchung verwalten oder stornieren: ${managementUrl}\n\nIhr White Mustang Team`

  // Stub: log to console until Resend is wired up
  console.log('[email stub]', { to, subject, body })
}

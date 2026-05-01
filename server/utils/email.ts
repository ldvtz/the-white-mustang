import { Resend } from 'resend'
import nodemailer from 'nodemailer'

async function sendEmail(opts: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const config = useRuntimeConfig()

  if (config.mailTransport === 'smtp') {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: false,
    })
    await transporter.sendMail({ from: config.mailFrom, ...opts })
    return
  }

  const resend = new Resend(config.resendApiKey)
  const { error } = await resend.emails.send({ from: config.mailFrom, ...opts })
  if (error) throw new Error(`Resend error: ${error.message}`)
}

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

  const text = locale === 'en'
    ? `Dear ${name},\n\nYour booking from ${fmt(startDate)} to ${fmt(endDate)} (${chf}) has been confirmed.\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nIhre Buchung vom ${fmt(startDate)} bis ${fmt(endDate)} (${chf}) wurde bestätigt.\n\nIhr White Mustang Team`

  await sendEmail({ to, subject, text, html: `<pre style="font-family:sans-serif">${text}</pre>` })
}

export async function sendBookingRequestReceived(
  to: string,
  name: string,
  startDate: string,
  endDate: string,
  totalPrice: number,
  managementUrl: string,
  locale: string,
): Promise<void> {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', { dateStyle: 'medium' }).format(new Date(d))
  const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(totalPrice)

  const subject = locale === 'en'
    ? 'Your reservation request — The White Mustang'
    : 'Ihre Reservierungsanfrage — The White Mustang'

  const text = locale === 'en'
    ? `Dear ${name},\n\nWe received your reservation request from ${fmt(startDate)} to ${fmt(endDate)} (${chf}). We will be in touch regarding payment once your reservation is confirmed.\n\nManage or cancel your request here: ${managementUrl}\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nWir haben Ihre Reservierungsanfrage vom ${fmt(startDate)} bis ${fmt(endDate)} (${chf}) erhalten. Wir werden uns bezüglich der Zahlung bei Ihnen melden, sobald Ihre Reservierung bestätigt wurde.\n\nAnfrage verwalten oder stornieren: ${managementUrl}\n\nIhr White Mustang Team`

  await sendEmail({ to, subject, text, html: `<pre style="font-family:sans-serif">${text}</pre>` })
}

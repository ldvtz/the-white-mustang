import { Resend } from 'resend'
import nodemailer from 'nodemailer'

type EmailOptions = {
  to: string
  subject: string
  text: string
  html: string
}

const DEFAULT_EMAIL_DELIVERY_TIMEOUT_MS = 5000

function getEmailDeliveryTimeoutMs(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(parsed, 30_000)
    : DEFAULT_EMAIL_DELIVERY_TIMEOUT_MS
}

async function withEmailDeliveryTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Email delivery timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function sendEmail(opts: EmailOptions): Promise<void> {
  const config = useRuntimeConfig()
  const timeoutMs = getEmailDeliveryTimeoutMs(config.emailDeliveryTimeoutMs)

  if (config.mailTransport === 'smtp') {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: false,
      ignoreTLS: true,
      connectionTimeout: timeoutMs,
      greetingTimeout: timeoutMs,
      socketTimeout: timeoutMs,
    })

    try {
      await withEmailDeliveryTimeout(transporter.sendMail({ from: config.mailFrom, ...opts }), timeoutMs)
    } finally {
      transporter.close()
    }
    return
  }

  const resend = new Resend(config.resendApiKey)
  const { error } = await withEmailDeliveryTimeout(
    resend.emails.send({ from: config.mailFrom, ...opts }),
    timeoutMs,
  )
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

export async function sendReservationConfirmation(
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
    ? 'Your reservation is confirmed — The White Mustang'
    : 'Ihre Reservierung ist bestätigt — The White Mustang'

  const text = locale === 'en'
    ? `Dear ${name},\n\nYour reservation from ${fmt(startDate)} to ${fmt(endDate)} (${chf}) has been confirmed. We will contact you separately with the next steps for payment and handover.\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nIhre Reservierung vom ${fmt(startDate)} bis ${fmt(endDate)} (${chf}) wurde bestätigt. Wir melden uns separat mit den nächsten Schritten zu Zahlung und Übergabe.\n\nIhr White Mustang Team`

  await sendEmail({ to, subject, text, html: `<pre style="font-family:sans-serif">${text}</pre>` })
}

export async function sendReservationDeclined(
  to: string,
  name: string,
  startDate: string,
  endDate: string,
  locale: string,
  reason?: string | null,
): Promise<void> {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', { dateStyle: 'medium' }).format(new Date(d))
  const reasonText = reason
    ? (locale === 'en' ? `\n\nReason: ${reason}` : `\n\nGrund: ${reason}`)
    : ''

  const subject = locale === 'en'
    ? 'Your reservation request — The White Mustang'
    : 'Ihre Reservierungsanfrage — The White Mustang'

  const text = locale === 'en'
    ? `Dear ${name},\n\nUnfortunately, we cannot confirm your reservation request from ${fmt(startDate)} to ${fmt(endDate)}.${reasonText}\n\nPlease contact us if you would like to discuss another date.\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nLeider können wir Ihre Reservierungsanfrage vom ${fmt(startDate)} bis ${fmt(endDate)} nicht bestätigen.${reasonText}\n\nKontaktieren Sie uns gerne, wenn Sie einen anderen Zeitraum besprechen möchten.\n\nIhr White Mustang Team`

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

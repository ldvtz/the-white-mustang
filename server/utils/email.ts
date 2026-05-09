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

const chfFormatter = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function emailGreeting(name: string, locale: string): string {
  const safe = escapeHtml(name)
  return locale === 'en' ? `Dear ${safe},` : `Guten Tag ${safe},`
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

function buildEmailHtml(opts: {
  locale: string
  greeting: string
  paragraphs: string[]
  details?: { startDate: string; endDate: string; price?: string }
  ctaButton?: { label: string; url: string }
  reasonBlock?: string
}): string {
  const de = opts.locale !== 'en'
  const closing = de ? 'Ihr White Mustang Team' : 'The White Mustang Team'

  const detailsHtml = opts.details
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="margin:24px 0 8px 0;background-color:#FFFFFF;border:1px solid #E8E8E8;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="40%" style="padding:6px 0;font-size:12px;letter-spacing:1px;
                                       text-transform:uppercase;color:#8E8E93;font-weight:600;">
                  ${de ? 'Von' : 'From'}
                </td>
                <td style="padding:6px 0;font-size:14px;color:#1C1C1E;font-weight:500;">
                  ${opts.details.startDate}
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:12px;letter-spacing:1px;
                           text-transform:uppercase;color:#8E8E93;font-weight:600;">
                  ${de ? 'Bis' : 'Until'}
                </td>
                <td style="padding:6px 0;font-size:14px;color:#1C1C1E;font-weight:500;">
                  ${opts.details.endDate}
                </td>
              </tr>
              ${opts.details.price ? `
              <tr>
                <td style="padding:6px 0;font-size:12px;letter-spacing:1px;
                           text-transform:uppercase;color:#8E8E93;font-weight:600;
                           border-top:1px solid #F0F0F0;">
                  ${de ? 'Betrag' : 'Amount'}
                </td>
                <td style="padding:6px 0;font-size:15px;color:#1C1C1E;font-weight:700;
                           border-top:1px solid #F0F0F0;">
                  ${opts.details.price}
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>`
    : ''

  const reasonHtml = opts.reasonBlock
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="margin:20px 0 8px 0;background-color:#F0F0F0;border-left:3px solid #C8102E;">
        <tr>
          <td style="padding:16px 20px;font-size:14px;line-height:1.6;color:#1C1C1E;">
            <strong style="font-size:11px;letter-spacing:1px;text-transform:uppercase;
                           color:#8E8E93;display:block;margin-bottom:6px;">
              ${de ? 'Grund' : 'Reason'}
            </strong>
            ${opts.reasonBlock}
          </td>
        </tr>
      </table>`
    : ''

  const ctaHtml = opts.ctaButton
    ? `
      <table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px 0;">
        <tr>
          <td align="center" style="background-color:#C8102E;border-radius:2px;">
            <a href="${opts.ctaButton.url}"
               style="display:inline-block;padding:14px 32px;font-size:13px;
                      font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
                      color:#FFFFFF;text-decoration:none;">
              ${opts.ctaButton.label}
            </a>
          </td>
        </tr>
      </table>`
    : ''

  const paragraphsHtml = opts.paragraphs
    .map(p => `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#1C1C1E;">${p}</p>`)
    .join('\n              ')

  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>The White Mustang</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F7F7;font-family:Montserrat,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#F7F7F7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background-color:#FFFFFF;">
          <tr>
            <td align="center" style="background-color:#C8102E;padding:28px 40px;color:#FFFFFF;">
              <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:3px;
                        text-transform:uppercase;color:#FFFFFF;">
                THE WHITE MUSTANG
              </p>
            </td>
          </tr>
          <tr>
            <td height="1" style="background-color:#E8E8E8;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background-color:#F7F7F7;padding:40px 40px 32px 40px;">
              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.5;
                        color:#1C1C1E;font-weight:500;">${opts.greeting}</p>
              ${paragraphsHtml}
              ${detailsHtml}
              ${reasonHtml}
              ${ctaHtml}
              <p style="margin:32px 0 0 0;font-size:14px;line-height:1.6;color:#1C1C1E;">
                ${de ? 'Mit freundlichen Grüssen,' : 'Warm regards,'}<br />
                <strong>${closing}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FFFFFF;padding:20px 40px 28px 40px;
                       border-top:1px solid #E8E8E8;">
              <p style="margin:0;font-size:11px;line-height:1.7;
                        color:#8E8E93;text-align:center;">
                thewhitemustang.ch &nbsp;·&nbsp;
                <a href="mailto:info@thewhitemustang.ch"
                   style="color:#8E8E93;text-decoration:none;">info@thewhitemustang.ch</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendBookingConfirmation(
  to: string,
  name: string,
  startDate: string,
  endDate: string,
  totalPrice: number,
  locale: string,
): Promise<void> {
  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', { dateStyle: 'medium' })
  const fmt = (d: string) => dateFormatter.format(new Date(d))
  const chf = chfFormatter.format(totalPrice)

  const subject = locale === 'en'
    ? 'Your booking is confirmed — The White Mustang'
    : 'Ihre Buchung ist bestätigt — The White Mustang'

  const text = locale === 'en'
    ? `Dear ${name},\n\nYour booking from ${fmt(startDate)} to ${fmt(endDate)} (${chf}) has been confirmed.\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nIhre Buchung vom ${fmt(startDate)} bis ${fmt(endDate)} (${chf}) wurde bestätigt.\n\nIhr White Mustang Team`

  const html = buildEmailHtml({
    locale,
    greeting: emailGreeting(name, locale),
    paragraphs: locale === 'en'
      ? [
          'Your payment has been received and your booking is fully confirmed. Everything is set — we look forward to handing over the keys.',
        ]
      : [
          'Ihre Zahlung ist eingegangen und Ihre Buchung ist vollständig bestätigt. Alles ist bereit — wir freuen uns auf die Schlüsselübergabe.',
        ],
    details: { startDate: fmt(startDate), endDate: fmt(endDate), price: chf },
  })

  await sendEmail({ to, subject, text, html })
}

export async function sendReservationConfirmation(
  to: string,
  name: string,
  startDate: string,
  endDate: string,
  totalPrice: number,
  locale: string,
): Promise<void> {
  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', { dateStyle: 'medium' })
  const fmt = (d: string) => dateFormatter.format(new Date(d))
  const chf = chfFormatter.format(totalPrice)

  const subject = locale === 'en'
    ? 'Your reservation is confirmed — The White Mustang'
    : 'Ihre Reservierung ist bestätigt — The White Mustang'

  const text = locale === 'en'
    ? `Dear ${name},\n\nYour reservation from ${fmt(startDate)} to ${fmt(endDate)} (${chf}) has been confirmed. We will contact you separately with the next steps for payment and handover.\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nIhre Reservierung vom ${fmt(startDate)} bis ${fmt(endDate)} (${chf}) wurde bestätigt. Wir melden uns separat mit den nächsten Schritten zu Zahlung und Übergabe.\n\nIhr White Mustang Team`

  const html = buildEmailHtml({
    locale,
    greeting: emailGreeting(name, locale),
    paragraphs: locale === 'en'
      ? [
          'Your reservation is confirmed. We look forward to welcoming you.',
          'We will contact you separately with the next steps for payment and handover.',
        ]
      : [
          'Ihre Reservierung ist bestätigt. Wir freuen uns, Sie bald begrüssen zu dürfen.',
          'Wir melden uns separat mit den nächsten Schritten zu Zahlung und Übergabe.',
        ],
    details: { startDate: fmt(startDate), endDate: fmt(endDate), price: chf },
  })

  await sendEmail({ to, subject, text, html })
}

export async function sendReservationDeclined(
  to: string,
  name: string,
  startDate: string,
  endDate: string,
  locale: string,
  reason?: string | null,
): Promise<void> {
  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', { dateStyle: 'medium' })
  const fmt = (d: string) => dateFormatter.format(new Date(d))
  const reasonText = reason
    ? (locale === 'en' ? `\n\nReason: ${reason}` : `\n\nGrund: ${reason}`)
    : ''

  const subject = locale === 'en'
    ? 'Your reservation request — The White Mustang'
    : 'Ihre Reservierungsanfrage — The White Mustang'

  const text = locale === 'en'
    ? `Dear ${name},\n\nUnfortunately, we cannot confirm your reservation request from ${fmt(startDate)} to ${fmt(endDate)}.${reasonText}\n\nPlease contact us if you would like to discuss another date.\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nLeider können wir Ihre Reservierungsanfrage vom ${fmt(startDate)} bis ${fmt(endDate)} nicht bestätigen.${reasonText}\n\nKontaktieren Sie uns gerne, wenn Sie einen anderen Zeitraum besprechen möchten.\n\nIhr White Mustang Team`

  const html = buildEmailHtml({
    locale,
    greeting: emailGreeting(name, locale),
    paragraphs: locale === 'en'
      ? [
          'We regret to inform you that we are unable to confirm your reservation request for the period below.',
          'We would be happy to discuss an alternative date — please do not hesitate to reach out.',
        ]
      : [
          'Leider können wir Ihre Reservierungsanfrage für den unten aufgeführten Zeitraum nicht bestätigen.',
          'Wir stehen Ihnen gerne zur Verfügung, um einen alternativen Zeitraum zu besprechen.',
        ],
    details: { startDate: fmt(startDate), endDate: fmt(endDate) },
    reasonBlock: reason ? escapeHtml(reason) : undefined,
  })

  await sendEmail({ to, subject, text, html })
}

export async function sendAdminNewBookingNotification(
  _bookingId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  startDate: string,
  endDate: string,
  totalPrice: number,
  adminUrl: string,
): Promise<void> {
  const dateFormatter = new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium' })
  const fmt = (d: string) => dateFormatter.format(new Date(d))
  const chf = chfFormatter.format(totalPrice)

  const html = buildEmailHtml({
    locale: 'de',
    greeting: 'Neue Buchungsanfrage eingegangen.',
    paragraphs: [
      `<strong>Name:</strong> ${escapeHtml(customerName)}`,
      `<strong>E-Mail:</strong> ${escapeHtml(customerEmail)}`,
      `<strong>Telefon:</strong> ${escapeHtml(customerPhone)}`,
    ],
    details: { startDate: fmt(startDate), endDate: fmt(endDate), price: chf },
    ctaButton: { label: 'Buchung ansehen', url: adminUrl },
  })

  await sendEmail({
    to: 'info@thewhitemustang.ch',
    subject: `Neue Buchungsanfrage — ${customerName}`,
    text: `Neue Buchungsanfrage von ${customerName} (${customerEmail}, ${customerPhone})\nVon: ${fmt(startDate)}\nBis: ${fmt(endDate)}\nBetrag: ${chf}\n\n${adminUrl}`,
    html,
  })
}

export async function sendAdminCancellationNotification(
  _bookingId: string,
  customerName: string,
  customerEmail: string,
  startDate: string,
  endDate: string,
  totalPrice: number,
  refundHandlingRequired: boolean,
  cancellationNote: string | null,
  adminUrl: string,
): Promise<void> {
  const dateFormatter = new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium' })
  const fmt = (d: string) => dateFormatter.format(new Date(d))
  const chf = chfFormatter.format(totalPrice)

  const refundLine = refundHandlingRequired
    ? '<strong style="color:#C8102E;">Achtung: Rückerstattung erforderlich.</strong>'
    : 'Keine Rückerstattung erforderlich.'

  const html = buildEmailHtml({
    locale: 'de',
    greeting: 'Ein Kunde hat seine Buchung storniert.',
    paragraphs: [
      `<strong>Name:</strong> ${escapeHtml(customerName)}`,
      `<strong>E-Mail:</strong> ${escapeHtml(customerEmail)}`,
      refundLine,
    ],
    details: { startDate: fmt(startDate), endDate: fmt(endDate), price: chf },
    reasonBlock: cancellationNote ? escapeHtml(cancellationNote) : undefined,
    ctaButton: { label: 'Buchung ansehen', url: adminUrl },
  })

  const refundText = refundHandlingRequired ? '\nACHTUNG: Rückerstattung erforderlich.' : ''
  await sendEmail({
    to: 'info@thewhitemustang.ch',
    subject: `Stornierung durch Kunde — ${customerName}`,
    text: `${customerName} (${customerEmail}) hat die Buchung vom ${fmt(startDate)} bis ${fmt(endDate)} (${chf}) storniert.${refundText}${cancellationNote ? `\nGrund: ${cancellationNote}` : ''}\n\n${adminUrl}`,
    html,
  })
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
  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', { dateStyle: 'medium' })
  const fmt = (d: string) => dateFormatter.format(new Date(d))
  const chf = chfFormatter.format(totalPrice)

  const subject = locale === 'en'
    ? 'Your reservation request — The White Mustang'
    : 'Ihre Reservierungsanfrage — The White Mustang'

  const text = locale === 'en'
    ? `Dear ${name},\n\nWe received your reservation request from ${fmt(startDate)} to ${fmt(endDate)} (${chf}). We will be in touch regarding payment once your reservation is confirmed.\n\nManage or cancel your request here: ${managementUrl}\n\nThe White Mustang Team`
    : `Guten Tag ${name},\n\nWir haben Ihre Reservierungsanfrage vom ${fmt(startDate)} bis ${fmt(endDate)} (${chf}) erhalten. Wir werden uns bezüglich der Zahlung bei Ihnen melden, sobald Ihre Reservierung bestätigt wurde.\n\nAnfrage verwalten oder stornieren: ${managementUrl}\n\nIhr White Mustang Team`

  const html = buildEmailHtml({
    locale,
    greeting: emailGreeting(name, locale),
    paragraphs: locale === 'en'
      ? [
          'We have received your reservation request for the period below. We will review it and be in touch within 24 hours.',
          'Once your reservation is confirmed, we will contact you separately with payment details.',
        ]
      : [
          'Wir haben Ihre Reservierungsanfrage für den unten aufgeführten Zeitraum erhalten. Wir werden diese prüfen und uns innerhalb von 24 Stunden bei Ihnen melden.',
          'Sobald Ihre Reservierung bestätigt wurde, kontaktieren wir Sie separat mit den Zahlungsdetails.',
        ],
    details: { startDate: fmt(startDate), endDate: fmt(endDate), price: chf },
    ctaButton: {
      label: locale === 'en' ? 'Manage My Request' : 'Anfrage verwalten',
      url: managementUrl,
    },
  })

  await sendEmail({ to, subject, text, html })
}

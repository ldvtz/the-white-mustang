import type { H3Event } from 'h3'
import type { PaymentMethod } from '@@/shared/booking'

export type PaymentInstructions = {
  method: PaymentMethod
  recipient?: string
  note?: string
  qrImageUrl?: string
  accountName?: string
  iban?: string
}

export function getPaymentInstructions(event: H3Event, method: PaymentMethod): PaymentInstructions {
  const config = useRuntimeConfig(event)

  if (method === 'twint') {
    return {
      method,
      recipient: config.twintPaymentRecipient,
      note: config.twintPaymentNote,
      qrImageUrl: config.twintQrImageUrl,
    }
  }

  if (method === 'bank_transfer') {
    return {
      method,
      accountName: config.bankTransferAccountName,
      iban: config.bankTransferIban,
      note: config.bankTransferNote,
    }
  }

  return { method }
}

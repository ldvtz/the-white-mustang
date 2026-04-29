import { computed, reactive, ref, type Ref } from 'vue'
import {
  calculateBookingPrice,
  isValidBookingUseCase,
  isValidPaymentMethod,
  validateBookingDates,
  type BookingPrice,
  type PaymentMethod,
  type BookingUseCase,
} from '@@/shared/booking'

export type BookingFormState = {
  useCase: BookingUseCase
  startDate: string
  endDate: string
  name: string
  email: string
  phone: string
  nationality: string
  age: string
  paymentMethod: PaymentMethod | ''
  comment: string
  privacyAccepted: boolean
}

export type BookingSubmissionResponse = {
  id: string
  startDate: string
  endDate: string
  totalPrice: number
  status: string
  paymentMethod: PaymentMethod
  paymentInstructions: {
    method: PaymentMethod
    recipient?: string
    note?: string
    qrImageUrl?: string
    accountName?: string
    iban?: string
  }
  managementUrl: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useBookingRequest(unavailableDates: Ref<Set<string>>) {
  const { locale } = useI18n()

  const form = reactive<BookingFormState>({
    useCase: 'joyride',
    startDate: '',
    endDate: '',
    name: '',
    email: '',
    phone: '',
    nationality: '',
    age: '',
    paymentMethod: '',
    comment: '',
    privacyAccepted: false,
  })

  const hasSubmitted = ref(false)
  const isSubmitting = ref(false)
  const submitErrorKey = ref<string | null>(null)
  const confirmation = ref<BookingSubmissionResponse | null>(null)

  const price = computed<BookingPrice | null>(() =>
    calculateBookingPrice(form.startDate, form.endDate, form.useCase),
  )

  const fieldErrors = computed<Record<string, string>>(() => {
    const errors: Record<string, string> = {}
    const dateValidation = validateBookingDates(form.startDate, form.endDate, unavailableDates.value)

    if (!form.name.trim()) errors.name = 'storefront.booking.errors.nameRequired'
    if (!EMAIL_RE.test(form.email.trim())) errors.email = 'storefront.booking.errors.emailInvalid'
    if (form.phone.trim().length < 7) errors.phone = 'storefront.booking.errors.phoneInvalid'
    if (!isValidBookingUseCase(form.useCase)) errors.useCase = 'storefront.booking.errors.useCaseRequired'
    if (!isValidPaymentMethod(form.paymentMethod)) errors.paymentMethod = 'storefront.booking.errors.paymentMethodRequired'
    if (!dateValidation.ok) errors.dates = dateValidation.errorKey
    if (!form.privacyAccepted) errors.privacyAccepted = 'storefront.booking.errors.privacyRequired'

    return errors
  })

  const hasErrors = computed(() => Object.keys(fieldErrors.value).length > 0)

  function selectDate(date: string) {
    confirmation.value = null
    submitErrorKey.value = null

    if (!form.startDate || form.endDate || date < form.startDate) {
      form.startDate = date
      form.endDate = ''
      return
    }

    form.endDate = date
  }

  async function submit() {
    hasSubmitted.value = true
    submitErrorKey.value = null
    confirmation.value = null

    if (hasErrors.value || isSubmitting.value) return

    isSubmitting.value = true
    try {
      confirmation.value = await $fetch<BookingSubmissionResponse>('/api/bookings', {
        method: 'POST',
        body: {
          useCase: form.useCase,
          startDate: form.startDate,
          endDate: form.endDate,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          nationality: form.nationality.trim() || undefined,
          age: form.age ? Number(form.age) : undefined,
          paymentMethod: form.paymentMethod,
          comment: form.comment.trim() || undefined,
          locale: locale.value,
        },
      })
    } catch {
      submitErrorKey.value = 'storefront.booking.errors.submitFailed'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    price,
    fieldErrors,
    hasSubmitted,
    hasErrors,
    isSubmitting,
    submitErrorKey,
    confirmation,
    selectDate,
    submit,
  }
}

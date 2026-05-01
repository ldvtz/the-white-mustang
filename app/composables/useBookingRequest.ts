import { computed, reactive, ref, type Ref } from 'vue'
import {
  calculateBookingPrice,
  isValidBookingUseCase,
  validateBookingDates,
  type BookingPrice,
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
  comment: string
  privacyAccepted: boolean
}

export type BookingSubmissionResponse = {
  id: string
  startDate: string
  endDate: string
  totalPrice: number
  status: string
  managementUrl: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function initialForm(): BookingFormState {
  return {
    useCase: 'joyride',
    startDate: '',
    endDate: '',
    name: '',
    email: '',
    phone: '',
    nationality: '',
    age: '',
    comment: '',
    privacyAccepted: false,
  }
}

export function useBookingRequest(unavailableDates: Ref<Set<string>>) {
  const { locale } = useI18n()

  const form = reactive<BookingFormState>(initialForm())

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
    if (!dateValidation.ok) errors.dates = dateValidation.errorKey
    if (!form.privacyAccepted) errors.privacyAccepted = 'storefront.booking.errors.privacyRequired'
    if (form.age) {
      const ageNum = Number(form.age)
      if (!Number.isInteger(ageNum) || ageNum < 18 || ageNum > 120) {
        errors.age = 'storefront.booking.errors.ageInvalid'
      }
    }

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
          comment: form.comment.trim() || undefined,
          locale: locale.value,
        },
      })
      Object.assign(form, initialForm())
      hasSubmitted.value = false
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

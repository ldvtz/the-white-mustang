<script setup lang="ts">
import type { BookingPrice } from '@@/shared/booking'
import type { BookingSubmissionResponse } from '~/composables/useBookingRequest'

defineProps<{
  price: BookingPrice | null
  submitErrorKey: string | null
  confirmation: BookingSubmissionResponse | null
  isReady: boolean
  isSubmitting: boolean
}>()

defineEmits<{
  submit: []
}>()

const { t, locale } = useI18n()

const formatCHF = (value: number) =>
  new Intl.NumberFormat(locale.value === 'de' ? 'de-CH' : 'en-GB', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: 0,
  }).format(value)
</script>

<template>
  <aside class="self-start rounded-md border border-steel-grey/20 bg-alpine-white p-6 shadow-sm">
    <p class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.booking.summary.label') }}</p>
    <p data-testid="booking-price-estimate" class="mt-3 text-3xl font-bold text-deep-charcoal">
      {{ price ? formatCHF(price.total) : t('storefront.booking.summary.pending') }}
    </p>
    <p class="mt-2 text-sm leading-relaxed text-steel-grey">
      {{ price ? t('storefront.booking.summary.days', { count: price.days }) : t('storefront.booking.summary.selectDates') }}
    </p>

    <p v-if="submitErrorKey" data-testid="booking-submit-error" class="mt-5 rounded-md border border-taillight-ruby/20 bg-taillight-ruby/5 px-4 py-3 text-sm text-taillight-ruby">
      {{ t(submitErrorKey) }}
    </p>
    <div v-if="confirmation" data-testid="booking-confirmation" class="mt-5 rounded-md border border-green-700/20 bg-green-50 px-4 py-3 text-sm text-green-900">
      <p>{{ t('storefront.booking.success', { id: confirmation.id }) }}</p>
      <div data-testid="booking-payment-instructions" class="mt-3 space-y-1 text-green-900">
        <p class="font-semibold">
          {{ t(`storefront.booking.payment.nextSteps.${confirmation.paymentMethod}`) }}
        </p>
        <p v-if="confirmation.paymentInstructions.recipient">
          {{ t('storefront.booking.payment.recipient', { value: confirmation.paymentInstructions.recipient }) }}
        </p>
        <p v-if="confirmation.paymentInstructions.accountName">
          {{ t('storefront.booking.payment.accountName', { value: confirmation.paymentInstructions.accountName }) }}
        </p>
        <p v-if="confirmation.paymentInstructions.iban">
          {{ t('storefront.booking.payment.iban', { value: confirmation.paymentInstructions.iban }) }}
        </p>
        <p v-if="confirmation.paymentInstructions.note">
          {{ t('storefront.booking.payment.note', { value: confirmation.paymentInstructions.note }) }}
        </p>
        <a
          data-testid="booking-management-link"
          :href="confirmation.managementUrl"
          class="inline-flex min-h-[44px] items-center font-bold text-green-950 underline underline-offset-4"
        >
          {{ t('storefront.booking.manageLink') }}
        </a>
      </div>
    </div>

    <button
      data-testid="booking-submit"
      type="button"
      :disabled="!isReady || isSubmitting"
      class="mt-6 flex min-h-[44px] w-full items-center justify-center rounded-md bg-taillight-ruby px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
      @click="$emit('submit')"
    >
      {{ isSubmitting ? t('storefront.booking.submitting') : t('storefront.booking.submit') }}
    </button>
  </aside>
</template>

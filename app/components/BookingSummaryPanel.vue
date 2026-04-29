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
    <p v-if="confirmation" data-testid="booking-confirmation" class="mt-5 rounded-md border border-green-700/20 bg-green-50 px-4 py-3 text-sm text-green-800">
      {{ t('storefront.booking.success', { id: confirmation.id }) }}
    </p>

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

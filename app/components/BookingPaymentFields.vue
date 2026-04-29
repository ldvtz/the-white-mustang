<script setup lang="ts">
import type { BookingFormState } from '~/composables/useBookingRequest'
import type { PaymentMethod } from '@@/shared/booking'

defineProps<{
  form: BookingFormState
  errors: Record<string, string>
}>()

const { t } = useI18n()

const methods: PaymentMethod[] = ['twint', 'bank_transfer', 'cash']
</script>

<template>
  <fieldset data-testid="payment-method" class="grid gap-3">
    <legend class="text-xs font-bold uppercase tracking-wider text-steel-grey">
      {{ t('storefront.booking.payment.label') }}
    </legend>
    <div class="grid gap-3 sm:grid-cols-3">
      <label
        v-for="method in methods"
        :key="method"
        class="flex min-h-[44px] cursor-pointer items-center rounded-md border px-4 py-3 text-sm font-semibold transition-colors"
        :class="form.paymentMethod === method
          ? 'border-deep-charcoal bg-deep-charcoal text-alpine-white'
          : 'border-steel-grey/30 bg-alpine-white text-deep-charcoal hover:border-deep-charcoal'"
      >
        <input
          v-model="form.paymentMethod"
          :value="method"
          :data-testid="`payment-method-${method}`"
          type="radio"
          class="sr-only"
        />
        {{ t(`storefront.booking.payment.methods.${method}`) }}
      </label>
    </div>
    <p class="text-sm leading-relaxed text-steel-grey">
      {{ t('storefront.booking.payment.description') }}
    </p>
    <span v-if="errors.paymentMethod" data-testid="payment-method-error" class="text-xs text-taillight-ruby">
      {{ t(errors.paymentMethod) }}
    </span>
  </fieldset>
</template>

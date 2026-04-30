<script setup lang="ts">
import type { BookingFormState } from '~/composables/useBookingRequest'

defineProps<{
  form: BookingFormState
  errors: Record<string, string>
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid gap-5">
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.booking.fields.name') }}</span>
        <input
          v-model="form.name"
          data-testid="booking-name"
          type="text"
          autocomplete="name"
          class="mt-2 min-h-[44px] w-full rounded-md border border-steel-grey/30 bg-alpine-white px-3 text-sm text-deep-charcoal focus:border-deep-charcoal focus:outline-none"
        />
        <span v-if="errors.name" data-testid="booking-name-error" class="mt-1 block text-xs text-taillight-ruby">{{ t(errors.name) }}</span>
      </label>
      <label class="block">
        <span class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.booking.fields.email') }}</span>
        <input
          v-model="form.email"
          data-testid="booking-email"
          type="email"
          autocomplete="email"
          class="mt-2 min-h-[44px] w-full rounded-md border border-steel-grey/30 bg-alpine-white px-3 text-sm text-deep-charcoal focus:border-deep-charcoal focus:outline-none"
        />
        <span v-if="errors.email" data-testid="booking-email-error" class="mt-1 block text-xs text-taillight-ruby">{{ t(errors.email) }}</span>
      </label>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <label class="block sm:col-span-2">
        <span class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.booking.fields.phone') }}</span>
        <input
          v-model="form.phone"
          data-testid="booking-phone"
          type="tel"
          autocomplete="tel"
          class="mt-2 min-h-[44px] w-full rounded-md border border-steel-grey/30 bg-alpine-white px-3 text-sm text-deep-charcoal focus:border-deep-charcoal focus:outline-none"
        />
        <span v-if="errors.phone" data-testid="booking-phone-error" class="mt-1 block text-xs text-taillight-ruby">{{ t(errors.phone) }}</span>
      </label>
      <label class="block">
        <span class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.booking.fields.age') }}</span>
        <input
          v-model="form.age"
          data-testid="booking-age"
          type="number"
          min="18"
          max="120"
          class="mt-2 min-h-[44px] w-full rounded-md border border-steel-grey/30 bg-alpine-white px-3 text-sm text-deep-charcoal focus:border-deep-charcoal focus:outline-none"
        />
        <span v-if="errors.age" data-testid="booking-age-error" class="mt-1 block text-xs text-taillight-ruby">{{ t(errors.age) }}</span>
      </label>
    </div>
  </div>
</template>

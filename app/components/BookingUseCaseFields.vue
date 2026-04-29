<script setup lang="ts">
import type { BookingFormState } from '~/composables/useBookingRequest'

defineProps<{
  form: BookingFormState
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2" data-testid="booking-use-case">
    <label class="flex min-h-[44px] items-center gap-3 rounded-md border border-steel-grey/30 bg-alpine-white px-4 py-3 text-sm font-semibold text-deep-charcoal">
      <input v-model="form.useCase" type="radio" value="joyride" class="accent-taillight-ruby" />
      {{ t('storefront.booking.useCases.joyride') }}
    </label>
    <label class="flex min-h-[44px] items-center gap-3 rounded-md border border-steel-grey/30 bg-alpine-white px-4 py-3 text-sm font-semibold text-deep-charcoal">
      <input v-model="form.useCase" type="radio" value="wedding" class="accent-taillight-ruby" />
      {{ t('storefront.booking.useCases.wedding') }}
    </label>
  </div>
</template>

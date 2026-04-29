<script setup lang="ts">
import type { BookingFormState } from '~/composables/useBookingRequest'

defineProps<{
  form: BookingFormState
  errors: Record<string, string>
}>()

const { t } = useI18n()
</script>

<template>
  <div>
    <label class="flex items-start gap-3 text-sm text-steel-grey">
      <input v-model="form.privacyAccepted" data-testid="booking-privacy" type="checkbox" class="mt-1 accent-taillight-ruby" />
      <span>{{ t('storefront.booking.privacy') }}</span>
    </label>
    <p v-if="errors.privacyAccepted" class="mt-2 text-sm text-taillight-ruby">
      {{ t(errors.privacyAccepted) }}
    </p>
  </div>
</template>

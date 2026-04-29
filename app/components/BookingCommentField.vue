<script setup lang="ts">
import type { BookingFormState } from '~/composables/useBookingRequest'

defineProps<{
  form: BookingFormState
}>()

const { t } = useI18n()
</script>

<template>
  <label class="block">
    <span class="text-xs font-bold uppercase tracking-wider text-steel-grey">
      {{ t('storefront.booking.fields.comment') }}
    </span>
    <textarea
      v-model="form.comment"
      data-testid="booking-comment"
      rows="4"
      maxlength="1200"
      class="mt-2 w-full rounded-md border border-steel-grey/30 bg-alpine-white px-3 py-3 text-sm text-deep-charcoal focus:border-deep-charcoal focus:outline-none"
    />
    <span class="mt-1 block text-xs text-steel-grey">
      {{ t('storefront.booking.fields.commentHint') }}
    </span>
  </label>
</template>

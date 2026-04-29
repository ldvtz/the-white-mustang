<script setup lang="ts">
import { todayIso } from '@@/shared/booking'
import type { BookingFormState } from '~/composables/useBookingRequest'

const props = defineProps<{
  form: BookingFormState
  errors: Record<string, string>
  unavailableDates?: string[]
}>()

const { t } = useI18n()

const today = todayIso()
const endDateMin = computed(() => props.form.startDate || today)

function onStartDateChange(date: string) {
  props.form.startDate = date
  if (date && props.form.endDate && props.form.endDate < date) {
    props.form.endDate = ''
  }
}
</script>

<template>
  <div>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.booking.fields.startDate') }}</span>
        <AppDatePicker
          :model-value="form.startDate"
          :min-date="today"
          :disabled-dates="unavailableDates"
          testid="booking-start-date"
          @update:model-value="onStartDateChange"
        />
      </label>
      <label class="block">
        <span class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.booking.fields.endDate') }}</span>
        <AppDatePicker
          v-model="form.endDate"
          :min-date="endDateMin"
          :disabled-dates="unavailableDates"
          testid="booking-end-date"
        />
      </label>
    </div>
    <p v-if="errors.dates" data-testid="booking-date-error" class="mt-2 text-sm text-taillight-ruby">
      {{ t(errors.dates) }}
    </p>
  </div>
</template>

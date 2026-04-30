<script setup lang="ts">
import { todayIso } from '@@/shared/booking'

const props = defineProps<{
  startDate: string
  endDate: string
  errors: Record<string, string>
  unavailableDates?: string[]
}>()

const emit = defineEmits<{
  'update:startDate': [date: string]
  'update:endDate': [date: string]
}>()

const { t } = useI18n()

const today = todayIso()
const endDateMin = computed(() => props.startDate || today)

function onStartDateChange(date: string) {
  emit('update:startDate', date)
  if (date && props.endDate && props.endDate < date) {
    emit('update:endDate', '')
  }
}
</script>

<template>
  <div>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.booking.fields.startDate') }}</span>
        <AppDatePicker
          :model-value="startDate"
          :min-date="today"
          :disabled-dates="unavailableDates"
          testid="booking-start-date"
          @update:model-value="onStartDateChange"
        />
      </label>
      <label class="block">
        <span class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.booking.fields.endDate') }}</span>
        <AppDatePicker
          :model-value="endDate"
          :min-date="endDateMin"
          :disabled-dates="unavailableDates"
          testid="booking-end-date"
          @update:model-value="emit('update:endDate', $event)"
        />
      </label>
    </div>
    <p v-if="errors.dates" data-testid="booking-date-error" class="mt-2 text-sm text-taillight-ruby">
      {{ t(errors.dates) }}
    </p>
  </div>
</template>

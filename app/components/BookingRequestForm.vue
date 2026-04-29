<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  selectedStartDate: string
  selectedEndDate: string
  unavailableDates: string[]
}>()

const { t } = useI18n()
const isReady = ref(false)
const unavailableDateSet = computed(() => new Set(props.unavailableDates))
const {
  form,
  price,
  fieldErrors,
  hasSubmitted,
  isSubmitting,
  submitErrorKey,
  confirmation,
  submit,
} = useBookingRequest(unavailableDateSet)

watch(() => props.selectedStartDate, (date) => {
  if (date) form.startDate = date
})

watch(() => props.selectedEndDate, (date) => {
  if (date) form.endDate = date
})

const visibleErrors = computed(() => hasSubmitted.value ? fieldErrors.value : {})

onMounted(() => {
  isReady.value = true
})

</script>

<template>
  <form
    data-testid="booking-form"
    :data-ready="isReady ? 'true' : 'false'"
    class="mt-10 grid gap-8 border-t border-steel-grey/20 pt-10 lg:grid-cols-[1.1fr_0.9fr]"
    novalidate
    @submit.prevent="submit"
  >
    <section class="grid gap-5" :aria-label="t('storefront.booking.formLabel')">
      <div>
        <p class="text-sm font-bold uppercase tracking-wider text-taillight-ruby">
          {{ t('storefront.booking.motif') }}
        </p>
        <h3 class="mt-2 text-2xl font-bold uppercase text-deep-charcoal">
          {{ t('storefront.booking.heading') }}
        </h3>
      </div>

      <BookingUseCaseFields :form="form" />
      <BookingDateFields :form="form" :errors="visibleErrors" :unavailable-dates="unavailableDates" />
      <BookingContactFields :form="form" :errors="visibleErrors" />
      <BookingPrivacyField :form="form" :errors="visibleErrors" />
    </section>

    <BookingSummaryPanel
      :price="price"
      :submit-error-key="submitErrorKey"
      :confirmation="confirmation"
      :is-ready="isReady"
      :is-submitting="isSubmitting"
      @submit="submit"
    />
  </form>
</template>

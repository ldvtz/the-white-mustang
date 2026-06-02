<script setup lang="ts">
import type { BookingFormState } from '~/composables/useBookingRequest'

defineProps<{
  form: BookingFormState
  errors: Record<string, string>
}>()

const { t } = useI18n()
const showPrivacyPopup = ref(false)
</script>

<template>
  <div>
    <label class="flex items-start gap-3 text-sm text-steel-grey">
      <input
        v-model="form.privacyAccepted"
        data-testid="booking-privacy"
        type="checkbox"
        class="mt-1 accent-taillight-ruby h-4 w-4 rounded border-steel-grey/30 text-taillight-ruby focus:ring-taillight-ruby"
      />
      <i18n-t keypath="storefront.booking.privacy" tag="span">
        <template #link>
          <button
            type="button"
            class="underline text-taillight-ruby hover:text-red-700 transition-colors font-medium focus:outline-none"
            data-testid="privacy-link"
            @click="showPrivacyPopup = true"
          >
            {{ t('storefront.booking.privacyLink') }}
          </button>
        </template>
      </i18n-t>
    </label>
    <p v-if="errors.privacyAccepted" class="mt-2 text-sm text-taillight-ruby">
      {{ t(errors.privacyAccepted) }}
    </p>

    <PrivacyPolicyModal :open="showPrivacyPopup" @close="showPrivacyPopup = false" />
  </div>
</template>

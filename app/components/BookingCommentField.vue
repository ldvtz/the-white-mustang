<script setup lang="ts">
const props = defineProps<{
  form: { comment: string }
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid gap-1">
    <label for="booking-comment" class="text-sm font-semibold uppercase tracking-wider text-deep-charcoal">
      {{ t('storefront.booking.fields.comment') }}
    </label>
    <textarea
      id="booking-comment"
      v-model="props.form.comment"
      :placeholder="t('storefront.booking.fields.commentPlaceholder')"
      rows="3"
      maxlength="500"
      class="w-full rounded-md border border-steel-grey/30 bg-white px-4 py-3 text-sm text-deep-charcoal placeholder:text-steel-grey focus:border-taillight-ruby focus:outline-none focus:ring-1 focus:ring-taillight-ruby resize-none"
    />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <p class="text-sm text-steel-grey">
    {{ t('storefront.booking.fields.commentEmailHint') }}
    <a href="mailto:info@thewhitemustang.ch" class="text-taillight-ruby underline">info@thewhitemustang.ch</a>
  </p>
</template>

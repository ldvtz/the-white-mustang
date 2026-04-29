<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <div data-testid="pricing-legend" class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div data-testid="legend-standard" class="rounded-md border border-gray-100 bg-alpine-white p-4 shadow-sm">
        <div class="mb-3 h-4 w-4 rounded-sm border border-gray-200 bg-white" />
        <p class="text-xs font-bold uppercase tracking-wider text-deep-charcoal">{{ t('storefront.pricing.legend.standard') }}</p>
        <p class="mt-1 text-lg font-bold text-deep-charcoal">{{ t('storefront.pricing.legend.standardPrice') }}</p>
        <p class="mt-0.5 text-xs text-steel-grey">{{ t('storefront.pricing.legend.standardDesc') }}</p>
      </div>

      <div data-testid="legend-weekend" class="rounded-md border border-gray-100 bg-alpine-white p-4 shadow-sm">
        <div class="mb-3 h-4 w-4 rounded-sm border border-[#F5E6B8] bg-[#FEF9EE]" />
        <p class="text-xs font-bold uppercase tracking-wider text-deep-charcoal">{{ t('storefront.pricing.legend.weekend') }}</p>
        <p class="mt-1 text-lg font-bold text-deep-charcoal">{{ t('storefront.pricing.legend.weekendPrice') }}</p>
        <p class="mt-0.5 text-xs text-steel-grey">{{ t('storefront.pricing.legend.weekendDesc') }}</p>
      </div>

      <div data-testid="legend-peak" class="rounded-md border border-gray-100 bg-alpine-white p-4 shadow-sm">
        <div class="mb-3 h-4 w-4 rounded-sm border border-[#FFD49E] bg-[#FFF3E0]" />
        <p class="text-xs font-bold uppercase tracking-wider text-deep-charcoal">{{ t('storefront.pricing.legend.peak') }}</p>
        <p class="mt-1 text-lg font-bold text-deep-charcoal">{{ t('storefront.pricing.legend.peakPrice') }}</p>
        <p class="mt-0.5 text-xs text-steel-grey">{{ t('storefront.pricing.legend.peakDesc') }}</p>
      </div>

      <div data-testid="legend-wedding" class="rounded-md bg-taillight-ruby p-4 shadow-sm">
        <div class="mb-3 h-4 w-4 rounded-sm bg-white/20" />
        <p class="text-xs font-bold uppercase tracking-wider text-white">{{ t('storefront.pricing.legend.wedding') }}</p>
        <p class="mt-1 text-lg font-bold text-white">{{ t('storefront.pricing.legend.weddingPrice') }}</p>
        <p class="mt-0.5 text-xs text-white/70">{{ t('storefront.pricing.legend.weddingDesc') }}</p>
      </div>
    </div>

    <p class="mt-4 text-center text-xs text-steel-grey">{{ t('storefront.pricing.calendarNote') }}</p>
  </div>
</template>

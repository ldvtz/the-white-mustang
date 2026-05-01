<script setup lang="ts">
import { computed, ref } from 'vue'

type ManagedBookingResponse = {
  booking: {
    id: string
    startDate: string
    endDate: string
    status: string
    paymentMethod: string | null
    totalPrice: number
    depositPaid: boolean
    cancelledAt: string | null
    cancellationNote: string | null
    refundHandlingRequired: boolean
    customerName: string
  }
  cancellation: {
    cutoffDays: number
    canCancel: boolean
  }
}

const route = useRoute()
const { t, locale } = useI18n()
const token = computed(() => String(route.params.token ?? ''))
const cancellationNote = ref('')
const isCancelling = ref(false)
const actionError = ref<string | null>(null)

useSeoMeta({
  title: () => t('storefront.manage.seoTitle'),
  description: () => t('storefront.manage.seoDescription'),
  robots: 'noindex, nofollow',
})

const { data, status, error, refresh } = await useFetch<ManagedBookingResponse>(
  () => `/api/bookings/manage/${encodeURIComponent(token.value)}`,
)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(locale.value === 'de' ? 'de-CH' : 'en-GB', { dateStyle: 'medium' }).format(new Date(value))

const formatCHF = (value: number) =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value)

async function cancelBooking() {
  if (!data.value?.cancellation.canCancel || isCancelling.value) return

  actionError.value = null
  isCancelling.value = true
  try {
    await $fetch(`/api/bookings/manage/${encodeURIComponent(token.value)}/cancel`, {
      method: 'POST',
      body: { note: cancellationNote.value.trim() || undefined },
    })
    cancellationNote.value = ''
    await refresh()
  } catch {
    actionError.value = 'storefront.manage.errors.cancelFailed'
  } finally {
    isCancelling.value = false
  }
}
</script>

<template>
  <main class="bg-alpine-white px-6 py-16 text-deep-charcoal">
    <section class="mx-auto grid max-w-4xl gap-8">
      <header>
        <p class="text-sm font-bold uppercase tracking-wider text-taillight-ruby">
          {{ t('storefront.manage.motif') }}
        </p>
        <h1 class="mt-3 text-3xl font-bold uppercase">
          {{ t('storefront.manage.heading') }}
        </h1>
      </header>

      <div v-if="status === 'pending'" class="text-sm text-steel-grey" data-testid="manage-loading">
        {{ t('storefront.manage.loading') }}
      </div>

      <p v-else-if="error || !data" data-testid="manage-error" class="rounded-md border border-taillight-ruby/20 bg-taillight-ruby/5 px-4 py-3 text-sm text-taillight-ruby">
        {{ t('storefront.manage.errors.loadFailed') }}
      </p>

      <template v-else>
        <section data-testid="manage-booking" class="rounded-md border border-steel-grey/20 bg-pearl-white p-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.manage.reference') }}</p>
              <p class="mt-1 font-semibold">{{ data.booking.id }}</p>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.manage.status') }}</p>
              <p class="mt-1 font-semibold">
                {{ data.booking.status === 'pending'
                  ? t('storefront.manage.statusPending')
                  : t(`common.status.${data.booking.status}`) }}
              </p>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.manage.period') }}</p>
              <p class="mt-1 font-semibold">{{ formatDate(data.booking.startDate) }} – {{ formatDate(data.booking.endDate) }}</p>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-steel-grey">{{ t('storefront.manage.total') }}</p>
              <p class="mt-1 font-semibold">{{ formatCHF(data.booking.totalPrice) }}</p>
            </div>
          </div>
        </section>

        <section data-testid="manage-payment" class="rounded-md border border-steel-grey/20 bg-alpine-white p-6">
          <h2 class="text-xl font-bold uppercase">{{ t('storefront.manage.paymentHeading') }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-steel-grey">
            {{ t('storefront.manage.paymentPending') }}
          </p>
        </section>

        <section class="rounded-md border border-steel-grey/20 bg-alpine-white p-6">
          <p class="text-sm text-steel-grey">
            {{ t('storefront.manage.contactEmailHint') }}
            <a href="mailto:info@thewhitemustang.ch" class="text-taillight-ruby underline">info@thewhitemustang.ch</a>
          </p>
        </section>

        <section data-testid="manage-cancellation" class="rounded-md border border-steel-grey/20 bg-alpine-white p-6">
          <h2 class="text-xl font-bold uppercase">{{ t('storefront.manage.cancelHeading') }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-steel-grey">
            {{ data.cancellation.canCancel
              ? t('storefront.manage.cancelAllowed', { days: data.cancellation.cutoffDays })
              : t('storefront.manage.cancelBlocked', { days: data.cancellation.cutoffDays }) }}
          </p>
          <p v-if="data.booking.refundHandlingRequired" data-testid="manage-refund-note" class="mt-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {{ t('storefront.manage.refundManual') }}
          </p>
          <form v-if="data.cancellation.canCancel" class="mt-5 grid gap-3" @submit.prevent="cancelBooking">
            <textarea
              v-model="cancellationNote"
              data-testid="manage-cancel-note"
              rows="3"
              maxlength="1200"
              class="w-full rounded-md border border-steel-grey/30 bg-alpine-white px-3 py-3 text-sm focus:border-deep-charcoal focus:outline-none"
              :placeholder="t('storefront.manage.cancelPlaceholder')"
            />
            <button
              data-testid="manage-cancel-submit"
              type="submit"
              :disabled="isCancelling"
              class="min-h-[44px] justify-self-start rounded-md bg-taillight-ruby px-5 py-3 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
            >
              {{ isCancelling ? t('storefront.manage.cancelling') : t('storefront.manage.cancelSubmit') }}
            </button>
          </form>
        </section>

        <p v-if="actionError" data-testid="manage-action-error" class="rounded-md border border-taillight-ruby/20 bg-taillight-ruby/5 px-4 py-3 text-sm text-taillight-ruby">
          {{ t(actionError) }}
        </p>
      </template>
    </section>
  </main>
</template>

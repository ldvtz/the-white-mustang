<script setup lang="ts">
import type { BookingWithCustomer, BookingStatus } from '@@/types/booking'

definePageMeta({ layout: 'admin' })

const { t, locale } = useI18n()
const route = useRoute()
const id = route.params.id as string

const { data: booking, error, refresh } = await useAsyncData<BookingWithCustomer>(
  `booking-${id}`,
  () => $fetch(`/api/admin/bookings/${id}`),
)

useSeoMeta({
  title: () => booking.value ? `${t('admin.dashboard.detailModal.title')} · ${booking.value.id.slice(0, 8)}` : t('admin.dashboard.detailModal.title'),
  robots: 'noindex, nofollow',
})

const inflightIds = ref<Set<string>>(new Set())
const decisionAction = ref<'confirm' | 'decline'>('confirm')
const decisionError = ref<string | null>(null)
const decisionOpen = ref(false)

const newComment = ref('')
const isPostingComment = ref(false)
const commentError = ref<string | null>(null)

const paymentMethod = ref('')
const paymentNote = ref('')
const isConfirmingPayment = ref(false)
const paymentError = ref<string | null>(null)

const statusClasses: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  awaiting_payment: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-stone-100 text-stone-600',
  declined: 'bg-zinc-100 text-zinc-700',
  cancelled: 'bg-red-100 text-red-800',
}

const AUTHOR_STYLE: Record<string, { labelKey: string; card: string; labelClass: string }> = {
  admin:    { labelKey: 'admin.dashboard.detailModal.authorAdmin',    card: 'bg-deep-charcoal/5 border border-steel-grey/10', labelClass: 'text-steel-grey' },
  customer: { labelKey: 'admin.dashboard.detailModal.authorCustomer', card: 'bg-pearl-white border border-steel-grey/20',     labelClass: 'text-taillight-ruby' },
  system:   { labelKey: 'admin.dashboard.detailModal.authorSystem',   card: 'bg-alpine-white border border-steel-grey/10',    labelClass: 'text-steel-grey' },
}

const dateFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'en' ? 'en-CH' : 'de-CH', { dateStyle: 'medium' }),
)

const datetimeFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'en' ? 'en-CH' : 'de-CH', { dateStyle: 'medium', timeStyle: 'short' }),
)

const currencyFormatter = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })

const sortedComments = computed(() =>
  [...(booking.value?.booking_comments ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  ),
)

function canDecideReservation(status: BookingStatus) {
  return status === 'pending' || status === 'awaiting_payment'
}

function authorStyle(authorType: string) {
  return AUTHOR_STYLE[authorType] ?? AUTHOR_STYLE.system!
}

function formatDate(d: string) { return dateFormatter.value.format(new Date(d)) }
function formatDatetime(d: string | null) {
  return d ? datetimeFormatter.value.format(new Date(d)) : t('admin.dashboard.detailModal.notProvided')
}

function openDecision(action: 'confirm' | 'decline') {
  decisionAction.value = action
  decisionError.value = null
  decisionOpen.value = true
}

async function submitDecision(note: string) {
  if (!booking.value) return
  inflightIds.value = new Set([...inflightIds.value, booking.value.id])
  decisionError.value = null
  try {
    await $fetch(`/api/admin/bookings/${booking.value.id}/${decisionAction.value}-reservation`, {
      method: 'POST',
      body: { note: note || undefined },
    })
    decisionOpen.value = false
    await refresh()
  } catch {
    decisionError.value = t('admin.dashboard.decisionModal.error')
  } finally {
    const next = new Set(inflightIds.value)
    next.delete(booking.value!.id)
    inflightIds.value = next
  }
}

async function confirmPayment() {
  if (!booking.value || !paymentMethod.value) return
  isConfirmingPayment.value = true
  paymentError.value = null
  try {
    await $fetch(`/api/admin/bookings/${booking.value.id}/confirm-payment`, {
      method: 'PATCH',
      body: {
        paymentMethod: paymentMethod.value,
        comment: paymentNote.value.trim() || undefined,
      },
    })
    paymentMethod.value = ''
    paymentNote.value = ''
    await refresh()
  } catch {
    paymentError.value = t('admin.dashboard.payment.error')
  } finally {
    isConfirmingPayment.value = false
  }
}

async function submitComment() {
  const message = newComment.value.trim()
  if (!message || !booking.value) return
  isPostingComment.value = true
  commentError.value = null
  try {
    await $fetch(`/api/admin/bookings/${booking.value.id}/comments`, {
      method: 'POST',
      body: { message, visible_to_customer: false },
    })
    newComment.value = ''
    await refresh()
  } catch {
    commentError.value = t('admin.dashboard.detailModal.noteError')
  } finally {
    isPostingComment.value = false
  }
}
</script>

<template>
  <div class="p-8 max-w-3xl">
    <!-- Back link -->
    <NuxtLink
      to="/admin"
      class="inline-flex items-center gap-1.5 text-sm text-steel-grey hover:text-deep-charcoal transition-colors mb-8"
    >
      ← {{ t('admin.dashboard.backToOverview') }}
    </NuxtLink>

    <p v-if="error" class="text-taillight-ruby text-sm">
      {{ t('admin.dashboard.error') }}
    </p>

    <template v-else-if="booking">
      <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-taillight-ruby mb-1">
            {{ t('admin.dashboard.detailModal.title') }}
          </p>
          <h1 class="text-2xl font-bold uppercase tracking-wide text-deep-charcoal">
            {{ booking.customers.name }}
          </h1>
          <p class="text-sm text-steel-grey mt-0.5 font-mono">{{ booking.id }}</p>
        </div>
        <div v-if="canDecideReservation(booking.status)" class="flex gap-2">
          <button
            type="button"
            :disabled="inflightIds.has(booking.id)"
            class="min-h-[44px] rounded bg-deep-charcoal px-4 py-2 text-xs font-semibold uppercase tracking-wide text-alpine-white transition-opacity disabled:opacity-50"
            @click="openDecision('confirm')"
          >
            {{ t('admin.dashboard.actions.confirmReservation') }}
          </button>
          <button
            type="button"
            :disabled="inflightIds.has(booking.id)"
            class="min-h-[44px] rounded border border-steel-grey/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-deep-charcoal transition-colors hover:border-taillight-ruby hover:text-taillight-ruby disabled:opacity-50"
            @click="openDecision('decline')"
          >
            {{ t('admin.dashboard.actions.declineReservation') }}
          </button>
        </div>
      </div>

      <!-- Booking info grid -->
      <section class="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.status') }}</p>
          <span class="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold" :class="statusClasses[booking.status]">
            {{ t(`admin.dashboard.status.${booking.status}`) }}
          </span>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.period') }}</p>
          <p class="text-deep-charcoal mt-1">{{ formatDate(booking.start_date) }} – {{ formatDate(booking.end_date) }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.total') }}</p>
          <p class="text-deep-charcoal font-semibold mt-1">{{ currencyFormatter.format(booking.total_price) }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.paymentMethod') }}</p>
          <p class="text-deep-charcoal mt-1">{{ booking.payment_method ? t(`storefront.booking.payment.methods.${booking.payment_method}`) : t('admin.dashboard.detailModal.notProvided') }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.depositStatus') }}</p>
          <p class="mt-1" :class="booking.deposit_paid ? 'text-green-700' : 'text-amber-700'">
            {{ booking.deposit_paid ? t('admin.dashboard.table.depositPaid') : t('admin.dashboard.table.depositPending') }}
          </p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.paymentReceivedAt') }}</p>
          <p class="text-deep-charcoal mt-1">{{ formatDatetime(booking.payment_received_at) }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.createdAt') }}</p>
          <p class="text-deep-charcoal mt-1">{{ formatDatetime(booking.created_at) }}</p>
        </div>
      </section>

      <!-- Payment section (only shown when payment not yet confirmed) -->
      <template v-if="!booking.deposit_paid">
        <hr class="border-steel-grey/20 mb-8" />
        <section class="mb-8">
          <h2 class="text-deep-charcoal font-bold uppercase tracking-wide text-xs mb-4">
            {{ t('admin.dashboard.payment.sectionTitle') }}
          </h2>
          <div class="grid gap-4 max-w-sm">
            <div>
              <label class="block text-steel-grey text-xs uppercase tracking-wide mb-1">
                {{ t('admin.dashboard.payment.methodLabel') }}
              </label>
              <select
                v-model="paymentMethod"
                class="w-full border border-steel-grey/30 rounded-md px-3 py-2 text-sm text-deep-charcoal bg-alpine-white focus:outline-none focus:border-deep-charcoal"
              >
                <option value="" disabled>{{ t('admin.dashboard.payment.methodPlaceholder') }}</option>
                <option value="twint">{{ t('storefront.booking.payment.methods.twint') }}</option>
                <option value="bank_transfer">{{ t('storefront.booking.payment.methods.bank_transfer') }}</option>
                <option value="cash">{{ t('storefront.booking.payment.methods.cash') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-steel-grey text-xs uppercase tracking-wide mb-1">
                {{ t('admin.dashboard.payment.noteLabel') }}
              </label>
              <textarea
                v-model="paymentNote"
                rows="2"
                class="w-full border border-steel-grey/30 rounded-md px-3 py-2 text-sm text-deep-charcoal bg-alpine-white focus:outline-none focus:border-deep-charcoal resize-none"
              />
            </div>
            <p v-if="paymentError" class="text-taillight-ruby text-xs">{{ paymentError }}</p>
            <button
              type="button"
              class="self-start bg-deep-charcoal text-alpine-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-md hover:opacity-80 transition-opacity disabled:opacity-40"
              :disabled="!paymentMethod || isConfirmingPayment"
              @click="confirmPayment"
            >
              {{ isConfirmingPayment ? t('admin.dashboard.payment.confirmingButton') : t('admin.dashboard.payment.confirmButton') }}
            </button>
          </div>
        </section>
      </template>

      <hr class="border-steel-grey/20 mb-8" />

      <!-- Customer section -->
      <section class="mb-8">
        <h2 class="text-deep-charcoal font-bold uppercase tracking-wide text-xs mb-4">
          {{ t('admin.dashboard.detailModal.customerSection') }}
        </h2>
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.table.customer') }}</p>
            <p class="text-deep-charcoal font-medium mt-1">{{ booking.customers.name }}</p>
            <a :href="`mailto:${booking.customers.email}`" class="text-xs text-steel-grey hover:text-taillight-ruby transition-colors">{{ booking.customers.email }}</a>
          </div>
          <div>
            <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.phone') }}</p>
            <p class="text-deep-charcoal mt-1">{{ booking.customers.phone ?? t('admin.dashboard.detailModal.notProvided') }}</p>
          </div>
          <div>
            <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.nationality') }}</p>
            <p class="text-deep-charcoal mt-1">{{ booking.customers.nationality ?? t('admin.dashboard.detailModal.notProvided') }}</p>
          </div>
          <div>
            <p class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.age') }}</p>
            <p class="text-deep-charcoal mt-1">{{ booking.customers.age ?? t('admin.dashboard.detailModal.notProvided') }}</p>
          </div>
        </div>
      </section>

      <hr class="border-steel-grey/20 mb-8" />

      <!-- Comments section -->
      <section>
        <h2 class="text-deep-charcoal font-bold uppercase tracking-wide text-xs mb-4">
          {{ t('admin.dashboard.detailModal.commentsSection') }}
        </h2>

        <div v-if="sortedComments.length === 0" class="text-steel-grey text-sm mb-5">
          {{ t('admin.dashboard.detailModal.noComments') }}
        </div>

        <div v-else class="space-y-2 mb-5">
          <div
            v-for="comment in sortedComments"
            :key="comment.id"
            class="rounded-md p-3"
            :class="authorStyle(comment.author_type).card"
          >
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-xs font-semibold"
                :class="[authorStyle(comment.author_type).labelClass, comment.author_type === 'system' ? 'italic' : '']"
              >
                {{ t(authorStyle(comment.author_type).labelKey) }}
              </span>
              <span class="text-xs text-steel-grey">{{ formatDatetime(comment.created_at) }}</span>
            </div>
            <p class="text-deep-charcoal text-sm whitespace-pre-line">{{ comment.message }}</p>
          </div>
        </div>

        <!-- Add note form -->
        <div>
          <label class="block text-steel-grey text-xs uppercase tracking-wide mb-1">
            {{ t('admin.dashboard.detailModal.addNoteLabel') }}
          </label>
          <textarea
            v-model="newComment"
            :placeholder="t('admin.dashboard.detailModal.notePlaceholder')"
            rows="3"
            class="w-full border border-steel-grey/30 rounded-md px-3 py-2 text-sm text-deep-charcoal bg-alpine-white focus:outline-none focus:border-deep-charcoal resize-none mb-2"
          />
          <p v-if="commentError" class="text-taillight-ruby text-xs mb-2">{{ commentError }}</p>
          <button
            type="button"
            class="bg-deep-charcoal text-alpine-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-md hover:opacity-80 transition-opacity disabled:opacity-40"
            :disabled="!newComment.trim() || isPostingComment"
            @click="submitComment"
          >
            {{ isPostingComment ? t('admin.dashboard.detailModal.savingNote') : t('admin.dashboard.detailModal.addNoteButton') }}
          </button>
        </div>
      </section>
    </template>

    <AdminReservationDecisionModal
      v-if="decisionOpen && booking"
      :booking="booking"
      :action="decisionAction"
      :inflight-ids="inflightIds"
      :error="decisionError"
      @submit="submitDecision"
      @cancel="decisionOpen = false"
    />
  </div>
</template>

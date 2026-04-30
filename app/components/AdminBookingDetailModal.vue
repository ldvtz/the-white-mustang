<script setup lang="ts">
import type { BookingWithCustomer } from '@@/types/supabase'

const props = defineProps<{
  booking: BookingWithCustomer
  inflightIds: Set<string>
}>()

const emit = defineEmits<{
  close: []
  commentPosted: []
}>()

const { t, locale } = useI18n()

const newComment = ref('')
const isPostingComment = ref(false)
const commentError = ref<string | null>(null)

const statusClasses: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  awaiting_payment: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-stone-100 text-stone-600',
  cancelled: 'bg-red-100 text-red-800',
}

const sortedComments = computed(() =>
  [...(props.booking.booking_comments ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  ),
)

const dateFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'en' ? 'en-CH' : 'de-CH', { dateStyle: 'medium' }),
)

const datetimeFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'en' ? 'en-CH' : 'de-CH', { dateStyle: 'medium', timeStyle: 'short' }),
)

const currencyFormatter = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })

function formatDate(d: string) { return dateFormatter.value.format(new Date(d)) }
function formatDatetime(d: string | null) {
  return d ? datetimeFormatter.value.format(new Date(d)) : t('admin.dashboard.detailModal.notProvided')
}

const AUTHOR_STYLE: Record<string, { labelKey: string; card: string; labelClass: string }> = {
  admin:    { labelKey: 'admin.dashboard.detailModal.authorAdmin',    card: 'bg-deep-charcoal/5 border border-steel-grey/10', labelClass: 'text-steel-grey' },
  customer: { labelKey: 'admin.dashboard.detailModal.authorCustomer', card: 'bg-pearl-white border border-steel-grey/20',     labelClass: 'text-taillight-ruby' },
  system:   { labelKey: 'admin.dashboard.detailModal.authorSystem',   card: 'bg-alpine-white border border-steel-grey/10',    labelClass: 'text-steel-grey' },
}

function authorStyle(authorType: string) {
  return AUTHOR_STYLE[authorType] ?? AUTHOR_STYLE.system!
}

async function submitComment() {
  const message = newComment.value.trim()
  if (!message) return
  isPostingComment.value = true
  commentError.value = null
  try {
    await $fetch(`/api/admin/bookings/${props.booking.id}/comments`, {
      method: 'POST',
      body: { message, visible_to_customer: false },
    })
    newComment.value = ''
    emit('commentPosted')
  } catch {
    commentError.value = t('admin.dashboard.detailModal.noteError')
  } finally {
    isPostingComment.value = false
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40"
    @click.self="emit('close')"
  >
    <div class="bg-alpine-white rounded-md shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-deep-charcoal font-bold uppercase tracking-wide text-sm">
          {{ $t('admin.dashboard.detailModal.title') }}
        </h2>
        <button
          type="button"
          class="text-steel-grey hover:text-deep-charcoal transition-colors text-lg leading-none"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Booking info grid -->
      <div class="grid grid-cols-2 gap-x-6 gap-y-3 mb-5 text-sm">
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.bookingId') }}</p>
          <p class="text-deep-charcoal font-mono text-xs mt-0.5">{{ booking.id }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.status') }}</p>
          <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-semibold" :class="statusClasses[booking.status] ?? 'bg-stone-100 text-stone-600'">
            {{ $t(`common.status.${booking.status}`) }}
          </span>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.period') }}</p>
          <p class="text-deep-charcoal mt-0.5">{{ formatDate(booking.start_date) }} – {{ formatDate(booking.end_date) }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.total') }}</p>
          <p class="text-deep-charcoal font-semibold mt-0.5">{{ currencyFormatter.format(booking.total_price) }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.paymentMethod') }}</p>
          <p class="text-deep-charcoal mt-0.5">{{ $t(`storefront.booking.payment.methods.${booking.payment_method}`) }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.depositStatus') }}</p>
          <p class="mt-0.5" :class="booking.deposit_paid ? 'text-green-700' : 'text-amber-700'">
            {{ booking.deposit_paid ? $t('admin.dashboard.table.depositPaid') : $t('admin.dashboard.table.depositPending') }}
          </p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.paymentReceivedAt') }}</p>
          <p class="text-deep-charcoal mt-0.5">{{ formatDatetime(booking.payment_received_at) }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.createdAt') }}</p>
          <p class="text-deep-charcoal mt-0.5">{{ formatDatetime(booking.created_at) }}</p>
        </div>
      </div>

      <hr class="border-steel-grey/20 mb-5" />

      <!-- Customer section -->
      <h3 class="text-deep-charcoal font-bold uppercase tracking-wide text-xs mb-3">
        {{ $t('admin.dashboard.detailModal.customerSection') }}
      </h3>
      <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.table.customer') }}</p>
          <p class="text-deep-charcoal font-medium mt-0.5">{{ booking.customers.name }}</p>
          <p class="text-steel-grey text-xs">{{ booking.customers.email }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.phone') }}</p>
          <p class="text-deep-charcoal mt-0.5">{{ booking.customers.phone ?? $t('admin.dashboard.detailModal.notProvided') }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.nationality') }}</p>
          <p class="text-deep-charcoal mt-0.5">{{ booking.customers.nationality ?? $t('admin.dashboard.detailModal.notProvided') }}</p>
        </div>
        <div>
          <p class="text-steel-grey text-xs uppercase tracking-wide">{{ $t('admin.dashboard.detailModal.age') }}</p>
          <p class="text-deep-charcoal mt-0.5">{{ booking.customers.age ?? $t('admin.dashboard.detailModal.notProvided') }}</p>
        </div>
      </div>

      <hr class="border-steel-grey/20 mb-5" />

      <!-- Comments section -->
      <h3 class="text-deep-charcoal font-bold uppercase tracking-wide text-xs mb-3">
        {{ $t('admin.dashboard.detailModal.commentsSection') }}
      </h3>

      <div v-if="sortedComments.length === 0" class="text-steel-grey text-sm mb-4">
        {{ $t('admin.dashboard.detailModal.noComments') }}
      </div>

      <div v-else class="space-y-2 mb-4">
        <div
          v-for="comment in sortedComments"
          :key="comment.id"
          class="rounded-md p-3"
          :class="authorStyle(comment.author_type).card"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-semibold" :class="[authorStyle(comment.author_type).labelClass, comment.author_type === 'system' ? 'italic' : '']">
              {{ $t(authorStyle(comment.author_type).labelKey) }}
            </span>
            <span class="text-xs text-steel-grey">{{ formatDatetime(comment.created_at) }}</span>
          </div>
          <p class="text-deep-charcoal text-sm whitespace-pre-line">{{ comment.message }}</p>
        </div>
      </div>

      <!-- Add note form -->
      <div>
        <label class="block text-steel-grey text-xs uppercase tracking-wide mb-1">
          {{ $t('admin.dashboard.detailModal.addNoteLabel') }}
        </label>
        <textarea
          v-model="newComment"
          :placeholder="$t('admin.dashboard.detailModal.notePlaceholder')"
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
          {{ isPostingComment ? $t('admin.dashboard.detailModal.savingNote') : $t('admin.dashboard.detailModal.addNoteButton') }}
        </button>
      </div>

    </div>
  </div>
</template>

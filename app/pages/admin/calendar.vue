<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg, CalendarOptions } from '@fullcalendar/core'
import type { BookingWithCustomer, BookingStatus } from '@@/types/booking'

definePageMeta({ layout: 'admin' })

const { t, locale } = useI18n()

useSeoMeta({
  title: () => t('admin.calendar.title'),
  robots: 'noindex, nofollow',
})

const { events, blockRange, unblockDate } = useCalendar()

const pendingRange = ref<{ start: string; end: string } | null>(null)
const pendingReason = ref('')
const pendingUnblockId = ref<string | null>(null)
const isSubmitting = ref(false)
const dialogError = ref<string | null>(null)

const activeBooking = ref<BookingWithCustomer | null>(null)
const popoverPos = ref({ x: 0, y: 0 })

const statusClasses: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  awaiting_payment: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-stone-100 text-stone-600',
  declined: 'bg-zinc-100 text-zinc-700',
  cancelled: 'bg-red-100 text-red-800',
}

const dateFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'de' ? 'de-CH' : 'en-GB', { dateStyle: 'medium' }),
)
const currencyFormatter = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })

function formatDate(d: string) {
  return dateFormatter.value.format(new Date(d))
}

function closePopover() {
  activeBooking.value = null
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePopover()
}

const isRangeBlock = computed(
  () => !!pendingRange.value && pendingRange.value.start !== pendingRange.value.end,
)

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: locale.value === 'de' ? 'de' : 'en',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: '',
  },
  height: 'auto',
  events: events.value,
  selectable: true,
  selectMirror: true,
  unselectAuto: false,
  select: handleSelect,
  eventClick: handleEventClick,
}))

function handleSelect(info: DateSelectArg) {
  pendingRange.value = {
    start: info.startStr,
    end: subtractDay(info.endStr),
  }
  pendingReason.value = ''
  pendingUnblockId.value = null
}

function handleEventClick(info: EventClickArg) {
  const props = info.event.extendedProps
  if (props.type === 'blocked') {
    pendingUnblockId.value = props.blockedId as string
    pendingRange.value = null
    activeBooking.value = null
  } else if (props.type === 'booking') {
    activeBooking.value = props.booking as BookingWithCustomer
    pendingRange.value = null
    pendingUnblockId.value = null

    const POPOVER_W = 288
    const POPOVER_H = 200
    const GAP = 12
    let x = info.jsEvent.clientX + GAP
    let y = info.jsEvent.clientY + GAP
    if (x + POPOVER_W + GAP > window.innerWidth) x = info.jsEvent.clientX - POPOVER_W - GAP
    if (y + POPOVER_H + GAP > window.innerHeight) y = info.jsEvent.clientY - POPOVER_H - GAP
    popoverPos.value = { x, y }
  }
}

async function confirmBlock() {
  if (!pendingRange.value || isSubmitting.value) return
  isSubmitting.value = true
  dialogError.value = null
  try {
    const { start, end } = pendingRange.value
    await blockRange(start, end, pendingReason.value || undefined)
    pendingRange.value = null
  } catch {
    dialogError.value = t('admin.calendar.errorBlock')
  } finally {
    isSubmitting.value = false
  }
}

async function confirmUnblock() {
  if (!pendingUnblockId.value || isSubmitting.value) return
  isSubmitting.value = true
  dialogError.value = null
  try {
    await unblockDate(pendingUnblockId.value)
    pendingUnblockId.value = null
  } catch {
    dialogError.value = t('admin.calendar.errorUnblock')
  } finally {
    isSubmitting.value = false
  }
}

function cancelDialog() {
  pendingRange.value = null
  pendingUnblockId.value = null
  dialogError.value = null
}

function subtractDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
</script>

<template>
  <div class="p-4 sm:p-8">
    <header class="mb-8">
      <h1 class="text-2xl font-bold uppercase tracking-wide text-deep-charcoal">
        {{ t('admin.calendar.title') }}
      </h1>
    </header>

    <!-- Calendar (client-side only — FullCalendar uses DOM APIs) -->
    <ClientOnly>
      <div class="bg-alpine-white rounded-md border border-steel-grey/20 p-4">
        <FullCalendar :options="calendarOptions" />
      </div>

      <template #fallback>
        <div class="flex items-center gap-2 py-8 text-steel-grey text-sm">
          <span class="inline-block w-4 h-4 border-2 border-steel-grey border-t-transparent rounded-full animate-spin" />
          <span>{{ t('admin.common.loading') }}</span>
        </div>
      </template>
    </ClientOnly>

    <!-- Legend + hint -->
    <div class="mt-4">
      <div class="flex flex-wrap items-center gap-4 text-xs text-steel-grey">
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-sm bg-[#C8102E]" />
          {{ t('admin.calendar.legend.booked') }}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-sm bg-[#8E8E93]" />
          {{ t('admin.calendar.legend.blocked') }}
        </span>
      </div>
      <p class="mt-2 text-xs text-steel-grey">{{ t('admin.calendar.dragHint') }}</p>
    </div>

    <!-- Block date / range dialog -->
    <div
      v-if="pendingRange"
      class="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40"
      @click.self="cancelDialog"
    >
      <div class="bg-alpine-white rounded-md shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 class="text-base font-bold uppercase tracking-wide text-deep-charcoal mb-1">
          {{ isRangeBlock ? t('admin.calendar.blockRange') : t('admin.calendar.blockDate') }}
        </h2>
        <p class="text-sm text-steel-grey mb-4">
          <template v-if="isRangeBlock">
            {{ pendingRange.start }} – {{ pendingRange.end }}
          </template>
          <template v-else>
            {{ pendingRange.start }}
          </template>
        </p>
        <label class="block text-xs text-steel-grey mb-1">
          {{ t('admin.calendar.blockReason') }}
        </label>
        <input
          v-model="pendingReason"
          type="text"
          class="w-full border border-steel-grey/30 rounded px-3 py-2 text-sm text-deep-charcoal focus:outline-none focus:border-deep-charcoal mb-4"
          @keyup.enter="confirmBlock"
        />
        <p v-if="dialogError" class="mb-3 text-xs text-taillight-ruby">{{ dialogError }}</p>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 text-sm text-steel-grey hover:text-deep-charcoal transition-colors min-h-[44px]"
            @click="cancelDialog"
          >
            {{ t('admin.calendar.cancel') }}
          </button>
          <button
            :disabled="isSubmitting"
            class="px-4 py-2 bg-deep-charcoal text-alpine-white text-sm font-medium rounded transition-opacity disabled:opacity-50 min-h-[44px]"
            @click="confirmBlock"
          >
            {{ t('admin.calendar.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Booking popover -->
    <template v-if="activeBooking">
      <div class="fixed inset-0 z-40" @click="closePopover" />

      <!-- Mobile: centered modal (hidden on sm+) -->
      <div class="sm:hidden fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-md border border-steel-grey/20 bg-alpine-white shadow-xl">
        <div class="flex items-start justify-between gap-2 border-b border-steel-grey/10 px-4 py-3">
          <div>
            <p class="font-semibold text-sm text-deep-charcoal leading-tight">{{ activeBooking.customers.name }}</p>
            <p class="text-xs text-steel-grey mt-0.5">{{ activeBooking.customers.email }}</p>
          </div>
          <button
            type="button"
            class="text-steel-grey hover:text-deep-charcoal transition-colors mt-0.5 leading-none shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            @click="closePopover"
          >
            ✕
          </button>
        </div>
        <div class="px-4 py-3 grid gap-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.period') }}</span>
            <span class="text-deep-charcoal font-medium text-xs">
              {{ formatDate(activeBooking.start_date) }} – {{ formatDate(activeBooking.end_date) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.status') }}</span>
            <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold" :class="statusClasses[activeBooking.status]">
              {{ t(`admin.dashboard.status.${activeBooking.status}`) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.total') }}</span>
            <span class="text-deep-charcoal font-semibold text-xs tabular-nums">{{ currencyFormatter.format(activeBooking.total_price) }}</span>
          </div>
        </div>
        <div class="border-t border-steel-grey/10 px-4 py-3">
          <NuxtLink
            :to="`/admin/bookings/${activeBooking.id}`"
            class="block w-full text-center rounded bg-deep-charcoal px-3 py-2 text-xs font-semibold uppercase tracking-wide text-alpine-white transition-opacity hover:opacity-80"
            @click="closePopover"
          >
            {{ t('admin.dashboard.actions.viewDetails') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Desktop: JS-positioned tooltip (hidden on mobile) -->
      <div
        class="hidden sm:block fixed z-50 w-72 rounded-md border border-steel-grey/20 bg-alpine-white shadow-xl"
        :style="{ top: popoverPos.y + 'px', left: popoverPos.x + 'px' }"
      >
        <div class="flex items-start justify-between gap-2 border-b border-steel-grey/10 px-4 py-3">
          <div>
            <p class="font-semibold text-sm text-deep-charcoal leading-tight">{{ activeBooking.customers.name }}</p>
            <p class="text-xs text-steel-grey mt-0.5">{{ activeBooking.customers.email }}</p>
          </div>
          <button
            type="button"
            class="text-steel-grey hover:text-deep-charcoal transition-colors mt-0.5 leading-none shrink-0"
            @click="closePopover"
          >
            ✕
          </button>
        </div>
        <div class="px-4 py-3 grid gap-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.period') }}</span>
            <span class="text-deep-charcoal font-medium text-xs">
              {{ formatDate(activeBooking.start_date) }} – {{ formatDate(activeBooking.end_date) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.status') }}</span>
            <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold" :class="statusClasses[activeBooking.status]">
              {{ t(`admin.dashboard.status.${activeBooking.status}`) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-steel-grey text-xs uppercase tracking-wide">{{ t('admin.dashboard.detailModal.total') }}</span>
            <span class="text-deep-charcoal font-semibold text-xs tabular-nums">{{ currencyFormatter.format(activeBooking.total_price) }}</span>
          </div>
        </div>
        <div class="border-t border-steel-grey/10 px-4 py-3">
          <NuxtLink
            :to="`/admin/bookings/${activeBooking.id}`"
            class="block w-full text-center rounded bg-deep-charcoal px-3 py-2 text-xs font-semibold uppercase tracking-wide text-alpine-white transition-opacity hover:opacity-80"
            @click="closePopover"
          >
            {{ t('admin.dashboard.actions.viewDetails') }}
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- Unblock date dialog -->
    <div
      v-if="pendingUnblockId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40"
      @click.self="cancelDialog"
    >
      <div class="bg-alpine-white rounded-md shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 class="text-base font-bold uppercase tracking-wide text-deep-charcoal mb-3">
          {{ t('admin.calendar.unblockDate') }}
        </h2>
        <p v-if="dialogError" class="mb-3 text-xs text-taillight-ruby">{{ dialogError }}</p>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 text-sm text-steel-grey hover:text-deep-charcoal transition-colors min-h-[44px]"
            @click="cancelDialog"
          >
            {{ t('admin.calendar.cancel') }}
          </button>
          <button
            :disabled="isSubmitting"
            class="px-4 py-2 bg-taillight-ruby text-alpine-white text-sm font-medium rounded transition-opacity disabled:opacity-50 min-h-[44px]"
            @click="confirmUnblock"
          >
            {{ t('admin.calendar.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg, CalendarOptions } from '@fullcalendar/core'

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
  }
}

async function confirmBlock() {
  if (!pendingRange.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    const { start, end } = pendingRange.value
    await blockRange(start, end, pendingReason.value || undefined)
    pendingRange.value = null
  } finally {
    isSubmitting.value = false
  }
}

async function confirmUnblock() {
  if (!pendingUnblockId.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await unblockDate(pendingUnblockId.value)
    pendingUnblockId.value = null
  } finally {
    isSubmitting.value = false
  }
}

function cancelDialog() {
  pendingRange.value = null
  pendingUnblockId.value = null
}

function subtractDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
</script>

<template>
  <div class="p-8">
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
      <div class="flex items-center gap-6 text-xs text-steel-grey">
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

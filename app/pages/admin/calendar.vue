<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { EventClickArg, CalendarOptions } from '@fullcalendar/core'

definePageMeta({ layout: 'admin' })

const { t, locale } = useI18n()

useSeoMeta({
  title: () => t('admin.calendar.title'),
  robots: 'noindex, nofollow',
})

const { events, blockedDateSet, blockDate, unblockDate } = useCalendar()

// Inline block dialog state
const pendingDate = ref<string | null>(null)
const pendingReason = ref('')
const pendingUnblockId = ref<string | null>(null)
const isSubmitting = ref(false)

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
  dateClick: handleDateClick,
  eventClick: handleEventClick,
}))

function handleDateClick(info: DateClickArg) {
  const date = info.dateStr
  if (blockedDateSet.value.has(date)) return
  pendingDate.value = date
  pendingReason.value = ''
  pendingUnblockId.value = null
}

function handleEventClick(info: EventClickArg) {
  const props = info.event.extendedProps
  if (props.type === 'blocked') {
    pendingUnblockId.value = props.blockedId as string
    pendingDate.value = null
  }
}

async function confirmBlock() {
  if (!pendingDate.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await blockDate(pendingDate.value, pendingReason.value || undefined)
    pendingDate.value = null
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
  pendingDate.value = null
  pendingUnblockId.value = null
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

    <!-- Legend -->
    <div class="flex items-center gap-6 mt-4 text-xs text-steel-grey">
      <span class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-3 rounded-sm bg-[#C8102E]" />
        {{ t('admin.calendar.legend.booked') }}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-3 rounded-sm bg-[#8E8E93]" />
        {{ t('admin.calendar.legend.blocked') }}
      </span>
    </div>

    <!-- Block date dialog -->
    <div
      v-if="pendingDate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40"
      @click.self="cancelDialog"
    >
      <div class="bg-alpine-white rounded-md shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 class="text-base font-bold uppercase tracking-wide text-deep-charcoal mb-1">
          {{ t('admin.calendar.blockDate') }}
        </h2>
        <p class="text-sm text-steel-grey mb-4">{{ pendingDate }}</p>
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

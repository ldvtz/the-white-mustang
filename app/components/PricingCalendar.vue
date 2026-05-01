<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { CalendarOptions } from '@fullcalendar/core'
import { listIsoDateRange } from '@@/shared/booking'
import '~/assets/css/fullcalendar.css'

const { t, locale } = useI18n()

const props = defineProps<{
  selectedStartDate?: string
  selectedEndDate?: string
  unavailableDates?: string[]
}>()

const emit = defineEmits<{
  selectDate: [date: string]
}>()

// Fictional unavailable days (fixed offsets from today so tests are stable)
const BLOCKED_OFFSETS = [3, 11, 18, 25, 34, 45, 52, 60, 72, 80]

const unavailableDateSet = computed(() => new Set(props.unavailableDates ?? []))

const blockedSet = computed(() => new Set(
  BLOCKED_OFFSETS.map(offset => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return toDateString(d)
  })
))

const selectedDateSet = computed(() => {
  const { selectedStartDate, selectedEndDate } = props
  if (!selectedStartDate) return new Set<string>()
  return new Set(listIsoDateRange(selectedStartDate, selectedEndDate || selectedStartDate))
})

function buildEvents() {
  const events: Array<{ start: string; display: string; backgroundColor: string; borderColor: string; title: string }> = []
  const today = new Date()
  const end = new Date(today)
  end.setMonth(end.getMonth() + 12)

  const cursor = new Date(today)
  cursor.setDate(1)

  while (cursor <= end) {
    const iso = toDateString(cursor)
    const dow = cursor.getDay() // 0=Sun,1=Mon,...,6=Sat
    const month = cursor.getMonth() + 1 // 1-based

    if (blockedSet.value.has(iso) || unavailableDateSet.value.has(iso)) {
      // Booked: transparent — visual treatment handled by fc-day-booked CSS class
      events.push({
        start: iso,
        display: 'background',
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        title: '',
      })
    } else if (month === 7 || month === 8) {
      // Peak season
      events.push({
        start: iso,
        display: 'background',
        backgroundColor: '#FFF3E0',
        borderColor: 'transparent',
        title: '',
      })
    } else if (dow === 5 || dow === 6 || dow === 0) {
      // Fri, Sat, Sun — weekend
      events.push({
        start: iso,
        display: 'background',
        backgroundColor: '#FEF9EE',
        borderColor: 'transparent',
        title: '',
      })
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return events
}

const selectedEvents = computed(() => {
  const { selectedStartDate, selectedEndDate } = props
  if (!selectedStartDate) return []

  const endDate = selectedEndDate || selectedStartDate

  return listIsoDateRange(selectedStartDate, endDate).map((date) => ({
    start: date,
    display: 'background',
    backgroundColor: 'rgba(200, 16, 46, 0.15)',
    borderColor: 'transparent',
    title: '',
  }))
})

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: locale.value === 'de' ? 'de' : 'en',
  headerToolbar: {
    left: 'prev',
    center: 'title',
    right: 'next',
  },
  firstDay: 1,
  height: 'auto',
  events: [...buildEvents(), ...selectedEvents.value],
  eventDisplay: 'background',
  dayCellClassNames: (arg) => {
    const iso = toDateString(arg.date)
    const classes: string[] = []
    if (blockedSet.value.has(iso) || unavailableDateSet.value.has(iso)) {
      classes.push('fc-day-booked', 'cursor-not-allowed')
    } else {
      classes.push('cursor-pointer')
      if (selectedDateSet.value.has(iso)) classes.push('fc-day-selected')
    }
    return classes
  },
  dayCellDidMount: (arg) => {
    arg.el.setAttribute('data-testid', `pricing-calendar-day-${toDateString(arg.date)}`)
  },
  dateClick: handleDateClick,
  selectable: false,
  editable: false,
}))

function handleDateClick(info: DateClickArg) {
  if (unavailableDateSet.value.has(info.dateStr) || blockedSet.value.has(info.dateStr)) return
  emit('selectDate', info.dateStr)
}

function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
</script>

<template>
  <div data-testid="pricing-calendar">
    <ClientOnly>
      <FullCalendar :options="calendarOptions" />
      <template #fallback>
        <section
          class="h-96 flex flex-col items-center justify-center px-6 text-center text-steel-grey"
          aria-labelledby="availability-summary"
        >
          <h3 id="availability-summary" class="sr-only">
            {{ t('storefront.pricing.heading') }}
          </h3>
          <p class="text-sm">
            {{ t('storefront.pricing.calendarNote') }}
          </p>
        </section>
      </template>
    </ClientOnly>
    <PricingLegend />
  </div>
</template>

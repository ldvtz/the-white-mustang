<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'

const { t, locale } = useI18n()

// Fictional unavailable days (fixed offsets from today so tests are stable)
const BLOCKED_OFFSETS = [3, 11, 18, 25, 34, 45, 52, 60, 72, 80]

function buildEvents() {
  const events: Array<{ start: string; display: string; backgroundColor: string; borderColor: string; title: string }> = []
  const today = new Date()
  const end = new Date(today)
  end.setMonth(end.getMonth() + 12)

  // Blocked days
  const blockedSet = new Set(
    BLOCKED_OFFSETS.map(offset => {
      const d = new Date(today)
      d.setDate(d.getDate() + offset)
      return d.toISOString().slice(0, 10)
    })
  )

  const cursor = new Date(today)
  cursor.setDate(1)

  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10)
    const dow = cursor.getDay() // 0=Sun,1=Mon,...,6=Sat
    const month = cursor.getMonth() + 1 // 1-based

    if (blockedSet.has(iso)) {
      events.push({
        start: iso,
        display: 'background',
        backgroundColor: '#E5E5EA',
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

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  locale: locale.value === 'de' ? 'de' : 'en',
  headerToolbar: {
    left: 'prev',
    center: 'title',
    right: 'next',
  },
  firstDay: 1,
  height: 'auto',
  events: buildEvents(),
  eventDisplay: 'background',
  dayCellClassNames: 'cursor-default',
  selectable: false,
  editable: false,
}))
</script>

<template>
  <div data-testid="pricing-calendar">
    <ClientOnly>
      <FullCalendar :options="calendarOptions" />
      <template #fallback>
        <div class="h-96 flex items-center justify-center text-steel-grey">
          <span>{{ t('admin.common.loading') }}</span>
        </div>
      </template>
    </ClientOnly>

    <!-- Pricing Legend -->
    <div data-testid="pricing-legend" class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Standard -->
      <div data-testid="legend-standard" class="bg-alpine-white border border-gray-100 rounded-md p-4 shadow-sm">
        <div class="w-4 h-4 rounded-sm bg-white border border-gray-200 mb-3" />
        <p class="text-xs font-bold uppercase tracking-wider text-deep-charcoal">{{ t('storefront.pricing.legend.standard') }}</p>
        <p class="text-lg font-bold text-deep-charcoal mt-1">{{ t('storefront.pricing.legend.standardPrice') }}</p>
        <p class="text-xs text-steel-grey mt-0.5">{{ t('storefront.pricing.legend.standardDesc') }}</p>
      </div>

      <!-- Weekend -->
      <div data-testid="legend-weekend" class="bg-alpine-white border border-gray-100 rounded-md p-4 shadow-sm">
        <div class="w-4 h-4 rounded-sm mb-3" style="background:#FEF9EE; border: 1px solid #F5E6B8;" />
        <p class="text-xs font-bold uppercase tracking-wider text-deep-charcoal">{{ t('storefront.pricing.legend.weekend') }}</p>
        <p class="text-lg font-bold text-deep-charcoal mt-1">{{ t('storefront.pricing.legend.weekendPrice') }}</p>
        <p class="text-xs text-steel-grey mt-0.5">{{ t('storefront.pricing.legend.weekendDesc') }}</p>
      </div>

      <!-- Peak -->
      <div data-testid="legend-peak" class="bg-alpine-white border border-gray-100 rounded-md p-4 shadow-sm">
        <div class="w-4 h-4 rounded-sm mb-3" style="background:#FFF3E0; border: 1px solid #FFD49E;" />
        <p class="text-xs font-bold uppercase tracking-wider text-deep-charcoal">{{ t('storefront.pricing.legend.peak') }}</p>
        <p class="text-lg font-bold text-deep-charcoal mt-1">{{ t('storefront.pricing.legend.peakPrice') }}</p>
        <p class="text-xs text-steel-grey mt-0.5">{{ t('storefront.pricing.legend.peakDesc') }}</p>
      </div>

      <!-- Wedding -->
      <div data-testid="legend-wedding" class="bg-taillight-ruby rounded-md p-4 shadow-sm">
        <div class="w-4 h-4 rounded-sm bg-white/20 mb-3" />
        <p class="text-xs font-bold uppercase tracking-wider text-white">{{ t('storefront.pricing.legend.wedding') }}</p>
        <p class="text-lg font-bold text-white mt-1">{{ t('storefront.pricing.legend.weddingPrice') }}</p>
        <p class="text-xs text-white/70 mt-0.5">{{ t('storefront.pricing.legend.weddingDesc') }}</p>
      </div>
    </div>

    <p class="mt-4 text-xs text-steel-grey text-center">{{ t('storefront.pricing.calendarNote') }}</p>
  </div>
</template>

<style>
.fc .fc-toolbar-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1C1C1E;
}
.fc .fc-button {
  background: transparent !important;
  border: 1px solid #E5E5EA !important;
  color: #1C1C1E !important;
  box-shadow: none !important;
  font-family: 'Montserrat', sans-serif;
  padding: 0.4rem 0.8rem;
}
.fc .fc-button:hover {
  background: #F7F7F7 !important;
}
.fc .fc-col-header-cell-cushion {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8E8E93;
  text-decoration: none;
}
.fc .fc-daygrid-day-number {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  color: #1C1C1E;
  text-decoration: none;
}
.fc .fc-daygrid-day.fc-day-today {
  background: #FFF5F5 !important;
}
.fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
  color: #C8102E;
  font-weight: 700;
}
.fc-theme-standard td, .fc-theme-standard th {
  border-color: #F0F0F2;
}
.fc-theme-standard .fc-scrollgrid {
  border-color: #F0F0F2;
}
</style>

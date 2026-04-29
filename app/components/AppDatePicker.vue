<script setup lang="ts">
import type { Instance } from 'flatpickr/dist/types/instance'
import 'flatpickr/dist/flatpickr.min.css'
import '~/assets/css/flatpickr-brand.css'

const props = defineProps<{
  modelValue: string
  minDate?: string
  disabledDates?: string[]
  testid?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { locale } = useI18n()
const inputRef = ref<HTMLInputElement | null>(null)
let fp: Instance | null = null

onMounted(async () => {
  if (!inputRef.value) return

  const { default: flatpickr } = await import('flatpickr')

  let fpLocale
  if (locale.value === 'de') {
    const { German } = await import('flatpickr/dist/l10n/de')
    fpLocale = German
  }

  fp = flatpickr(inputRef.value, {
    dateFormat: 'Y-m-d',
    minDate: props.minDate ?? 'today',
    disable: props.disabledDates ?? [],
    locale: fpLocale,
    defaultDate: props.modelValue || undefined,
    disableMobile: true,
    onChange: (dates) => {
      emit('update:modelValue', dates[0] ? dates[0].toISOString().slice(0, 10) : '')
    },
  })
})

onBeforeUnmount(() => fp?.destroy())

watch(() => props.modelValue, (val) => {
  if (!fp) return
  const current = fp.selectedDates[0] ? fp.selectedDates[0].toISOString().slice(0, 10) : ''
  if (current === val) return
  if (val) fp.setDate(val, false)
  else fp.clear(false)
})

watch(() => props.minDate, (val) => {
  fp?.set('minDate', val ?? 'today')
})

watch(() => props.disabledDates, (val) => {
  fp?.set('disable', val ?? [])
}, { deep: true })
</script>

<template>
  <input
    ref="inputRef"
    :data-testid="testid"
    type="text"
    readonly
    class="mt-2 min-h-[44px] w-full cursor-pointer rounded-md border border-steel-grey/30 bg-alpine-white px-3 text-sm text-deep-charcoal focus:border-deep-charcoal focus:outline-none"
  />
</template>

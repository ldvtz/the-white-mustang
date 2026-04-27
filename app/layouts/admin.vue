<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const supabase = useSupabaseClient()

const navItems = [
  { labelKey: 'admin.nav.dashboard', to: '/admin' },
  { labelKey: 'admin.nav.calendar', to: '/admin/calendar' },
  { labelKey: 'admin.nav.handover', to: '/admin/handover' },
  { labelKey: 'admin.nav.customers', to: '/admin/customers' },
]

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo(localePath('/admin/login'))
}
</script>

<template>
  <div class="flex h-screen bg-pearl-white font-sans">
    <aside class="w-64 bg-deep-charcoal flex flex-col shrink-0">
      <div class="px-6 py-8 border-b border-white/10">
        <span class="block text-alpine-white font-bold uppercase tracking-widest text-sm">
          The White Mustang
        </span>
        <span class="block text-steel-grey text-xs mt-1 uppercase tracking-wider">Admin</span>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="localePath(item.to)"
          class="flex items-center px-3 py-2.5 rounded text-sm font-medium transition-colors min-h-[44px]"
          :class="route.path === localePath(item.to)
            ? 'bg-taillight-ruby text-alpine-white'
            : 'text-steel-grey hover:text-alpine-white hover:bg-white/5'"
        >
          {{ t(item.labelKey) }}
        </NuxtLink>
      </nav>

      <div class="px-6 py-4 border-t border-white/10">
        <button
          type="button"
          class="mb-4 flex min-h-[44px] w-full items-center rounded px-3 text-left text-sm font-medium text-steel-grey transition-colors hover:bg-white/5 hover:text-alpine-white"
          @click="signOut"
        >
          {{ t('admin.nav.signOut') }}
        </button>
        <span class="text-steel-grey text-xs">{{ t('admin.nav.domain') }}</span>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const supabase = useSupabaseClient()

const navItems = [
  { labelKey: 'admin.nav.dashboard', to: '/admin' },
  { labelKey: 'admin.nav.calendar', to: '/admin/calendar' },
]

const sidebarOpen = ref(false)
function closeSidebar() { sidebarOpen.value = false }

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo(localePath('/admin/login'))
}
</script>

<template>
  <div class="flex h-screen bg-pearl-white font-sans">
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-deep-charcoal flex flex-col shrink-0
             transform transition-transform duration-300 ease-in-out
             lg:relative lg:translate-x-0 lg:z-auto"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="px-6 py-8 border-b border-white/10 flex items-center">
        <div>
          <span class="block text-alpine-white font-bold uppercase tracking-widest text-sm">
            The White Mustang
          </span>
          <span class="block text-steel-grey text-xs mt-1 uppercase tracking-wider">Admin</span>
        </div>
        <button
          class="lg:hidden ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-steel-grey hover:text-alpine-white"
          aria-label="Close menu"
          @click="closeSidebar"
        >
          ✕
        </button>
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
          @click="closeSidebar"
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

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="closeSidebar"
    />

    <main class="flex-1 overflow-auto flex flex-col">
      <header class="lg:hidden flex items-center px-4 py-3 bg-deep-charcoal border-b border-white/10 shrink-0">
        <button
          class="text-alpine-white p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center flex-col gap-1"
          aria-label="Open menu"
          @click="sidebarOpen = true"
        >
          <span class="block w-5 h-0.5 bg-current" />
          <span class="block w-5 h-0.5 bg-current" />
          <span class="block w-5 h-0.5 bg-current" />
        </button>
        <span class="ml-3 text-alpine-white font-bold uppercase tracking-widest text-sm">
          The White Mustang
        </span>
      </header>
      <slot />
    </main>
  </div>
</template>

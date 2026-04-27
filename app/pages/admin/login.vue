<script setup lang="ts">
import { hasAdminRole } from '@@/shared/adminAuth'
import type { Database } from '@@/types/supabase'

definePageMeta({ layout: false })

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const supabase = useSupabaseClient<Database>()

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorKey = ref<string | null>(
  route.query.reason === 'unauthorized' ? 'admin.login.errorUnauthorized' : null,
)

useSeoMeta({
  title: () => t('admin.login.seoTitle'),
  description: () => t('admin.login.seoDescription'),
  ogTitle: () => t('admin.login.seoTitle'),
  ogDescription: () => t('admin.login.seoDescription'),
  robots: 'noindex, nofollow',
})

const canSubmit = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) && password.value.length > 0,
)

async function submitLogin() {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true
  errorKey.value = null

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    })

    if (error || !data.user) {
      errorKey.value = 'admin.login.errorInvalid'
      return
    }

    if (!hasAdminRole(data.user.app_metadata)) {
      await supabase.auth.signOut()
      errorKey.value = 'admin.login.errorUnauthorized'
      return
    }

    await navigateTo(getSafeRedirectPath())
  } catch {
    errorKey.value = 'admin.login.errorGeneric'
  } finally {
    isSubmitting.value = false
  }
}

function getSafeRedirectPath(): string {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }

  return localePath('/admin')
}
</script>

<template>
  <main class="min-h-screen bg-alpine-white font-sans text-deep-charcoal">
    <section class="grid min-h-screen lg:grid-cols-[1fr_520px]">
      <div class="hidden lg:flex flex-col justify-between bg-deep-charcoal px-14 py-12 text-alpine-white">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.35em] text-alpine-white">
            {{ t('admin.login.brand') }}
          </p>
          <p class="mt-3 text-sm uppercase tracking-[0.25em] text-steel-grey">
            {{ t('admin.login.motif') }}
          </p>
        </div>
        <div class="max-w-xl">
          <p class="text-4xl font-bold uppercase leading-tight">
            {{ t('admin.login.statement') }}
          </p>
          <p class="mt-6 text-sm leading-7 text-steel-grey">
            {{ t('admin.login.supporting') }}
          </p>
        </div>
      </div>

      <div class="flex min-h-screen items-center justify-center bg-pearl-white px-6 py-12">
        <article class="w-full max-w-sm">
          <header class="mb-8">
            <p class="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-taillight-ruby">
              {{ t('admin.login.motif') }}
            </p>
            <h1 class="text-3xl font-bold uppercase tracking-wide text-deep-charcoal">
              {{ t('admin.login.title') }}
            </h1>
            <p class="mt-3 text-sm leading-6 text-steel-grey">
              {{ t('admin.login.description') }}
            </p>
          </header>

          <form class="space-y-5" @submit.prevent="submitLogin">
            <div>
              <label for="admin-email" class="block text-xs font-semibold uppercase tracking-wide text-steel-grey">
                {{ t('admin.login.email') }}
              </label>
              <input
                id="admin-email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="mt-2 min-h-[48px] w-full rounded-md border border-steel-grey/30 bg-alpine-white px-4 text-sm text-deep-charcoal outline-none transition-colors focus:border-deep-charcoal"
              />
            </div>

            <div>
              <label for="admin-password" class="block text-xs font-semibold uppercase tracking-wide text-steel-grey">
                {{ t('admin.login.password') }}
              </label>
              <input
                id="admin-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                class="mt-2 min-h-[48px] w-full rounded-md border border-steel-grey/30 bg-alpine-white px-4 text-sm text-deep-charcoal outline-none transition-colors focus:border-deep-charcoal"
              />
            </div>

            <p v-if="errorKey" class="rounded-md border border-taillight-ruby/20 bg-taillight-ruby/5 px-4 py-3 text-sm text-taillight-ruby">
              {{ t(errorKey) }}
            </p>

            <button
              type="submit"
              :disabled="!canSubmit || isSubmitting"
              class="min-h-[48px] w-full rounded-md bg-taillight-ruby px-5 text-sm font-bold uppercase tracking-wide text-alpine-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ isSubmitting ? t('admin.login.submitting') : t('admin.login.submit') }}
            </button>
          </form>
        </article>
      </div>
    </section>
  </main>
</template>

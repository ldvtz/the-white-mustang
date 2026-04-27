import { hasAdminRole } from '@@/shared/adminAuth'

export default defineNuxtRouteMiddleware((to) => {
  const isAdminRoute = /(^|\/)admin(\/|$)/.test(to.path)
  if (!isAdminRoute) return

  const localePath = useLocalePath()
  const isLoginRoute = /(^|\/)admin\/login(\/|$)/.test(to.path)
  const loginPath = localePath('/admin/login')
  const dashboardPath = localePath('/admin')
  const user = useSupabaseUser()

  if (isLoginRoute) {
    if (user.value && hasAdminRole(user.value.app_metadata)) {
      return navigateTo(dashboardPath)
    }
    return
  }

  if (!user.value) {
    return navigateTo({
      path: loginPath,
      query: { redirect: to.fullPath },
    })
  }

  if (!hasAdminRole(user.value.app_metadata)) {
    return navigateTo({
      path: loginPath,
      query: { reason: 'unauthorized' },
    })
  }
})

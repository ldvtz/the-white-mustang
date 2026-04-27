type AdminMetadata = {
  role?: unknown
  roles?: unknown
  admin?: unknown
}

export function hasAdminRole(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false

  const appMetadata = metadata as AdminMetadata
  const roles = appMetadata.roles

  return appMetadata.role === 'admin'
    || appMetadata.admin === true
    || (Array.isArray(roles) && roles.includes('admin'))
}

import type { Organization, User } from '@datagouv/components-next'

export type ExtendedUser = User & {
  organizations: Organization[]
}

import { type Owned } from '@datagouv/components-next'

import config from '@/config'

/**
 *
 */
export const getOwnerAvatar = (
  object: Partial<Owned>,
  size: number = 32
): string => {
  if (
    object.owner?.avatar_thumbnail !== null &&
    object.owner?.avatar_thumbnail !== undefined
  ) {
    return object.owner.avatar_thumbnail
  }
  return `${config.datagouvfr.base_url}/api/1/avatars/${object.owner?.id}/${size}`
}

import type { Organization, User } from '@datagouv/components'

import config from '@/config'

// FIXME: this is an ersatz of the Owned type in @datagouv/components,
// but correctly working with our type system (especially DatasetV2)
// see also @utils/dataset:useOwnerName
// https://github.com/datagouv/udata-front/issues/661
interface HasOwnership {
  organization?: Organization | null
  owner?: User | null
}

export const getOwnerAvatar = (
  object: HasOwnership,
  size: number = 32
): string => {
  if (object.owner?.avatar_thumbnail != null) {
    return object.owner.avatar_thumbnail
  }
  return `${config.datagouvfr.base_url}/api/1/avatars/${object.owner?.id}/${size}`
}

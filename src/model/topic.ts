import type { Owned, Rel } from '@datagouv/components'

import type { SpatialField } from './spatial'

// a placeholder for ecospheres, meteofrance...
// value doesn't really matter, SiteId is used to cast the "real" config value
export type SiteId = 'siteId'

export enum Availability {
  MISSING = 'missing',
  NOT_AVAILABLE = 'not available',
  LOCAL_AVAILABLE = 'available',
  URL_AVAILABLE = 'url available',
  REMOTE_DELETED = 'remote deleted'
}

export interface DatasetProperties {
  title: string
  purpose: string
  uri: string | null
  id: string | null
  availability: Availability
  group?: string
  // those are "local" properties, not stored on data.gouv.fr
  isHidden?: boolean
  remoteDeleted?: boolean
  remoteArchived?: boolean
}

export type DatasetsGroups = Map<string, DatasetProperties[]>

export interface SiteTopicExtras {
  datasets_properties: DatasetProperties[]
  cloned_from?: string
}

export type TopicExtras = Record<SiteId, SiteTopicExtras>

export type Topic = Owned & {
  name: string
  description: string
  created_at: string
  last_modified: string
  extras: TopicExtras
  featured: boolean
  id: string
  page: string
  private: boolean
  reuses: Rel
  datasets: Rel
  slug: string
  tags: string[]
  uri: string
  spatial: SpatialField | undefined
}

export type TopicPostData = Omit<
  Topic,
  'datasets' | 'reuses' | 'id' | 'slug'
> & {
  id?: string
  slug?: string
  datasets: string[]
  reuses: string[]
}

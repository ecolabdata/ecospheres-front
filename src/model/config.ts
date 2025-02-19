import type { SiteId } from './topic'

export interface CanAddTopicsConf {
  everyone: boolean
  authorized_users: string[]
}

export interface TopicsConf {
  slug: string
  name: string
  extras_key: SiteId
  themes: {
    usage: boolean
    main_name: string
    secondary_name: string
  }
  list_all: boolean
  display_metadata: boolean
  activate_read_more: boolean
  dataset_editorialization: boolean
  can_add_topics: CanAddTopicsConf
}

export interface TopicItemConf {
  id: string
  name: string
}

export interface PageConfig {
  title: string
  id: string
  route: string
  url: string
}

export interface MenuConfig {
  text: string
  to: string
}

export interface FilterItemValueConf {
  id: string
  name: string
  parent?: string
}

export interface FilterItemConf {
  name: string
  id: string
  child?: string
  color: string
  values: FilterItemValueConf[]
}

export type Filters = 'bouquets' | 'indicators'

export type FiltersConf = {
  [K in Filters]: {
    tag_prefix: string
    items: FilterItemConf[]
  }
}

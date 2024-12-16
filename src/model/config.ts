import type { SiteId } from './topic'

export interface CanAddElementConf {
  everyone: boolean
  authorized_users: string[]
}

export interface FilterValueConf {
  name: string
  tag: string
  condition_on?: string
}
export interface FilterConf {
  name: string
  tag: string
  condition_on?: string
  values: FilterValueConf[]
}

export interface LabelConf {
  search_page_title: string
  search_bar_title: string
  search_results: string
  add_button: string
  add_title: string
  add_subtitle: string
  subject: string
  description_title: string
  description_info: string
  owner: string
}
export interface SearchConf {
  name: string
  slug: string
  type: string
  organizations: Array<string>
  extras_key: SiteId
  list_all: boolean
  display_metadata: boolean
  activate_read_more: boolean
  dataset_editorialization: boolean
  labels: LabelConf
  can_add: CanAddElementConf
  filters: FilterConf[]
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

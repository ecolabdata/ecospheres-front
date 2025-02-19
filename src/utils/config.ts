import config from '@/config'
import type {
  CanAddTopicsConf,
  Filters,
  FiltersConf,
  TopicsConf
} from '@/model/config'
import type { SiteId } from '@/model/topic'

interface TopicsConfNormalized {
  topicsName: string
  topicsSlug: string
  topicsExtrasKey: SiteId
  topicsUseThemes: boolean
  topicsMainTheme: string
  topicsSecondaryTheme: string
  topicsDatasetEditorialization: boolean
  topicsCanAdd: CanAddTopicsConf
  topicsListAll: boolean
  topicsDisplayMetadata: boolean
  topicsActivateReadMore: boolean
}

export const useTopicsConf = (): TopicsConfNormalized => {
  const topicsConf = config.website.topics as TopicsConf
  return {
    topicsName: topicsConf.name,
    topicsSlug: topicsConf.slug,
    topicsExtrasKey: topicsConf.extras_key,
    topicsUseThemes: topicsConf.themes.usage,
    topicsMainTheme: topicsConf.themes.main_name,
    topicsSecondaryTheme: topicsConf.themes.secondary_name,
    topicsDatasetEditorialization: topicsConf.dataset_editorialization,
    topicsCanAdd: topicsConf.can_add_topics,
    // FIXME: this applies only to breadcrumb on topic detail page
    // apply it also to menu and routes...?
    topicsListAll: topicsConf.list_all,
    topicsDisplayMetadata: topicsConf.display_metadata,
    topicsActivateReadMore: topicsConf.activate_read_more
  }
}

// Get debounce value or set default.
export const debounceWait: number = config.website.default_debounce_wait ?? 600

export const useFiltersConf = (objectType: Filters) => {
  const filtersConf: FiltersConf = config.filters
  return filtersConf[objectType]
}

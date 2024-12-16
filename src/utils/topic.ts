import {
  capitalize,
  computed,
  ref,
  watch,
  type ComputedRef,
  type Ref
} from 'vue'

import type { BreadcrumbItem } from '@/model/breadcrumb'
import type { SiteId } from '@/model/topic'
import {
  Availability,
  type DatasetProperties,
  type SiteTopicExtras,
  type Topic,
  type TopicExtras,
  type TopicPostData
} from '@/model/topic'
import { useTopicStore } from '@/store/TopicStore'
import { useUserStore } from '@/store/UserStore'

export const isAvailable = (availability: Availability): boolean => {
  return [Availability.LOCAL_AVAILABLE, Availability.URL_AVAILABLE].includes(
    availability
  )
}

export const updateTopicExtras = (
  topic: Topic,
  data: Partial<SiteTopicExtras>,
  searchPageExtrasKey: SiteId
): TopicExtras => {
  return {
    ...topic.extras,
    [searchPageExtrasKey]: {
      ...topic.extras[searchPageExtrasKey],
      ...data
    }
  }
}

/**
 * Build a fonctionnal v1 (POST format) topic from clone source data
 */
export const cloneTopic = (
  topic: Topic,
  searchPageExtrasKey: SiteId
): TopicPostData => {
  const { id, slug, ...data } = topic
  return {
    ...data,
    private: true,
    datasets: [],
    reuses: [],
    spatial: undefined,
    owner: useUserStore().data ?? null,
    extras: updateTopicExtras(
      topic,
      {
        cloned_from: topic.id,
        datasets_properties: topic.extras[
          searchPageExtrasKey
        ].datasets_properties.map((dp) => {
          return {
            ...dp,
            id: null,
            uri: null,
            availability: Availability.NOT_AVAILABLE
          }
        })
      },
      searchPageExtrasKey
    )
  }
}

export function useBreadcrumbLinksForTopic(
  theme: Ref<string | undefined>,
  subtheme: Ref<string | undefined>,
  topic: Ref<Topic | null>,
  topicsListAll: boolean | null,
  searchPageSlug: string,
  searchPageName: string
): ComputedRef<BreadcrumbItem[]> {
  return computed(() => {
    const breadcrumbs = [{ to: '/', text: 'Accueil' }]
    if (topicsListAll === true) {
      breadcrumbs.push({
        to: `/${searchPageSlug}`,
        text: `${capitalize(searchPageName)}s`
      })
    }

    if (theme.value !== undefined && subtheme.value !== undefined) {
      breadcrumbs.push(
        { text: theme.value, to: `/${searchPageSlug}/?theme=${theme.value}` },
        {
          text: subtheme.value,
          to: `/${searchPageName}/?theme=${theme.value}&subtheme=${subtheme.value}`
        }
      )
    }

    if (topic?.value != null) {
      breadcrumbs.push({ to: '', text: topic.value.name ?? '' })
    }

    return breadcrumbs
  })
}

export function useExtras(
  topic: Ref<Topic | null>,
  searchPageExtrasKey: SiteId
): {
  theme: Ref<string | undefined>
  subtheme: Ref<string | undefined>
  datasetsProperties: Ref<DatasetProperties[]>
  clonedFrom: Ref<Topic | null>
} {
  const theme: Ref<string | undefined> = ref()
  const subtheme: Ref<string | undefined> = ref()
  const datasetsProperties: Ref<DatasetProperties[]> = ref([])
  const clonedFrom = ref<Topic | null>(null)

  watch(
    topic,
    () => {
      const extras = topic.value?.extras[searchPageExtrasKey]
      if (extras != null) {
        datasetsProperties.value = extras.datasets_properties ?? []

        if (extras.cloned_from != null) {
          useTopicStore()
            .load(extras.cloned_from, { toasted: false })
            .then((res) => {
              clonedFrom.value = res
            })
            .catch((err) => {
              console.error('Failed fetching cloned_from', err.response?.data)
              clonedFrom.value = null
            })
        } else {
          clonedFrom.value = null
        }
      } else {
        theme.value = undefined
        subtheme.value = undefined
        datasetsProperties.value = []
        clonedFrom.value = null
      }
    },
    { immediate: true }
  )

  return { theme, subtheme, datasetsProperties, clonedFrom }
}

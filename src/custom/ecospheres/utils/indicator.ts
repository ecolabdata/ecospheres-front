import config from '@/config'
import { useSpatialStore } from '@/store/SpatialStore'
import type { DatasetV2 } from '@datagouv/components'
import type { ComputedRef } from 'vue'
import type { IndicatorsConf } from '../model/config'
import type {
  Indicator,
  IndicatorExtras,
  IndicatorExtrasCalcul,
  IndicatorExtrasSource,
  IndicatorFilters,
  IndicatorsExtrasApi,
  IndicatorTag
} from '../model/indicator'

const indicatorsConf = config.indicators as IndicatorsConf
const tagPrefix = indicatorsConf.global_tag_prefix
const filters = indicatorsConf.filters

export const UNFILLED_LABEL = 'Non renseigné'

interface QueryArgs extends IndicatorFilters {
  [key: string]: string | null
}

/**
 * Build an array of normalized tags from query components and clean the original QueryArgs
 */
export const useTagsQuery = (
  query: QueryArgs
): { tag: Array<string>; extraArgs: QueryArgs } => {
  const queryArray = []
  for (const filter of filters) {
    if (query[filter.id] != null) {
      queryArray.push(`${tagPrefix}-${filter.id}-${query[filter.id]}`)
    }
    delete query[filter.id]
  }
  return {
    tag: queryArray,
    extraArgs: query
  }
}

/**
 * Extract and denormalize tags from an indicator
 */
export const useTags = (
  indicator?: Indicator,
  type?: string,
  exclude?: string[]
): ComputedRef<IndicatorTag[]> => {
  return computed(() => {
    const tags: IndicatorTag[] = []

    for (const tag of indicator?.tags || []) {
      if (!tag.startsWith(tagPrefix)) continue

      for (const filter of filters) {
        if (type && type !== filter.id) continue
        if (exclude?.includes(filter.id)) continue

        const filterPrefix = `${tagPrefix}-${filter.id}-`
        if (!tag.startsWith(filterPrefix)) continue

        const value = tag.replace(filterPrefix, '')
        const matchingValue = filter.values.find((v) => v.id === value)

        if (matchingValue) {
          tags.push({
            color: filter.color,
            value: matchingValue.name,
            type: filter.id
          })
        }
      }
    }

    return tags
  })
}

export const useIndicatorExtras = (indicator: Ref<Indicator | undefined>) => {
  const unite: Ref<string | undefined> = ref()
  const mailles: Ref<string[]> = ref([])
  const axes: Ref<Record<string, string[]>> = ref({})
  const calcul: Ref<IndicatorExtrasCalcul | undefined> = ref()
  const sources: Ref<IndicatorExtrasSource[]> = ref([])
  const api: Ref<IndicatorsExtrasApi | undefined> = ref()

  const store = useSpatialStore()
  store.loadLevels()

  watch(
    indicator,
    () => {
      const extras: IndicatorExtras =
        indicator.value?.extras?.['ecospheres-indicateurs']
      if (extras) {
        unite.value = extras.unite
        mailles.value = (extras.mailles_geographiques || [])
          .map((m: string) => store.getLevelById(m)?.name)
          .filter((v) => v !== undefined)
        axes.value = extras.axes
        calcul.value = extras.calcul
        api.value = extras.api
        sources.value = extras.sources
      }
    },
    { immediate: true }
  )

  return {
    unite,
    mailles,
    axes,
    calcul,
    api,
    sources
  }
}

// FIXME: use only tagPrefix when test data are OK
export const isIndicator = (
  dataset: Ref<DatasetV2 | undefined>
): ComputedRef<boolean> => {
  return computed(() => {
    return (
      dataset.value?.tags?.some((tag) => tag.startsWith(tagPrefix)) || false
    )
  })
}

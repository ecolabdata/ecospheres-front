import { useFiltersConf } from '@/utils/config'
import type { IndicatorFilterConf } from '../model/config'
import { type IndicatorFilters, FILTER_KEYS } from '../model/indicator'

export const useIndicatorsFiltersConf = () => {
  return FILTER_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: useIndicatorsFilterConf(key)
    }),
    {} as Record<keyof IndicatorFilters, IndicatorFilterConf>
  )
}

export const useIndicatorsFilterConf = (
  filter: keyof IndicatorFilters
): IndicatorFilterConf => {
  const filters = useFiltersConf('indicators').items
  const filterConf = filters.find((f) => f.id === filter)
  if (!filterConf) {
    throw new Error(`Filter ${filter} not found`)
  }
  return filterConf as IndicatorFilterConf
}

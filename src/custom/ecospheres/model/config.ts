import { type FilterItemConf } from '@/model/config'
import { type IndicatorFilters } from './indicator'

export type IndicatorFilterConf = FilterItemConf & {
  id: keyof IndicatorFilters
}

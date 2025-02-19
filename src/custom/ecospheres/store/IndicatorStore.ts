import { defineStore } from 'pinia'

import config from '@/config'
import SearchAPI from '@/services/api/SearchAPI'
import type { IndicatorsConf } from '../model/config'
import type { Indicator, IndicatorFilters } from '../model/indicator'
import { useTagsQuery } from '../utils/indicator'

const searchApi = new SearchAPI()
const PAGE_SIZE = 20

const indicatorsConf = config.indicators as IndicatorsConf
const tagPrefix = indicatorsConf.global_tag_prefix

export interface RootState {
  indicators: Indicator[]
  total: number
}

interface QueryArgs extends IndicatorFilters {
  query: string
  geozone: string | null
}

export const useIndicatorStore = defineStore('indicator', {
  state: (): RootState => ({
    indicators: [],
    total: 0
  }),
  actions: {
    async query(args: QueryArgs) {
      const { query, ...queryArgs } = args
      const { extraArgs, tag } = useTagsQuery(queryArgs)
      const results = await searchApi.search(query, null, 1, {
        organization: config.indicators.organization_id,
        page_size: PAGE_SIZE,
        tag: [tagPrefix, ...tag],
        ...extraArgs
      })
      this.indicators = results.data as Indicator[]
      this.total = results.total
    }
  },
  getters: {
    pagination() {
      const nbPages = Math.ceil(this.total / PAGE_SIZE)
      return [...Array(nbPages).keys()].map((page) => {
        page += 1
        return {
          label: page.toString(),
          href: '#',
          title: `Page ${page}`
        }
      })
    }
  }
})

import { defineStore } from 'pinia'

import config from '@/config'
import SearchAPI from '@/services/api/SearchAPI'
import { useTagsQuery } from '@/utils/tags'
import type { Indicator, IndicatorFilters } from '../model/indicator'

const searchApi = new SearchAPI()
const PAGE_SIZE = 20

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
      const { extraArgs, tag } = useTagsQuery('indicators', queryArgs)
      const results = await searchApi.search(query, null, 1, {
        organization: config.universe.indicators.organization_id,
        page_size: PAGE_SIZE,
        tag,
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

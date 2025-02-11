import { defineStore } from 'pinia'

import config from '@/config'
import SearchAPI from '@/services/api/SearchAPI'

const searchAPI = new SearchAPI()
const pageSize = 20

export const useSearchStore = defineStore('search', {
  state: () => ({
    data: {}
  }),
  getters: {
    facets: (state) => {
      return state.data.facetDistribution || {}
    },
    datasets: (state) => {
      return state.data.data || []
    },
    total: (state) => {
      return state.data.total
    },
    pagination: (state) => {
      if (!state.data) return []
      if (!state.data.total && !state.data.page_size) return []
      return [
        ...Array(Math.ceil(state.data.total / state.data.page_size)).keys()
      ].map((page) => {
        page += 1
        return {
          label: page.toString(),
          href: '#',
          title: `Page ${page}`
        }
      })
    }
  },
  actions: {
    async search(query, topic, page = 1, args = {}) {
      const results = await searchAPI.search(
        query,
        topic || config.universe.topic_id,
        page,
        { ...args, page_size: pageSize }
      )
      this.data = results
    }
  }
})

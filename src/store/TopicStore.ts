import { defineStore } from 'pinia'
import { computed, type ComputedRef } from 'vue'

import config from '@/config'
import type { BaseParams } from '@/model/api'
import type { TopicItemConf } from '@/model/config'
import type { Topic } from '@/model/topic'
import TopicsAPI from '@/services/api/resources/TopicsAPI'
import { type QueryArgs, useTagsQuery } from '@/utils/tags'

import { useUserStore } from './UserStore'

const PAGE_SIZE = 20

const topicsAPI = new TopicsAPI()
const topicsAPIv2 = new TopicsAPI({ version: 2 })

type SortCriterions = '-created_at' | '-last_modified' | 'name'

export interface RootState {
  // FIXME: merge with data
  topics: Topic[]
  total: number
  data: Topic[]
  isLoaded: boolean
  sort: SortCriterions
}

export const useTopicStore = defineStore('topic', {
  state: (): RootState => ({
    topics: [],
    total: 0,
    data: [],
    // flag for initial/remote loading of data
    isLoaded: false,
    sort: '-created_at'
  }),
  getters: {
    // Computed property to get topics writable by the current user sorted by last_modified
    // FIXME: this one might be tough to migrate to data.gouv.fr API
    // but we don't need pagination or filters, so maybe just load everything?
    myTopics(): ComputedRef<Topic[]> {
      const userStore = useUserStore()
      return computed(() => {
        if (!userStore.isLoggedIn) return []
        return this.sortedByDateDesc('last_modified').filter((topic: Topic) =>
          userStore.hasEditPermissions(topic)
        )
      })
    },
    sortedByDateDesc:
      (state) => (attribute: 'created_at' | 'last_modified') => {
        return [...state.data].sort((a, b) => {
          const dateA = new Date(a[attribute])
          const dateB = new Date(b[attribute])
          return dateB.getTime() - dateA.getTime()
        })
      },
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
  },
  actions: {
    async query(args: QueryArgs) {
      const { query, ...queryArgs } = args
      const { extraArgs, tag } = useTagsQuery('topics', queryArgs)
      const results = await topicsAPIv2.list({
        params: {
          q: query,
          tag: [config.universe.name, ...tag],
          page_size: PAGE_SIZE,
          ...extraArgs
        }
      })
      this.topics = results.data
      this.total = results.total
    },
    /**
     * Load topics to store from a list of ids and API
     */
    async loadTopicsFromList(topics: TopicItemConf[]) {
      this.data = []
      for (const topic of topics) {
        const res = await topicsAPIv2.get({ entityId: topic.id })
        this.data.push(res)
      }
    },
    /**
     * Filter a list of topics related to the current universe and private or not
     */
    filter(topics: Topic[]) {
      const draftFilter = (topic: Topic): boolean => {
        if (!topic.private) return true
        // FIXME: migrate to data.gouv.fr API
        return useUserStore().hasEditPermissions(topic)
      }
      return topics.filter((topic) => {
        return topic.id !== config.universe.topic_id && draftFilter(topic)
      })
    },
    /**
     * Load universe related topics from API
     */
    async loadTopicsForUniverse(): Promise<Topic[]> {
      if (this.isLoaded) return this.data
      let response = await topicsAPIv2.list({
        params: {
          page_size: config.website.pagination_sizes.topics_list,
          tag: config.universe.name,
          include_private: 'yes'
        },
        authenticated: true
      })
      await useUserStore().waitForStoreInit()
      this.data = this.filter(response.data)
      while (response.next_page !== null) {
        response = await topicsAPIv2.request({
          url: response.next_page,
          method: 'get'
        })
        this.data = [...this.data, ...this.filter(response.data)]
      }
      this.isLoaded = true
      return this.data
    },
    /**
     * Get a topic from store
     */
    get(slugOrId: string): Topic | undefined {
      return this.data.find((b) => b.slug === slugOrId || b.id === slugOrId)
    },
    /**
     * Get a single topic from store or API
     */
    async load(slugOrId: string, params?: BaseParams): Promise<Topic> {
      const existing = this.get(slugOrId)
      if (existing !== undefined) return existing
      const topic = await topicsAPIv2.get({ entityId: slugOrId, ...params })
      this.data.push(topic)
      return topic
    },
    /**
     * Create a topic
     */
    async create(topicData: object): Promise<Topic> {
      const res = await topicsAPI.create({ data: topicData })
      // get the v2 version (create res is v1) for storage
      const topic = await topicsAPIv2.get({ entityId: res.id })
      this.data.push(topic)
      return topic
    },
    /**
     * Update a topic
     */
    async update(topicId: string, data: object): Promise<Topic> {
      const res = await topicsAPI.update({ entityId: topicId, data })
      const idx = this.data.findIndex((b) => b.id === topicId)
      // do not apply reuses and datasets because they're in v1 format
      const { reuses, datasets, ...remoteData } = res
      this.data[idx] = { ...this.data[idx], ...remoteData }
      return res
    },
    /**
     * Delete a topic
     */
    async delete(topicId: string) {
      await topicsAPI.delete({ entityId: topicId })
      const idx = this.data.findIndex((b) => b.id === topicId)
      this.data.splice(idx, 1)
    }
  }
})

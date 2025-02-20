import type { Rel } from '@datagouv/components-next'
import { defineStore } from 'pinia'

import config from '@/config'
import type { Resource, ResourceData, ResourceType } from '@/model/resource'
import DatasetsAPI from '@/services/api/resources/DatasetsAPI'

const datasetsApi = new DatasetsAPI()
const datasetsApiv2 = new DatasetsAPI({ version: 2 })
const pageSize: number = config.website.pagination_sizes.files_list

export interface RootState {
  data: Record<string, ResourceData[]>
  resourceTypes: ResourceType[]
}

export const useResourceStore = defineStore('resource', {
  state: (): RootState => ({
    data: {},
    resourceTypes: []
  }),
  actions: {
    /**
     * Load resources from the API via a HATEOAS rel
     *
     */
    async loadResources(datasetId: string, rel: Rel): Promise<ResourceData[]> {
      if (datasetId in this.data) {
        return this.data[datasetId]
      }
      if (this.resourceTypes.length === 0) {
        this.resourceTypes = await datasetsApi.get({
          entityId: 'resource_types'
        })
      }
      this.data[datasetId] = []
      for (const type of this.resourceTypes) {
        const url = new URL(rel.href)
        url.searchParams.set('page_size', pageSize.toFixed(0))
        url.searchParams.set('type', type.id)
        const response = await datasetsApi.request({
          url: url.toString(),
          method: 'get'
        })
        this.data[datasetId].push({
          currentPage: 1,
          resources: response.data,
          total: response.total,
          totalWithoutFilter: response.total,
          type
        })
      }
      return this.data[datasetId]
    },

    async fetchDatasetResources(
      datasetId: string,
      typeId: string,
      page: number,
      q = ''
    ): Promise<{ data: Resource[]; total: number }> {
      const response = await datasetsApiv2.get({
        entityId: `${datasetId}/resources`,
        params: {
          page,
          page_size: pageSize,
          type: typeId,
          q
        }
      })
      return { data: response.data, total: response.total }
    }
  }
})

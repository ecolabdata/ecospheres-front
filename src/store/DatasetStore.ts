import type { DatasetV2, License } from '@datagouv/components-next'
import { defineStore } from 'pinia'

import type { BaseParams } from '@/model/api'
import type { DatasetV2Response } from '@/model/dataset'
import DatasetsAPI from '@/services/api/resources/DatasetsAPI'

const datasetsApi = new DatasetsAPI()
const datasetsApiv2 = new DatasetsAPI({ version: 2 })

interface RootState {
  data: Record<string, DatasetV2Response[]>
  resourceTypes: unknown[]
  sort: string | undefined
}

/**
 * An organization oriented and paginated store for datasets
 * data = {
 *   "{organization_id}": [{
 *     "page": 1,
 *     "total": 200,
 *     "data": [{dataset}, ...]
 *   }, ...]
 * }
 *
 * A special key `_orphans` exists for storing individual datasets if needed (ie w/o org and pagination)
 * This is useful when fetching a single dataset on a dataset page
 */
export const useDatasetStore = defineStore('dataset', {
  state: (): RootState => ({
    data: {},
    resourceTypes: [],
    sort: undefined
  }),
  actions: {
    /**
     * Get a datasets pagination object for a given org, from store infos
     */
    getDatasetsPaginationForOrg(orgId: string) {
      const datasets = this.getDatasetsForOrg(orgId)
      if (datasets === undefined) return []
      const nbPages = Math.ceil(datasets.total / datasets.page_size)
      return [...Array(nbPages).keys()].map((page) => {
        page += 1
        return {
          label: page.toString(),
          href: '#',
          title: `Page ${page}`
        }
      })
    },
    /**
     * Get datasets from store for an org and a page
     */
    getDatasetsForOrg(orgId: string, page: number = 1, sort?: string) {
      if (this.sort !== sort) return undefined
      if (this.data[orgId] === undefined) return undefined
      return this.data[orgId].find((d) => d.page === page)
    },
    /**
     * Async function to trigger API fetch of an org's datasets if not known in store
     */
    async loadDatasetsForOrg(orgId: string, page: number = 1, sort?: string) {
      const existing = this.getDatasetsForOrg(orgId, page, sort)
      if (existing !== undefined) return existing
      const datasets = await datasetsApiv2.getDatasetsForOrganization(
        orgId,
        page,
        sort
      )
      this.addDatasets(orgId, datasets, sort)
      return this.getDatasetsForOrg(orgId, page, sort)
    },
    /**
     * Store the result of a datasets fetch operation for an org in store
     */
    addDatasets(orgId: string, res: DatasetV2Response, sort?: string) {
      // reset org data if another sort has been requested
      if (this.data[orgId] === undefined) this.data[orgId] = []
      if (this.sort !== sort) this.data[orgId] = []
      this.sort = sort
      this.data[orgId] = [...this.data[orgId], res]
    },
    /**
     * Get a dataset from the store given its id
     */
    get(datasetId: string) {
      // flatten pages data for each organization
      // TODO: suboptimal store structure for this use case, see later if org oriented or flat is better
      const flattened = Object.keys(this.data)
        .map((k) => this.data[k].map((a) => a.data).flat())
        .flat()
      const foundDataset = flattened.find((d) => {
        return d.id === datasetId || d.slug === datasetId
      })
      return foundDataset
    },
    /**
     * Add an "orphan" dataset to the store
     */
    addOrphan(dataset: DatasetV2) {
      this.addDatasets(
        '_orphan',
        {
          data: [dataset],
          page: 1,
          page_size: 1,
          next_page: null,
          previous_page: null,
          total: 1
        },
        undefined
      )
      return dataset
    },
    /**
     * Async function to trigger API fetch of a dataset if not known in store
     */
    async load(datasetId: string, params?: BaseParams) {
      const existing = this.get(datasetId)
      if (existing !== undefined) return existing
      const dataset = await datasetsApiv2.get({
        entityId: datasetId,
        ...params
      })
      if (dataset === undefined) return
      return this.addOrphan(dataset)
    },
    /**
     * Fetch datasets by their IDs and store them in an array.
     */
    async loadMultipleByIds(datasetIds: string[]) {
      const fetchedDatasets = []
      for (const datasetId of datasetIds) {
        const dataset = await datasetsApiv2.get({
          entityId: datasetId
        })
        if (dataset != null) {
          fetchedDatasets.push(dataset)
        }
      }
      return fetchedDatasets
    },
    async getLicense(license: string) {
      const response: License[] = await datasetsApi.get({
        entityId: 'licenses'
      })
      const foundLicense = response.find((l) => l.id === license)
      return foundLicense
    }
  }
})

import type { Organization } from '@datagouv/components-next'
import { defineStore } from 'pinia'

import config from '@/config'
import type { BaseParams } from '@/model/api'
import CustomOrganizationsAPI from '@/services/api/CustomOrganizationsAPI'
import OrganizationsAPI from '@/services/api/resources/OrganizationsAPI'

const orgApi = new OrganizationsAPI()
const customOrgApi = new CustomOrganizationsAPI()

interface LightweightOrganization {
  id: string
  name: string
  slug: string
}

interface PaginatedOrganizations {
  page: number
  orgs: Organization[]
}

interface RootState {
  data: PaginatedOrganizations[]
  flatData: LightweightOrganization[]
}

export const useOrganizationStore = defineStore('organization', {
  state: (): RootState => ({
    data: [],
    flatData: []
  }),
  actions: {
    /**
     * Get orgs list for a given page from store
     */
    getForPage(page = 1) {
      return this.data.find((d) => d.page === page)?.orgs ?? []
    },
    /**
     * Async function to trigger API fetch of orgs list for a page, using the config
     * and preserving the config file order
     */
    async loadFromConfig(page = 1) {
      const orgsList = await this.loadFromConfigFlat()
      const pageSize = config.website.pagination_sizes.organizations_list
      const paginated = orgsList
        .slice(pageSize * (page - 1), pageSize * page)
        .map((org) => org.id)
      await this.loadMultipleByIds(paginated, page)
      return this.getForPage(page)
    },
    /**
     * Load multiple organizations in a lightweight format without pagination
     * Used for e.g. for filtering
     */
    async loadFromConfigFlat() {
      if (this.flatData.length > 0) return this.flatData
      this.flatData = await customOrgApi.list()
      return this.flatData
    },
    /**
     * Load multiple organizations to store
     */
    async loadMultipleByIds(orgIds: string[], page: number) {
      for (const orgId of orgIds) {
        const existing = this.get(orgId)
        if (existing !== undefined) continue
        try {
          const org = await orgApi.get({ entityId: orgId })
          this.add(org, page)
        } catch (e) {
          console.log(
            `Error fetching ${orgId}: ${
              e instanceof Error ? e.message : String(e)
            }`
          )
        }
      }
    },
    /**
     * Add an organization to the store
     */
    add(org: Organization, page: number) {
      const existing = this.data.find((d) => d.page === page)
      if (existing !== undefined) {
        existing.orgs.push(org)
      } else {
        this.data.push({ page, orgs: [org] })
      }
      return org
    },
    /**
     * Get an org from store given its id
     */
    get(orgId: string) {
      return this.data
        .map((d) => d.orgs)
        .flat()
        .find((o) => o.id === orgId || o.slug === orgId)
    },
    /**
     * Async function to trigger API fetch of an org if not known in store
     */
    async load(orgId: string, page: number, params?: BaseParams) {
      const existing = this.get(orgId)
      if (existing !== undefined) return existing
      const org = await orgApi.get({ entityId: orgId, ...params })
      return this.add(org, page)
    }
  },
  getters: {
    pagination: (state) => {
      const pageSize = config.website.pagination_sizes.organizations_list
      const total = state.flatData.length
      const nbPages = Math.ceil(total / pageSize)
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

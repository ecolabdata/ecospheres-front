import type { Organization } from '@datagouv/components-next'

import DatagouvfrAPI from './DatagouvfrAPI'

/**
 * A wrapper around search engine API
 */
export default class SearchAPI extends DatagouvfrAPI {
  version = 1
  endpoint = 'organizations/suggest'

  async search(
    query: string,
    size: number,
    page?: number,
    args?: object
  ): Promise<Organization[]> {
    return await this.list({
      params: {
        q: query,
        size: size ?? 20,
        page: page ?? 1,
        ...args
      }
    })
  }
}

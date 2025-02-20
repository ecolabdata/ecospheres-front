import type { Rel } from '@datagouv/components-next'

import type { Reuse, ReuseResponse } from '@/model/reuse'
import DatagouvfrAPI from '@/services/api/DatagouvfrAPI'

export default class ReusesAPI extends DatagouvfrAPI {
  endpoint = 'reuses'

  /**
   * Get reuses for a dataset
   */
  async getReusesForDataset(datasetId: string): Promise<ReuseResponse> {
    return await this.request({
      url: this.url(true),
      method: 'get',
      params: {
        dataset: datasetId
      }
    })
  }

  /**
   * Get reuses from rel
   */
  async getReusesFromRel(rel: Rel): Promise<Reuse[]> {
    let response = await this.request({
      url: rel.href,
      method: 'get'
    })
    let reuses = response.data
    while (response.next_page !== null) {
      response = await this.request({
        url: response.next_page,
        method: 'get'
      })
      reuses = [...reuses, ...response.data]
    }
    return reuses
  }
}

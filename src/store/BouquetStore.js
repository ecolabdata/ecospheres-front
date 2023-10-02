import { defineStore } from "pinia"
import TopicsAPI from "../services/api/resources/TopicsAPI"

const topicsAPI = new TopicsAPI()

export const useBouquetStore = defineStore("bouquet", {
  state: () => ({
    data: [],
  }),
  actions: {
    /**
     * Filter a list of bouquets related to Ecospheres
     *
     * @param {Array} bouquets
     * @returns {Array}
     */
    filter (bouquets) {
      return bouquets.filter(bouquet => bouquet.extras.is_ecospheres || bouquet.tags.includes("ecospheres"))
    },
    /**
     * Load Ecospheres related topics from API
     *
     * @returns {Array<object>}
     */
    async loadBouquets () {
      if (this.data.length > 0) return this.data
      let response = await topicsAPI._list()
      this.data = this.filter(response.data)
      while (response.next_page) {
        response = await topicsAPI._request(response.next_page)
        this.data = [...this.data, ...this.filter(response.data)]
      }
      return this.data
    },
  },
})

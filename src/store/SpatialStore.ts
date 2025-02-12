import { defineStore } from 'pinia'

import type { SpatialCoverage, SpatialCoverageLevel } from '@/model/spatial'
import SpatialAPI from '@/services/api/SpatialAPI'

const api = new SpatialAPI()

export const useSpatialStore = defineStore('spatial', {
  state: () => ({
    levels: [] as SpatialCoverageLevel[],
    zones: {} as Record<string, SpatialCoverage>
  }),
  actions: {
    async loadLevels(): Promise<SpatialCoverageLevel[]> {
      if (this.levels.length > 0) return this.levels
      this.levels = await api.getLevels()
      return this.levels
    },
    getLevelById(levelId: string): SpatialCoverageLevel | undefined {
      return this.levels.find((level) => level.id === levelId)
    },
    async loadZone(zoneId: string): Promise<SpatialCoverage> {
      if (this.zones[zoneId]) return this.zones[zoneId]
      const zone = await api.getZone(zoneId)
      this.zones[zoneId] = zone
      return zone
    }
  }
})

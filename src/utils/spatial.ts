import { ref, watch, type Ref } from 'vue'

import type {
  SpatialCoverage,
  SpatialCoverageLevel,
  SpatialField
} from '@/model/spatial'
import type { Topic, TopicPostData } from '@/model/topic'
import { useSpatialStore } from '@/store/SpatialStore'
import type { DatasetV2 } from '@datagouv/components'

export const getZoneFromSpatial = async (
  spatial: SpatialField | undefined | null
): Promise<SpatialCoverage | undefined> => {
  if (spatial == null) return
  const store = useSpatialStore()
  const zoneId = spatial.zones != null ? spatial.zones[0] : undefined
  if (zoneId !== undefined) {
    return await store.loadZone(zoneId)
  }
}

export function useSpatialCoverage(
  object: Ref<Topic | Partial<TopicPostData> | null | DatasetV2>
): Ref<SpatialCoverage | undefined> {
  const spatialCoverage = ref<SpatialCoverage | undefined>(undefined)

  watch(
    object,
    async (newObject) => {
      if (newObject?.spatial != null) {
        const coverage = await getZoneFromSpatial(newObject.spatial)
        spatialCoverage.value = coverage
      } else {
        spatialCoverage.value = undefined
      }
    },
    { immediate: true }
  )

  return spatialCoverage
}

export const getGranularityFromSpatial = async (
  spatial: SpatialField | undefined | null
): Promise<SpatialCoverageLevel | undefined> => {
  const store = useSpatialStore()
  if (spatial?.granularity) {
    await store.loadLevels()
    return store.getLevelById(spatial.granularity)
  }
}

export const useSpatialGranularity = (
  dataset: Ref<DatasetV2 | undefined>
): Ref<SpatialCoverageLevel | undefined> => {
  const level = ref<SpatialCoverageLevel | undefined>(undefined)
  watch(
    dataset,
    async () => {
      level.value = await getGranularityFromSpatial(dataset.value?.spatial)
    },
    { immediate: true }
  )
  return level
}

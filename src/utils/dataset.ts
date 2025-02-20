import { useDatasetStore } from '@/store/DatasetStore'
import type { DatasetV2, License } from '@datagouv/components-next'

export const useLicense = (
  dataset: Ref<DatasetV2 | undefined>
): Ref<License | undefined> => {
  const datasetStore = useDatasetStore()
  const license = ref<License | undefined>(undefined)
  watch(
    dataset,
    async () => {
      if (dataset.value) {
        license.value = await datasetStore.getLicense(dataset.value.license)
      }
    },
    { immediate: true }
  )
  return license
}

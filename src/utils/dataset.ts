import { useDatasetStore } from '@/store/DatasetStore'
import type { DatasetV2, License } from '@datagouv/components'

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

// FIXME: this is a redefinition of the same function in @datagouv/components
// It handles types correcly when passing a DatasetV2
// https://github.com/datagouv/udata-front/issues/661
export const useOwnerName = (
  dataset: DatasetV2
): ComputedRef<string | undefined> => {
  const owner = computed(() => {
    const ownedValue = toValue(dataset)
    if (ownedValue) {
      if (ownedValue.organization) {
        return ownedValue.organization.name
      } else if (ownedValue.owner) {
        return ownedValue.owner.first_name + ' ' + ownedValue.owner.last_name
      }
    }
  })
  return owner
}

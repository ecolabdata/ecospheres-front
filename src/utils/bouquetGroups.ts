import { useDebounceFn } from '@vueuse/core'
import { type ComputedRef, type Ref, ref } from 'vue'

import type { DatasetProperties, DatasetsGroups } from '@/model/topic'

import { debounceWait } from '@/utils/config'

export const NO_GROUP = 'Sans regroupement'

export const isOnlyNoGroup = (groups: DatasetsGroups) => {
  return groups.has(NO_GROUP) && groups.size === 1
}

export function useGroups(datasetsProperties: Ref<DatasetProperties[]>): {
  groupedDatasets: ComputedRef<DatasetsGroups>
  getDatasetIndex: (group: string, indexInGroup: number) => number
  removeDatasetFromGroup: (group: string, index: number) => DatasetProperties[]
  groupExists: (groupName: string) => boolean
  renameGroup: (
    oldGroupName: string,
    newGroupName: string
  ) => DatasetProperties[]
  deleteGroup: (groupName: string) => DatasetProperties[]
} {
  const groupedDatasets = computed(() => {
    // Group datasets by their group property
    const groupedMap = datasetsProperties.value.reduce((acc, dataset) => {
      const groupKey = dataset.group || NO_GROUP
      if (!acc.has(groupKey)) {
        acc.set(groupKey, [])
      }
      acc.get(groupKey)?.push(dataset)
      return acc
    }, new Map<string, DatasetProperties[]>())

    // Extract and remove NO_GROUP entries
    const noGroupEntries = groupedMap.get(NO_GROUP)
    groupedMap.delete(NO_GROUP)

    // Sort groups alphabetically
    const sortedEntries = Array.from(groupedMap.entries()).sort(
      ([keyA], [keyB]) => keyA.localeCompare(keyB)
    )

    // Add noGroup entries at the end if they exist
    if (noGroupEntries?.length) {
      sortedEntries.push([NO_GROUP, noGroupEntries])
    }

    return new Map(sortedEntries)
  })
  const getDatasetIndex = (group: string, indexInGroup: number) => {
    // get all datasets from group
    const groupItems = groupedDatasets.value.get(group ?? NO_GROUP)

    if (groupItems) {
      // find the right dataset index (to handle duplicates)
      const datasetIndex = datasetsProperties.value.findIndex(
        (item) => item === groupItems[indexInGroup]
      )
      return datasetIndex
    }
    return -1
  }

  const removeDatasetFromGroup = (group: string, index: number) => {
    const datasetToDeleteIndex = getDatasetIndex(group, index)

    if (datasetToDeleteIndex === -1) {
      return datasetsProperties.value
    }

    const confirmMessage =
      'Etes-vous sûr de vouloir supprimer ce jeu de données ?'
    if (!window.confirm(confirmMessage)) {
      return datasetsProperties.value
    }

    return datasetsProperties.value.filter(
      (_, index) => index !== datasetToDeleteIndex
    )
  }

  const groupExists = (groupName: string) => {
    return groupedDatasets.value.has(groupName)
  }

  const renameGroup = (oldGroupName: string, newGroupName: string) => {
    // Skip if new group already exists or old group is empty
    if (groupExists(newGroupName) || !groupedDatasets.value.has(oldGroupName)) {
      return datasetsProperties.value
    }
    const data = datasetsProperties.value.map((dataset) =>
      dataset.group === oldGroupName
        ? { ...dataset, group: newGroupName }
        : dataset
    )
    return data
  }

  const deleteGroup = (groupName: string) => {
    return datasetsProperties.value.filter(
      (dataset) => dataset.group !== groupName
    )
  }

  return {
    groupedDatasets,
    getDatasetIndex,
    removeDatasetFromGroup,
    groupExists,
    renameGroup,
    deleteGroup
  }
}

export function useDatasetFilter(datasetsProperties: Ref<DatasetProperties[]>) {
  const searchQuery = ref('')
  const isFiltering = computed(() => !!searchQuery.value)

  // add a property to hide the datasets on filtering
  const filteredDatasets = computed(() => {
    if (!searchQuery.value) return datasetsProperties.value

    const searchValue = searchQuery.value.toLowerCase()

    return datasetsProperties.value.map((dataset) => ({
      ...dataset,
      isHidden: !(
        dataset.title.toLowerCase().includes(searchValue) ||
        (dataset.purpose && dataset.purpose.toLowerCase().includes(searchValue))
      )
    }))
  })

  // Check if all groups only contain hidden datasets
  const isAllGroupsHidden = computed(() => {
    return filteredDatasets.value.every((dataset) => dataset.isHidden)
  })

  // Check if a specific group only contains hidden datasets
  const isGroupOnlyHidden = (groupName: string) => {
    const filterGroupName = groupName === NO_GROUP ? undefined : groupName
    return filteredDatasets.value
      .filter((dataset) => dataset.group === filterGroupName)
      .every((dataset) => dataset.isHidden)
  }

  // apply search query
  const filterDatasetsProperties = useDebounceFn((value: string) => {
    searchQuery.value = value
  }, debounceWait)

  return {
    isFiltering,
    filterDatasetsProperties,
    filteredDatasets,
    isAllGroupsHidden,
    isGroupOnlyHidden
  }
}

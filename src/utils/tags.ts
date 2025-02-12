import type { FilterItemConf, Filters } from '@/model/config'
import type { ResolvedTag, TagSelectOption } from '@/model/tag'
import type { ComputedRef, Ref } from 'vue'
import { useFiltersConf } from './config'

interface HasTags {
  tags: string[] | null
}

/**
 * Extract and denormalize tags from an object
 */
export const useTags = <T extends HasTags>(
  objectType: Filters,
  object: T | undefined | null,
  filterId?: string,
  exclude?: string[]
): ComputedRef<ResolvedTag[]> => {
  const filtersConf = useFiltersConf(objectType)
  const tagPrefix = filtersConf.tag_prefix
  const filters = filtersConf.items

  return computed(() => {
    const tags: ResolvedTag[] = []

    for (const tag of object?.tags || []) {
      if (!tag.startsWith(tagPrefix)) continue

      for (const filter of filters) {
        if (filterId && filterId !== filter.id) continue
        if (exclude?.includes(filter.id)) continue

        const filterPrefix = `${tagPrefix}-${filter.id}-`
        if (!tag.startsWith(filterPrefix)) continue

        const value = tag.replace(filterPrefix, '')
        const matchingValue = filter.values.find((v) => v.id === value)

        if (matchingValue) {
          tags.push({
            color: filter.color,
            name: matchingValue.name,
            type: filter.id,
            id: matchingValue.id
          })
        }
      }
    }

    return tags
  })
}

export const useTag = <T extends HasTags>(
  objectType: Filters,
  object: Ref<T | undefined | null>,
  filterId: string
): ComputedRef<ResolvedTag | undefined> => {
  return computed(() => {
    const tags = useTags(objectType, object.value, filterId)
    return tags.value[0]
  })
}

export const getTagOptions = (
  objectType: Filters,
  filterId: string,
  parentTagId?: string
): TagSelectOption[] => {
  const filter = getFilterConf(objectType, filterId)
  if (!filter) return []
  return filter.values.filter((value) => {
    if (!parentTagId) return true
    return value.parent === parentTagId
  })
}

export const getFilterConf = (
  objectType: Filters,
  filterId: string
): FilterItemConf | undefined => {
  const filtersConf = useFiltersConf(objectType)
  return filtersConf.items.find((filter) => filter.id === filterId)
}

export const useTagOptions = (
  objectType: Filters,
  tagId: Ref<string | undefined>,
  tagType: string
): {
  tagOptions: TagSelectOption[]
  subTagOptions: ComputedRef<TagSelectOption[]>
} => {
  const tagOptions = getTagOptions(objectType, tagType)

  const subTagOptions = computed(() => {
    if (!tagId) return []
    const filter = getFilterConf(objectType, tagType)
    if (!filter || !filter.child) return []
    return getTagOptions(objectType, filter.child, tagId.value)
  })

  return {
    tagOptions,
    subTagOptions
  }
}

export interface QueryArgs {
  [key: string]: string | null
}

export const useTagSlug = (
  objectType: Filters,
  filterId: string,
  tagId?: string
): string => {
  const filtersConf = useFiltersConf(objectType)
  return `${filtersConf.tag_prefix}-${filterId}-${tagId || ''}`
}

/**
 * Build an array of normalized tags from query components and clean the original QueryArgs
 */
export const useTagsQuery = (
  objectType: Filters,
  query: QueryArgs
): { tag: Array<string>; extraArgs: QueryArgs } => {
  const filtersConf = useFiltersConf(objectType)
  const filters = filtersConf.items
  const queryArray = []
  for (const filter of filters) {
    const queryFilter = query[filter.id]
    if (queryFilter != null) {
      queryArray.push(useTagSlug(objectType, filter.id, queryFilter))
    }
    delete query[filter.id]
  }
  return {
    tag: queryArray,
    extraArgs: query
  }
}

export const useTagFromId = (
  objectType: Filters,
  filterId: string,
  tagId: string
): ResolvedTag | null => {
  const filter = getFilterConf(objectType, filterId)
  if (!filter) return null
  const tag = filter.values.find((v) => v.id === tagId)
  if (!tag) return null
  return {
    color: filter.color,
    type: filter.id,
    name: tag.name,
    id: tag.id
  }
}

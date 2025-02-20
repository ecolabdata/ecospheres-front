import type { Resource } from '@datagouv/components-next'

export interface ResourceType {
  id: string
  label: string
}

export interface ResourceData {
  currentPage: number
  resources: Resource[]
  total: number
  totalWithoutFilter: number
  type: ResourceType
}

export type { Resource }

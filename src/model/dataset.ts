import type { DatasetV2 } from '@datagouv/components'

import type { GenericResponse } from './api'
import type { DatasetProperties } from './topic'

export interface DatasetV2Response extends GenericResponse {
  data: DatasetV2[]
}

export interface DatasetModalData {
  index?: number
  dataset?: DatasetProperties
  isValid: boolean
  mode: 'edit' | 'create'
}

interface ContactPoint {
  name: string
  email?: string
  contact_form?: string
  role: string
}

export type ExtendedDatasetV2 = DatasetV2 & {
  contact_points: ContactPoint[]
  extras: {
    [key: string]: unknown
    dcat?: Record<string, string[] | undefined>
  }
}

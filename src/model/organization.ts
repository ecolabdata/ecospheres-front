import type { Organization } from '@datagouv/components-next'

import type { GenericResponse } from './api'

export interface OrganizationResponse extends GenericResponse {
  data: Organization[]
}

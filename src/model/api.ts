import type { AxiosError, AxiosResponse } from 'axios'

export type { AxiosError }

export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'head'
  | 'options'

export type AxiosResponseData = AxiosResponse['data']

export type GenericData = object[]

export interface GenericResponse {
  data: GenericData
  page: number
  page_size: number
  next_page: string | null
  previous_page: string | null
  total: number
}

export interface DatagouvfrAPIArgs {
  baseUrl?: string
  version?: number
  endpoint?: string
}

export interface CustomParams {
  toasted?: boolean
  authenticated?: boolean
  redirectNotFound?: boolean
}

export interface RequestConfig extends CustomParams {
  url: string
  method: HttpMethod
  params?: object
  data?: object
  headers?: object
}

export type URLParams = Record<string, string | number | null | string[]>

export interface BaseParams extends CustomParams {
  headers?: Record<string, unknown>
}

interface EntityParam {
  entityId: string
}

interface QueryParam {
  params?: URLParams
}

interface DataParam {
  data: object
}

export type GetParams = BaseParams & QueryParam & EntityParam
export type ListParams = BaseParams & QueryParam
export type CreateParams = BaseParams & DataParam
export type UpdateParams = BaseParams & DataParam & EntityParam
export type DeleteParams = BaseParams & EntityParam

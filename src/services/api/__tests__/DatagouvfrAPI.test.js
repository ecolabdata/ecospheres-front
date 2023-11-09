import axios from 'axios'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { v4 as uuid } from 'uuid'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test
} from 'vitest'

import DatagouvfrAPI from '@/services/api/DatagouvfrAPI'

const baseUrl = 'https://example.lol'
const version = '1234'
const endpoint = 'asdf'
const noContent = uuid()
const notFound = uuid()
const networkError = uuid()

const server = setupServer(
  http.delete(`${baseUrl}/${version}/${endpoint}/${noContent}/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete(`${baseUrl}/${version}/${endpoint}/${notFound}`, () => {
    return new HttpResponse(null, { status: 404 })
  }),

  http.delete(`${baseUrl}/${version}/${endpoint}/${networkError}/`, () => {
    return HttpResponse.error()
  })
)

beforeAll(() => {
  server.listen()
})

beforeEach(async (context) => {
  // FIXME: remove once API dependencies to stores are cleaned up
  setActivePinia(createPinia())
  const httpClient = axios.create()
  httpClient.defaults.proxy = false
  context.client = new DatagouvfrAPI(
    baseUrl,
    version,
    endpoint,
    httpClient
  )
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

test('delete when 204', async ({ client }) => {
  const { status } = await client.delete(noContent)
  expect(status).toEqual(204)
})

test('delete when 404', async ({ client }) => {
  console.log(notFound)
  const { status } = await client.delete(notFound)
  expect(status).toEqual(404)
})

test('delete something else', async ({ client }) => {
  const { message } = await client.delete(networkError)
  expect(message).toMatch(/network error/i)
})

import '@gouvfr/dsfr/dist/core/core.main.min.css' // Le CSS minimal du DSFR

import '@gouvfr/dsfr/dist/component/component.main.min.css' // Styles de tous les composants du DSFR

import '@gouvfr/dsfr/dist/utility/utility.main.min.css' // Classes utilitaires : les composants de VueDsfr en ont besoin

import '@gouvminint/vue-dsfr/styles' // Les styles propres aux composants de VueDsfr

import '@datagouv/components/dist/style.css'

import { setupI18n } from '@datagouv/components'
import { createHead } from '@unhead/vue'
import type { InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { createPinia } from 'pinia'
import { createApp, markRaw } from 'vue'
import { LoadingPlugin } from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/css/index.css'
import VueMatomo from 'vue-matomo'
import TextClamp from 'vue3-text-clamp'
import 'vue3-toastify/dist/index.css'

import config from '@/config'

import { datagouv } from '@datagouv/components-next'
import App from './App.vue'
import './assets/main.css'
import type { CustomParams } from './model/api'
import routerPromise from './router'
import LocalStorageService from './services/LocalStorageService'
import { useUserStore } from './store/UserStore'
import { isNotFoundError } from './utils/http'

const app = createApp(App)
const pinia = createPinia()
const i18n = setupI18n()
const head = createHead()

app.use(datagouv, {
  name: 'data.gouv.fr',
  baseUrl: config.datagouvfr.base_url,
  apiBase: config.datagouvfr.base_url,
  staticUrl: 'https://static.data.gouv.fr' // TODO add to config?
})

routerPromise
  .then((router) => {
    app.use(router)
    app.use(pinia)
    app.use(i18n)
    app.use(head)
    app.use(TextClamp)
    app.use(LoadingPlugin)

    if (config.website.matomo.siteId != null) {
      app.use(VueMatomo, {
        host: config.website.matomo.host,
        siteId: config.website.matomo.siteId,
        router,
        debug: import.meta.env.DEV
      })
    }

    // Add router to Pinia as a plugin
    pinia.use(({ store }) => {
      store.$router = markRaw(router)
    })

    router.beforeEach((to) => {
      // protect authenticated routes
      const store = useUserStore()
      if (to.meta.requiresAuth === true && !store.$state.isLoggedIn) {
        LocalStorageService.setItem('lastRoute', to.fullPath)
        void router.push({ name: 'login' })
      }
      // set page title where needed
      if (to.meta.title != null) {
        document.title = to.meta.title + ' | ' + config.website.title
      }
    })

    // redirect to 404 if configured for this request
    axios.interceptors.response.use(
      async (response) => {
        return response
      },
      async (error) => {
        if (isNotFoundError(error) && error.config.redirectNotFound === true) {
          await router.push({ name: 'not_found' })
        }
        return await Promise.reject(error)
      }
    )

    app.mount('#app')
  })
  .catch((error) => {
    console.error('Failure while loading router config', error)
  })

// setup the interceptor for API calls, based on stored infos
// this is done here (upmost possible) to avoid circular deps below

// inject token in requests if user is loggedIn
axios.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig & CustomParams) => {
    const store = useUserStore()
    if (store.$state.isLoggedIn && requestConfig.authenticated === true) {
      requestConfig.headers.Authorization = `Bearer ${store.$state.token}`
    }
    return requestConfig
  },
  async (error) => await Promise.reject(error)
)

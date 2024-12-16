import type { AxiosError } from 'axios'
import { defineStore } from 'pinia'
import { watch } from 'vue'

import type { WithOwned } from '@/model'
import type { ExtendedUser } from '@/model/user'
import LocalStorageService from '@/services/LocalStorageService'
import UserAPI from '@/services/api/resources/UserAPI'
import { useSearchPagesConfig } from '@/utils/config'

const STORAGE_KEY = 'token'
const userAPI = new UserAPI()
export interface RootState {
  isInited: boolean
  isLoggedIn: boolean
  token: string | undefined
  data: ExtendedUser | undefined
}

export const useUserStore = defineStore('user', {
  state: (): RootState => ({
    isInited: false,
    isLoggedIn: false,
    data: undefined,
    token: undefined
  }),
  getters: {
    loggedIn(state): boolean {
      return state.isLoggedIn
    },
    userName(): string | undefined {
      return this.loggedIn
        ? `${this.data?.first_name} ${this.data?.last_name}`
        : undefined
    },
    isAdmin(): boolean {
      return this.loggedIn && (this.data?.roles?.includes('admin') ?? false)
    }
  },
  actions: {
    /**
     * Init store from localStorage
     * If we have a token, fetch user infos from API
     */
    async init(): Promise<ExtendedUser | undefined> {
      const token = localStorage.getItem(STORAGE_KEY)
      if (token !== null) {
        this.token = token
        this.isLoggedIn = true
        let userData: ExtendedUser | undefined
        try {
          userData = await userAPI.list({ authenticated: true })
        } catch (err) {
          // profile info fetching has failed, we're probably using a bad token
          // keep the current route and redirect to the login flow
          if ((err as AxiosError).response?.status === 401) {
            this.logout()
            LocalStorageService.setItem(
              'lastRoute',
              this.$router.currentRoute.value
            )
            await this.$router.push({ name: 'login' })
          }
          throw err
        }
        if (userData !== undefined) {
          this.storeInfo(userData)
        }
      }
      this.isInited = true
      return this.data
    },
    /**
     * Promise around isInited
     */
    async waitForStoreInit(): Promise<void> {
      await new Promise<void>((resolve) => {
        if (this.isInited) {
          resolve()
        } else {
          const unwatch = watch(
            () => this.isInited,
            (isInited: boolean) => {
              if (isInited) {
                unwatch()
                resolve()
              }
            },
            { immediate: true }
          )
        }
      })
    },
    /**
     * Store user info after login
     */
    login(token: string) {
      this.isLoggedIn = true
      this.token = token
      localStorage.setItem(STORAGE_KEY, token)
    },
    /**
     * Reflet logged-out state
     */
    logout() {
      this.isLoggedIn = false
      this.token = undefined
      this.data = undefined
      localStorage.removeItem(STORAGE_KEY)
    },
    /**
     * Store user infos
     */
    storeInfo(data: ExtendedUser) {
      this.data = data
    },
    /**
     * Has current user edit permissions on given object?
     */
    hasEditPermissions<T>(object: WithOwned<T> | null): boolean {
      if (object === null) return false
      if (!this.loggedIn || this.data === undefined) return false
      if (this.isAdmin) return true
      if (object.owner != null) {
        return object.owner.id === this.data.id
      } else if (object.organization != null) {
        return this.data.organizations
          .map((o) => o.id)
          .includes(object.organization.id)
      }
      return false
    },
    canAddTopic(searchPageSlug: string): boolean {
      const { searchPageCanAdd } = useSearchPagesConfig(searchPageSlug)
      if (searchPageCanAdd.everyone || this.isAdmin) {
        return true
      }
      if (this.loggedIn && this.data != null) {
        if (searchPageCanAdd.authorized_users?.includes(this.data.id)) {
          return true
        }
      }
      return false
    }
  }
})

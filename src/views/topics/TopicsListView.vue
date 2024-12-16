<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { capitalize, computed, inject, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import GenericContainer from '@/components/GenericContainer.vue'
import TopicList from '@/components/topics/TopicList.vue'
import TopicSearch from '@/components/topics/TopicSearch.vue'
import type { BreadcrumbItem } from '@/model/breadcrumb'
import {
  AccessibilityPropertiesKey,
  type AccessibilityPropertiesType
} from '@/model/injectionKeys'
import { useUserStore } from '@/store/UserStore'
import { useSearchPagesConfig } from '@/utils/config'

const router = useRouter()
const route = useRoute()

const searchPageName = ref<string>('')
const searchPageSlug = ref<string>('')
const searchPageLabelTitle = ref<string>('')
const searchPageLabelAddButton = ref<string>('')

const config = useSearchPagesConfig(
  route.path.replace('/admin', '').split('/')[1]
)
searchPageName.value = config.searchPageName
searchPageSlug.value = config.searchPageSlug
searchPageLabelTitle.value = config.searchPageLabelTitle
searchPageLabelAddButton.value = config.searchPageLabelAddButton

const props = defineProps({
  query: {
    type: String,
    default: ''
  },
  geozone: {
    type: String,
    default: null
  },
  drafts: {
    type: String,
    default: null
  }
})

const selectedGeozone: Ref<string | null> = ref(null)
const selectedQuery = ref('')
const showDrafts = ref(false)
const topicListComp = ref<InstanceType<typeof TopicList> | null>(null)

const userStore = useUserStore()

const setAccessibilityProperties = inject(
  AccessibilityPropertiesKey
) as AccessibilityPropertiesType

const breadcrumbList = computed(() => {
  const links: BreadcrumbItem[] = []
  links.push({ text: 'Accueil', to: '/' })
  links.push({
    text: `${capitalize(searchPageLabelTitle.value)}`,
    to: `/${searchPageSlug.value}`
  })
  return links
})

const createUrl = computed(() => {
  return { name: `${searchPageSlug.value}_add`, query: route.query }
})

const pageTitle = computed(() => {
  if (selectedQuery.value) {
    return `${route.meta.title} pour "${selectedQuery.value}"`
  }
  return route.meta.title
})

const searchResultsMessage = computed(() => {
  return topicListComp.value ? topicListComp.value.numberOfResultMsg : ''
})

const setLiveResults = () => {
  // only display the number of results if a query or filter exists
  if (route.fullPath !== route.path) {
    setAccessibilityProperties(pageTitle.value, false, [
      {
        text: searchResultsMessage.value
      }
    ])
  } else {
    setAccessibilityProperties(pageTitle.value, false)
  }
}

const search = useDebounceFn(() => {
  router
    .push({
      name: searchPageSlug.value,
      query: { ...route.query, q: selectedQuery.value }
    })
    .then(() => {
      setLiveResults()
    })
}, 600)

watch(
  props,
  () => {
    selectedGeozone.value = props.geozone
    selectedQuery.value = props.query
    showDrafts.value = props.drafts === '1'
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    const config = useSearchPagesConfig(
      route.path.replace('/admin', '').split('/')[1]
    )
    if (config) {
      searchPageName.value = config.searchPageName
      searchPageSlug.value = config.searchPageSlug
      searchPageLabelTitle.value = config.searchPageLabelTitle
      searchPageLabelAddButton.value = config.searchPageLabelAddButton
    }
  }
)
</script>

<template>
  <div class="fr-container">
    <DsfrBreadcrumb class="fr-mb-1v" :links="breadcrumbList" />
  </div>
  <GenericContainer>
    <div
      class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle justify-between fr-pb-1w"
    >
      <h1 class="fr-col-auto fr-mb-2v">
        {{ capitalize(searchPageLabelTitle) }}
      </h1>
      <div
        v-if="userStore.canAddTopic(searchPageSlug)"
        class="fr-col-auto fr-grid-row fr-grid-row--middle"
      >
        <router-link :to="createUrl" class="fr-btn fr-mb-1w">
          <VIcon name="ri-add-circle-line" class="fr-mr-1v" />
          {{ searchPageLabelAddButton }}
        </router-link>
      </div>
    </div>
    <div class="fr-col-md-12 fr-mb-2w">
      <SearchComponent
        id="search-topic"
        v-model="selectedQuery"
        :is-filter="true"
        :search-label="`Filtrer les ${searchPageLabelTitle}`"
        :label="`Filtrer les ${searchPageLabelTitle}`"
        :search-endpoint="router.resolve({ name: searchPageName }).href"
        @update:model-value="search"
      />
    </div>
    <div class="fr-mt-2w">
      <div className="fr-grid-row">
        <nav
          className="fr-sidemenu fr-col-md-4"
          aria-labelledby="fr-sidemenu-title"
        >
          <div className="fr-sidemenu__inner">
            <h2 id="fr-sidemenu-title" className="fr-sidemenu__title h3">
              Filtres
            </h2>
            <TopicSearch
              :geozone="selectedGeozone"
              :show-drafts="showDrafts"
              @vue:updated="setLiveResults"
            />
          </div>
        </nav>
        <div className="fr-col-12 fr-col-md-8">
          <TopicList
            ref="topicListComp"
            :show-drafts="showDrafts"
            :geozone="geozone"
            :query="selectedQuery"
            @clear-filters="setLiveResults"
          />
        </div>
      </div>
    </div>
  </GenericContainer>
</template>

<style scoped>
/* put above header (ground+500) so that multiselect floats above menu */
.fr-sidemenu {
  z-index: calc(var(--ground) + 600);
}

@media (max-width: 768px) {
  .fr-sidemenu {
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 2em;
    width: 100%;
    .fr-sidemenu__title {
      box-shadow: none;
    }
  }
}
</style>

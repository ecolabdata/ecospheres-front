<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { capitalize, computed, inject, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import GenericContainer from '@/components/GenericContainer.vue'
import BouquetList from '@/components/bouquets/BouquetList.vue'
import BouquetSearch from '@/components/bouquets/BouquetSearch.vue'
import config from '@/config'
import type { BreadcrumbItem } from '@/model/breadcrumb'
import {
  AccessibilityPropertiesKey,
  type AccessibilityPropertiesType
} from '@/model/injectionKeys'
import type { ResolvedTag } from '@/model/tag'
import { useUserStore } from '@/store/UserStore'
import { fromMarkdown } from '@/utils'
import { debounceWait, useTopicsConf } from '@/utils/config'
import { useTagFromId } from '@/utils/tags'

const { topicsSlug, topicsName } = useTopicsConf()

const router = useRouter()
const route = useRoute()

const props = defineProps({
  query: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: null
  },
  subtheme: {
    type: String,
    default: null
  },
  geozone: {
    type: String,
    default: null
  },
  drafts: {
    type: String,
    default: null
  },
  page: {
    type: String,
    default: null
  },
  sort: {
    type: String,
    required: true
  }
})

const banner = config.website.topics.banner
const selectedTheme: Ref<ResolvedTag | null> = ref(null)
const selectedSubtheme: Ref<ResolvedTag | null> = ref(null)
const selectedGeozone: Ref<string | null> = ref(null)
const selectedQuery = ref('')
const showDrafts = ref(false)
const bouquetListComp = ref<InstanceType<typeof BouquetList> | null>(null)

const userStore = useUserStore()
const { canAddBouquet } = storeToRefs(userStore)

const setAccessibilityProperties = inject(
  AccessibilityPropertiesKey
) as AccessibilityPropertiesType

const breadcrumbList = computed(() => {
  const links: BreadcrumbItem[] = []
  links.push({ text: 'Accueil', to: '/' })
  links.push({ text: `${capitalize(topicsName)}s`, to: `/${topicsSlug}` })
  if (selectedTheme.value && selectedTheme.value) {
    links.push({
      text: selectedTheme.value.name,
      to: `/${topicsSlug}?theme=${selectedTheme.value.id}`
    })
    if (selectedSubtheme.value) {
      links.push({ text: selectedSubtheme.value.name })
    }
  }
  return links
})

const createUrl = computed(() => {
  return { name: `${topicsSlug}_add`, query: route.query }
})

const pageTitle = computed(() => {
  if (selectedQuery.value) {
    return `${route.meta.title} pour "${selectedQuery.value}"`
  }
  return route.meta.title
})

const searchResultsMessage = computed(() => {
  return bouquetListComp.value ? bouquetListComp.value.numberOfResultMsg : ''
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
      name: topicsSlug,
      query: { ...route.query, q: selectedQuery.value },
      hash: '#bouquets-list'
    })
    .then(() => {
      setLiveResults()
    })
}, debounceWait)

watch(
  props,
  () => {
    selectedTheme.value = useTagFromId('bouquets', 'theme', props.theme)
    selectedSubtheme.value = useTagFromId(
      'bouquets',
      'subtheme',
      props.subtheme
    )
    selectedGeozone.value = props.geozone
    selectedQuery.value = props.query
    showDrafts.value = props.drafts === '1'
  },
  { immediate: true }
)
</script>

<template>
  <div class="fr-container">
    <DsfrBreadcrumb class="fr-mb-1v" :links="breadcrumbList" />
  </div>
  <div class="fr-container datagouv-components fr-my-2v">
    <div class="fr-grid-row fr-grid-row--middle justify-between fr-mb-3w">
      <h1 class="fr-mb-0">{{ capitalize(topicsName) }}s</h1>
      <div
        v-if="canAddBouquet"
        class="fr-col-auto fr-grid-row fr-grid-row--middle"
      >
        <router-link :to="createUrl" class="fr-btn fr-mb-1w">
          <VIconCustom name="add-circle-line" class="fr-mr-1w" align="middle" />
          Ajouter un {{ topicsName }}
        </router-link>
      </div>
    </div>
  </div>
  <section
    v-if="banner"
    class="fr-container--fluid hero-banner datagouv-components fr-mb-4w"
  >
    <div class="fr-container fr-py-12v">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <h2 v-html="banner.title" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="fromMarkdown(banner.content)" />
    </div>
  </section>
  <GenericContainer id="bouquets-list">
    <div class="fr-col-md-12 fr-mb-2w">
      <SearchComponent
        id="search-bouquet"
        v-model="selectedQuery"
        :is-filter="true"
        :search-label="`Filtrer les ${topicsName}s`"
        :label="`Filtrer les ${topicsName}s`"
        :search-endpoint="router.resolve({ name: topicsSlug }).href"
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
            <BouquetSearch
              :theme="selectedTheme?.id"
              :subtheme="selectedSubtheme?.id"
              :geozone="selectedGeozone"
              :show-drafts="showDrafts"
              @vue:updated="setLiveResults"
            />
          </div>
        </nav>
        <div className="fr-col-12 fr-col-md-8">
          <BouquetList
            ref="bouquetListComp"
            :theme="selectedTheme?.id"
            :subtheme="selectedSubtheme?.id"
            :show-drafts="showDrafts"
            :geozone="geozone"
            :query="selectedQuery"
            :page="props.page ? props.page : '1'"
            :sort="props.sort"
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

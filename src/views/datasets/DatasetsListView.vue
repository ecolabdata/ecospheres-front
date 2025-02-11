<script setup lang="ts">
import { DatasetCard } from '@datagouv/components'
import { useDebounceFn } from '@vueuse/core'
import {
  capitalize,
  computed,
  inject,
  onMounted,
  ref,
  watch,
  type Ref
} from 'vue'
import { useLoading } from 'vue-loading-overlay'
import { useRoute, useRouter } from 'vue-router'

import GenericContainer from '@/components/GenericContainer.vue'
import config from '@/config'
import type { TopicItemConf } from '@/model/config'
import {
  AccessibilityPropertiesKey,
  type AccessibilityPropertiesType
} from '@/model/injectionKeys'
import { useOrganizationStore } from '@/store/OrganizationStore'
import { useSearchStore } from '@/store/SearchStore'
import { useTopicStore } from '@/store/TopicStore'
import { fromMarkdown } from '@/utils'
import { debounceWait, useTopicsConf } from '@/utils/config'

defineEmits(['search'])
const props = defineProps({
  query: {
    type: String,
    default: null
  },
  page: {
    type: String,
    default: null
  },
  organization: {
    type: String,
    default: null
  },
  topic: {
    type: String,
    default: null
  }
})

const router = useRouter()
const route = useRoute()
const store = useSearchStore()
const currentPage = ref(1)
const localQuery = ref()
const loader = useLoading()

const queryResults = ref<HTMLParagraphElement | null>(null)

const topicStore = useTopicStore()

const selectedTopicId: Ref<string | null> = ref(null)
const selectedOrganizationId: Ref<string | null> = ref(null)

const datasets = computed(() => store.datasets)
const total = computed(() => store.total)
const pages = computed(() => store.pagination)

const title = config.website.title as string
const banner = config.website.datasets.banner
const topicItems = config.website.list_search_topics as TopicItemConf[]
const hasOrganizationFilter = config.website.datasets
  .organization_filter as boolean

const { topicsMainTheme } = useTopicsConf()

const setAccessibilityProperties = inject(
  AccessibilityPropertiesKey
) as AccessibilityPropertiesType

const metaTitle = computed(() => {
  if (currentPage.value && localQuery.value) {
    return `${route.meta.title} pour "${localQuery.value}" - page ${currentPage.value}`
  } else if (currentPage.value) {
    return `${route.meta.title} - page ${currentPage.value}`
  } else if (localQuery.value) {
    return `${route.meta.title} pour "${localQuery.value}"`
  }
  return document.title
})

const topicOptions = computed(() => {
  if (!topicItems?.length) return
  const topics = topicStore.$state.data
    .filter((t) => {
      return topicItems.map((st) => st.id).includes(t.id)
    })
    .map((t) => {
      return { value: t.id, text: t.name }
    })
  return [{ value: '', text: 'Toutes les données' }, ...topics]
})

const organizationOptions = computed(() => [
  { value: '', text: 'Toutes les organisations' },
  ...useOrganizationStore().flatData.map((org) => {
    return { value: org.id, text: org.name }
  })
])

const links = [{ to: '/', text: 'Accueil' }, { text: 'Données' }]

const computeUrlQuery = (
  data: Record<string, string | number>
): Record<string, string | number> => {
  return {
    page: currentPage.value,
    ...(localQuery.value && { q: localQuery.value }),
    ...(selectedOrganizationId.value && {
      organization: selectedOrganizationId.value
    }),
    ...(selectedTopicId.value && { topic: selectedTopicId.value }),
    ...data
  }
}

const onSelectTopic = (topicId: string | number) => {
  router.push({
    path: '/datasets',
    query: computeUrlQuery({
      page: 1,
      topic: topicId
    })
  })
}

const onSelectOrganization = (orgId: string | number) => {
  router.push({
    path: '/datasets',
    query: computeUrlQuery({
      page: 1,
      organization: orgId
    })
  })
}

const search = () => {
  router.push({
    path: '/datasets',
    query: computeUrlQuery({ page: 1 }),
    hash: '#datasets-list'
  })
}

const goToPage = (page: number) => {
  router.push({
    path: '/datasets',
    query: computeUrlQuery({ page: page + 1 })
  })
}

const zIndex = (key: number) => {
  return { zIndex: datasets.value.length - key }
}

const getDatasetPage = (id: string) => {
  return { name: 'dataset_detail', params: { did: id } }
}

const getOrganizationPage = (id: string) => {
  if (router.hasRoute('organization_detail')) {
    return { name: 'organization_detail', params: { oid: id } }
  }
  return ''
}

watch(
  props,
  () => {
    localQuery.value = props.query
    currentPage.value = props.page ? parseInt(props.page) : 1
    selectedOrganizationId.value = props.organization
    selectedTopicId.value = props.topic
  },
  { immediate: true }
)

const delayedSearch = useDebounceFn(
  (currentQuery, currentTopicId, currentOrganizationId, currentPageValue) => {
    const loadingInstance = loader.show()
    const args = currentOrganizationId
      ? { organization: currentOrganizationId }
      : {}
    store
      .search(currentQuery, currentTopicId, currentPageValue, args)
      .finally(() => {
        const searchResultsMessage = queryResults.value
          ? queryResults.value.innerText
          : ''
        setAccessibilityProperties(metaTitle.value, false, [
          {
            text: searchResultsMessage
          }
        ])
        loadingInstance.hide()
      })
  },
  debounceWait
)

watch(
  [localQuery, selectedTopicId, selectedOrganizationId, currentPage],
  ([currentQuery, currentTopicId, currentOrganizationId, currentPageValue]) => {
    delayedSearch(
      currentQuery,
      currentTopicId,
      currentOrganizationId,
      currentPageValue
    )
  },
  {
    immediate: true
  }
)

onMounted(() => {
  if (topicItems?.length) {
    topicStore.loadTopicsFromList(topicItems)
  }
  if (hasOrganizationFilter) {
    useOrganizationStore().loadFromConfigFlat()
  }
})
</script>

<template>
  <div class="fr-container">
    <DsfrBreadcrumb class="fr-mb-1v" :links="links" />
  </div>
  <div class="fr-container datagouv-components fr-my-2v">
    <h1>Jeux de données</h1>
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
  <GenericContainer id="datasets-list">
    <p v-show="query" ref="queryResults" tabindex="-1">
      {{ total }} résultats de recherche pour "{{ query }}".
    </p>
    <p v-if="!query && !banner">
      <!-- eslint-disable-next-line vue/no-v-html -->
      Parcourir tous les jeux de données présents sur <span v-html="title" />.
    </p>
    <div class="fr-col-md-12 fr-mb-2w">
      <SearchComponent
        id="search-datasets"
        v-model="localQuery"
        :is-filter="true"
        search-label="Filtrer des données"
        :search-endpoint="router.resolve({ name: 'datasets' }).href"
        @update:model-value="search()"
      />
    </div>
    <div v-if="topicItems" class="fr-col-md-12 fr-mb-2w">
      <DsfrSelect
        :model-value="selectedTopicId"
        :options="topicOptions"
        default-unselected-text="Toutes les données"
        @update:model-value="onSelectTopic"
      >
        <template #label>{{ capitalize(topicsMainTheme) }}s</template>
      </DsfrSelect>
    </div>
    <div v-if="hasOrganizationFilter" class="fr-col-md-12 fr-mb-2w">
      <DsfrSelect
        :model-value="selectedOrganizationId"
        :options="organizationOptions"
        default-unselected-text="Toutes les organisations"
        @update:model-value="onSelectOrganization"
      >
        <template #label>Filtrer par organisation</template>
      </DsfrSelect>
    </div>
    <div v-if="datasets?.length === 0" class="fr-mb-4w">
      Aucun résultat pour cette recherche.
    </div>
    <div class="fr-col-md-12">
      <DatasetCard
        v-for="(d, index) in datasets"
        :key="d.id"
        :style="zIndex(index)"
        :dataset="d"
        :dataset-url="getDatasetPage(d.id)"
        :organization-url="getOrganizationPage(d.organization?.id)"
      />
    </div>
  </GenericContainer>
  <DsfrPagination
    v-if="pages.length"
    class="fr-container"
    :current-page="currentPage - 1"
    :pages="pages"
    @update:current-page="goToPage"
  />
</template>

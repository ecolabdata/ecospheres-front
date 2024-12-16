<script setup lang="ts">
import { DatasetCard } from '@datagouv/components'
import { useDebounceFn } from '@vueuse/core'
import { computed, inject, onMounted, ref, watch, type Ref } from 'vue'
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
import { useUserStore } from '@/store/UserStore'

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
const userStore = useUserStore()

const selectedTopicId: Ref<string | null> = ref(null)
const selectedOrganizationId: Ref<string | null> = ref(null)

const datasets = computed(() => store.datasets)
const total = computed(() => store.total)
const pages = computed(() => store.pagination)

const title = config.website.title as string
const topicItems = config.website.list_search_topics as TopicItemConf[]
const hasOrganizationFilter = config.website.datasets
  .organization_filter as boolean

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

const onSelectTopic = (topicId: string) => {
  router.push({
    path: '/datasets',
    query: computeUrlQuery({
      page: 1,
      topic: topicId
    })
  })
}

const onSelectOrganization = (orgId: string) => {
  router.push({
    path: '/datasets',
    query: computeUrlQuery({
      page: 1,
      organization: orgId
    })
  })
}

const search = () => {
  router.push({ path: '/datasets', query: computeUrlQuery({ page: 1 }) })
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
  600
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
  <GenericContainer>
    <div
      class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle justify-between fr-pb-1w"
    >
      <h1 class="fr-col-auto fr-mb-2v">Jeux de données</h1>
      <div class="fr-col-auto fr-grid-row fr-grid-row--middle">
        <a
          v-if="userStore.isAdmin"
          :href="`${config.datagouvfr.base_url}/fr/datasets.csv?topic=${config.universe.topic_id}`"
          class="fr-btn fr-btn--secondary fr-btn--md inline-flex fr-mb-1w fr-ml-2w"
        >
          <VIcon name="ri-file-download-line" class="fr-mr-1w" />
          Exporter la liste des jeux de données
        </a>
      </div>
    </div>
    <p v-show="query" ref="queryResults" tabindex="-1">
      {{ total }} résultats de recherche pour "{{ query }}".
    </p>
    <p v-if="!query">
      Parcourir tous les jeux de données présents sur {{ title }}.
    </p>

    <div class="fr-col-md-12 fr-mb-2w">
      <SearchComponent
        id="search-topic"
        v-model="localQuery"
        :is-filter="true"
        search-label="Filtrer des données"
        label="Filtrer des données"
        :search-endpoint="router.resolve({ name: 'datasets' }).href"
        @update:model-value="search()"
        @search="$emit('search', $event)"
      />
    </div>
    <!--
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
    -->
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

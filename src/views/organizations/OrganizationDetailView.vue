<script setup lang="ts">
import type { DatasetV2 } from '@datagouv/components-next'
import { computed, inject, onMounted, ref, watch, type Ref } from 'vue'
import { useLoading } from 'vue-loading-overlay'

import GenericContainer from '@/components/GenericContainer.vue'
import type { BreadcrumbItem } from '@/model/breadcrumb'
import {
  AccessibilityPropertiesKey,
  type AccessibilityPropertiesType
} from '@/model/injectionKeys'
import { useRouteParamsAsString } from '@/router/utils'
import { useDatasetStore } from '@/store/DatasetStore'
import { useOrganizationStore } from '@/store/OrganizationStore'
import { descriptionFromMarkdown } from '@/utils'
import { DatasetCard } from '@datagouv/components'

const route = useRouteParamsAsString()
const organizationId = route.params.oid

const orgStore = useOrganizationStore()
const datasetStore = useDatasetStore()

const org = computed(() => orgStore.get(organizationId))

const breadcrumbLinks: Ref<BreadcrumbItem[]> = ref([
  { to: '/', text: 'Accueil' },
  { to: '/organizations', text: 'Organisations' }
])

const currentPage = ref(1)
const pages: Ref<{ label: string; href: string; title: string }[]> = ref([])
const datasets: Ref<DatasetV2[] | undefined> = ref(undefined)
const selectedSort: Ref<string | undefined> = ref(undefined)

const setAccessibilityProperties = inject(
  AccessibilityPropertiesKey
) as AccessibilityPropertiesType

onMounted(() => {
  orgStore
    .load(organizationId, -1, { toasted: false, redirectNotFound: true })
    .then(() => {
      setAccessibilityProperties(org.value?.name)
    })
})

const sorts = [
  { value: '-created', text: 'Les plus récemment créés' },
  { value: '-last_update', text: 'Les plus récemment modifiés' }
]

function doSort(sort: string | number) {
  currentPage.value = 1
  selectedSort.value = sort.toString()
}

const description = computed(() => descriptionFromMarkdown(org))

// TODO: make this a composable "breadcrumbForObject"
// fill in the last breadcrumb when organization is ready
watch(
  () => org.value?.name,
  () => {
    if (org.value?.name === undefined) return
    breadcrumbLinks.value.push({ text: org.value.name })
  },
  { immediate: true }
)

// we need the technical id to fetch the datasets and thus pagination
watchEffect(() => {
  if (org.value?.id === undefined) return
  const loader = useLoading().show({
    enforceFocus: false
  })
  datasetStore
    .loadDatasetsForOrg(org.value.id, currentPage.value, selectedSort.value)
    .then((res) => {
      datasets.value = res?.data
      if (!pages.value.length && org.value?.id) {
        pages.value = datasetStore.getDatasetsPaginationForOrg(org.value?.id)
      }
    })
    .finally(() => {
      loader.hide()
    })
})
</script>

<template>
  <div class="fr-container">
    <DsfrBreadcrumb class="fr-mb-1v" :links="breadcrumbLinks" />
  </div>
  <GenericContainer>
    <h1 class="fr-mb-2v">{{ org?.name }}</h1>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="description"></div>

    <div class="w-100 fr-grid-row fr-grid-row--middle fr-mt-5v justify-end">
      <div class="fr-col-auto fr-grid-row fr-grid-row--middle">
        <label
          for="sort-search"
          class="fr-col-auto fr-text--sm fr-m-0 fr-mr-1w"
        >
          Trier par :
        </label>
        <!-- TODO: add "pertinence" when custom SelectComponent has landed -->
        <div class="fr-col">
          <DsfrSelect
            select-id="sort-search"
            :model-value="selectedSort"
            :options="sorts"
            label=""
            @update:model-value="doSort"
          ></DsfrSelect>
        </div>
      </div>
    </div>

    <h2 class="fr-mt-2w">Jeux de données</h2>
    <div v-if="!datasets?.length">
      Pas de jeu de données pour cette organisation.
    </div>
    <ul v-else class="fr-px-0" role="list">
      <li v-for="d in datasets" :key="d.id" class="fr-col-md-12 fr-py-0">
        <DatasetCard
          :dataset="d"
          :dataset-url="{ name: 'dataset_detail', params: { did: d.id } }"
          :organization-url="{
            name: 'organization_detail',
            params: { oid: d.organization?.id }
          }"
        />
      </li>
    </ul>
  </GenericContainer>
  <DsfrPagination
    v-if="pages.length"
    class="fr-container"
    :current-page="currentPage - 1"
    :pages="pages"
    @update:current-page="(p: number) => (currentPage = p + 1)"
  />
</template>

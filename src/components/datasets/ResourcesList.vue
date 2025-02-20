<script setup lang="ts">
import config from '@/config'
import type { ResourceData } from '@/model/resource'
import { useResourceStore } from '@/store/ResourceStore'
import { ResourceAccordion } from '@datagouv/components'
import { Pagination } from '@datagouv/components-next'
import type { DatasetV2 } from '@datagouv/components/ts'
import { useLoading } from 'vue-loading-overlay'

const pageSize = config.website.pagination_sizes.files_list as number

const props = defineProps({
  dataset: {
    type: Object as () => DatasetV2,
    required: true
  }
})

const resourceStore = useResourceStore()
const resources = ref<Record<string, ResourceData>>({})
const queries = ref<Record<string, string>>({})

const getResourcesTitle = (typedResources: ResourceData) => {
  if (typedResources?.total > 1) {
    let pluralName
    switch (typedResources.type.id) {
      case 'main':
        pluralName = 'Fichiers principaux'
        break
      case 'documentation':
        pluralName = 'Documentations'
        break
      case 'update':
        pluralName = 'Mises à jour'
        break
      case 'api':
        pluralName = 'APIs'
        break
      case 'code':
        pluralName = 'Dépôts de code'
        break
      case 'other':
        pluralName = 'Autres'
        break
      default:
        pluralName = typedResources.type.label
    }
    return `${typedResources.total} ${pluralName}`
  } else {
    return typedResources.type.label
  }
}

const updateQuery = (q: string, typeId: string) => {
  queries.value[typeId] = q
  changePage(typeId, 1, q)
}

const doSearch = (typeId: string) => {
  changePage(typeId, 1, queries.value[typeId])
}

const changePage = async (type: string, page = 1, query = '') => {
  resources.value[type].currentPage = page
  queries.value[type] = query
  const data = await resourceStore.fetchDatasetResources(
    props.dataset.id,
    type,
    page,
    query
  )
  resources.value[type].resources = data.data
  resources.value[type].total = data.total
}

onMounted(async () => {
  // fetch ressources
  const resourceLoader = useLoading().show({ enforceFocus: false })
  const allResources = await resourceStore.loadResources(
    props.dataset.id,
    props.dataset.resources
  )
  for (const typedResources of allResources) {
    resources.value[typedResources.type.id] = { ...typedResources }
    resources.value[typedResources.type.id].totalWithoutFilter =
      typedResources.total
  }
  resourceLoader.hide()
})
</script>

<template>
  <template v-for="typedResources in resources">
    <div
      v-if="typedResources.totalWithoutFilter"
      :key="typedResources.type.id"
      class="fr-mb-4w"
    >
      <h2 class="fr-mb-1v subtitle subtitle--uppercase">
        {{ getResourcesTitle(typedResources) }}
      </h2>
      <DsfrSearchBar
        v-if="typedResources.totalWithoutFilter > pageSize"
        label="Rechercher un fichier"
        button-text="Rechercher"
        placeholder=""
        :large="false"
        class="search-bar"
        @search="() => doSearch(typedResources.type.id)"
        @update:model-value="
          (value: string) => updateQuery(value, typedResources.type.id)
        "
      />
      <span v-if="typedResources.resources.length != 0">
        <ResourceAccordion
          v-for="resource in typedResources.resources"
          :key="resource.id"
          :dataset-id="dataset.id"
          :resource="resource"
        />
        <Pagination
          v-if="typedResources.total > pageSize"
          class="fr-mt-3w"
          :page="typedResources.currentPage"
          :page-size="pageSize"
          :total-results="typedResources.total"
          @change="
            (page) =>
              changePage(
                typedResources.type.id,
                page,
                queries[typedResources.type.id]
              )
          "
        />
      </span>
      <span v-else> <br />Aucun résultat pour votre recherche. </span>
    </div>
  </template>
</template>

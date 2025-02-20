<script setup lang="ts">
import { type DatasetV2 } from '@datagouv/components-next'
import { onMounted, ref, type Ref } from 'vue'

import DatasetEditModal, {
  type DatasetEditModalType
} from '@/components/forms/dataset/DatasetEditModal.vue'
import config from '@/config'
import { type DatasetProperties } from '@/model/topic'
import { useDatasetStore } from '@/store/DatasetStore'
import { isAvailable } from '@/utils/bouquet'
import { useTopicsConf } from '@/utils/config'
import { toastHttpError } from '@/utils/error'
import { isNotFoundError } from '@/utils/http'

import { basicSlugify, fromMarkdown } from '@/utils'
import {
  isOnlyNoGroup,
  useDatasetFilter,
  useGroups
} from '@/utils/bouquetGroups'
import BouquetDatasetCard from './BouquetDatasetCard.vue'
import BouquetGroup from './BouquetGroup.vue'

const datasetsProperties = defineModel({
  type: Array<DatasetProperties>,
  default: []
})

defineProps({
  isEdit: {
    type: Boolean,
    default: false
  },
  datasetEditorialization: {
    type: Boolean,
    default: true
  }
})

const emits = defineEmits(['updateDatasets'])

const modal: Ref<DatasetEditModalType | null> = ref(null)
const datasetsContent = ref(new Map<string, DatasetV2>())

const { topicsName } = useTopicsConf()

const {
  groupedDatasets,
  getDatasetIndex,
  removeDatasetFromGroup,
  renameGroup,
  deleteGroup
} = useGroups(datasetsProperties)

const {
  isFiltering,
  filterDatasetsProperties,
  filteredDatasets,
  isAllGroupsHidden,
  isGroupOnlyHidden
} = useDatasetFilter(datasetsProperties)

const { groupedDatasets: filteredResults } = useGroups(filteredDatasets)

const handleRemoveDataset = (group: string, index: number) => {
  datasetsProperties.value = removeDatasetFromGroup(group, index)
  emits('updateDatasets')
}

const handleRenameGroup = (oldGroupName: string, newGroupName: string) => {
  datasetsProperties.value = renameGroup(oldGroupName, newGroupName)
  emits('updateDatasets')
}

const handleDeleteGroup = (groupName: string) => {
  datasetsProperties.value = deleteGroup(groupName)
  emits('updateDatasets')
}

const loadDatasetsContent = () => {
  datasetsProperties.value.forEach((datasetItem) => {
    const id = datasetItem.id ?? null
    if (id && !datasetsContent.value.has(id) && !datasetItem.remoteDeleted) {
      useDatasetStore()
        .load(id, { toasted: false })
        .then((d) => {
          if (d) {
            datasetsContent.value.set(id, d)
            datasetItem.remoteArchived = !!d.archived
          }
        })
        .catch((err) => {
          if (isNotFoundError(err)) {
            datasetItem.remoteDeleted = true
          } else {
            toastHttpError(err)
          }
        })
    }
  })
}

const showTOC = computed(() => {
  /* 
  hide the table of content if "NoGroup" is the only group and results are not 0
  or
  hide if all factors (datasetProperties) are hidden by the filter
  */
  return (
    (!isOnlyNoGroup(filteredResults.value) && !!filteredResults.value.size) ||
    !isAllGroupsHidden
  )
})

const addDataset = () => {
  modal.value?.addDataset()
}

const editDataset = (
  dataset: DatasetProperties,
  index: number,
  group: string
) => {
  modal.value?.editDataset(dataset, getDatasetIndex(group, index))
}

const onDatasetEditModalSubmit = () => {
  emits('updateDatasets')
  loadDatasetsContent()
}

onMounted(() => {
  loadDatasetsContent()
})
</script>

<template>
  <!-- Header and buttons -->
  <div class="flex-gap fr-grid-row fr-grid-row--middle justify-between">
    <h2 class="fr-col-auto fr-m-0">
      Composition du {{ topicsName }} de données
    </h2>
    <SearchComponent
      v-if="datasetEditorialization"
      id="filter-factors"
      :is-filter="true"
      search-label="Filtrer les données"
      :label-visible="false"
      @update:model-value="filterDatasetsProperties"
    />
    <div class="fr-col-auto fr-grid-row fr-grid-row--middle">
      <DsfrButton
        v-if="isEdit"
        size="sm"
        label="Ajouter un jeu de données"
        icon="fr-icon-add-line"
        @click.prevent="addDataset"
      />
    </div>
  </div>
  <!-- Datasets list -->
  <div
    v-if="filteredResults.size < 1 || isAllGroupsHidden"
    class="no-dataset fr-mt-2w"
  >
    <p v-if="isFiltering">Aucune donnée trouvée pour cette recherche.</p>
    <p v-else>Ce {{ topicsName }} ne contient pas encore de donnée.</p>
  </div>
  <template v-else>
    <details v-if="showTOC" class="fr-mt-2w">
      <summary class="fr-py-3v fr-px-2w">Sommaire</summary>
      <ul role="list">
        <li
          v-for="[group] in filteredResults"
          v-show="!isGroupOnlyHidden(group)"
          :key="group"
        >
          <a :href="`#${basicSlugify(group)}-summary`">{{ group }}</a>
        </li>
      </ul>
    </details>
    <div v-if="datasetEditorialization" class="fr-mt-10v">
      <ul role="list" class="groups fr-m-0 fr-p-0">
        <template v-for="[group, datasets] in filteredResults" :key="group">
          <li v-if="datasets.length && !isGroupOnlyHidden(group)">
            <BouquetGroup
              :group-name="group"
              :all-groups="filteredResults"
              :datasets-properties="datasets"
              :is-edit="isEdit"
              @edit-group-name="handleRenameGroup"
              @delete-group="handleDeleteGroup"
            >
              <template v-if="isEdit" #datasetActions="{ dataset, index }">
                <DsfrButton
                  size="sm"
                  icon="fr-icon-edit-line"
                  label="Éditer"
                  tertiary
                  icon-only
                  :on-click="() => editDataset(dataset, index, group)"
                />
                <DsfrButton
                  size="sm"
                  icon="fr-icon-delete-line"
                  label="Supprimer"
                  tertiary
                  icon-only
                  :on-click="() => handleRemoveDataset(group, index)"
                />
              </template>
              <template #datasetContent="{ dataset }">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-html="fromMarkdown(dataset.purpose)"></div>
                <BouquetDatasetCard
                  v-if="dataset.id"
                  :dataset-properties="dataset"
                  :dataset-content="datasetsContent.get(dataset.id)"
                />
                <div class="fr-grid-row">
                  <a
                    v-if="!isAvailable(dataset.availability) && !isEdit"
                    class="fr-btn fr-btn--sm fr-btn--secondary inline-flex"
                    :href="`mailto:${config.website.contact_email}`"
                  >
                    Aidez-nous à trouver la donnée</a
                  >
                  <a
                    v-if="dataset.uri && !dataset.id"
                    class="fr-btn fr-btn--sm fr-btn--secondary inline-flex"
                    :href="dataset.uri"
                    target="_blank"
                    >Accéder au catalogue</a
                  >
                </div>
              </template>
            </BouquetGroup>
          </li>
        </template>
      </ul>
    </div>
    <div v-else>
      <div v-for="(dataset, index) in datasetsProperties" :key="index">
        <BouquetDatasetCard
          v-if="dataset.id"
          :dataset-properties="dataset"
          :dataset-content="datasetsContent.get(dataset.id)"
        />
      </div>
    </div>
  </template>

  <!-- add/edit modal -->
  <DatasetEditModal
    v-if="isEdit"
    ref="modal"
    v-model="datasetsProperties"
    v-model:groups-model="groupedDatasets"
    @submit-modal="onDatasetEditModalSubmit"
  />
</template>

<style scoped>
.flex-gap {
  --gap: 1rem;
}
details {
  border-block: 1px solid var(--border-default-grey, #ddd);
  color: #000091;
}
details[open] {
  padding-block-end: 0.75rem;
}
summary {
  font-weight: 500;
  background-color: var(--background-alt-grey, #f6f6f6);
}
details li {
  margin-block-start: 1rem;
}
details summary::marker,
:is(::-webkit-details-marker) {
  content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 16 16' aria-hidden='true' transform='rotate(90)' %3E%3Cpath fill='%233458A2' fill-rule='evenodd' d='m8 7.219-3.3 3.3-.942-.943L8 5.333l4.243 4.243-.943.943-3.3-3.3Z' clip-rule='evenodd' /%3E%3C/svg%3E")
    ' ';
}
details[open] summary::marker {
  content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 16 16' aria-hidden='true' transform='rotate(180)' %3E%3Cpath fill='%233458A2' fill-rule='evenodd' d='m8 7.219-3.3 3.3-.942-.943L8 5.333l4.243 4.243-.943.943-3.3-3.3Z' clip-rule='evenodd' /%3E%3C/svg%3E")
    ' ';
}
.groups {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
:deep(.fr-input-group) {
  margin-inline-start: auto;
}
</style>

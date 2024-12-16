<script setup lang="ts">
import { type DatasetV2 } from '@datagouv/components'
import { onMounted, ref, type Ref } from 'vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import { useRoute } from 'vue-router'

import DatasetEditModal, {
  type DatasetEditModalType
} from '@/components/forms/dataset/DatasetEditModal.vue'
import config from '@/config'
import { type DatasetProperties } from '@/model/topic'
import { useDatasetStore } from '@/store/DatasetStore'
import { fromMarkdown } from '@/utils'
import { useSearchPagesConfig } from '@/utils/config'
import { toastHttpError } from '@/utils/error'
import { isNotFoundError } from '@/utils/http'
import { isAvailable } from '@/utils/topic'

import TopicDatasetAccordionTitle from './TopicDatasetAccordionTitle.vue'
import TopicDatasetCard from './TopicDatasetCard.vue'

const route = useRoute()

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
const isReorder = ref(false)
const expandStore: Ref<{ [key: string]: string | null }> = ref({})
// make a copy for local reordering before save
const originalDatasets = ref([...datasetsProperties.value])
const datasetsContent = ref(new Map<string, DatasetV2>())

const { searchPageName } = useSearchPagesConfig(
  route.path.replace('/admin', '').split('/')[1]
)

const activeAccordion: Ref<number> = ref(-1)

const getAccordeonId = (index: number): string => {
  return `accordion_${index}`
}

const removeDataset = (index: number) => {
  if (
    window.confirm(
      `Etes-vous sûr de vouloir supprimer ce jeu de données du ${searchPageName} ?`
    )
  ) {
    delete expandStore.value[getAccordeonId(index)]
    if (datasetsProperties.value[index].id) {
      datasetsContent.value.delete(datasetsProperties.value[index].id)
    }
    datasetsProperties.value.splice(index, 1)
    emits('updateDatasets')
  }
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

const saveOrder = () => {
  isReorder.value = false
  emits('updateDatasets')
}

const cancelReorder = () => {
  datasetsProperties.value = [...originalDatasets.value]
  isReorder.value = false
}

const addDataset = () => {
  modal.value?.addDataset()
}

const editDataset = (dataset: DatasetProperties, index: number) => {
  modal.value?.editDataset(dataset, index)
}

const triggerReorder = () => {
  isReorder.value = true
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
  <div
    v-if="!isReorder"
    class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle justify-between fr-pb-1w"
  >
    <h2 class="fr-col-auto fr-mb-2v">
      Composition du {{ searchPageName }} de données
    </h2>
    <div class="fr-col-auto fr-grid-row fr-grid-row--middle">
      <DsfrButton
        v-if="isEdit && datasetsProperties.length >= 2"
        secondary
        size="sm"
        class="fr-mb-1w"
        label="Réorganiser la liste"
        icon="ic:baseline-drag-indicator"
        @click.prevent="triggerReorder"
      />
      <DsfrButton
        v-if="isEdit"
        size="sm"
        class="fr-mb-1w fr-ml-1w"
        label="Ajouter un jeu de données"
        icon="ri-add-line"
        @click.prevent="addDataset"
      />
    </div>
  </div>
  <div
    v-else
    class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle justify-between fr-pb-1w"
  >
    <h2 class="fr-col-auto fr-mb-2v">Réorganiser la liste</h2>
    <div class="fr-col-auto fr-grid-row fr-grid-row--middle">
      <DsfrButton
        secondary
        size="sm"
        class="fr-mb-1w"
        label="Annuler"
        @click.prevent="cancelReorder"
      />
      <DsfrButton
        size="sm"
        class="fr-mb-1w fr-ml-1w"
        label="Enregister"
        @click.prevent="saveOrder"
      />
    </div>
  </div>
  <!-- Actual datasets list -->
  <div v-if="datasetsProperties.length < 1" class="no-dataset">
    <p>Ce {{ searchPageName }} ne contient pas encore de jeux de données</p>
  </div>
  <div v-else>
    <div v-if="datasetEditorialization">
      <!-- Draggable list -->
      <div v-if="isReorder">
        <ul class="fr-accordions-group">
          <draggable ghost-class="ghost" :list="datasetsProperties">
            <li v-for="(dataset, index) in datasetsProperties" :key="index">
              <section class="fr-accordion draggable">
                <h3 class="fr-accordion__title">
                  <button
                    class="fake__fr-accordion__btn fake__fr-accordion__btn__mq"
                  >
                    <TopicDatasetAccordionTitle
                      :dataset-properties="dataset"
                      :is-edit="true"
                    />
                  </button>
                </h3>
              </section>
            </li>
          </draggable>
        </ul>
      </div>
      <!-- Static list -->
      <DsfrAccordionsGroup v-if="!isReorder" v-model="activeAccordion">
        <template v-for="(dataset, index) in datasetsProperties" :key="index">
          <DsfrAccordion
            :id="getAccordeonId(index)"
            :expanded-id="expandStore[getAccordeonId(index)]"
            @expand="expandStore[getAccordeonId(index)] = $event"
          >
            <template #title>
              <TopicDatasetAccordionTitle
                :dataset-properties="dataset"
                :is-edit="false"
              />
            </template>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-html="fromMarkdown(dataset.purpose)"></div>
            <TopicDatasetCard
              v-if="dataset.id"
              :dataset-properties="dataset"
              :dataset-content="datasetsContent.get(dataset.id)"
            />
            <div class="fr-grid-row">
              <DsfrButton
                v-if="isEdit"
                secondary
                size="sm"
                icon="ri-delete-bin-line"
                label="Supprimer"
                class="fr-mr-2w"
                @click.prevent="removeDataset(index)"
              />
              <DsfrButton
                v-if="isEdit"
                size="sm"
                icon="ri-pencil-line"
                label="Éditer"
                class="fr-mr-2w"
                @click.prevent="editDataset(dataset, index)"
              />
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
          </DsfrAccordion>
        </template>
      </DsfrAccordionsGroup>
    </div>
    <div v-else>
      <div v-for="(dataset, index) in datasetsProperties" :key="index">
        <TopicDatasetCard
          v-if="dataset.id"
          :dataset-properties="dataset"
          :dataset-content="datasetsContent.get(dataset.id)"
        />
      </div>
    </div>
  </div>

  <!-- add/edit modal -->
  <DatasetEditModal
    v-if="isEdit"
    ref="modal"
    v-model="datasetsProperties"
    @submit-modal="onDatasetEditModalSubmit"
  />
</template>

<style scoped>
.ghost {
  background-color: #bbb;
}

@media (min-width: 48em) {
  .fake__fr-accordion__btn.fake__fr-accordion__btn__mq {
    padding: 0.75rem 1rem;
  }
}

.fake__fr-accordion__btn {
  cursor: grab;
  align-items: center;
  display: inline-flex;
  flex-direction: row;
  font-size: 1rem;
  line-height: 1.5rem;
  margin: 0;
  max-height: none;
  max-width: 100%;
  min-height: 3rem;
  overflow: initial;
  padding: 0.75rem 0;
  text-align: left;
  width: 100%;
}
</style>

<script setup lang="ts">
import { computed, defineModel, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'

import config from '@/config'
import type { DatasetModalData } from '@/model/dataset'
import { Availability, type DatasetProperties } from '@/model/topic'
import { useDatasetStore } from '@/store/DatasetStore'

import DatasetPropertiesFields from './DatasetPropertiesFields.vue'

export interface DatasetEditModalType {
  addDataset: () => void
  editDataset: (dataset: DatasetProperties, index: number) => void
}

const emits = defineEmits(['submitModal'])

const router = useRouter()

const datasets = defineModel({
  type: Object as () => DatasetProperties[],
  required: true
})

const isModalOpen = ref(false)
const modalData: Ref<DatasetModalData> = ref({
  isValid: false,
  mode: 'edit'
})

const modalActions = computed(() => {
  return [
    {
      label: 'Annuler',
      secondary: true,
      onClick: () => {
        closeModal()
      }
    },
    {
      label: 'Enregistrer',
      disabled: !modalData.value.isValid,
      onClick: ($event: PointerEvent) => {
        $event.preventDefault()
        submitModal(modalData.value)
        closeModal()
      }
    }
  ]
})

const editDataset = (dataset: DatasetProperties, index: number) => {
  // clone the object to enable cancellation
  modalData.value = {
    index,
    dataset: { ...dataset },
    isValid: false,
    mode: 'edit'
  }
  isModalOpen.value = true
}

const addDataset = () => {
  modalData.value = {
    index: undefined,
    dataset: {
      title: '',
      purpose: '',
      availability: Availability.LOCAL_AVAILABLE,
      uri: null,
      id: null
    },
    isValid: false,
    mode: 'create'
  }
  isModalOpen.value = true
}

const submitModal = async (modalData: DatasetModalData) => {
  if (modalData.dataset !== undefined) {
    // check if data.gouv.fr URL and update metadata if needed
    if (
      modalData.dataset.uri &&
      modalData.dataset.availability === Availability.URL_AVAILABLE
    ) {
      const pattern = new RegExp(
        `^${config.datagouvfr.base_url}(?:/.*)?/datasets/(?<datasetName>[a-zA-Z0-9_-]+)(?:/|#|$)`
      )
      const match = pattern.exec(modalData.dataset.uri)
      if (match?.groups?.datasetName) {
        try {
          const dataset = await useDatasetStore().load(
            match.groups.datasetName,
            {
              toasted: false
            }
          )
          if (dataset !== undefined) {
            modalData.dataset.availability = Availability.LOCAL_AVAILABLE
            const resolved = router.resolve({
              name: 'dataset_detail',
              params: { did: dataset.id }
            })
            modalData.dataset.uri = resolved.href
            modalData.dataset.id = dataset.id
          }
        } catch (error) {
          console.error(
            `Error fetching dataset from ${config.datagouvfr.base_url}`,
            error
          )
        }
      }
    }
    if (modalData.mode === 'create') {
      datasets.value.push(modalData.dataset)
    } else if (modalData.mode === 'edit' && modalData.index !== undefined) {
      datasets.value[modalData.index] = modalData.dataset
    }
  }
  emits('submitModal')
}

const closeModal = () => {
  isModalOpen.value = false
}

defineExpose({ addDataset, editDataset })
</script>

<template>
  <DsfrModal
    v-if="isModalOpen && modalData.dataset"
    size="lg"
    class="topic-dataset-modal"
    :title="
      modalData.mode === 'edit'
        ? 'Éditer le jeu de données'
        : 'Ajouter un jeu de données'
    "
    :opened="isModalOpen"
    aria-modal="true"
    @close="closeModal"
  >
    <form novalidate>
      <DatasetPropertiesFields
        v-model="modalData.dataset"
        :already-selected-datasets="datasets"
        @update-validation="(isValid: boolean) => (modalData.isValid = isValid)"
      />
    </form>
    <slot name="footer">
      <DsfrButtonGroup
        v-if="modalActions?.length"
        align="right"
        :buttons="modalActions"
        inline-layout-when="large"
      />
    </slot>
  </DsfrModal>
</template>

<style scoped>
:deep(h1) {
  margin-bottom: 1rem;
}
</style>

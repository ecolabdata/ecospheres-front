<script setup lang="ts">
import type { DatasetV2 } from '@datagouv/components-next'
import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  Availability,
  type DatasetProperties,
  type DatasetsGroups
} from '@/model/topic'
import { useDatasetStore } from '@/store/DatasetStore'
import { useTopicsConf } from '@/utils/config'

import DatasetPropertiesTextFields from './DatasetPropertiesTextFields.vue'
import SelectDataset from './SelectDataset.vue'

const emit = defineEmits(['updateValidation', 'update:datasetProperties'])

const datasetProperties = defineModel({
  type: Object as () => DatasetProperties,
  default: {}
})

const datasetsGroups = defineModel('groups-model', {
  type: Object as () => DatasetsGroups,
  default: []
})

defineProps({
  alreadySelectedDatasets: {
    type: Array<DatasetProperties>,
    default: []
  }
})

const router = useRouter()
const datasetStore = useDatasetStore()
const { topicsDatasetEditorialization } = useTopicsConf()

const selectedDataset: Ref<DatasetV2 | undefined> = ref(undefined)

const hasEditorialization = computed(() => {
  return (
    !!datasetProperties.value.title.trim() &&
    !!datasetProperties.value.purpose.trim() &&
    (datasetProperties.value.group
      ? datasetProperties.value.group.trim().length < 100
      : true)
  )
})

const isValidDataset = computed((): boolean => {
  const isValidWithoutEditorialization =
    isValidCatalogDataset.value &&
    isValidUrlDataset.value &&
    !datasetProperties.value.remoteDeleted

  if (!topicsDatasetEditorialization) return isValidWithoutEditorialization

  return isValidWithoutEditorialization && hasEditorialization.value
})

const isValidCatalogDataset = computed((): boolean => {
  if (datasetProperties.value.availability === Availability.LOCAL_AVAILABLE) {
    return (
      datasetProperties.value.uri !== null &&
      datasetProperties.value.id !== null
    )
  }
  return true
})

const isValidUrlDataset = computed((): boolean => {
  if (datasetProperties.value.availability === Availability.URL_AVAILABLE) {
    return datasetProperties.value.uri !== null
  }
  return true
})

const onSelectDataset = (value: DatasetV2 | undefined) => {
  if (value === undefined) {
    datasetProperties.value.uri = null
    datasetProperties.value.id = null
  } else {
    datasetProperties.value.availability = Availability.LOCAL_AVAILABLE
    datasetProperties.value.id = value.id
    const resolved = router.resolve({
      name: 'dataset_detail',
      params: { did: value.id }
    })
    datasetProperties.value.uri = resolved.href
    delete datasetProperties.value.remoteDeleted
  }
}

watch(
  isValidDataset,
  (newValue) => {
    emit('updateValidation', newValue)
  },
  { immediate: true }
)

watch(
  () => datasetProperties.value.availability,
  (availability) => {
    if (availability !== Availability.LOCAL_AVAILABLE) {
      selectedDataset.value = undefined
      datasetProperties.value.uri = null
      datasetProperties.value.id = null
    }
    delete datasetProperties.value.remoteDeleted
  }
)

onMounted(() => {
  if (datasetProperties.value.id && !datasetProperties.value.remoteDeleted) {
    datasetStore.load(datasetProperties.value.id).then((dataset) => {
      selectedDataset.value = dataset
    })
  }
})
</script>

<template>
  <DatasetPropertiesTextFields
    v-if="topicsDatasetEditorialization"
    v-model:dataset-properties-model="datasetProperties"
  />
  <div class="fr-mt-1w fr-mb-4w">
    <SelectDataset
      v-model="selectedDataset"
      :already-selected-datasets="alreadySelectedDatasets"
      @update:model-value="onSelectDataset"
    />
  </div>
  <div
    v-if="!selectedDataset && topicsDatasetEditorialization"
    class="fr-mt-4w"
  >
    <fieldset id="alt-source" class="fr-fieldset">
      <legend
        class="fr-fieldset__legend fr-fieldset__legend--regular"
        for="alt-source"
      >
        Vous ne trouvez pas le jeu de données dans data.gouv.fr&nbsp;?
      </legend>
      <DsfrRadioButton
        v-model="datasetProperties.availability"
        name="source"
        :value="Availability.URL_AVAILABLE"
        label="J'ajoute l'URL"
      />
      <div
        v-if="datasetProperties.availability === Availability.URL_AVAILABLE"
        class="fr-mb-4w fr-fieldset__element"
      >
        <DsfrInput
          id="alt-link"
          v-model="datasetProperties.uri"
          label="Url vers le jeu de données souhaité (obligatoire)"
          :label-visible="true"
          class="fr-mb-md-1w fr-input"
        />
      </div>
      <DsfrRadioButton
        v-model="datasetProperties.availability"
        name="source"
        :value="Availability.MISSING"
        label="Je n'ai pas trouvé la donnée"
      />
      <DsfrRadioButton
        v-model="datasetProperties.availability"
        name="source"
        :value="Availability.NOT_AVAILABLE"
        label="Je n'ai pas cherché la donnée"
      />
    </fieldset>
  </div>
  <div class="fr-input-group">
    <SelectTopicGroup
      v-model:properties-model="datasetProperties"
      v-model:groups-model="datasetsGroups"
      label="Regroupement"
      description="Rechercher ou créer un regroupement (100 caractères maximum). Un regroupement contient un ou plusieurs jeux de données."
    />
  </div>
</template>

<style scoped>
.fr-fieldset {
  margin: 30px 0;
}
textarea {
  height: 150px;
}
</style>

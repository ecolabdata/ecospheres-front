<script setup lang="ts">
import type { DatasetV2 } from '@datagouv/components'
import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  Availability,
  type DatasetProperties,
  type DatasetsGroups
} from '@/model/topic'
import { useDatasetStore } from '@/store/DatasetStore'
import { useTopicsConf } from '@/utils/config'
import { useForm } from '@/utils/form'

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

const formErrors = defineModel('errors-model', {
  type: Array<string>,
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
const { getErrorMessage } = useForm(formErrors)

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
    :error-title="getErrorMessage('title')"
    :error-purpose="getErrorMessage('purpose')"
  />
  <div id="input-availability" tabindex="-1">
    <div class="fr-mt-1w fr-mb-4w">
      <SelectDataset
        v-model="selectedDataset"
        :already-selected-datasets="alreadySelectedDatasets"
        :is-invalid="formErrors.includes('availability')"
        @update:model-value="onSelectDataset"
      />
    </div>
    <div
      v-if="!selectedDataset && topicsDatasetEditorialization"
      class="fr-mt-4w"
    >
      <fieldset
        class="fr-fieldset availability"
        role="radiogroup"
        aria-errormessage="errors-availability"
        :aria-invalid="formErrors.includes('availability') ? true : undefined"
      >
        <legend class="fr-fieldset__legend fr-fieldset__legend--regular">
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
            id="input-availabilityUrl"
            v-model="datasetProperties.uri"
            label="Url vers le jeu de données souhaité (obligatoire)"
            :label-visible="true"
            class="fr-mb-md-1w fr-input"
            aria-errormessage="errors-availabilityUrl"
            :aria-invalid="
              formErrors.includes('availabilityUrl') ? true : undefined
            "
          />
          <ErrorMessage
            v-if="!!getErrorMessage('availabilityUrl')"
            input-name="availabilityUrl"
            :error-message="getErrorMessage('availabilityUrl')"
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
    <ErrorMessage
      v-if="!!getErrorMessage('availability')"
      :error-message="getErrorMessage('availability')"
      input-name="availability"
    />
  </div>
  <div class="fr-input-group">
    <SelectTopicGroup
      v-model:properties-model="datasetProperties"
      v-model:groups-model="datasetsGroups"
      label="Regroupement"
      description="Rechercher ou créer un regroupement (100 caractères maximum). Un regroupement contient un ou plusieurs jeux de données."
      :error-message="getErrorMessage('group')"
    />
  </div>
</template>

<style scoped>
.fr-fieldset {
  margin: 30px 0;
}
.fr-fieldset.availability[aria-invalid='true'] {
  border: none;
  outline: 2px solid var(--border-plain-error);
}
#input-availability:focus {
  outline-style: solid;
}
fieldset legend {
  inline-size: fit-content;
}
textarea {
  height: 150px;
}
</style>

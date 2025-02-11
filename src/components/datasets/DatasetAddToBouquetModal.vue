<script setup lang="ts">
import type { DatasetV2 } from '@datagouv/components'
import { capitalize, computed, onMounted, ref } from 'vue'
import { useLoading } from 'vue-loading-overlay'
import { toast } from 'vue3-toastify'

import DatasetPropertiesTextFields from '@/components/forms/dataset/DatasetPropertiesTextFields.vue'
import { Availability, type DatasetProperties } from '@/model/topic'
import { useTopicStore } from '@/store/TopicStore'
import { useTopicsConf } from '@/utils/config'

import { useExtras } from '@/utils/bouquet'
import { useGroups } from '@/utils/bouquetGroups'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  dataset: {
    type: Object as () => DatasetV2,
    required: true
  }
})

const emit = defineEmits(['update:show'])
const loader = useLoading()
const topicStore = useTopicStore()

const { topicsName, topicsExtrasKey, topicsDatasetEditorialization } =
  useTopicsConf()

const bouquets = topicStore.myTopics
const datasetProperties = ref<DatasetProperties>({
  title: '',
  purpose: '',
  id: props.dataset.id,
  uri: `/datasets/${props.dataset.id}`,
  availability: Availability.LOCAL_AVAILABLE
})
const selectedBouquetId: Ref<string | null> = ref(null)

const bouquetOptions = computed(() => {
  return bouquets.value.map((bouquet) => {
    return {
      value: bouquet.id,
      text: bouquet.name
    }
  })
})

const inputErrorMessages = new Map([
  ['bouquetId', `Veuillez sélectionner un ${topicsName}.`],
  ['group', `Le groupe est limité à 100 caractères.`],
  ['title', 'Veuillez renseigner un libellé.'],
  ['purpose', "La raison d'utilisation ne doit pas être vide."]
])
const formErrors: Ref<string[]> = ref([])

const validateFields = () => {
  if (!datasetProperties.value.title.trim()) {
    formErrors.value.push('title')
  }
  if (!datasetProperties.value.purpose.trim()) {
    formErrors.value.push('purpose')
  }
  if (!selectedBouquetId.value) {
    formErrors.value.push('bouquetId')
  }
  if (
    datasetProperties.value.group &&
    datasetProperties.value.group.trim().length > 100
  ) {
    formErrors.value.push('group')
  }
}

const sortedinputErrors = computed(() =>
  Array.from(inputErrorMessages.keys()).filter((key) =>
    formErrors.value.includes(key)
  )
)

const isValid = computed(() => {
  if (topicsDatasetEditorialization) {
    return !formErrors.value.length
  } else {
    return !!selectedBouquetId.value
  }
})

const modalActions = computed(() => {
  return [
    {
      label: 'Annuler',
      secondary: true,
      onClick: () => closeModal()
    },
    {
      label: 'Enregistrer',
      onClick: () => onSubmit()
    }
  ]
})

const errorStatus = useTemplateRef('errorStatus')
const isSubmitted: Ref<boolean> = ref(false)

const onSubmit = () => {
  // reset error fields
  formErrors.value = []
  isSubmitted.value = true

  validateFields()

  if (formErrors.value.length > 0) {
    errorStatus.value?.focus()
  } else if (isValid.value) {
    isSubmitted.value = false
    submit()
  }
}

const selectedBouquet = computed(() => {
  if (selectedBouquetId.value === null) {
    return null
  }
  return topicStore.get(selectedBouquetId.value)
})

const { datasetsProperties } = useExtras(selectedBouquet)

const isDatasetInBouquet = computed(() => {
  if (!selectedBouquetId.value) {
    return false
  }
  return datasetsProperties.value.some(
    (datasetProps) => datasetProps.id === props.dataset.id
  )
})

const { groupedDatasets: datasetsGroups } = useGroups(datasetsProperties)

const submit = async () => {
  if (selectedBouquetId.value === null) {
    throw Error('Trying to attach to topic without id')
  }
  const bouquet = topicStore.get(selectedBouquetId.value)
  if (bouquet === undefined) {
    throw Error('Topic not in store')
  }
  const newDatasetsProperties =
    bouquet.extras[topicsExtrasKey].datasets_properties || []
  newDatasetsProperties.push(datasetProperties.value)
  bouquet.extras[topicsExtrasKey].datasets_properties = newDatasetsProperties
  await topicStore.update(bouquet.id, {
    id: bouquet.id,
    tags: bouquet.tags,
    extras: bouquet.extras
  })
  toast(
    `Jeu de données ajouté avec succès au ${topicsName} "${bouquet.name}"`,
    {
      type: 'success'
    }
  )
  closeModal()
}

const closeModal = () => {
  emit('update:show', false)
}

onMounted(() => {
  const loading = loader.show()
  topicStore.loadTopicsForUniverse().then(() => loading.hide())
})
</script>

<template>
  <DsfrModal
    v-if="show"
    size="lg"
    :title="`Ajouter le jeu de données à un de vos ${topicsName}s`"
    :opened="show"
    aria-modal="true"
    class="form"
    @close="closeModal"
  >
    <div
      v-show="formErrors.length"
      class="fr-my-4w fr-p-2w error-status"
      role="group"
      aria-labelledby="error-summary-title"
    >
      <h3 id="error-summary-title" ref="errorStatus" tabindex="-1">
        Il y a {{ sortedinputErrors.length }} erreur<span
          v-if="formErrors.length > 1"
          >s</span
        >
        de saisie dans le formulaire.
      </h3>
      <ol>
        <li
          v-for="(error, index) in sortedinputErrors"
          :key="index"
          class="error"
        >
          <a :href="`#input-${error}`">{{ inputErrorMessages.get(error) }}</a>
        </li>
      </ol>
    </div>
    <DsfrSelect
      id="input-bouquetId"
      v-model="selectedBouquetId"
      :label="`${capitalize(topicsName)} à associer (obligatoire)`"
      :options="bouquetOptions"
      :default-unselected-text="`Choisissez un ${topicsName}`"
      :aria-invalid="
        formErrors.includes('bouquetId') && isSubmitted ? true : undefined
      "
      aria-describedby="errors-bouquetId"
    />
    <p
      v-if="formErrors.includes('bouquetId')"
      id="errors-bouquetId"
      class="error"
    >
      <VIconCustom name="error-fill" />
      {{ inputErrorMessages.get('bouquetId') }}
    </p>
    <DsfrBadge
      v-if="isDatasetInBouquet"
      type="info"
      label="Déjà utilisé dans ce bouquet"
      small
      ellipsis
      class="fr-mb-2w"
    />
    <div class="fr-input-group">
      <SelectTopicGroup
        id="input-group"
        v-model:properties-model="datasetProperties"
        v-model:groups-model="datasetsGroups"
        label="Regroupement"
        description="Rechercher ou créer un regroupement (100 caractères maximum). Un regroupement contient un ou plusieurs jeux de données."
      >
        <template v-if="formErrors.includes('group')" #errorGroup>
          {{ inputErrorMessages.get('group') }}
        </template>
      </SelectTopicGroup>
    </div>
    <DatasetPropertiesTextFields
      v-if="topicsDatasetEditorialization"
      v-model:dataset-properties-model="datasetProperties"
    >
      <template v-if="formErrors.includes('title')" #errorTitle>
        {{ inputErrorMessages.get('title') }}
      </template>
      <template v-if="formErrors.includes('purpose')" #errorPurpose>
        {{ inputErrorMessages.get('purpose') }}
      </template>
    </DatasetPropertiesTextFields>

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
.fr-select-group:has(+ .fr-badge) {
  margin-bottom: 0.5rem;
}
:deep(.fr-select-group:has(+ #errors-name)) {
  margin-bottom: 0;
}
</style>

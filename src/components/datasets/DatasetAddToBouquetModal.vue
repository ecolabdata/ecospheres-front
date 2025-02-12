<script setup lang="ts">
import type { DatasetV2 } from '@datagouv/components'
import { capitalize, computed, onMounted, ref } from 'vue'
import { useLoading } from 'vue-loading-overlay'
import { toast } from 'vue3-toastify'

import DatasetPropertiesTextFields from '@/components/forms/dataset/DatasetPropertiesTextFields.vue'
import type { Topic } from '@/model/topic'
import { Availability, type DatasetProperties } from '@/model/topic'
import { useTopicStore } from '@/store/TopicStore'
import { useExtras } from '@/utils/bouquet'
import { useGroups } from '@/utils/bouquetGroups'
import { useTopicsConf } from '@/utils/config'

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

const isValid = computed(() => {
  if (topicsDatasetEditorialization) {
    return (
      !!datasetProperties.value.title.trim() &&
      !!datasetProperties.value.purpose.trim() &&
      !!selectedBouquetId.value &&
      (datasetProperties.value.group
        ? datasetProperties.value.group.trim().length < 100
        : true)
    )
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
      disabled: !isValid.value,
      onClick: () => submit()
    }
  ]
})

const selectedBouquet: Ref<Topic | null> = ref(null)

watch(selectedBouquetId, async () => {
  if (selectedBouquetId.value === null) {
    return null
  }
  selectedBouquet.value = await topicStore.load(selectedBouquetId.value)
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
  if (selectedBouquetId.value === null || selectedBouquet.value === null) {
    throw Error('Trying to attach to topic without id')
  }
  const newDatasetsProperties =
    selectedBouquet.value.extras[topicsExtrasKey].datasets_properties || []
  newDatasetsProperties.push(datasetProperties.value)
  selectedBouquet.value.extras[topicsExtrasKey].datasets_properties =
    newDatasetsProperties
  await topicStore.update(selectedBouquet.value.id, {
    id: selectedBouquet.value.id,
    tags: selectedBouquet.value.tags,
    extras: selectedBouquet.value.extras
  })
  toast(
    `Jeu de données ajouté avec succès au ${topicsName} "${selectedBouquet.value.name}"`,
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
    @close="closeModal"
  >
    <DsfrSelect
      v-model="selectedBouquetId"
      :label="`${capitalize(topicsName)} à associer (obligatoire)`"
      :options="bouquetOptions"
      :default-unselected-text="`Choisissez un ${topicsName}`"
    >
    </DsfrSelect>
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
        v-model:properties-model="datasetProperties"
        v-model:groups-model="datasetsGroups"
        label="Regroupement"
        description="Rechercher ou créer un regroupement (100 caractères maximum). Un regroupement contient un ou plusieurs jeux de données."
      />
    </div>
    <DatasetPropertiesTextFields
      v-if="topicsDatasetEditorialization"
      v-model:dataset-properties-model="datasetProperties"
    />
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
</style>

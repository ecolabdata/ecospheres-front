<script setup lang="ts">
import type { DatasetV2 } from '@datagouv/components'
import { capitalize, computed, onMounted, ref } from 'vue'
import { useLoading } from 'vue-loading-overlay'
import { useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'

import DatasetPropertiesTextFields from '@/components/forms/dataset/DatasetPropertiesTextFields.vue'
import { Availability, type DatasetProperties } from '@/model/topic'
import { useTopicStore } from '@/store/TopicStore'
import { useSearchPagesConfig } from '@/utils/config'

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

const route = useRoute()

const emit = defineEmits(['update:show'])
const loader = useLoading()
const topicStore = useTopicStore()

const {
  searchPageName,
  searchPageExtrasKey,
  searchPageDatasetEditorialization,
  searchPageSlug
} = useSearchPagesConfig(route.path.replace('/admin', '').split('/')[1])

const topics = topicStore.myTopics
const datasetProperties = ref<DatasetProperties>({
  title: '',
  purpose: '',
  id: props.dataset.id,
  uri: `/datasets/${props.dataset.id}`,
  availability: Availability.LOCAL_AVAILABLE
})
const selectedTopicId = ref(null)

const topicOptions = computed(() => {
  return topics.value.map((topic) => {
    return {
      value: topic.id,
      text: topic.name
    }
  })
})

const isValid = computed(() => {
  if (searchPageDatasetEditorialization) {
    return (
      datasetProperties.value.title.trim() !== '' &&
      datasetProperties.value.purpose.trim() !== '' &&
      !!selectedTopicId.value
    )
  } else {
    return !!selectedTopicId.value
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

const isDatasetInTopic = computed(() => {
  if (selectedTopicId.value === null) {
    return false
  }
  const selectedTopic = topicStore.get(selectedTopicId.value)
  const datasetsProperties =
    selectedTopic?.extras[searchPageExtrasKey].datasets_properties
  return datasetsProperties?.some(
    (datasetProps) => datasetProps.id === props.dataset.id
  )
})

const submit = async () => {
  if (selectedTopicId.value === null) {
    throw Error('Trying to attach to topic without id')
  }
  const topic = topicStore.get(selectedTopicId.value)
  if (topic === undefined) {
    throw Error('Topic not in store')
  }
  const newDatasetsProperties =
    topic.extras[searchPageExtrasKey].datasets_properties || []
  newDatasetsProperties.push(datasetProperties.value)
  topic.extras[searchPageExtrasKey].datasets_properties = newDatasetsProperties
  await topicStore.update(topic.id, {
    id: topic.id,
    tags: topic.tags,
    extras: topic.extras
  })
  toast(
    `Jeu de données ajouté avec succès au ${searchPageName} "${topic.name}"`,
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
  topicStore.loadTopicsForUniverse([searchPageSlug]).then(() => loading.hide())
})
</script>

<template>
  <DsfrModal
    v-if="show"
    size="lg"
    :title="`Ajouter le jeu de données à un de vos ${searchPageName}s`"
    :opened="show"
    aria-modal="true"
    @close="closeModal"
  >
    <DsfrSelect
      v-model="selectedTopicId"
      :label="`${capitalize(searchPageName)} à associer (obligatoire)`"
      :options="topicOptions"
      :default-unselected-text="`Choisissez un ${searchPageName}`"
    >
    </DsfrSelect>
    <DsfrBadge
      v-if="isDatasetInTopic"
      type="info"
      label="Déjà utilisé dans ce topic"
      small
      ellipsis
      class="fr-mb-2w"
    />
    <DatasetPropertiesTextFields
      v-if="searchPageDatasetEditorialization"
      v-model:dataset-properties="datasetProperties"
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

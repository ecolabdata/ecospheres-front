<script setup lang="ts">
import type { DatasetV2 } from '@datagouv/components'
import { useDebounceFn } from '@vueuse/core'
import { defineModel, ref } from 'vue'

import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'

import '@/assets/multiselect.css'

import type { DatasetProperties } from '@/model/topic'
import SearchAPI from '@/services/api/SearchAPI'
import { debounceWait } from '@/utils/config'

const selectedDataset = defineModel({
  type: Object as () => DatasetV2
})

const props = defineProps({
  alreadySelectedDatasets: {
    type: Array<DatasetProperties>,
    default: []
  },
  isInvalid: {
    type: Boolean,
    default: false
  },
  errorMessageId: {
    type: String,
    default: 'errors-availability'
  }
})

const isLoading = ref(false)

const alreadySelected = (id: string): boolean => {
  for (const alreadySelectedDataset of props.alreadySelectedDatasets) {
    if (alreadySelectedDataset.id === id) return true
  }
  return false
}

const search = useDebounceFn(async (query: string) => {
  isLoading.value = true
  if (!query) {
    isLoading.value = false
    return
  }
  try {
    return (
      await new SearchAPI().search(query, null, 1, {
        page_size: 10
      })
    ).data
  } catch (error) {
    console.error('Search error', error)
  } finally {
    isLoading.value = false
  }
}, debounceWait)

const clear = () => {
  selectedDataset.value = undefined
}
</script>

<template>
  <label class="fr-label fr-mb-2v" for="input-dataset">
    Jeu de données (facultatif)
  </label>
  <p id="dataset-description" class="fr-mt-1v fr-mb-2v fr-text--sm">
    Rechercher un jeu de données dans data.gouv.fr
  </p>
  <Multiselect
    id="input-dataset"
    v-model="selectedDataset"
    role="search"
    :object="true"
    value-prop="id"
    label="title"
    track-by="title"
    :filter-results="false"
    :min-chars="3"
    :clear-on-search="true"
    :delay="0"
    :options="search"
    :resolve-on-load="false"
    :searchable="true"
    :limit="5"
    :strict="false"
    :clear-on-blur="false"
    placeholder=""
    no-options-text="Aucun jeu de données trouvé, précisez ou élargissez votre recherche."
    :aria="{
      'aria-describedby': 'dataset-description',
      'aria-errormessage': `${errorMessageId}`,
      'aria-invalid': `${isInvalid ? true : undefined}`,
      // useless or unsupported https://github.com/vueform/multiselect/issues/436
      'aria-labelledby': null,
      'aria-multiselectable': null,
      'aria-placeholder': null
    }"
  >
    <template #singlelabel="{ value }">
      <div class="multiselect-single-label fr-py-2w">
        <DatasetCardForSelect
          :dataset="value"
          :already-selected="alreadySelected(value.id)"
          badge-position="absolute"
        />
      </div>
    </template>
    <template #option="{ option }">
      <DatasetCardForSelect
        :dataset="option"
        :already-selected="alreadySelected(option.id)"
        badge-position="relative"
      />
    </template>
    <template #clear>
      <button
        type="button"
        class="multiselect-clear"
        @click="clear"
        @keydown.enter="clear"
        @keydown.space="clear"
      >
        <span class="fr-sr-only">Supprimer la sélection</span>
        <span aria-hidden class="multiselect-clear-icon"></span>
      </button>
    </template>
  </Multiselect>
</template>

<style scoped>
.multiselect-single-label {
  position: relative;
  margin-inline-end: auto;
}
.multiselect:has(.fr-badge.absolute) {
  margin-top: 1.5rem;
}
</style>

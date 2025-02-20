<script lang="ts" setup>
import type { DatasetProperties, DatasetsGroups } from '@/model/topic'

import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'
import ErrorMessage from './ErrorMessage.vue'

const datasetProperties = defineModel('properties-model', {
  type: Object as () => DatasetProperties,
  default: {}
})

const datasetsGroups = defineModel('groups-model', {
  type: Object as () => DatasetsGroups,
  default: []
})

defineProps({
  label: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: undefined
  },
  required: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const groupOptions = computed(() =>
  Array.from(datasetsGroups.value, ([key]) => key)
)

const clear = () => {
  datasetProperties.value.group = undefined
}

const trimGroupName = (groupName: string) => {
  // prevents spaces at the beginning and end of the group name
  datasetProperties.value.group = groupName.trim()
}
</script>

<template>
  <label for="input-group">
    {{ label }}
    (<span v-if="required">obligatoire</span><span v-else>facultatif</span>)
  </label>
  <p
    v-if="description"
    id="regroupement-description"
    class="fr-mt-1v fr-mb-2v fr-text--sm"
  >
    {{ description }}
  </p>
  <Multiselect
    id="input-group"
    v-model="datasetProperties.group"
    role="search"
    :options="groupOptions"
    :searchable="true"
    :limit="5"
    :strict="false"
    no-options-text="Il n'y a pas encore de regroupement dans ce bouquet."
    no-results-text="Aucun regroupement existant."
    :create-option="true"
    placeholder=""
    :aria="{
      'aria-describedby': 'regroupement-description',
      'aria-errormessage': 'errors-group',
      // useless or unsupported https://github.com/vueform/multiselect/issues/436
      'aria-labelledby': null,
      'aria-multiselectable': null,
      'aria-placeholder': null,
      'aria-invalid': `${!!errorMessage}`
    }"
    @select="trimGroupName"
  >
    <template #option="{ option }">
      <span v-if="option.__CREATE__">
        Ajouter "{{ option.label }}" comme regroupement
      </span>
      <span v-else>{{ option.label }}</span>
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
  <ErrorMessage
    v-if="errorMessage"
    input-name="group"
    :error-message="errorMessage"
  />
</template>

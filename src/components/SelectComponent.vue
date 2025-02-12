<!-- a select component with a selectable null value (default) -->
<script setup lang="ts">
import { getRandomId } from '@gouvminint/vue-dsfr'

type SelectOption = {
  id: string
  name: string
}

const selectedOption = defineModel({
  type: String as () => string | null,
  default: null
})

defineProps({
  options: {
    type: Object as PropType<SelectOption[]>,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  labelClass: {
    type: Array,
    default: () => ['fr-label']
  },
  defaultOption: {
    type: String,
    default: null
  }
})

const id = getRandomId('select')
</script>

<template>
  <label :class="labelClass" :for="id">{{ label }}</label>
  <select :id="id" v-model="selectedOption" class="fr-select fr-col">
    <option v-if="defaultOption" :value="null">
      {{ defaultOption }}
    </option>
    <option v-for="option in options" :key="option.id" :value="option.id">
      {{ option.name }}
    </option>
  </select>
</template>

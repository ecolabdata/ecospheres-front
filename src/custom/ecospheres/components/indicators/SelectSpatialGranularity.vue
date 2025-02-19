<script setup lang="ts">
import SelectComponent from '@/components/SelectComponent.vue'
import type { SpatialCoverageLevel } from '@/model/spatial'
import { useSpatialStore } from '@/store/SpatialStore'

const selectedGranularity = defineModel({
  type: String as () => string | null,
  default: null
})

const options: Ref<SpatialCoverageLevel[]> = ref([])

onMounted(() => {
  useSpatialStore()
    .loadLevels()
    .then((levels) => {
      options.value = levels
    })
})
</script>

<template>
  <SelectComponent
    v-model="selectedGranularity"
    default-option="Toutes les mailles"
    label="Maille minimale"
    :options="options"
  />
</template>

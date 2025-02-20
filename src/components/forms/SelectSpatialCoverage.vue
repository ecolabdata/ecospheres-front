<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { onMounted, ref, type PropType } from 'vue'

import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'

import type { SpatialCoverage, SpatialCoverageLevel } from '@/model/spatial'
import SpatialAPI from '@/services/api/SpatialAPI'
import { useSpatialStore } from '@/store/SpatialStore'

import { debounceWait } from '@/utils/config'

const selectedSpatialCoverage = defineModel('spatialCoverageModel', {
  type: Object as PropType<SpatialCoverage>
})

defineProps({
  short: {
    type: Boolean,
    default: false
  }
})

const isLoading = ref(false)

const getLevelById = (levelId: string): SpatialCoverageLevel | undefined => {
  return useSpatialStore().getLevelById(levelId)
}

const search = useDebounceFn(async (query: string) => {
  isLoading.value = true
  if (!query) {
    isLoading.value = false
    return
  }
  try {
    return await new SpatialAPI().suggestZones(query, {
      page_size: 10
    })
  } catch (error) {
    console.error('Search error', error)
  } finally {
    isLoading.value = false
  }
}, debounceWait)

const clear = () => {
  selectedSpatialCoverage.value = undefined
}

onMounted(() => {
  useSpatialStore().loadLevels()
})
</script>

<template>
  <Multiselect
    id="select-spatial-coverage"
    v-model="selectedSpatialCoverage"
    role="search"
    :object="true"
    value-prop="id"
    label="name"
    track-by="name"
    class="fr-input-wrap"
    :filter-results="false"
    :min-chars="3"
    :clear-on-search="true"
    :delay="0"
    :options="search"
    placeholder=""
    :resolve-on-load="false"
    :searchable="true"
    :limit="10"
    :strict="false"
    :clear-on-blur="false"
    :allow-absent="true"
    no-options-text="Aucune couverture territoriale trouvée, précisez ou élargissez votre recherche."
    :aria="{
      // useless or unsupported yet https://github.com/vueform/multiselect/issues/436
      'aria-labelledby': null,
      'aria-multiselectable': null,
      'aria-placeholder': null
    }"
  >
    <template #clear>
      <button
        class="multiselect-clear"
        @click="clear"
        @keydown.prevent.enter="clear"
        @keydown.prevent.space="clear"
      >
        <span class="fr-sr-only">Supprimer la sélection</span>
        <span aria-hidden class="multiselect-clear-icon"></span>
      </button>
    </template>

    <template #singlelabel="{ value }">
      <div class="multiselect-single-label fr-py-2w">
        <span v-if="short">
          {{ value.name }}
        </span>
        <span v-else>
          {{ getLevelById(value.level)?.name }} : {{ value.name }} ({{
            value.code
          }})
        </span>
      </div>
    </template>

    <template #option="{ option }">
      <div class="spatial-select-option">
        <div class="header">
          <span class="name">{{ option.name }}</span>
          <span class="code fr-ml-1v">{{ option.code }}</span>
        </div>
        <div class="level">
          {{ getLevelById(option.level)?.name }}
        </div>
      </div>
    </template>
  </Multiselect>
</template>

<style scoped>
.spatial-select-option {
  flex-direction: column;
  align-items: flex-start;
  .code,
  .level {
    font-size: 0.8rem;
  }
  .level {
    display: block;
  }
}
</style>

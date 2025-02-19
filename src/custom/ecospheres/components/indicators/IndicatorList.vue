<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, watch, type ComputedRef } from 'vue'
import { useLoading } from 'vue-loading-overlay'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import type { IndicatorFilters } from '../../model/indicator'
import { useIndicatorStore } from '../../store/IndicatorStore'

import SelectComponent from '@/components/SelectComponent.vue'
import IndicatorCard from './IndicatorCard.vue'

const route = useRoute()
const router = useRouter()
const store = useIndicatorStore()

type Props = IndicatorFilters & {
  query: string
  page: number
  sort: string | null
  geozone: string | null
  granularity: string | null
}
const props = withDefaults(defineProps<Props>(), { query: '' })

const emits = defineEmits(['clearFilters'])

const { indicators, pagination, total } = storeToRefs(store)

const numberOfResultMsg: ComputedRef<string> = computed(() => {
  if (total.value === 1) {
    return '1 indicateur disponible'
  } else if (total.value > 1) {
    return `${total.value} indicateurs disponibles`
  } else {
    return 'Aucun résultat ne correspond à votre recherche'
  }
})

const clearFilters = () => {
  const query: LocationQueryRaw = {}
  router
    .push({ name: 'indicators', query, hash: '#indicators-list' })
    .then(() => {
      emits('clearFilters')
    })
}

const executeQuery = async (args: typeof props) => {
  const loader = useLoading().show({ enforceFocus: false })
  return store.query(args).finally(() => loader.hide())
}

const goToPage = (page: number) => {
  router.push({
    name: 'indicators',
    query: { ...route.query, page: page + 1 },
    hash: '#indicators-list'
  })
}

const doSort = (value: string | null) => {
  router.push({
    name: 'indicators',
    query: { ...route.query, sort: value },
    hash: '#indicators-list'
  })
}

// launch search on props (~route.query) changes
watch(props, () => executeQuery(props), { immediate: true, deep: true })

defineExpose({
  numberOfResultMsg
})
</script>

<template>
  <div
    v-if="indicators.length > 0"
    class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle justify-between fr-pb-2w"
  >
    <h2 class="fr-col-auto fr-my-0 h4">{{ numberOfResultMsg }}</h2>
    <div class="fr-col-auto fr-grid-row fr-grid-row--middle">
      <SelectComponent
        label="Trier par :"
        default-option="Pertinence"
        :label-class="['fr-col-auto', 'fr-text--sm', 'fr-m-0', 'fr-mr-1w']"
        :options="[
          { id: '-created', name: 'Les plus récemment créés' },
          { id: '-last_update', name: 'Les plus récemment modifiés' }
        ]"
        @update:model-value="doSort"
      />
    </div>
  </div>
  <div
    v-if="indicators.length === 0"
    class="fr-mt-2w rounded-xxs fr-p-3w fr-grid-row flex-direction-column bg-contrast-blue-cumulus"
  >
    <div class="fr-col fr-grid-row fr-grid-row--gutters text-blue-400">
      <div class="fr-col-auto">
        <img
          src="/search/france_with_magnifying_glass.svg"
          alt=""
          loading="lazy"
          class="w-100"
          height="134"
          width="124"
        />
      </div>
      <div
        class="fr-col-12 fr-col-sm fr-grid-row flex-direction-column justify-between"
      >
        <div class="fr-mb-1w">
          <h2 class="fr-m-0 fr-mb-1w fr-text--bold fr-text--md">
            Aucun résultat ne correspond à votre recherche
          </h2>
          <p class="fr-mt-1v fr-mb-3v">
            Essayez de réinitialiser les filtres pour agrandir votre champ de
            recherche.
          </p>
        </div>
        <div class="fr-grid-row fr-grid-row--undefined">
          <button class="fr-btn" @click.stop.prevent="clearFilters">
            Réinitialiser les filtres
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="fr-mb-4w border-top">
    <ul class="fr-grid-row flex-gap fr-mt-3w fr-pl-0" role="list">
      <li v-for="indicator in indicators" :key="indicator.id" class="col-fluid">
        <IndicatorCard :indicator="indicator" />
      </li>
    </ul>
  </div>
  <DsfrPagination
    v-if="pagination.length"
    class="fr-container"
    :current-page="page - 1"
    :pages="pagination"
    @update:current-page="goToPage"
  />
</template>

<style scoped>
.fr-grid-row {
  --gap: 1rem;
}
.col-fluid {
  padding: 0;
  flex: 1 1 48%;
  min-inline-size: 30ch;
}
</style>

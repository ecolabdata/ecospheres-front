<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ComputedRef, PropType } from 'vue'
import { computed } from 'vue'
import { useLoading } from 'vue-loading-overlay'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import { useTopicStore } from '@/store/TopicStore'
import { useUserStore } from '@/store/UserStore'
import { useTopicsConf } from '@/utils/config'

const router = useRouter()
const route = useRoute()
const topicStore = useTopicStore()

const { topicsName, topicsSlug } = useTopicsConf()

const userStore = useUserStore()
const { canAddBouquet } = storeToRefs(userStore)

// TODO: use BouquetQueryArgs here for typing (migrate include_drafts)
const props = defineProps({
  theme: {
    type: String,
    default: null
  },
  subtheme: {
    type: String,
    default: null
  },
  showDrafts: {
    type: Boolean
  },
  geozone: {
    type: String as PropType<string | null>,
    default: null
  },
  query: {
    type: String,
    default: ''
  },
  page: {
    type: String,
    default: '1'
  },
  sort: {
    type: String,
    required: true
  }
})

const emits = defineEmits(['clearFilters'])

const {
  topics: bouquets,
  pagination,
  total: nbBouquets
} = storeToRefs(topicStore)

const numberOfResultMsg: ComputedRef<string> = computed(() => {
  if (nbBouquets.value === 1) {
    return `1 ${topicsName} disponible`
  } else if (nbBouquets.value > 1) {
    return nbBouquets.value + ` ${topicsName}s disponibles`
  } else {
    return 'Aucun résultat ne correspond à votre recherche'
  }
})

const createUrl = computed(() => {
  return { name: `${topicsSlug}_add`, query: route.query }
})

const clearFilters = () => {
  const query: LocationQueryRaw = {}
  if (route.query.drafts) query.drafts = route.query.drafts
  router.push({ name: topicsSlug, query, hash: '#bouquets-list' }).then(() => {
    emits('clearFilters')
  })
}

const executeQuery = async (args: typeof props) => {
  const loader = useLoading().show({ enforceFocus: false })
  const { showDrafts, ...cleanArgs } = args
  const queryArgs = {
    ...cleanArgs,
    // TODO: maybe handle this through a prop of the same name
    ...(showDrafts && { include_private: 'yes' })
  }
  return topicStore.query(queryArgs).finally(() => loader.hide())
}

const goToPage = (page: number) => {
  router.push({
    name: topicsSlug,
    query: { ...route.query, page: page + 1 },
    hash: '#bouquets-list'
  })
}

const doSort = (value: string | null) => {
  router.push({
    name: topicsSlug,
    query: { ...route.query, sort: value },
    hash: '#bouquets-list'
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
    v-if="nbBouquets > 0"
    class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle justify-between fr-pb-2w"
  >
    <h2 class="fr-col-auto fr-my-0 h4">{{ numberOfResultMsg }}</h2>
    <div class="fr-col-auto fr-grid-row fr-grid-row--middle">
      <SelectComponent
        :model-value="sort"
        label="Trier par :"
        :label-class="['fr-col-auto', 'fr-text--sm', 'fr-m-0', 'fr-mr-1w']"
        :options="[
          { id: '-last_modified', name: 'Les plus récemment modifiés' },
          { id: '-created', name: 'Les plus récemment créés' },
          { id: 'name', name: 'Titre' }
        ]"
        @update:model-value="doSort"
      />
    </div>
  </div>
  <div
    v-if="nbBouquets === 0"
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
            recherche.<br />
            Vous pouvez aussi contribuer en créant un {{ topicsName }}.
          </p>
        </div>
        <div class="fr-grid-row">
          <button class="fr-btn" @click.stop.prevent="clearFilters">
            Réinitialiser les filtres
          </button>
          <router-link
            v-if="canAddBouquet"
            :to="createUrl"
            class="fr-btn fr-btn--secondary fr-ml-1w"
          >
            <VIconCustom name="add-circle-line" class="fr-mr-1v" />
            Ajouter un {{ topicsName }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
  <div class="fr-mb-4w border-top">
    <ul class="fr-grid-row flex-gap fr-mt-3w fr-pl-0" role="list">
      <li v-for="bouquet in bouquets" :key="bouquet.id" class="fr-col-12">
        <BouquetCard :bouquet="bouquet" />
      </li>
    </ul>
  </div>
  <DsfrPagination
    v-if="pagination.length"
    class="fr-container"
    :current-page="parseInt(page) - 1"
    :pages="pagination"
    @update:current-page="goToPage"
  />
</template>

<style scoped>
.fr-grid-row {
  --gap: 1rem;
}
</style>

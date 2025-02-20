<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ComputedRef, PropType } from 'vue'
import { computed, onMounted } from 'vue'
import { useLoading } from 'vue-loading-overlay'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import { NoOptionSelected } from '@/model/theme'
import type { Topic } from '@/model/topic'
import { useTopicStore } from '@/store/TopicStore'
import { useUserStore } from '@/store/UserStore'
import { useTopicsConf } from '@/utils/config'

const router = useRouter()
const route = useRoute()
const topicStore = useTopicStore()

const { topicsName, topicsSlug, topicsExtrasKey } = useTopicsConf()

const userStore = useUserStore()
const { canAddBouquet } = storeToRefs(userStore)

const props = defineProps({
  themeName: {
    type: String,
    default: NoOptionSelected
  },
  subthemeName: {
    type: String,
    default: NoOptionSelected
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
  }
})

const emits = defineEmits(['clearFilters'])

const bouquets: ComputedRef<Topic[]> = computed(() => {
  return topicStore.sorted
    .filter((bouquet) => {
      return !props.showDrafts ? !bouquet.private : true
    })
    .filter((bouquet) => {
      if (props.geozone === null) return true
      return (
        bouquet.spatial?.zones &&
        bouquet.spatial.zones.length > 0 &&
        bouquet.spatial.zones.includes(props.geozone)
      )
    })
    .filter((bouquet) => {
      if (props.themeName === NoOptionSelected) return true
      return bouquet.extras[topicsExtrasKey].theme === props.themeName
    })
    .filter((bouquet) => {
      if (props.subthemeName === NoOptionSelected) return true
      return bouquet.extras[topicsExtrasKey].subtheme === props.subthemeName
    })
    .filter((bouquet) => {
      if (props.query === '') return true
      return bouquet.name.toLowerCase().includes(props.query.toLowerCase())
    })
})

const numberOfResultMsg: ComputedRef<string> = computed(() => {
  if (bouquets.value.length === 1) {
    return `1 ${topicsName} disponible`
  } else if (bouquets.value.length > 1) {
    return bouquets.value.length + ` ${topicsName}s disponibles`
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
  router.push({ name: topicsSlug, query }).then(() => {
    emits('clearFilters')
  })
}

onMounted(() => {
  const loader = useLoading().show({ enforceFocus: false })
  topicStore.loadTopicsForUniverse().then(() => loader.hide())
})

defineExpose({
  numberOfResultMsg
})
</script>

<template>
  <div
    v-if="bouquets.length > 0"
    class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle justify-between fr-pb-2w"
  >
    <h2 class="fr-col-auto fr-my-0 h4">{{ numberOfResultMsg }}</h2>
    <div class="fr-col-auto fr-grid-row fr-grid-row--middle">
      <label for="sort-search" class="fr-col-auto fr-text--sm fr-m-0 fr-mr-1w"
        >Trier par :</label
      >
      <div class="fr-col">
        <DsfrSelect
          v-model="topicStore.sort"
          select-id="sort-search"
          :options="[
            { value: '-created_at', text: 'Les plus récemment créés' },
            { value: '-last_modified', text: 'Les plus récemment modifiés' },
            { value: 'name', text: 'Titre' }
          ]"
        ></DsfrSelect>
      </div>
    </div>
  </div>
  <div
    v-if="bouquets.length === 0"
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
</template>

<style scoped>
.fr-grid-row {
  --gap: 1rem;
}
</style>

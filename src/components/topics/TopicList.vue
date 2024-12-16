<script setup lang="ts">
import type { ComputedRef, PropType } from 'vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useLoading } from 'vue-loading-overlay'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import type { Topic } from '@/model/topic'
import { useTopicStore } from '@/store/TopicStore'
import { useUserStore } from '@/store/UserStore'
import { useSearchPagesConfig } from '@/utils/config'

const router = useRouter()
const route = useRoute()
let topicStore = useTopicStore()

const searchPageName = ref<string>('')
const searchPageSlug = ref<string>('')
const searchPageExtrasKey = ref<string>('')
const searchPageLabelTitle = ref<string>('')

const config = useSearchPagesConfig(
  route.path.replace('/admin', '').split('/')[1]
)
searchPageName.value = config.searchPageName
searchPageSlug.value = config.searchPageSlug
searchPageExtrasKey.value = config.searchPageExtrasKey
searchPageLabelTitle.value = config.searchPageLabelTitle

const userStore = useUserStore()

const props = defineProps({
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

const topics: ComputedRef<Topic[]> = computed(() => {
  return topicStore.sorted
    .filter((topic) => {
      return !props.showDrafts ? !topic.private : true
    })
    .filter((topic) => {
      if (props.geozone === null) return true
      return (
        topic.spatial?.zones &&
        topic.spatial.zones.length > 0 &&
        topic.spatial.zones.includes(props.geozone)
      )
    })
    .filter((topic) => {
      if (props.query === '') return true
      return topic.name.toLowerCase().includes(props.query.toLowerCase())
    })
})

const numberOfResultMsg: ComputedRef<string> = computed(() => {
  if (topics.value.length === 1) {
    return `1 ${searchPageLabelTitle.value} disponible`
  } else if (topics.value.length > 1) {
    return topics.value.length + ` ${searchPageLabelTitle.value} disponibles`
  } else {
    return 'Aucun résultat ne correspond à votre recherche'
  }
})

const createUrl = computed(() => {
  return { name: `${searchPageSlug.value}_add`, query: route.query }
})

const clearFilters = () => {
  const query: LocationQueryRaw = {}
  if (route.query.drafts) query.drafts = route.query.drafts
  router.push({ name: searchPageSlug.value, query }).then(() => {
    emits('clearFilters')
  })
}

onMounted(() => {
  const loader = useLoading().show({ enforceFocus: false })
  topicStore
    .loadTopicsForUniverse([searchPageSlug.value])
    .then(() => loader.hide())
})

defineExpose({
  numberOfResultMsg
})

const updateTopics = () => {
  let tags = [searchPageSlug.value]
  const loader = useLoading().show({ enforceFocus: false })
  topicStore.isLoaded = false
  if (route.query.tags) {
    let filteredTags = route.query.tags.toString().split(',')
    tags = [...tags, ...filteredTags]
  }
  topicStore.loadTopicsForUniverse(tags).then(() => loader.hide())
}

watch(
  () => route.fullPath,
  () => {
    const config = useSearchPagesConfig(
      route.path.replace('/admin', '').split('/')[1]
    )
    if (config) {
      searchPageName.value = config.searchPageName
      searchPageSlug.value = config.searchPageSlug
      searchPageExtrasKey.value = config.searchPageExtrasKey
      searchPageLabelTitle.value = config.searchPageLabelTitle
      updateTopics()
    }
  }
)
</script>

<template>
  <div
    v-if="topics.length > 0"
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
    v-if="topics.length === 0"
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
            Vous pouvez aussi contribuer en créant un {{ searchPageName }}.
          </p>
        </div>
        <div class="fr-grid-row fr-grid-row--undefined">
          <button class="fr-btn" @click.stop.prevent="clearFilters">
            Réinitialiser les filtres
          </button>
          <router-link
            v-if="userStore.canAddTopic(searchPageSlug)"
            :to="createUrl"
            class="fr-btn fr-btn--secondary fr-ml-1w"
          >
            <VIcon name="ri-add-circle-line" class="fr-mr-1v" />
            Ajouter un {{ searchPageName }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
  <div class="topics-list-container fr-container fr-mb-4w border-top">
    <ul class="fr-mt-3w fr-pl-0" role="list">
      <li v-for="topic in topics" :key="topic.id" class="fr-col-12">
        <TopicCard :topic="topic" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* "revert" gutters — simpler than w/o gutters */
.topics-list-container {
  padding-right: 0;
  padding-left: 0;
}
</style>

<script setup lang="ts">
import { computed, ref, watch, watchEffect, type PropType, type Ref } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import SelectSpatialCoverage from '@/components/forms/SelectSpatialCoverage.vue'
import type { FilterConf } from '@/model/config'
import type { SpatialCoverage } from '@/model/spatial'
import SpatialAPI from '@/services/api/SpatialAPI'
import { useUserStore } from '@/store/UserStore'
import { useSearchPagesConfig } from '@/utils/config'

interface Filter {
  filter: string
  value: string
}

const spatialAPI = new SpatialAPI()

const props = defineProps({
  geozone: {
    type: String as PropType<string | null>,
    default: null
  },
  showDrafts: {
    type: Boolean,
    default: false
  }
})

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const selectedGeozone: Ref<string | undefined> = ref(undefined)
const selectedSpatialCoverage: Ref<SpatialCoverage | undefined> = ref(undefined)

const searchPageName = ref<string>('')
const searchPageSlug = ref<string>('')
const searchPageFilters = ref<FilterConf[]>([])

const config = useSearchPagesConfig(
  route.path.replace('/admin', '').split('/')[1]
)
searchPageName.value = config.searchPageName
searchPageSlug.value = config.searchPageSlug
searchPageFilters.value = config.searchPageFilters

const currentFilters = ref<Record<string, string>>({})

if (searchPageFilters.value) {
  searchPageFilters.value.forEach((item) => {
    currentFilters.value[item.tag] = ''
  })
}

const localShowDrafts = ref(false)

const computeQueryArgs = (): LocationQueryRaw => {
  const query: LocationQueryRaw = {}
  if (selectedGeozone.value) query.geozone = selectedGeozone.value
  if (localShowDrafts.value) {
    query.drafts = 1
  }
  if (route.query.q) {
    query.q = route.query.q
  }
  let tags = Object.entries(currentFilters.value)
    .map(([key, value]) => value)
    .filter((value) => value != '')
    .join(',')
  if (tags) {
    query.tags = tags
  }
  return query
}

const navigate = () => {
  router.push({
    path: `/${searchPageSlug.value}`,
    query: computeQueryArgs()
  })
}

const updateCurrentFilters = (tag: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  currentFilters.value[tag] = target.value
  if (searchPageFilters.value) {
    searchPageFilters.value.forEach((spf) => {
      if (spf.condition_on && spf.condition_on == tag) {
        currentFilters.value[spf.tag] = ''
      }
    })
  }
  navigate()
}

const switchSpatialCoverage = (
  spatialCoverage: SpatialCoverage | null | undefined
) => {
  selectedGeozone.value =
    spatialCoverage != null ? spatialCoverage.id : undefined
  navigate()
}

const switchLocalShowDrafts = () => {
  navigate()
}

watchEffect(() => {
  if (props.geozone) {
    selectedGeozone.value = props.geozone
    spatialAPI
      .getZone(props.geozone)
      .then((zone) => (selectedSpatialCoverage.value = zone))
  } else {
    selectedSpatialCoverage.value = undefined
    selectedGeozone.value = undefined
  }
  localShowDrafts.value = props.showDrafts
})

watch(
  () => route.fullPath,
  () => {
    const config = useSearchPagesConfig(
      route.path.replace('/admin', '').split('/')[1]
    )
    if (config) {
      searchPageName.value = config.searchPageName
      searchPageSlug.value = config.searchPageSlug
      searchPageFilters.value = config.searchPageFilters
    }
  }
)

const filteredSearchPageFilters = computed(() => {
  if (!searchPageFilters.value) return
  return searchPageFilters.value.map((spf) => ({
    ...spf,
    values:
      spf.condition_on && spf.condition_on in currentFilters.value
        ? spf.values.filter(
            (option) =>
              currentFilters.value[spf.condition_on] === option.condition_on
          )
        : spf.values
  }))
})
</script>

<template>
  <div className="filterForm">
    <DsfrCheckbox
      v-if="userStore.isLoggedIn"
      v-model="localShowDrafts"
      label="Afficher les brouillons"
      name="show_drafts"
      @update:model-value="switchLocalShowDrafts"
    />
    <div v-bind:key="filter.name" v-for="filter in filteredSearchPageFilters">
      <div class="fr-select-group">
        <label class="fr-label" :for="`select_${filter.tag}`">
          {{ filter.name }}
        </label>
        <select
          :id="`select_${filter.tag}`"
          class="fr-select"
          @change="updateCurrentFilters(filter.tag, $event)"
        >
          <option value="">Toutes les {{ filter.name }}</option>
          <option
            v-for="option in filter.values"
            :key="option.tag"
            :value="option.tag"
          >
            {{ option.name }}
          </option>
        </select>
      </div>
    </div>
    <div class="fr-select-group">
      <label class="fr-label" for="select-spatial-coverage"
        >Couverture territoriale</label
      >
      <SelectSpatialCoverage
        v-model:spatial-coverage-model="selectedSpatialCoverage"
        :short="true"
        @update:spatial-coverage-model="switchSpatialCoverage"
      />
    </div>
  </div>
</template>

<style scoped>
.fr-select-group {
  margin-bottom: 20px;
}
</style>

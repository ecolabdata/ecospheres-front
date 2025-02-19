<script setup lang="ts">
import {
  capitalize,
  ref,
  toRef,
  watchEffect,
  type PropType,
  type Ref
} from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import SelectSpatialCoverage from '@/components/forms/SelectSpatialCoverage.vue'
import SelectComponent from '@/components/SelectComponent.vue'
import type { SpatialCoverage } from '@/model/spatial'
import SpatialAPI from '@/services/api/SpatialAPI'
import { useUserStore } from '@/store/UserStore'
import { useTopicsConf } from '@/utils/config'
import { useTagOptions } from '@/utils/tags'

const spatialAPI = new SpatialAPI()

const props = defineProps({
  theme: {
    type: String,
    default: null
  },
  subtheme: {
    type: String,
    default: null
  },
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

const themeIdRef = toRef(props, 'theme')
const { tagOptions: themeOptions, subTagOptions: subthemeOptions } =
  useTagOptions('bouquets', themeIdRef, 'theme')

const { topicsSlug, topicsUseThemes, topicsMainTheme, topicsSecondaryTheme } =
  useTopicsConf()
const localShowDrafts = ref(false)

const computeQueryArgs = (
  data?: Record<string, string | null>
): LocationQueryRaw => {
  const query: LocationQueryRaw = {}
  if (props.theme) query.theme = props.theme
  if (props.subtheme) query.subtheme = props.subtheme
  if (selectedGeozone.value) query.geozone = selectedGeozone.value
  if (localShowDrafts.value) {
    query.drafts = 1
  }
  if (route.query.q) {
    query.q = route.query.q
  }
  return { ...query, ...data }
}

const navigate = (data?: Record<string, string | null>) => {
  router.push({
    path: `/${topicsSlug}`,
    query: computeQueryArgs(data),
    hash: '#bouquets-list'
  })
}

const switchTheme = (value: string | null | undefined) => {
  navigate({
    theme: value || null,
    subtheme: null
  })
}

const switchSubtheme = (value: string | null | undefined) => {
  navigate({
    subtheme: value || null
  })
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
</script>

<template>
  <div className="filterForm">
    <DsfrCheckbox
      v-if="userStore.isLoggedIn"
      v-model="localShowDrafts"
      value="y"
      label="Afficher les brouillons"
      name="show_drafts"
      @update:model-value="switchLocalShowDrafts"
    />
    <template v-if="topicsUseThemes">
      <div class="fr-select-group">
        <SelectComponent
          :default-option="`Toutes les ${topicsMainTheme}s`"
          :label="capitalize(topicsMainTheme)"
          :options="themeOptions"
          :model-value="props.theme"
          @update:model-value="(value) => switchTheme(value)"
        />
      </div>
      <div class="fr-select-group">
        <SelectComponent
          :default-option="`Tous les ${topicsSecondaryTheme}s`"
          :label="capitalize(topicsSecondaryTheme)"
          :options="subthemeOptions"
          :model-value="props.subtheme"
          @update:model-value="(value) => switchSubtheme(value)"
        />
      </div>
    </template>
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

<script setup lang="ts">
import { ref, watchEffect, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SelectSpatialCoverage from '@/components/forms/SelectSpatialCoverage.vue'
import SelectComponent from '@/components/SelectComponent.vue'
import SelectSpatialGranularity from '@/custom/ecospheres/components/indicators/SelectSpatialGranularity.vue'
import type { SpatialCoverage } from '@/model/spatial'
import SpatialAPI from '@/services/api/SpatialAPI'
import type { IndicatorFilters } from '../../model/indicator'
import { useIndicatorsFiltersConf } from '../../utils/config'

const spatialAPI = new SpatialAPI()

type Props = IndicatorFilters & {
  geozone: string | null
  granularity: string | null
}
const props = defineProps<Props>()

const router = useRouter()
const route = useRoute()

const selectedGeozone: Ref<string | null> = ref(null)
const selectedSpatialCoverage: Ref<SpatialCoverage | undefined> = ref(undefined)

const filtersConf = useIndicatorsFiltersConf()

const navigate = (data?: Record<string, string | null>) => {
  router.push({
    name: 'indicators',
    query: { ...route.query, ...data },
    hash: '#indicators-list'
  })
}

const switchFilter = (filter: string, value: string | null) => {
  navigate({ [filter]: value })
}

const switchSpatialCoverage = (
  spatialCoverage: SpatialCoverage | null | undefined
) => {
  selectedGeozone.value = spatialCoverage != null ? spatialCoverage.id : null
  navigate({ geozone: selectedGeozone.value })
}

const switchSpatialGranularity = (
  spatialCoverageGranularity: string | null
) => {
  navigate({ granularity: spatialCoverageGranularity })
}

watchEffect(() => {
  if (props.geozone) {
    selectedGeozone.value = props.geozone
    spatialAPI
      .getZone(props.geozone)
      .then((zone) => (selectedSpatialCoverage.value = zone))
  } else {
    selectedSpatialCoverage.value = undefined
    selectedGeozone.value = null
  }
})
</script>

<template>
  <div className="filterForm">
    <div class="fr-select-group">
      <SelectComponent
        default-option="Tous les enjeux"
        :label="filtersConf.enjeu.name"
        :options="filtersConf.enjeu.values"
        :model-value="props.enjeu"
        @update:model-value="(value) => switchFilter('enjeu', value)"
      />
    </div>
    <div class="fr-select-group">
      <SelectComponent
        default-option="Toutes les thématiques"
        :label="filtersConf.theme.name"
        :options="filtersConf.theme.values"
        :model-value="props.theme"
        @update:model-value="(value) => switchFilter('theme', value)"
      />
    </div>
    <div class="fr-select-group">
      <SelectComponent
        default-option="Tous les secteurs"
        :label="filtersConf.secteur.name"
        :options="filtersConf.secteur.values"
        :model-value="props.secteur"
        @update:model-value="(value) => switchFilter('secteur', value)"
      />
    </div>
    <div class="fr-select-group">
      <SelectComponent
        default-option="Tous les leviers"
        :label="filtersConf.levier.name"
        :options="filtersConf.levier.values"
        :model-value="props.levier"
        @update:model-value="(value) => switchFilter('levier', value)"
      />
    </div>
    <div class="fr-select-group">
      <SelectComponent
        default-option="Tous les producteurs"
        :label="filtersConf.producteur.name"
        :options="filtersConf.producteur.values"
        :model-value="props.producteur"
        @update:model-value="(value) => switchFilter('producteur', value)"
      />
    </div>
    <div class="fr-select-group">
      <SelectComponent
        default-option="Tous les usages"
        :label="filtersConf.usage.name"
        :options="filtersConf.usage.values"
        :model-value="props.usage"
        @update:model-value="(value) => switchFilter('usage', value)"
      />
    </div>
    <div class="fr-select-group">
      <SelectSpatialGranularity
        :model-value="props.granularity"
        @update:model-value="switchSpatialGranularity"
      />
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

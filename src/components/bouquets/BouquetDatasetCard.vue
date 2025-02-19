<script setup lang="ts">
import type { DatasetV2 } from '@datagouv/components'
import { DatasetCard } from '@datagouv/components'
import { toRef } from 'vue'

import IndicatorDatasetCard from '@/custom/ecospheres/components/indicators/IndicatorDatasetCard.vue'
import { isIndicator } from '@/custom/ecospheres/utils/indicator'
import { type DatasetProperties } from '@/model/topic'

const props = defineProps({
  datasetProperties: {
    type: Object as () => DatasetProperties,
    required: true
  },
  datasetContent: {
    type: Object as () => DatasetV2,
    default: null,
    required: false
  }
})

const datasetPropertiesRef = toRef(props, 'datasetProperties')
const datasetIsIndicator = isIndicator(toRef(props, 'datasetContent'))
</script>

<template>
  <!-- Using :key ensures that the component is recreated when dataset changes otherwise, we have a persistence on the thumbnail -->
  <DatasetCard
    v-if="datasetContent && !datasetIsIndicator"
    :key="datasetContent.id"
    :dataset="datasetContent"
    :dataset-url="{
      name: 'dataset_detail',
      params: { did: datasetContent.id }
    }"
    :show-description="false"
    class="dataset-card fr-m-0"
  />
  <IndicatorDatasetCard
    v-if="datasetContent && datasetIsIndicator"
    :key="datasetContent.id"
    :dataset="datasetContent"
    class="dataset-card fr-m-0"
  />
  <DsfrAlert
    v-if="datasetProperties.remoteDeleted"
    class="fr-mb-4w"
    type="warning"
    title="Jeu de données supprimé"
  >
    <div>Ce jeu de données a été détecté comme supprimé sur data.gouv.fr.</div>
    <div>
      Son identifiant est <code>{{ datasetPropertiesRef.id }}</code
      >.
    </div>
  </DsfrAlert>
</template>

<style scoped>
/* fix overflow from "mis à jour" text in DatasetCard */
:deep(h4 + div) {
  flex-wrap: wrap;
}
.dataset-card {
  background-color: var(--background-default-grey, #fff);
}
</style>

<script setup lang="ts">
/**
 * This component is a copy of the DatasetCard component from the @datagouv/components package.
 * It is used to display an indicator.
 */
import type { DatasetV2 } from '@datagouv/components'
import {
  Avatar,
  OrganizationNameWithCertificate,
  Placeholder,
  QualityComponentInline,
  formatRelativeIfRecentDate,
  summarize
} from '@datagouv/components'
import TextClamp from 'vue3-text-clamp'

import { useOwnerName } from '@/utils/dataset'

type Props = {
  dataset: DatasetV2
}

const props = defineProps<Props>()

const ownerName = useOwnerName(props.dataset)
</script>

<template>
  <div class="fr-my-2w fr-p-2w border border-default-grey fr-enlarge-link">
    <div
      class="absolute top-0 fr-grid-row fr-grid-row--middle fr-mt-n3v fr-ml-n1v"
    >
      <p
        class="fr-badge fr-badge--sm fr-badge--mention-grey text-grey-380 fr-mr-1w"
      >
        <span
          class="fr-icon-lightbulb-line fr-icon--sm"
          aria-hidden="true"
        ></span>
        Indicateur
      </p>
    </div>
    <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
      <div class="fr-col-auto">
        <div class="logo">
          <Placeholder
            v-if="dataset.organization"
            type="dataset"
            :src="dataset.organization.logo_thumbnail"
            alt=""
            :size="40"
          />
          <Avatar v-else-if="dataset.owner" :user="dataset.owner" :size="40" />
          <Placeholder v-else type="dataset" :size="40" />
        </div>
      </div>
      <div class="fr-col-12 fr-col-sm">
        <h4 class="fr-text--md fr-mb-0 fr-grid-row">
          <RouterLink
            :to="{ name: 'indicator_detail', params: { iid: dataset.id } }"
            class="text-grey-500 fr-grid-row"
          >
            <TextClamp
              class="fr-col"
              :auto-resize="true"
              :text="dataset.title"
              :max-lines="1"
            />
            <small v-if="dataset.acronym" class="fr-col-auto fr-ml-1w">{{
              dataset.acronym
            }}</small>
          </RouterLink>
        </h4>
        <div
          v-if="dataset.organization || dataset.owner"
          class="fr-text--sm fr-m-0 inline-flex"
        >
          <template v-if="dataset.organization">
            <span class="not-enlarged fr-mr-1v">
              <OrganizationNameWithCertificate
                :organization="dataset.organization"
              />
            </span>
          </template>
          <TextClamp
            v-else
            class="not-enlarged fr-mr-1v"
            :auto-resize="true"
            :text="ownerName"
            :max-lines="1"
          />
          <span class="text-mention-grey dash-before-sm whitespace-nowrap"
            >Mise à jour
            {{ formatRelativeIfRecentDate(dataset.last_update) }}</span
          >
        </div>
        <div
          class="fr-mx-0 fr-mb-n1v fr-grid-row fr-grid-row--middle fr-text--sm text-mention-grey"
        >
          <div class="fr-hidden flex-sm dash-after-sm text-grey-500">
            <QualityComponentInline :quality="dataset.quality" />
          </div>
          <div class="fr-grid-row fr-grid-row--middle fr-mr-1v">
            <p
              class="fr-text--sm fr-my-0"
              :aria-label="`${dataset.metrics.resources_downloads} téléchargements`"
            >
              <span
                class="fr-icon-download-line fr-icon--sm fr-px-1v"
                aria-hidden="true"
              ></span
              >{{ summarize(dataset.metrics.resources_downloads) }}
            </p>
            <p
              class="fr-text--sm fr-my-0"
              :aria-label="`${dataset.metrics.followers} abonnés`"
            >
              <span
                class="fr-icon-star-line fr-icon--sm fr-px-1v"
                aria-hidden="true"
              ></span
              >{{ summarize(dataset.metrics.followers) }}
            </p>
            <p
              class="fr-text--sm fr-my-0"
              :aria-label="`${dataset.metrics.reuses} réutilisations`"
            >
              <span
                class="fr-icon-line-chart-line fr-icon--sm fr-px-1v"
                aria-hidden="true"
              ></span
              >{{ summarize(dataset.metrics.reuses) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

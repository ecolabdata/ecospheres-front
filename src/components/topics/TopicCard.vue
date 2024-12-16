<script setup lang="ts">
import {
  formatRelativeIfRecentDate,
  OrganizationNameWithCertificate,
  useOwnerName
} from '@datagouv/components'
import { toRef } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useRoute } from 'vue-router'

import OrganizationLogo from '@/components/OrganizationLogo.vue'
import type { Topic } from '@/model/topic'
import { stripFromMarkdown } from '@/utils'
import { getOwnerAvatar } from '@/utils/avatar'
import { useSearchPagesConfig } from '@/utils/config'
import { useSpatialCoverage } from '@/utils/spatial'
import { useExtras } from '@/utils/topic'

const route = useRoute()
const { searchPageSlug, searchPageExtrasKey } = useSearchPagesConfig(
  route.path.replace('/admin', '').split('/')[1]
)

const props = defineProps({
  topic: {
    type: Object as () => Topic,
    required: true
  },
  hideDescription: {
    type: Boolean,
    default: false
  }
})

const topicRef = toRef(props, 'topic')
const spatialCoverage = useSpatialCoverage(topicRef)

const ownerName = useOwnerName(props.topic)

const { datasetsProperties } = useExtras(topicRef, searchPageExtrasKey)

const nbData: number = datasetsProperties.value.length

const topicLink: RouteLocationRaw = {
  name: `${searchPageSlug}_detail`,
  params: { bid: props.topic.slug }
}
</script>

<template>
  <article
    class="fr-my-1w fr-px-3w fr-py-2w border border-default-grey fr-enlarge-link"
  >
    <div
      v-if="topic.private"
      class="absolute top-0 fr-grid-row fr-grid-row--middle fr-mt-n3v"
    >
      <p class="fr-badge fr-badge--mention-grey fr-mr-1w">Brouillon</p>
    </div>
    <div class="fr-grid-row fr-pt-2v align-center flex-nowrap">
      <div class="fr-col-12 fr-col-sm-2 topic-card-col-logo">
        <OrganizationLogo
          v-if="topic.organization"
          :size="43"
          :object="topic"
        />
        <div v-else class="border fr-p-1-5v fr-mr-1-5v inline-block">
          <img
            :src="getOwnerAvatar(topic)"
            alt=""
            loading="lazy"
            class="owner-avatar"
            height="42"
            width="42"
          />
        </div>
      </div>
      <div
        class="fr-col-12 fr-col-sm-10 fr-pl-2v overflow-hidden flex-1-1-auto"
      >
        <h3 class="fr-mb-1v fr-grid-row h4">
          <RouterLink :to="topicLink" class="text-grey-500">
            {{ topic.name }}
          </RouterLink>
        </h3>
        <p v-if="topic.organization || topic.owner" class="fr-m-0 fr-text--sm">
          Par
          <template v-if="topic.organization">
            <OrganizationNameWithCertificate
              :organization="topic.organization"
            />
          </template>
          <template v-else>{{ ownerName }}</template>
        </p>
      </div>
    </div>
    <div v-if="!hideDescription" class="fr-grid-row description fr-mt-3v">
      <p class="fr-mb-1v">{{ stripFromMarkdown(topic.description) }}</p>
    </div>

    <p class="fr-mb-2v fr-text--sm flex align-center fr-pt-3v text-grey-380">
      <VIcon name="ri:time-line" class="fr-mr-1v text-grey-380" />
      Mis à jour {{ formatRelativeIfRecentDate(topic.last_modified) }}
    </p>

    <div class="fr-grid-row">
      <span class="fr-tag fr-mr-2v fr-mb-2v">
        <VIcon name="ri-database-2-line" class="fr-mr-1v" />
        <span class="fr-mr-1v">
          {{
            `${nbData > 0 ? nbData : 'Aucune'} donnée${nbData > 1 ? 's' : ''}`
          }}
        </span>
      </span>

      <span v-if="spatialCoverage" class="fr-tag fr-mb-2v">
        <VIcon name="ri-map-2-line" class="fr-mr-1v" />
        <span class="fr-mr-1v">
          {{ spatialCoverage.name }}
        </span>
      </span>
    </div>
  </article>
</template>

<style scoped>
.owner-avatar {
  margin-bottom: -6px;
  display: inline-block;
}

.fr-card__detail,
:deep(h3) {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  line-height: inherit;
}

.topic-card-col-logo {
  max-width: 4.25rem;
}

.description p {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>

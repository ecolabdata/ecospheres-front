<script setup lang="ts">
import {
  AppLink,
  InformationPanel,
  OrganizationNameWithCertificate,
  Pagination,
  QualityComponent,
  ReadMore,
  ResourceAccordion,
  Well,
  type License
} from '@datagouv/components'
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useLoading } from 'vue-loading-overlay'

import DiscussionsList from '@/components/DiscussionsList.vue'
import GenericContainer from '@/components/GenericContainer.vue'
import ReusesList from '@/components/ReusesList.vue'
import DatasetAddToTopicModal from '@/components/datasets/DatasetAddToTopicModal.vue'
import ExtendedInformationPanel from '@/components/datasets/ExtendedInformationPanel.vue'
import config from '@/config'
import {
  AccessibilityPropertiesKey,
  type AccessibilityPropertiesType
} from '@/model/injectionKeys'
import type { ResourceDataWithQuery } from '@/model/resource'
import { useRouteParamsAsString } from '@/router/utils'
import { useDatasetStore } from '@/store/DatasetStore'
import { useResourceStore } from '@/store/ResourceStore'
import { useUserStore } from '@/store/UserStore'
import { descriptionFromMarkdown, formatDate } from '@/utils'
import { useSearchPagesConfig } from '@/utils/config'

const route = useRouteParamsAsString()
const datasetId = route.params.did

const datasetStore = useDatasetStore()
const resourceStore = useResourceStore()
const userStore = useUserStore()

const dataset = computed(() => datasetStore.get(datasetId))

const resources = ref<Record<string, ResourceDataWithQuery>>({})
const selectedTabIndex = ref(0)
const license = ref<License>()
const showAddToTopicModal = ref(false)

const pageSize = config.website.pagination_sizes.files_list as number
const showDiscussions = config.website.discussions.dataset.display as boolean

const { searchPageName, searchPageSlug } = useSearchPagesConfig(
  route.path.replace('/admin', '').split('/')[1]
)

const setAccessibilityProperties = inject(
  AccessibilityPropertiesKey
) as AccessibilityPropertiesType

const updateQuery = (q: string, typeId: string) => {
  resources.value[typeId].query = q
  changePage(typeId, 1, q)
}

const doSearch = (typeId: string) => {
  changePage(typeId, 1, resources.value[typeId].query)
}

const links = computed(() => [
  { to: '/', text: 'Accueil' },
  { to: '/datasets', text: 'Données' },
  { text: dataset.value?.title }
])

const tabTitles = computed(() => {
  const _tabs = [
    { title: 'Fichiers', tabId: 'tab-0', panelId: 'tab-content-0' },
    { title: 'Réutilisations', tabId: 'tab-1', panelId: 'tab-content-1' },
    { title: 'Discussions', tabId: 'tab-2', panelId: 'tab-content-2' }
  ]
  _tabs.push({
    title: 'Informations',
    tabId: 'tab-3',
    panelId: 'tab-content-3'
  })
  return _tabs
})

const activeTab = ref(0)

const description = computed(() => descriptionFromMarkdown(dataset))

const showHarvestQualityWarning = computed(() => {
  const backend = dataset.value?.harvest?.backend
  const warningBackends =
    config.website.datasets.harvest_backends_quality_warning || []
  return backend && warningBackends.includes(backend)
})

const changePage = (type: string, page = 1, query = '') => {
  resources.value[type].currentPage = page
  resources.value[type].query = query
  if (dataset.value) {
    return resourceStore
      .fetchDatasetResources(dataset.value.id, type, page, query)
      .then((data) => {
        resources.value[type].resources = data.data
        resources.value[type].total = data.total
      })
  }
}

const getResourcesTitle = (typedResources: ResourceDataWithQuery) => {
  if (typedResources?.total > 1) {
    let pluralName
    switch (typedResources.type.id) {
      case 'main':
        pluralName = 'Fichiers principaux'
        break
      case 'documentation':
        pluralName = 'Documentations'
        break
      case 'update':
        pluralName = 'Mises à jour'
        break
      case 'api':
        pluralName = 'APIs'
        break
      case 'code':
        pluralName = 'Dépôts de code'
        break
      case 'other':
        pluralName = 'Autres'
        break
      default:
        pluralName = typedResources.type.label
    }
    return `${typedResources.total} ${pluralName}`
  } else {
    return typedResources.type.label
  }
}

const discussionWellTitle = showDiscussions
  ? 'Participer aux discussions'
  : 'Voir les discussions'
const discussionWellDescription = showDiscussions
  ? 'Vous avez une question sur ce jeu de données ? Rendez-vous sur data.gouv.fr pour participer aux discussions.'
  : 'Vous avez une question sur ce jeu de données ? Rendez-vous sur data.gouv.fr pour voir les discussions.'

const openDataGouvDiscussions = () =>
  window.open(`${dataset.value?.page}#/discussions`, 'datagouv-discussion')

onMounted(() => {
  datasetStore
    .load(datasetId, { toasted: false, redirectNotFound: true })
    .then(() => {
      setAccessibilityProperties(dataset.value?.title)
    })
})

// launch reuses and discussions fetch as soon as we have the technical id
watch(
  dataset,
  async () => {
    if (!dataset.value) return
    // fetch ressources if need be
    if (dataset.value.resources.rel) {
      const resourceLoader = useLoading().show({ enforceFocus: false })
      const allResources = (await resourceStore.loadResources(
        dataset.value.id,
        dataset.value.resources
      )) as ResourceDataWithQuery[]
      for (const typedResources of allResources) {
        resources.value[typedResources.type.id] = { ...typedResources }
        resources.value[typedResources.type.id].totalWithoutFilter =
          typedResources.total
      }
      resourceLoader.hide()
    } else {
      throw Error('Unsupported dataset.resources format')
    }
    license.value = await datasetStore.getLicense(dataset.value.license)
  },
  { immediate: true }
)
</script>

<template>
  <div class="fr-container">
    <DsfrBreadcrumb class="fr-mb-1v" :links="links" />
  </div>
  <GenericContainer v-if="dataset">
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12 fr-col-md-8">
        <h1 class="fr-mb-2v">{{ dataset.title }}</h1>
        <ReadMore max-height="600">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="description"></div>
        </ReadMore>
      </div>
      <div class="fr-col-12 fr-col-md-4">
        <h2 id="producer" class="subtitle fr-mb-1v">Producteur</h2>
        <div
          v-if="dataset.organization"
          class="fr-grid-row fr-grid-row--middle"
        >
          <div class="fr-col-auto">
            <div class="border fr-p-1-5v fr-mr-1-5v">
              <img
                :src="dataset.organization.logo"
                alt=""
                loading="lazy"
                height="32"
              />
            </div>
          </div>
          <p class="fr-col fr-m-0">
            <a class="fr-link" :href="dataset.organization.page">
              <OrganizationNameWithCertificate
                :organization="dataset.organization"
              />
            </a>
          </p>
        </div>
        <div v-if="dataset.harvest?.remote_url" class="fr-my-3v fr-text--sm">
          <div class="bg-alt-blue-cumulus fr-p-3v fr-mb-1w">
            <p class="fr-grid-row fr-grid-row--middle fr-my-0">
              Ce jeu de données provient d'un portail externe.
              <AppLink
                :to="dataset.harvest.remote_url"
                target="_blank"
                rel="noopener nofollow"
                >Voir la source originale.</AppLink
              >
            </p>
          </div>
        </div>
        <h2 class="subtitle fr-mt-3v fr-mb-1v">Dernière mise à jour</h2>
        <p>{{ formatDate(dataset.last_update) }}</p>
        <div v-if="license">
          <h2 class="subtitle fr-mt-3v fr-mb-1v">Licence</h2>
          <p class="fr-text--sm fr-mt-0 fr-mb-3v">
            <code class="bg-alt-grey fr-px-1v text-grey-380">
              <a :href="license.url">
                {{ license.title }}
              </a>
            </code>
          </p>
        </div>
        <QualityComponent
          v-if="config.website.show_quality_component"
          :quality="dataset.quality"
        />
        <div
          v-if="showHarvestQualityWarning"
          class="text-mention-grey fr-text--sm fr-my-1v"
        >
          <span
            class="fr-icon-warning-line fr-icon--sm"
            aria-hidden="true"
          ></span>
          La qualité des métadonnées peut être trompeuse car les métadonnées de
          la source originale peuvent avoir été perdues lors de leur
          récupération. Nous travaillons actuellement à améliorer la situation.
        </div>
        <div
          v-if="
            config.website.datasets.add_to_topic &&
            userStore.loggedIn &&
            userStore.canAddTopic(searchPageSlug)
          "
        >
          <DsfrButton
            class="fr-mt-2w"
            size="md"
            :label="`Ajouter à un ${searchPageName}`"
            icon="ri-file-add-line"
            @click="showAddToTopicModal = true"
          />
          <DatasetAddToTopicModal
            v-if="showAddToTopicModal"
            v-model:show="showAddToTopicModal"
            :dataset="dataset"
          />
        </div>
      </div>
    </div>

    <DsfrTabs
      v-model="activeTab"
      class="fr-mt-2w"
      tab-list-name="Groupes d'attributs du jeu de données"
      :tab-titles="tabTitles"
    >
      <!-- Fichiers -->
      <DsfrTabContent v-if="resources" panel-id="tab-content-0" tab-id="tab-0">
        <div v-if="selectedTabIndex === 0">
          <template v-for="typedResources in resources">
            <div
              v-if="typedResources.totalWithoutFilter"
              :key="typedResources.type.id"
              class="fr-mb-4w"
            >
              <h2 class="fr-mb-1v subtitle subtitle--uppercase">
                {{ getResourcesTitle(typedResources) }}
              </h2>
              <DsfrSearchBar
                v-if="typedResources.totalWithoutFilter > pageSize"
                label="Rechercher un fichier"
                button-text="Rechercher"
                placeholder=""
                :large="false"
                class="search-bar"
                @search="() => doSearch(typedResources.type.id)"
                @update:model-value="
                  (value: string) => updateQuery(value, typedResources.type.id)
                "
              />
              <span v-if="typedResources.resources.length != 0">
                <ResourceAccordion
                  v-for="resource in typedResources.resources"
                  :key="resource.id"
                  :dataset-id="datasetId"
                  :resource="resource"
                />
                <Pagination
                  v-if="typedResources.total > pageSize"
                  class="fr-mt-3w"
                  :page="typedResources.currentPage"
                  :page-size="pageSize"
                  :total-results="typedResources.total"
                  @change="
                    (page) =>
                      changePage(
                        typedResources.type.id,
                        page,
                        typedResources.query
                      )
                  "
                />
              </span>
              <span v-else> <br />Aucun résultat pour votre recherche. </span>
            </div>
          </template>
        </div>
      </DsfrTabContent>

      <!-- Réutilisations -->
      <DsfrTabContent panel-id="tab-content-1" tab-id="tab-1">
        <ReusesList model="dataset" :object-id="dataset.id" />
      </DsfrTabContent>

      <!-- Discussions -->
      <DsfrTabContent panel-id="tab-content-2" tab-id="tab-2">
        <Well
          v-if="!config.website.discussions.dataset.create"
          color="blue-cumulus"
          weight="regular"
        >
          <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
            <div class="fr-col-12 fr-col-lg-8">
              <p class="fr-text--bold fr-mb-0">{{ discussionWellTitle }}</p>
              <p class="fr-text--alt fr-text--sm f-italic fr-m-0">
                {{ discussionWellDescription }}
              </p>
            </div>
            <div class="fr-col-12 fr-col-lg-4 text-align-right">
              <DsfrButton
                label="Voir les discussions sur data.gouv.fr"
                icon="ri-external-link-line"
                size="sm"
                :icon-right="true"
                @click="openDataGouvDiscussions"
              />
            </div>
          </div>
        </Well>
        <DiscussionsList v-if="showDiscussions" :subject="dataset" />
      </DsfrTabContent>

      <!-- Informations -->
      <DsfrTabContent
        v-show="dataset && license"
        panel-id="tab-content-3"
        tab-id="tab-3"
      >
        <ExtendedInformationPanel
          v-if="
            config.website.datasets.show_extended_information_panel && dataset
          "
          :dataset="dataset"
        />
        <InformationPanel
          v-if="dataset && license"
          :dataset="dataset"
          :license="license"
        />
      </DsfrTabContent>
    </DsfrTabs>
  </GenericContainer>
</template>

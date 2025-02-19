<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { onMounted } from 'vue'

import SearchComponent from '@/components/SearchComponent.vue'
import BouquetCard from '@/components/bouquets/BouquetCard.vue'
import config from '@/config'
import HomeFaq from '@/custom/ecospheres/components/HomeFaq.vue'

import { useTopicStore } from '@/store/TopicStore'
import { storeToRefs } from 'pinia'

const topicStore = useTopicStore()
const { topics } = storeToRefs(topicStore)

onMounted(() => topicStore.query({ page_size: '3' }))

useHead({
  meta: [
    { property: 'og:title', content: config.website.title },
    { name: 'description', content: config.website.homepage.meta_description },
    {
      property: 'og:description',
      content: config.website.homepage.meta_description
    }
  ],
  link: [{ rel: 'canonical', href: window.location.origin }]
})
const dropdown = config.website.header_search.dropdown
</script>

<template>
  <div class="datagouv-components">
    <section class="fr-container fr-pt-12v">
      <h1 class="main-title-v2">
        Le catalogue des données
        <br />
        pour la <span class="highlight">transition écologique</span>
      </h1>
      <div class="big-search">
        <SearchComponent
          id="big-select-search"
          placeholder="Rechercher"
          search-label="Rechercher"
          :dropdown="dropdown"
        />
        <p class="text-grey-300 fr-text--sm fr-mt-1v">
          Exemple&nbsp;: «&nbsp;Itinéraires fraîcheur&nbsp;» dans les bouquets
          ou «&nbsp;Horaires des TGV&nbsp;» dans les données
        </p>
      </div>
    </section>
    <section class="fr-container explore-contribute fr-mt-10v">
      <ul class="fr-grid-row flex-gap fr-pb-12v" role="list">
        <li class="card-container border">
          <div class="home-card">
            <img src="../assets/explorer.svg" alt="" width="234" height="160" />
            <div class="card__content">
              <h2 class="h3">Explorer</h2>
              <p>
                Accéder aux données des services et opérateurs de l’État et
                d’une sélection d’organisations publiant des données utiles aux
                politiques du ministère en charge de l&rsquo;environnement.
              </p>
              <div class="card__links">
                <RouterLink
                  :to="{
                    name: 'datasets'
                  }"
                  class="fr-link fr-icon-arrow-right-line fr-link--icon-right"
                >
                  Parcourir les données</RouterLink
                >
                <RouterLink
                  :to="{
                    name: 'bouquets'
                  }"
                  class="fr-link fr-icon-arrow-right-line fr-link--icon-right"
                >
                  Découvrir des usages</RouterLink
                >
              </div>
            </div>
          </div>
        </li>

        <li class="card-container border">
          <div class="home-card">
            <img
              src="../assets/contribuer.svg"
              alt=""
              width="188"
              height="273"
            />
            <div class="card__content">
              <h2 class="h3">Contribuer</h2>
              <p>
                Participez au référencement et à l’articulation des données
                utiles à l’appui des politiques publiques grâce aux
                fonctionnalités de catalogage et au concept de bouquet de
                données.
              </p>
              <div class="card__links">
                <a
                  href="https://www.data.gouv.fr/fr/pages/onboarding/producteurs/"
                  class="fr-link fr-icon-arrow-right-line fr-link--icon-right"
                  >Publier des données</a
                >
                <RouterLink
                  :to="{
                    name: 'bouquets_add'
                  }"
                  class="fr-link fr-icon-arrow-right-line fr-link--icon-right"
                >
                  Partager des usages</RouterLink
                >
              </div>
            </div>
          </div>
        </li>
      </ul>
    </section>
    <section class="fr-container--fluid bg-grey fr-py-16v">
      <div class="fr-container bouquets">
        <h2>Cataloguer les usages grâce aux bouquets</h2>

        <div class="bg-white border fr-py-3w fr-px-2w">
          <div class="bg-grey">
            <ul class="fr-grid-row flex-gap organize-data" role="list">
              <li class="fr-grid-row">
                <div>
                  <img
                    src="../assets/sign-document.svg"
                    alt=""
                    class="illustration"
                    width="64"
                    height="64"
                  />
                  <h3>Documenter un besoin</h3>
                </div>
                <p>
                  Quels enjeux cherche-t-on à soutenir&nbsp;? Quels sont les
                  acteurs concernés&nbsp;? Un bouquet de données est créé au nom
                  d’un utilisateur ou d’une organisation. Tous les membres d’une
                  organisation peuvent éditer le bouquet.
                </p>
              </li>

              <li class="fr-grid-row">
                <div>
                  <img
                    src="../assets/binders.svg"
                    alt=""
                    class="illustration"
                    width="64"
                    height="64"
                  />
                  <h3>Lister les informations utiles</h3>
                </div>
                <p>
                  Quelles sont les informations géographiques ou les indicateurs
                  pertinents&nbsp;? Les bouquets de données permettent de
                  renseigner les informations souhaitées indépendamment de
                  l’existence des données.
                </p>
              </li>

              <li class="fr-grid-row">
                <div>
                  <img
                    src="../assets/document-add.svg"
                    alt=""
                    class="illustration"
                    width="64"
                    height="64"
                  />
                  <h3>Associer les données</h3>
                </div>
                <p>
                  Les données existantes satisfont-elles les besoins du cas
                  d’usage&nbsp;? L’association peut se faire dans sa forme la
                  plus interopérable via une donnée cataloguée sur
                  <b>data.gouv</b><i>.fr</i> ou le renseignement d’un URL.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="fr-container fr-my-10v">
        <div class="border"></div>
      </div>

      <div class="fr-container">
        <h2>Les bouquets à découvrir</h2>
        <ul class="fr-grid-row discover fr-mb-2w" role="list">
          <li v-for="topic in topics" :key="topic.id">
            <BouquetCard :bouquet="topic" :hide-description="true" />
          </li>
        </ul>
        <p class="fr-m-0">
          <RouterLink
            :to="{
              name: 'bouquets'
            }"
            class="fr-link fr-icon-arrow-right-line fr-link--icon-right"
          >
            Voir les bouquets
          </RouterLink>
        </p>
      </div>
    </section>
    <section class="fr-container fr-py-16v faq">
      <h2>Foire aux questions</h2>
      <HomeFaq />
    </section>
  </div>
</template>

<style scoped>
.bouquets {
  --gap: 2px;
  h3 {
    margin-block-end: 0;
    flex: 1 1 15ch;
  }
}

.bg-grey {
  background-color: var(--background-alt-grey);
}

.faq {
  background-color: var(--background-default-grey);
}
.organize-data li {
  padding: 1rem;
  flex-direction: column;
  align-content: start;
  gap: 1rem;
  flex: 1 1 33%;
  min-inline-size: 20ch;
  background-color: white;

  & > :first-child {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: 0.5rem;
  }

  h4 {
    margin-top: 5px;
  }

  p {
    margin-bottom: 0;
  }
}
.discover {
  gap: 1.5rem;

  & > li {
    flex: 1 1 30%;
    min-inline-size: 24ch;
  }
}

.discover :deep(article) {
  block-size: 100%;
}

:deep(.fr-links-group) {
  li {
    display: block;
  }

  li a {
    color: var(--text-action-high-blue-france);
  }

  li a::after {
    content: ' →';
    margin-left: 0.5rem;
  }

  .fr-link {
    /* Overide style for external link */
    font-size: inherit;
    margin: inherit;
    vertical-align: inherit;
  }
}

.explore-contribute {
  /* Fluid gap. Maths from: https://utopia.fyi/space/calculator/ */
  --gap: clamp(1.5rem, 0.7241rem + 3.8793vw, 3.75rem);
}

.card-container {
  padding: 0;
  flex: 1 1 30ch;
  container-type: inline-size;
  container-name: card;
}
.home-card {
  /* Fluid padding. Maths from: https://utopia.fyi/space/calculator/ */
  padding: clamp(1rem, 0.4286rem + 2.8571cqi, 1.5rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  block-size: 100%;

  .card__content {
    block-size: 100%;
  }

  & > :first-child {
    max-block-size: 60px;
    max-inline-size: 85px;
    object-fit: cover;
    object-position: center;
  }
}

@container card (inline-size > 50ch) {
  .home-card {
    padding-inline-start: 0;
    flex-direction: row;

    & > :first-child {
      flex: 1 0 188px;
      align-self: end;
      max-block-size: 200px;
      max-inline-size: 188px;
      object-position: top right;
    }
  }
}

.card__content > * {
  margin: 0;
}
.card__content h2 {
  margin-block-end: -0.25rem;
}

.card__content,
.card__links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: start;
}
.card__links {
  margin-block-start: auto;
}

.main-title-v2 {
  text-align: center;
  /* Fluid font-size. Maths from: https://utopia.fyi/type/calculator/ */
  font-size: clamp(1.375rem, 0.4698rem + 4.5259vw, 4rem);

  @media (max-width: 768px) {
    text-align: inherit;
  }
}
.main-title-v2 :deep(.highlight) {
  color: var(--blue-france-sun-113);
}

.big-search {
  max-width: 792px;
  margin: 0 auto;
}
</style>

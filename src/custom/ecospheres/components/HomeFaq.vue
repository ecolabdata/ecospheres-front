<script setup lang="ts">
import config from '@/config'

const activeAccordion = ref<number>()
const faqEcologieDataGouvHtml: string = config.website.formatted_title
const faqDataGouvHtml = '<b>data.gouv</b><i>.fr</i>'
const faqMinisterLink =
  "<a href='https://www.ecologie.gouv.fr/' class='fr-link' rel='noreferrer noopener' title='Ministère en charge de l&rsquo;environnement - nouvelle fenêtre' target='_blank'>ministère en charge de l&rsquo;environnement</a>"
</script>

<template>
  <DsfrAccordionsGroup v-model="activeAccordion">
    <DsfrAccordion title="Qu'est-ce que ecologie.data.gouv.fr ?">
      <!-- eslint-disable vue/no-v-html -->
      <p>
        <span v-html="faqEcologieDataGouvHtml" /> est la plateforme publique
        mettant à disposition les données relatives à la transition écologique.
        Elle permet de rendre accessible au public des informations fiables et
        structurées, issues des institutions publiques et des acteurs privés.
        L'objectif est de rassembler les données utiles au déploiement des
        politiques publiques portées par le
        <span v-html="faqMinisterLink" /> dans des secteurs comme
        l&rsquo;environnement, l'énergie, le transport et le logement.
      </p>
    </DsfrAccordion>
    <DsfrAccordion
      title="Quel est le lien entre le lien ecologie.data.gouv.fr et data.gouv.fr ?"
    >
      <p>
        <span v-html="faqEcologieDataGouvHtml" /> est une verticale thématique
        de <span v-html="faqDataGouvHtml" />, la plateforme nationale de
        données, dédiée aux thématiques liées à la transition écologique.
      </p>
      <p>
        Bien que présentant des contenus éditoriaux et des fonctionnalités
        spécifiques, les deux plateformes partagent le même catalogue, auquel
        nous contribuons avec les données du pôle ministériel
        <a
          href="https://www.ecologie.gouv.fr/"
          target="_blank"
          class="fr-link"
          rel="noreferrer noopener"
          title="ecologie.gouv.fr - nouvelle fenêtre"
          >ecologie.gouv.fr</a
        >. Toute modification sur <span v-html="faqDataGouvHtml" /> est donc
        immédiatement visible sur <span v-html="faqEcologieDataGouvHtml" />, et
        inversement.
      </p>
      <p>
        <span v-html="faqEcologieDataGouvHtml" /> fait partie d'un écosystème
        naissant de verticales thématiques construites à partir d'un
        <a
          href="https://github.com/opendatateam/udata-front-kit"
          target="_blank"
          rel="noreferrer noopener"
          title="commun numérique - nouvelle fenêtre"
          class="fr-link"
          >commun numérique</a
        >
        porté et co-développé par le CGDD et la DINUM.
      </p>
    </DsfrAccordion>
    <DsfrAccordion title="À qui s'adresse cette plateforme ?">
      <p>
        <span v-html="faqEcologieDataGouvHtml" /> s'adresse principalement :
      </p>
      <ul>
        <li>
          aux producteurs de données souhaitant ouvrir et valoriser leurs
          données en lien avec la transition écologique&nbsp;;
        </li>
        <li>
          aux utilisateurs de données œuvrant à déployer les politiques
          publiques portées par le <span v-html="faqMinisterLink" />&nbsp;;
        </li>
        <li>
          mais aussi à tout citoyen curieux souhaitant découvrir des données en
          lien avec les enjeux écologiques.
        </li>
      </ul>
      <p>
        Grâce à une approche par cas d'usage, la plateforme propose un accès
        structuré à des données environnementales organisées autour de
        problématiques précises, facilitant ainsi leur réutilisation et
        adaptation sur différents territoires.
      </p>
    </DsfrAccordion>
    <DsfrAccordion
      title="Qu'est-ce que le concept de guichet unique de la donnée ?"
    >
      <p>
        Le guichet unique de la donnée est un point d’accès centralisé
        permettant de regrouper et de simplifier l’accès aux données d’intérêt
        public.
      </p>

      <p>
        <span v-html="faqEcologieDataGouvHtml" /> centralise les données utiles
        au déploiement des politiques liées à la transition écologique, en les
        rendant accessibles et facilement réutilisables pour tous les acteurs,
        administrations, décideurs publics, citoyens ou chercheurs. La
        plateforme propose aux utilisateurs un portail unique pour consulter et
        exploiter des informations provenant de différentes sources
        institutionnelles, facilitant ainsi la recherche de données et
        renforçant la transparence.
      </p>
    </DsfrAccordion>
    <DsfrAccordion title="Qu'est-ce que le concept de bouquet ?">
      <p>
        Un bouquet de données désigne un ensemble cohérent de jeux de données
        regroupés autour d'une thématique ou d'un enjeu spécifique sur un
        territoire donné.
      </p>
      <p>Un bouquet de données :</p>
      <ul>
        <li>
          s'insère dans le contexte d’une politique publique, nationale et/ou
          locale, et de ses objectifs&nbsp;;
        </li>
        <li>
          pose une problématique claire autour des décisions à soutenir&nbsp;;
        </li>
        <li>
          détaille les informations utiles à l’éclairage de ces décisions et les
          données disponibles qui les renseignent.
        </li>
      </ul>
      <p>
        Les bouquets de données répondent ainsi au besoin de centraliser et de
        référencer les données liées à la mise en œuvre d’une politique publique
        précise sur différents territoires.
      </p>
    </DsfrAccordion>
    <DsfrAccordion
      title="Quelles données sont accessibles depuis ecologie.data.gouv.fr ?"
    >
      <p>
        Les données présentées sur
        <span v-html="faqEcologieDataGouvHtml" /> sont une sélection du
        catalogue de données moissonnées ou publiées dans
        <span v-html="faqDataGouvHtml" />. Elles sont produites par des
        organisations dont les données ont un intérêt en lien avec la transition
        écologique, ou qui sont en lien avec le
        <span v-html="faqMinisterLink" />.
      </p>
      <p>
        Lors de la création d'un bouquet de données, il est également possible
        d’inclure des jeux de données provenant de l'ensemble du catalogue de
        <span v-html="faqDataGouvHtml" />, permettant ainsi d’ajouter des
        données pertinentes pour une thématique, même si elles sont produites
        par des organisations non référencées sur
        <span v-html="faqEcologieDataGouvHtml" />.
      </p>
    </DsfrAccordion>
    <DsfrAccordion
      title="Comment rendre disponible un jeu de données sur ecologie.data.gouv.fr ?"
    >
      <p>
        Pour rendre disponible un jeu de données sur
        <span v-html="faqEcologieDataGouvHtml" />, il est nécessaire de les
        publier via <span v-html="faqDataGouvHtml" />, en utilisant les méthodes
        standards : vous pouvez passer par le parcours de publication web, l’API
        de <span v-html="faqDataGouvHtml" />, ou par un processus de
        moissonnage. Vous trouverez des informations détaillées sur la
        publication dans le
        <a
          href="https://guides.data.gouv.fr/guide-data.gouv.fr/jeux-de-donnees/publier-un-jeu-de-donnees"
          class="fr-link"
          target="_blank"
          rel="noreferrer noopener"
          title="guide de data.gouv.fr  - nouvelle fenêtre"
          >guide de <span v-html="faqDataGouvHtml"
        /></a>
        et les étapes pour
        <a
          href="https://www.data.gouv.fr/fr/pages/onboarding/producteurs/"
          class="fr-link"
          target="_blank"
          rel="noreferrer noopener"
          title="devenir producteur de données - nouvelle fenêtre"
          >devenir producteur de données</a
        >.
      </p>

      <p>
        Pour mettre en place un moissonnage spécifique, veuillez
        <a href="https://tally.so/r/m61AqO" rel="noopener noreferer"
          >nous contacter</a
        >
        directement afin que nous vous aidions à configurer les paramètres
        nécessaires pour que vos flux de données soient correctement
        synchronisés.
      </p>

      <p>
        Une fois publiées sur <span v-html="faqDataGouvHtml" />, vos données
        peuvent être intégrées dans un bouquet de données. Si vous souhaitez que
        votre jeu de données soit également directement accessible depuis
        l’onglet "Données" du site, veuillez
        <a href="https://tally.so/r/m61AqO" rel="noopener noreferer"
          >nous contacter</a
        >
        afin de référencer votre organisation.
      </p>
    </DsfrAccordion>
    <DsfrAccordion
      title="Je ne trouve pas le jeu de données dont j'ai besoin lors de la création d'un bouquet ?"
    >
      <p>Lors de la création d’un bouquet, vous pouvez&nbsp;:</p>
      <ul>
        <li>
          Ajouter un jeu de données déjà présent dans le catalogue
          <span v-html="faqDataGouvHtml" />&nbsp;;
        </li>
        <li>
          Référencer une URL externe si la donnée se trouve en dehors de
          <span v-html="faqDataGouvHtml" />.
        </li>
      </ul>
      <p>
        Il est également possible de pré-remplir un bouquet en spécifiant les
        données utiles, même si ces dernières ne sont pas encore identifiées ou
        disponibles sur <span v-html="faqDataGouvHtml" />. Si vous ne trouvez
        pas votre jeu de données sur la plateforme alors qu’il est bien
        référencé sur <span v-html="faqDataGouvHtml" />, n’hésitez pas à
        <a href="https://tally.so/r/m61AqO" rel="noopener noreferer"
          >nous contacter</a
        >
        pour résoudre le problème.
      </p>
    </DsfrAccordion>
    <DsfrAccordion title="Un retour, une question ?">
      <p>
        Si vous avez une question ou souhaitez faire part de vos retours, vous
        pouvez contacter l'équipe d'<span v-html="faqEcologieDataGouvHtml" />
        via
        <a href="https://tally.so/r/m61AqO" rel="noopener noreferer"
          >ce formulaire de contact</a
        >. L'équipe est également à votre disposition pour répondre à vos
        suggestions.
      </p>
    </DsfrAccordion>
    <!--eslint-enable-->
  </DsfrAccordionsGroup>
</template>

<style scoped>
:deep(.fr-accordion .fr-collapse) {
  /* 
  Fluid padding. Maths from:
  https://utopia.fyi/space/calculator?c=320,8,1.2,1248,16,1.25,5,2,&s=0.75%7C0.5%7C0.25,1.5%7C2%7C3%7C4%7C6,s-l&g=s,l,xl,12
  */
  padding-inline: clamp(0.5rem, 0.3276rem + 0.8621vw, 1rem);
}
:deep(.fr-accordion__btn) {
  color: #000091;
}
:deep(.fr-accordion__btn[aria-expanded='true']),
:deep(.fr-accordion__btn:hover) {
  background-color: #e3e3fd;
}
:deep(.fr-collapse) {
  background-color: white;
  margin: 0;
}
</style>

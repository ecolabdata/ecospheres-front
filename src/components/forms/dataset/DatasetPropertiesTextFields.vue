<script setup lang="ts">
import type { DatasetProperties } from '@/model/topic'
import { useTopicsConf } from '@/utils/config'

const datasetProperties = defineModel('datasetProperties-model', {
  type: Object as () => DatasetProperties,
  default: {}
})

defineProps({
  errorTitle: {
    type: String,
    default: ''
  },
  errorPurpose: {
    type: String,
    default: ''
  }
})

const { topicsName } = useTopicsConf()
</script>

<template>
  <div class="fr-input-group">
    <label class="fr-label" for="input-title"
      >Libellé du jeu de données (obligatoire)</label
    >
    <p id="title-description" class="fr-mt-1v fr-mb-2v fr-text--sm">
      Décrivez l'indicateur ou l'objet géographique correspondant. Par
      exemple&nbsp;: «&nbsp;Taux d'imperméabilisation des sols&nbsp;»
    </p>
    <input
      id="input-title"
      v-model="datasetProperties.title"
      class="fr-input"
      type="text"
      aria-describedby="title-description"
      aria-errormessage="errors-title"
      :aria-invalid="!!errorTitle"
    />
    <ErrorMessage
      v-if="errorTitle"
      input-name="title"
      :error-message="errorTitle"
    />
  </div>
  <div class="fr-input-group">
    <label class="fr-label" for="input-purpose"
      >Raison d'utilisation dans ce {{ topicsName }} (obligatoire)</label
    >
    <p id="purpose-description" class="fr-mt-1v fr-mb-2v fr-text--sm">
      Renseignez la raison d'utilisation de ce jeu de données, si celle-ci n'est
      pas évidente. Vous pouvez également utiliser cet espace pour renseigner
      des problèmes liés à l'accès ou la qualité des données.<br />
      Utilisez du
      <a target="_blank" href="https://www.markdownguide.org/cheat-sheet/"
        ><span lang="en">markdown</span> (guide en anglais)</a
      >
      pour mettre en forme votre texte.
    </p>
    <textarea
      id="input-purpose"
      v-model="datasetProperties.purpose"
      class="fr-input"
      type="text"
      aria-describedby="purpose-description"
      aria-errormessage="errors-purpose"
      :aria-invalid="!!errorPurpose"
    />
    <ErrorMessage
      v-if="errorPurpose"
      input-name="purpose"
      :error-message="errorPurpose"
    />
  </div>
</template>

<style scoped>
textarea {
  min-height: 150px;
}
</style>

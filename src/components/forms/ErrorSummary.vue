<script lang="ts" setup>
import type { FormErrorMessagesMap } from '@/utils/form'

defineProps({
  formErrors: {
    type: Array<string>,
    required: true
  },
  formErrorMessagesMap: {
    type: Object as () => FormErrorMessagesMap,
    required: true
  },
  headingLevel: {
    type: String as () => 'h2' | 'h3' | 'h4' | 'h5',
    required: true
  }
})
</script>

<template>
  <div
    v-show="formErrors.length"
    class="fr-my-4w fr-p-2w error-status"
    role="group"
    aria-labelledby="error-summary-title"
  >
    <component :is="headingLevel" id="error-summary-title" tabindex="-1">
      Il y a {{ formErrors.length }} erreur<span v-if="formErrors.length > 1"
        >s</span
      >
      de saisie dans le formulaire.
    </component>
    <ol>
      <li v-for="(error, index) in formErrors" :key="index" class="error">
        <a :href="`#input-${error}`">{{ formErrorMessagesMap.get(error) }}</a>
      </li>
    </ol>
  </div>
</template>

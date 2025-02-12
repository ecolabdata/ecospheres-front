<script setup lang="ts">
import { required } from '@vee-validate/rules'
import { useForm } from 'vee-validate'
import { capitalize, onMounted, ref, type Ref } from 'vue'

import SelectSpatialCoverage from '@/components/forms/SelectSpatialCoverage.vue'
import type { SpatialCoverage } from '@/model/spatial'
import type { TopicPostData } from '@/model/topic'
import { useTopicsConf } from '@/utils/config'
import { useSpatialCoverage } from '@/utils/spatial'
import { useTag, useTagOptions, useTagSlug } from '@/utils/tags'

const topic = defineModel({
  type: Object as () => Partial<TopicPostData> &
    Pick<TopicPostData, 'extras' | 'tags'>,
  required: true
})
const formErrors = defineModel('formErrors', {
  type: Array,
  default: () => []
})

type FormErrors = {
  name?: string
  description?: string
  theme?: string
  subtheme?: string
}

const emits = defineEmits(['updateValidation'])

const spatialCoverage = useSpatialCoverage(topic)
const { topicsUseThemes, topicsMainTheme, topicsSecondaryTheme, topicsName } =
  useTopicsConf()

const initialTheme = useTag('bouquets', topic, 'theme')
const initialSubtheme = useTag('bouquets', topic, 'subtheme')

// Define values and validation rules for each field
const { values, errors, defineField, handleSubmit } = useForm({
  initialValues: {
    name: topic.value.name ?? '',
    description: topic.value.description ?? '',
    theme: initialTheme.value?.id || '',
    subtheme: initialSubtheme.value?.id || ''
  },
  validationSchema: {
    name: required,
    description: required,
    theme: required,
    subtheme: required
  }
})

// create fields value binding
const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')
const [theme, themeAttrs] = defineField('theme')
const [subtheme, subthemeAttrs] = defineField('subtheme')

const isSubmitted: Ref<boolean | undefined> = ref(undefined)

const onValidSubmit = async (validatedValues: {
  name: string
  description: string
  theme: string
  subtheme: string
}) => {
  // set form states
  isSubmitted.value = true
  // set topic values from validated fields
  topic.value.name = validatedValues.name
  topic.value.description = validatedValues.description
  topic.value.tags = [
    ...topic.value.tags.filter(
      (tag) =>
        !tag.startsWith(useTagSlug('bouquets', 'theme')) &&
        !tag.startsWith(useTagSlug('bouquets', 'subtheme'))
    ),
    useTagSlug('bouquets', 'theme', validatedValues.theme),
    useTagSlug('bouquets', 'subtheme', validatedValues.subtheme)
  ]
  // sync valid status with parent
  emits('updateValidation', true)
}

const onInvalidSubmit = ({ errors }: { errors: FormErrors }) => {
  // send invalid fields name
  formErrors.value = Object.keys(errors)
  isSubmitted.value = true
}

const onSubmit = handleSubmit(onValidSubmit, onInvalidSubmit)

defineExpose({
  onSubmit
})

const { tagOptions: themeOptions, subTagOptions: subthemeOptions } =
  useTagOptions('bouquets', theme, 'theme')

const onUpdateSpatialCoverage = (value: SpatialCoverage | undefined) => {
  const zones = value === undefined ? null : [value.id]
  topic.value.spatial = { ...topic.value.spatial, zones }
}

// initialize theme and subtheme from topic values, if any
onMounted(() => {
  if (initialTheme.value) {
    theme.value = initialTheme.value.id
  }
  if (initialSubtheme.value) {
    subtheme.value = initialSubtheme.value.id
  }
})
</script>

<template>
  <!-- Title -->
  <div class="fr-input-group">
    <DsfrInput
      v-model="name"
      v-bind="nameAttrs"
      :label="`Sujet du ${topicsName} (obligatoire)`"
      label-visible
      :aria-invalid="errors.name && isSubmitted ? true : undefined"
      :description-id="errors.name && isSubmitted ? 'errors-name' : undefined"
    />
    <p v-if="errors.name && isSubmitted" id="errors-name" class="error">
      <VIconCustom name="error-fill" />
      Veuillez renseigner un sujet.
    </p>
  </div>
  <!-- Description -->
  <div class="fr-input-group">
    <DsfrInput
      v-model="description"
      v-bind="descriptionAttrs"
      is-textarea
      :label="`Objectif du ${topicsName} (obligatoire)`"
      label-visible
      :aria-invalid="errors.description && isSubmitted ? true : undefined"
      :description-id="
        errors.description && isSubmitted
          ? 'errors-description description-instructions'
          : 'description-instructions'
      "
    />
    <p
      v-if="errors.description && isSubmitted"
      id="errors-description"
      class="error"
    >
      <VIconCustom name="error-fill" />
      La description ne doit pas être vide.
    </p>
    <p id="description-instructions" class="fr-mt-1v fr-text--sm">
      Renseignez ici les informations nécessaires à la compréhension du
      {{ topicsName }}&nbsp;: politique publique et problématique à laquelle il
      répond, lien vers toute méthodologie de traitement des données,
      description de l'organisme porteur du projet, etc.<br />
      Utilisez du
      <a target="_blank" href="https://www.markdownguide.org/cheat-sheet/"
        ><span lang="en">markdown</span> (guide en anglais)</a
      >
      pour mettre en forme votre texte.
    </p>
  </div>
  <!-- Theme -->
  <div v-if="topicsUseThemes" class="fr-select-group fr-input-group">
    <label class="fr-label" for="input-theme">
      {{ capitalize(topicsMainTheme) }} (obligatoire)
    </label>
    <select
      id="input-theme"
      v-model="theme"
      v-bind="themeAttrs"
      class="fr-select"
      :aria-invalid="errors.theme && isSubmitted ? true : undefined"
      :aria-describedby="
        errors.theme && isSubmitted ? 'errors-theme' : undefined
      "
      @change="subtheme = ''"
    >
      <option value="" selected disabled hidden>
        Choisir une {{ topicsMainTheme }}
      </option>
      <option
        v-for="option in themeOptions"
        :key="option.id"
        :value="option.id"
        :selected="option.id === theme"
      >
        {{ option.name }}
      </option>
    </select>
    <p v-if="errors.theme && isSubmitted" id="errors-theme" class="error">
      <VIconCustom name="error-fill" />
      Veuillez sélectionner une thématique.
    </p>
  </div>
  <!-- Subtheme -->
  <div v-if="topicsUseThemes" class="fr-select-group">
    <label class="fr-label" for="input-subtheme"
      >{{ capitalize(topicsSecondaryTheme) }}
      (obligatoire)
    </label>
    <select
      id="input-subtheme"
      v-model="subtheme"
      v-bind="subthemeAttrs"
      :disabled="!values.theme ? true : undefined"
      class="fr-select"
      :aria-invalid="errors.subtheme && isSubmitted ? true : undefined"
      :aria-describedby="
        errors.subtheme && isSubmitted
          ? 'errors-subtheme subtheme-instructions'
          : 'subtheme-instructions'
      "
    >
      <option value="" selected disabled hidden>
        Choisir un {{ topicsSecondaryTheme }}
      </option>
      <option
        v-for="option in subthemeOptions"
        :key="option.id"
        :value="option.id"
        :selected="option.id === subtheme"
      >
        {{ option.name }}
      </option>
    </select>
    <p v-if="errors.subtheme && isSubmitted" id="errors-subtheme" class="error">
      <VIconCustom name="error-fill" />
      Veuillez sélectionner un {{ topicsSecondaryTheme }}.
    </p>
    <p v-if="theme === ''" id="subtheme-instructions" class="fr-text--sm">
      Choisissez d'abord une {{ topicsMainTheme }}
    </p>
  </div>
  <!-- Spatial coverage -->
  <div class="fr-select-group">
    <label class="fr-label" for="select-spatial-coverage"
      >Couverture territoriale (facultatif)</label
    >
    <SelectSpatialCoverage
      v-model:spatial-coverage-model="spatialCoverage"
      @update:spatial-coverage-model="onUpdateSpatialCoverage"
    />
  </div>
</template>

<style scoped>
:deep(textarea) {
  min-height: 150px;
}
</style>

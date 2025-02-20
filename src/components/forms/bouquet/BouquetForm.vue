<script setup lang="ts">
import { required } from '@vee-validate/rules'
import { useForm } from 'vee-validate'
import { capitalize, onMounted, ref, type Ref } from 'vue'

import SelectSpatialCoverage from '@/components/forms/SelectSpatialCoverage.vue'
import type { SpatialCoverage } from '@/model/spatial'
import { NoOptionSelected } from '@/model/theme'
import type { TopicPostData } from '@/model/topic'
import { useTopicsConf } from '@/utils/config'
import { useSpatialCoverage } from '@/utils/spatial'
import { useThemeOptions } from '@/utils/theme'

const topic = defineModel({
  type: Object as () => Partial<TopicPostData> & Pick<TopicPostData, 'extras'>,
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
const {
  topicsUseThemes,
  topicsExtrasKey,
  topicsMainTheme,
  topicsSecondaryTheme,
  topicsName
} = useTopicsConf()

// Define values and validation rules for each field
const { values, errors, defineField, handleSubmit } = useForm({
  initialValues: {
    name: topic.value.name ?? '',
    description: topic.value.description ?? '',
    theme:
      topic.value.extras[topicsExtrasKey].theme === NoOptionSelected
        ? ''
        : topic.value.extras[topicsExtrasKey].theme,
    subtheme:
      topic.value.extras[topicsExtrasKey].subtheme === NoOptionSelected
        ? ''
        : topic.value.extras[topicsExtrasKey].subtheme
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
  topic.value.extras[topicsExtrasKey].theme = validatedValues.theme
  topic.value.extras[topicsExtrasKey].subtheme = validatedValues.subtheme
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

const { themeOptions, subthemeOptions } = useThemeOptions(theme)

const onUpdateSpatialCoverage = (value: SpatialCoverage | undefined) => {
  const zones = value === undefined ? null : [value.id]
  topic.value.spatial = { ...topic.value.spatial, zones }
}

// initialize theme and subtheme from topic values, if any
onMounted(() => {
  if (topic.value.extras[topicsExtrasKey].theme !== NoOptionSelected) {
    theme.value = topic.value.extras[topicsExtrasKey].theme
  }
  if (topic.value.extras[topicsExtrasKey].subtheme !== NoOptionSelected) {
    subtheme.value = topic.value.extras[topicsExtrasKey].subtheme
  }
})
</script>

<template>
  <!-- Title -->
  <div class="fr-input-group">
    <DsfrInput
      id="input-name"
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
      id="input-description"
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
      aria-errormessage="errors-theme"
      @change="subtheme = ''"
    >
      <option value="" selected disabled hidden>
        Choisir une {{ topicsMainTheme }}
      </option>
      <option
        v-for="option in themeOptions"
        :key="option.value"
        :value="option.value"
        :selected="option.value === theme"
      >
        {{ option.text }}
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
      aria-describedby="subtheme-instructions"
      aria-errormessage="errors-subtheme"
    >
      <option value="" selected disabled hidden>
        Choisir un {{ topicsSecondaryTheme }}
      </option>
      <option
        v-for="option in subthemeOptions"
        :key="option.value"
        :value="option.value"
        :selected="option.value === subtheme"
      >
        {{ option.text }}
      </option>
    </select>
    <p v-if="errors.subtheme && isSubmitted" id="errors-subtheme" class="error">
      <VIconCustom name="error-fill" />
      Veuillez sélectionner un chantier.
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

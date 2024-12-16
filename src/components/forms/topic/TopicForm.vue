<script setup lang="ts">
import config from '@/config'
import { required } from '@vee-validate/rules'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref, type Ref } from 'vue'
import { useRoute } from 'vue-router'

import SelectSpatialCoverage from '@/components/forms/SelectSpatialCoverage.vue'
import type { FilterConf } from '@/model/config'
import type { SpatialCoverage } from '@/model/spatial'
import type { TopicPostData } from '@/model/topic'
import { useSearchPagesConfig } from '@/utils/config'
import { useSpatialCoverage } from '@/utils/spatial'

const route = useRoute()

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
} & {
  [K in keyof typeof currentFilters.value]?: string
}

const emits = defineEmits(['updateValidation'])

const spatialCoverage = useSpatialCoverage(topic)

const searchPageName = ref<string>('')
const searchPageSlug = ref<string>('')
const searchPageExtrasKey = ref<string>('')
const searchPageFilters = ref<FilterConf[]>([])
const searchPageLabelSubject = ref<string>('')
const searchPageLabelDescriptionTitle = ref<string>('')
const searchPageLabelDescriptionInfo = ref<string>('')

const configSearchPage = useSearchPagesConfig(
  route.path.replace('/admin', '').split('/')[1]
)
searchPageName.value = configSearchPage.searchPageName
searchPageSlug.value = configSearchPage.searchPageSlug
searchPageExtrasKey.value = configSearchPage.searchPageExtrasKey
searchPageFilters.value = configSearchPage.searchPageFilters
searchPageLabelSubject.value = configSearchPage.searchPageLabelSubject
searchPageLabelDescriptionTitle.value =
  configSearchPage.searchPageLabelDescriptionTitle
searchPageLabelDescriptionInfo.value =
  configSearchPage.searchPageLabelDescriptionInfo

const currentFilters = ref<Record<string, string>>({})

if (searchPageFilters.value) {
  searchPageFilters.value.forEach((item) => {
    currentFilters.value[item.tag] = ''
  })
}

Object.keys(currentFilters.value).forEach((key) => {
  if (searchPageFilters.value) {
    searchPageFilters.value.forEach((spf) => {
      if (spf.tag === key) {
        spf.values.forEach((val) => {
          if (topic.value.tags?.includes(val.tag)) {
            currentFilters.value[key] = val.tag
          }
          if (route.query.tags) {
            if (route.query.tags.toString().split(',').includes(val.tag)) {
              currentFilters.value[key] = val.tag
            }
          }
        })
      }
    })
  }
})

// Define values and validation rules for each field
const { values, errors, defineField, handleSubmit, setValues } = useForm({
  initialValues: {
    name: topic.value.name ?? '',
    description: topic.value.description ?? '',
    ...currentFilters.value
  },
  validationSchema: {
    name: required,
    description: required,
    ...Object.keys(currentFilters.value).reduce((schema, key) => {
      schema[key] = required
      return schema
    }, {})
  }
})

// create fields value binding
const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')

const isSubmitted: Ref<boolean | undefined> = ref(undefined)

const onValidSubmit = async (
  validatedValues: {
    name: string
    description: string
  } & Record<string, string>
) => {
  // set form states
  isSubmitted.value = true
  // set topic values from validated fields
  topic.value.name = validatedValues.name
  topic.value.description = validatedValues.description
  // set topic tags for filters
  let tags: string[] = []
  Object.keys(currentFilters.value).forEach((key) => {
    tags.push(validatedValues[key])
  })
  tags.push(searchPageSlug.value)
  tags.push(config.universe.name)
  topic.value.tags = tags
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

const onUpdateSpatialCoverage = (value: SpatialCoverage | undefined) => {
  const zones = value === undefined ? null : [value.id]
  topic.value.spatial = { ...topic.value.spatial, zones }
}

onMounted(() => {})

const updateCurrentFilters = (tag: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  const newValue = target.value

  // Update the reactive `currentFilters`
  currentFilters.value[tag] = newValue

  // Update dependent filters if any condition exists
  if (searchPageFilters.value) {
    searchPageFilters.value.forEach((spf) => {
      if (spf.condition_on && spf.condition_on === tag) {
        currentFilters.value[spf.tag] = '' // Reset dependent filters
      }
    })
  }

  // Use `setValues` to update the form values
  setValues({
    ...values,
    ...currentFilters.value
  })
}

const filteredSearchPageFilters = computed(() => {
  if (!searchPageFilters.value) return
  return searchPageFilters.value.map((spf) => ({
    ...spf,
    values:
      spf.condition_on && spf.condition_on in currentFilters.value
        ? spf.values.filter(
            (option) =>
              currentFilters.value[spf.condition_on] === option.condition_on
          )
        : spf.values
  }))
})
</script>

<template>
  {{ route.query.tags }}
  <!-- Title -->
  <div class="fr-input-group">
    <DsfrInput
      v-model="name"
      v-bind="nameAttrs"
      :label="`${searchPageLabelSubject} (obligatoire)`"
      label-visible
      :aria-invalid="errors.name && isSubmitted ? true : undefined"
      :description-id="errors.name && isSubmitted ? 'errors-name' : undefined"
    />
    <p v-if="errors.name && isSubmitted" id="errors-name" class="error">
      <span class="fr-icon-error-fill" aria-hidden="true" />
      Veuillez renseigner un sujet.
    </p>
  </div>
  <!-- Description -->
  <div class="fr-input-group">
    <DsfrInput
      v-model="description"
      v-bind="descriptionAttrs"
      is-textarea
      :label="`${searchPageLabelDescriptionTitle} (obligatoire)`"
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
      <span class="fr-icon-error-fill" aria-hidden="true" />
      La description ne doit pas être vide.
    </p>
    <p id="description-instructions" class="fr-mt-1v fr-text--sm">
      {{ searchPageLabelDescriptionInfo }}<br />
      Utilisez du
      <a target="_blank" href="https://www.markdownguide.org/cheat-sheet/"
        ><span lang="en">markdown</span> (guide en anglais)</a
      >
      pour mettre en forme votre texte.
    </p>
  </div>
  <div v-bind:key="filter.tag" v-for="filter in filteredSearchPageFilters">
    <br />
    <div class="fr-select-group fr-input-group">
      <label class="fr-label" :for="`select_${filter.tag}`">
        {{ filter.name }}
      </label>
      <select
        :id="`input-${filter.tag}`"
        class="fr-select"
        :aria-invalid="errors[filter.tag] && isSubmitted ? true : undefined"
        :aria-describedby="
          errors[filter.tag] && isSubmitted ? `errors-${filter.tag}` : undefined
        "
        @change="updateCurrentFilters(filter.tag, $event)"
      >
        <option value="" selected disabled hidden>
          Sélectionner une option
        </option>
        <option
          v-for="option in filter.values"
          :key="option.tag"
          :value="option.tag"
          :selected="option.tag === currentFilters[filter.tag]"
        >
          {{ option.name }}
        </option>
      </select>
      <p
        v-if="errors[filter.tag] && isSubmitted"
        :id="`errors-${filter.tag}`"
        class="error"
      >
        <span class="fr-icon-error-fill" aria-hidden="true" />
        Veuillez remplir le champs de sélection.
      </p>
    </div>
  </div>

  <br />
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

<script setup lang="ts">
import type { Organization } from '@datagouv/components'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch, type Ref } from 'vue'

import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'

import type { TopicPostData } from '@/model/topic'
import SearchAPI from '@/services/api/SearchOrgAPI'
import { useUserStore } from '@/store/UserStore'
import { debounceWait, useTopicsConf } from '@/utils/config'

const topic = defineModel({
  type: Object as () => Partial<TopicPostData>,
  required: true
})

const userStore = useUserStore()
const { topicsName } = useTopicsConf()

const choice: Ref<'organization' | 'owner'> = ref(
  topic.value.organization != null ? 'organization' : 'owner'
)

const organizations = computed(() => userStore.data?.organizations || [])

// checks if current owner is a user's org and return its id
const ownOrganizationIndex = computed(() => {
  return organizations.value.findIndex(
    (org) => org.id === topic.value.organization?.id
  )
})
// both models check the above index to determine the default owner to display
const selectedAnyOrganization: Ref<Organization | null | undefined> = ref(
  ownOrganizationIndex.value < 0 && !topic.value.owner
    ? topic.value.organization
    : null
)
const selectedOwnOrganization: Ref<number | string | null> = ref(
  ownOrganizationIndex.value >= 0 && !topic.value.owner
    ? ownOrganizationIndex.value
    : null
)

const radioOptions = [
  {
    label: 'En votre propre nom',
    value: 'owner'
  },
  {
    label: "En tant qu'organisation",
    value: 'organization'
  }
]
const selectOptions = computed(() => {
  return organizations.value.map((option, index) => {
    return { value: index, text: option.name }
  })
})

const isLoading = ref(false)

const search = useDebounceFn(async (query: string) => {
  isLoading.value = true
  if (!query) {
    isLoading.value = false
    return
  }
  try {
    return await new SearchAPI().search(query, 10)
  } catch (error) {
    console.error('Search error', error)
  } finally {
    isLoading.value = false
  }
}, debounceWait)

const onSelectOwnOrganization = () => {
  if (selectedOwnOrganization.value) {
    const idx = Number(selectedOwnOrganization.value)
    topic.value.organization = organizations.value[idx]
    topic.value.owner = null
    clear()
  }
}
const onSelectAnyOrganization = () => {
  if (selectedAnyOrganization.value) {
    topic.value.organization = selectedAnyOrganization.value
    topic.value.owner = null
    selectedOwnOrganization.value = null
  }
}

const clear = () => {
  selectedAnyOrganization.value = undefined
}

watch(choice, () => {
  if (choice.value === 'owner' && userStore.data?.id) {
    topic.value.owner = userStore.data
    topic.value.organization = null
  }
})
</script>

<template>
  <div>
    <DsfrRadioButtonSet
      v-model="choice"
      :options="radioOptions"
      :legend="`Choisissez si vous souhaitez gérer ce ${topicsName}&nbsp;:`"
      name="owner"
    />
    <div v-if="choice === 'organization'" class="flex-gap">
      <DsfrSelect
        id="ownerOrg"
        v-model="selectedOwnOrganization"
        label="Organisations dont vous faites partie&nbsp;:"
        default-unselected-text="Sélectionnez une organisation"
        :options="selectOptions"
        @update:model-value="onSelectOwnOrganization()"
      />

      <div v-if="userStore.isAdmin" class="fr-select-group">
        <label class="fr-label fr-mt-2v" for="any-org-select-bouquet"
          >Cherchez une autre organisation&nbsp;:</label
        >
        <Multiselect
          id="any-org-select-bouquet"
          v-model="selectedAnyOrganization"
          role="search"
          :object="true"
          value-prop="id"
          label="title"
          track-by="title"
          class="fr-input-wrap"
          :filter-results="false"
          :min-chars="3"
          :clear-on-search="true"
          :delay="0"
          :options="search"
          placeholder=""
          :resolve-on-load="false"
          :searchable="true"
          :limit="10"
          :strict="false"
          :clear-on-blur="false"
          :allow-absent="true"
          no-options-text="Aucune organisation trouvée, précisez ou élargissez votre recherche."
          :aria="{
            // useless or unsupported yet https://github.com/vueform/multiselect/issues/436
            'aria-labelledby': null,
            'aria-multiselectable': null,
            'aria-placeholder': null
          }"
          @select="onSelectAnyOrganization()"
        >
          <template #clear>
            <button
              class="multiselect-clear"
              @click="clear"
              @keydown.prevent.enter="clear"
              @keydown.prevent.space="clear"
            >
              <span class="fr-sr-only">Supprimer la sélection</span>
              <span aria-hidden class="multiselect-clear-icon"></span>
            </button>
          </template>

          <template #singlelabel="{ value }">
            <div class="multiselect-single-label fr-py-2w">
              {{ value.name }}
            </div>
          </template>

          <template #option="{ option }">
            <div class="spatial-select-option">{{ option.name }}</div>
          </template>
        </Multiselect>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-gap {
  --gap: 1rem;
}
</style>

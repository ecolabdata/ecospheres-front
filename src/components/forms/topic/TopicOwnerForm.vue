<script setup lang="ts">
import type { Organization } from '@datagouv/components'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch, type Ref } from 'vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import { useRoute } from 'vue-router'

import '@/assets/multiselect.css'
import type { TopicPostData } from '@/model/topic'
import SearchAPI from '@/services/api/SearchOrgAPI'
import { useUserStore } from '@/store/UserStore'
import { useSearchPagesConfig } from '@/utils/config'

const route = useRoute()

const topic = defineModel({
  type: Object as () => Partial<TopicPostData>,
  required: true
})

const userStore = useUserStore()
const { searchPageName, searchPageLabelTitle } = useSearchPagesConfig(
  route.path.replace('/admin', '').split('/')[1]
)

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
const options: Ref<Organization[]> = ref([])

const search = useDebounceFn(async (query: string) => {
  isLoading.value = true
  if (!query) {
    options.value = []
    isLoading.value = false
    return
  }
  const organizations = await new SearchAPI().search(query, 10)
  options.value = organizations
  isLoading.value = false
}, 400)

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
  selectedAnyOrganization.value = null
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
      :legend="`Choisissez si vous souhaitez gérer ce ${searchPageLabelTitle}&nbsp;:`"
      name="owner"
    />
    <div v-if="choice === 'organization'" class="organizations">
      <DsfrSelect
        id="ownerOrg"
        v-model="selectedOwnOrganization"
        label="Organisations dont vous faites partie&nbsp;:"
        default-unselected-text="Sélectionnez une organisation"
        :options="selectOptions"
        @update:model-value="onSelectOwnOrganization()"
      />

      <div v-if="userStore.isAdmin" class="fr-select-group">
        <label class="fr-label fr-mt-2v" for="any-org-select-topic"
          >Cherchez une autre organisation&nbsp;:</label
        >
        <Multiselect
          id="any-org-select-topic"
          ref="multiselect"
          v-model="selectedAnyOrganization"
          role="search"
          :options="options"
          track-by="id"
          placeholder=""
          select-label="Entrée pour sélectionner"
          :multiple="false"
          :searchable="true"
          :internal-search="false"
          :loading="isLoading"
          :clear-on-select="true"
          :close-on-select="true"
          :show-no-results="false"
          :hide-selected="true"
          :limit="3"
          :options-limit="100"
          @search-change="search"
          @select="onSelectAnyOrganization()"
        >
          <template #caret>
            <div
              v-if="selectedAnyOrganization"
              class="multiselect__clear"
              @mousedown.prevent.stop="clear"
            />
          </template>
          <template #singleLabel="slotProps">
            {{ slotProps.option.name }}
          </template>
          <template #option="slotProps">
            {{ slotProps.option.name }}
          </template>
          <template #noOptions>
            Précisez ou élargissez votre recherche
          </template>
        </Multiselect>
      </div>
    </div>
  </div>
</template>

<style scoped>
.organizations {
  gap: 1rem;
}
</style>

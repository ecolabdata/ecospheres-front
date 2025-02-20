<script lang="ts" setup>
import type { DatasetProperties, DatasetsGroups } from '@/model/topic'
import { basicSlugify } from '@/utils'
import { isAvailable } from '@/utils/bouquet'
import { NO_GROUP, isOnlyNoGroup } from '@/utils/bouquetGroups'
import { getRandomId } from '@gouvminint/vue-dsfr'

const props = defineProps({
  groupName: {
    type: String,
    required: true
  },
  allGroups: {
    type: Object as () => DatasetsGroups,
    required: true
  },
  datasetsProperties: {
    type: Object as () => DatasetProperties[],
    required: true
  },
  headingLevel: {
    type: String,
    default: 'h3'
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const newGroupName: Ref<string> = ref(props.groupName)
const inputErrors: Ref<string[]> = ref([])

const isDisclosure = computed(() => props.groupName !== NO_GROUP)
const factorsInGroup = computed(() => {
  const factors = props.allGroups
    .get(props.groupName)
    ?.filter((factor) => !factor.isHidden).length

  let factorsLabel = ''
  switch (factors) {
    case 0:
      factorsLabel = 'Aucun donnée'
      break
    case 1:
      factorsLabel = '1 donnée'
      break
    default:
      factorsLabel = `${factors} données`
      break
  }
  return factorsLabel
})

const emit = defineEmits<{
  (e: 'editGroupName', oldGroupeName: string, newGroupeName: string): void
  (e: 'deleteGroup', groupeName: string): void
}>()

const isDisclosureOpen: Ref<boolean> = ref(!isDisclosure.value)

const toggleDisclosure = () => {
  isDisclosureOpen.value = !isDisclosureOpen.value
}
const widgetID = getRandomId('disclosure')

const opened = ref(false)
const modalType = ref('')
const modalContent = computed(() => {
  let modalFields = {
    title: '',
    confirmLabel: '',
    color: '',
    action: () => {}
  }
  switch (modalType.value) {
    case 'edit':
      modalFields = {
        title: `Renommer le regroupement ${props.groupName}.`,
        confirmLabel: 'Valider',
        color: '',
        action: onValidateEdit
      }
      break
    case 'delete':
      modalFields = {
        title: `Supprimer le regroupement ${props.groupName}.`,
        confirmLabel: 'Supprimer',
        color: '--background-flat-error',
        action: onDelete
      }
      break
  }
  return modalFields
})

const openModal = (type: string) => {
  modalType.value = type
  opened.value = true
}

const onValidateEdit = () => {
  inputErrors.value = []
  // check if new group name already exists
  if (
    props.allGroups.has(newGroupName.value.trim()) ||
    props.groupName.trim() === newGroupName.value.trim()
  ) {
    inputErrors.value.push('Ce nom de regroupement existe déjà.')
  } // check if new group name is more than 100 characters
  else if (newGroupName.value.trim().length > 100) {
    inputErrors.value.push('Ce nom de regroupement est trop long.')
  } // check if new group name is empty
  else if (!newGroupName.value.trim().length) {
    inputErrors.value.push('Le nom du regroupement ne peut pas être vide.')
  } else if (newGroupName.value) {
    emit('editGroupName', props.groupName, newGroupName.value.trim())
    opened.value = false
  }
}

const onDelete = () => {
  emit('deleteGroup', props.groupName)
}
const resetForm = () => {
  opened.value = false
  newGroupName.value = props.groupName
  inputErrors.value = []
}

const actions = computed(() => {
  return [
    {
      label: 'Annuler',
      tertiary: true,
      onClick() {
        resetForm()
      }
    },
    {
      label: modalContent.value.confirmLabel,
      onClick() {
        modalContent.value.action()
      }
    }
  ]
})
</script>

<template>
  <div class="disclosure">
    <div v-if="!isOnlyNoGroup(allGroups)" class="disclosure__header">
      <template v-if="isDisclosure">
        <button
          :id="`${basicSlugify(groupName)}-summary`"
          class="disclosure__trigger fr-icon-arrow-right-s-line"
          :aria-expanded="isDisclosureOpen"
          :aria-controls="widgetID"
          @click.prevent="toggleDisclosure"
        >
          <span class="fr-sr-only">ouvrir le regroupement</span>
          <span class="disclosure__name">
            {{ groupName }}
            <DsfrTag class="fr-text--xs" small :label="factorsInGroup" />
          </span>
        </button>
        <div v-if="isEdit" class="disclosure__actions">
          <DsfrButton
            :label="`éditer le regroupement ${groupName}`"
            icon="fr-icon-edit-line"
            icon-only
            secondary
            size="sm"
            :on-click="() => openModal('edit')"
          />
          <DsfrButton
            :label="`supprimer le regroupement ${groupName}`"
            icon="fr-icon-delete-line"
            icon-only
            secondary
            size="sm"
            :on-click="() => openModal('delete')"
          />
        </div>
      </template>
      <p
        v-else
        :id="`${basicSlugify(groupName)}-summary`"
        class="simple__name fr-text--lg"
      >
        {{ groupName }}
        <DsfrTag class="fr-text--xs" small :label="factorsInGroup" />
      </p>
    </div>
    <div v-else class="disclosure__header">
      <DsfrTag class="fr-text--xs only-tag" small :label="factorsInGroup" />
    </div>
    <div
      v-show="isDisclosureOpen"
      :id="widgetID"
      :class="[{ isVisible: isDisclosureOpen }, 'disclosure__content']"
    >
      <ul role="list" class="fr-m-0 fr-p-0">
        <li
          v-for="(dataset, index) in datasetsProperties"
          v-show="!dataset.isHidden"
          :key="index"
        >
          <div class="dataset__header fr-px-2w fr-py-3v">
            <slot name="datasetTitle">
              <component :is="headingLevel" class="dataset__title">
                {{ dataset.title }}
              </component>
            </slot>
            <div class="dataset__actions">
              <DsfrTag
                v-if="
                  !isAvailable(dataset.availability) ||
                  dataset.remoteDeleted ||
                  dataset.remoteArchived
                "
                class="uppercase bold fr-text--xs fr-mr-2w"
                label="Non disponible"
              />
              <slot name="datasetActions" :dataset="dataset" :index="index" />
            </div>
          </div>
          <div v-if="$slots.datasetContent" class="dataset__content">
            <slot name="datasetContent" :dataset="dataset" />
          </div>
        </li>
      </ul>
    </div>
    <Teleport to="body">
      <DsfrModal
        v-model:opened="opened"
        :title="modalContent.title"
        :class="['modal-group', `modal-${modalType}`]"
        :style="{ '--modal-confirm-button-bg': `var(${modalContent.color})` }"
        size="lg"
        @close="resetForm"
      >
        <div v-if="modalType === 'edit'" class="form fr-input-group">
          <DsfrInput
            v-model="newGroupName"
            label="Nom du regroupement"
            label-visible
            maxlength="100"
            :aria-invalid="inputErrors.length ? true : undefined"
            :description-id="
              inputErrors.length
                ? 'input-requirements errors-name'
                : 'input-requirements'
            "
            @keypress.prevent.enter="onValidateEdit"
          />
          <small
            id="input-requirements"
            :class="{ 'error fr-text--bold': newGroupName.length > 100 }"
            >100 caractères maximum&nbsp;:
            {{ newGroupName.trim().length }}&nbsp;/&nbsp;100</small
          >
          <div v-if="inputErrors.length" id="errors-name" class="error">
            <p v-for="(error, index) in inputErrors" :key="index">
              <span class="fr-icon-error-fill" aria-hidden="true" />
              {{ error }}
            </p>
          </div>
        </div>
        <div v-else-if="modalType === 'delete'">
          <p>
            Ce regroupement contient un ou plusieurs jeux de données. En
            confirmant la suppression,
            <strong>
              tous les jeux de données associés seront retirés du bouquet.
            </strong>
          </p>
          <p>Êtes-vous sûr de vouloir supprimer ce regroupement&nbsp;?</p>
        </div>
        <slot name="footer">
          <DsfrButtonGroup
            align="right"
            :buttons="actions"
            inline-layout-when="large"
          />
        </slot>
      </DsfrModal>
    </Teleport>
  </div>
</template>

<style scoped>
.disclosure {
  --padding-base: 1rem;
  container-type: inline-size;
  container-name: disclosure;
}
.disclosure__header,
.disclosure__trigger,
.disclosure__actions,
.dataset__actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--padding-base) / 2);
}

.disclosure__header {
  --text-spacing: 0;
  flex-wrap: wrap;
  gap: 0;
  border-block-end: 1px solid var(--border-default-grey);
}
.disclosure__header:has(.only-tag) {
  padding: calc(var(--padding-base) / 2);
}
.disclosure__trigger,
.simple__name {
  padding: calc(var(--padding-base) / 2);
  flex-grow: 1;
  align-items: start;
  text-align: left;
}
.disclosure__name {
  font-size: 1.125rem;
}
.disclosure__name,
.simple__name {
  flex: 1 1 auto;
  align-self: center;
  font-weight: 500;
}

.disclosure__trigger::before {
  --icon-size: 1rem;
  /* needed for long title on mobile */
  margin-block-start: 1ex;
  rotate: 0deg;
  transition: rotate 0.4s ease;
}
.disclosure__trigger[aria-expanded='true']::before {
  rotate: 90deg;
}

.disclosure__actions,
.dataset__actions {
  margin-inline-start: auto;
}
.disclosure__actions {
  padding-block: calc(var(--padding-base) / 2);
  padding-inline: calc(var(--padding-base) / 2) var(--padding-base);
}
.disclosure__content.isVisible {
  padding-block: var(--padding-base);
}
.disclosure__content ul > li + li {
  margin-block-start: var(--padding-base);
}
.disclosure__content ul > li {
  background: var(--background-alt-grey, #f6f6f6);
}

.disclosure__header .fr-tag {
  /* can't use custom properties because of the cumulus theme. */
  font-weight: 400;
  vertical-align: baseline;
  color: #000091;
  background-color: #e3e3fd;
}
.disclosure__content .fr-tag {
  color: var(--purple-glycine-sun-319-moon-630, #6e445a);
  background-color: var(--purple-glycine-950-100, #fee7fc);
  border-radius: 0;
}

/* DATASETS */
.dataset__header {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: var(
    --light-decisions-background-background-alt-blue-france,
    #f5f5fe
  );
}
.dataset__title {
  padding: 0;
  margin: 0;
  font-weight: 500;
  font-size: 1.1rem;
}

.dataset__content {
  padding-block: var(--padding-base) calc(var(--padding-base) / 2);
  padding-inline: calc(var(--padding-base) / 2);
}

/* DESKTOP styles */
@container disclosure (width >= 42rem) {
  .disclosure__content.isVisible {
    padding-inline: var(--padding-base);
  }
  .disclosure__trigger {
    /* half padding on right to harmonize with other icons */
    padding-inline: var(--padding-base) calc(var(--padding-base) / 2);
    padding-block: calc(var(--padding-base) * 0.75);
    align-items: center;
  }
  .disclosure__trigger::before {
    margin-block-start: 0;
  }
  .disclosure__actions {
    gap: var(--padding-base);
  }
  .dataset__content {
    padding-inline: var(--padding-base);
  }
}

/* MODAL */
.modal-group :deep(h1) {
  /* Fluid font-size. Maths from: https://utopia.fyi/type/calculator/ */
  font-size: clamp(1.375rem, 1.3319rem + 0.2155vw, 1.5rem);
}
.modal-group form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-delete :deep(.fr-btns-group :last-child button) {
  background-color: var(--modal-confirm-button-bg);
}
</style>

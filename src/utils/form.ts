import type { ComputedRef, Ref } from 'vue'
import { useTopicsConf } from './config'

type FormErrorMessage = { inputName: string; message: string }

const { topicsName } = useTopicsConf()

export type FormErrorMessagesMap = Map<
  FormErrorMessage['inputName'],
  FormErrorMessage['message']
>

// define error messages for all inputs here
const errorMessages = [
  {
    inputName: 'bouquetId',
    message: `Veuillez sélectionner un ${topicsName}.`
  },
  {
    inputName: 'group',
    message: 'Le nom du regroupement est limité à 100 caractères.'
  },
  { inputName: 'title', message: 'Le libellé doit être renseigné.' },
  {
    inputName: 'purpose',
    message: "La raison d'utilisation ne doit pas être vide."
  },
  {
    inputName: 'availability',
    message: 'Un jeu de données ou une disponibilité doit être sélectionné.'
  },
  {
    inputName: 'availabilityUrl',
    message: 'Une URL doit être renseignée.'
  }
] as const

// create a union type of available input errors
export type AllowedInput = (typeof errorMessages)[number]['inputName']

interface UseFormOptions {
  validateFields: () => void
  onSuccess: () => void | Promise<void>
  errorSummaryRef?: Ref<{ $el: HTMLElement } | null>
  isValid?: Ref<boolean>
}

export function useForm(
  formErrors: Ref<string[]>,
  options?: UseFormOptions
): {
  formErrorMessagesMap: ComputedRef<FormErrorMessagesMap>
  sortedErrors: ComputedRef<string[]>
  getErrorMessage: (inputName: AllowedInput) => string
  isSubmitted: Ref<boolean>
  handleSubmit: () => void
} {
  const isSubmitted = ref(false)

  const formErrorMessagesMap = computed(() => {
    return errorMessages.reduce(
      (acc, error) => acc.set(error.inputName, error.message),
      new Map()
    )
  })

  const sortedErrors = computed(() => {
    return Array.from(formErrorMessagesMap.value.keys()).filter((key) =>
      formErrors.value.includes(key)
    )
  })

  const getErrorMessage = (inputName: AllowedInput): string => {
    if (formErrors.value.includes(inputName))
      return formErrorMessagesMap.value.get(inputName)
    return ''
  }

  const handleSubmit = async () => {
    // reset error fields
    formErrors.value = []
    isSubmitted.value = true

    // check input fields
    options?.validateFields()

    // handle error summary
    if (formErrors.value.length > 0 && options?.errorSummaryRef?.value) {
      const errorSummaryTitle = options.errorSummaryRef.value.$el.querySelector(
        '#error-summary-title'
      ) as HTMLHeadingElement | null

      if (errorSummaryTitle) {
        await nextTick()
        errorSummaryTitle.focus()
      }
      return
    }
    if (options?.isValid !== undefined && !options.isValid.value) {
      return
    }
    // submit if no error
    isSubmitted.value = false
    await options?.onSuccess()
  }

  return {
    formErrorMessagesMap,
    sortedErrors,
    getErrorMessage,
    isSubmitted,
    handleSubmit
  }
}

import { useSpatialStore } from '@/store/SpatialStore'
import type {
  Indicator,
  IndicatorExtras,
  IndicatorExtrasCalcul,
  IndicatorExtrasSource,
  IndicatorsExtrasApi
} from '../model/indicator'

export const UNFILLED_LABEL = 'Non renseigné'

export const useIndicatorExtras = (indicator: Ref<Indicator | undefined>) => {
  const unite: Ref<string | undefined> = ref()
  const mailles: Ref<string[]> = ref([])
  const axes: Ref<Record<string, string[]>> = ref({})
  const calcul: Ref<IndicatorExtrasCalcul | undefined> = ref()
  const sources: Ref<IndicatorExtrasSource[]> = ref([])
  const api: Ref<IndicatorsExtrasApi | undefined> = ref()

  const store = useSpatialStore()
  store.loadLevels()

  watch(
    indicator,
    () => {
      const extras: IndicatorExtras =
        indicator.value?.extras?.['ecospheres-indicateurs']
      if (extras) {
        unite.value = extras.unite
        mailles.value = (extras.mailles_geographiques || [])
          .map((m: string) => store.getLevelById(m)?.name)
          .filter((v) => v !== undefined)
        axes.value = extras.axes
        calcul.value = extras.calcul
        api.value = extras.api
        sources.value = extras.sources
      }
    },
    { immediate: true }
  )

  return {
    unite,
    mailles,
    axes,
    calcul,
    api,
    sources
  }
}

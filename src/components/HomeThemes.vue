<script setup lang="ts">
import { computed, type ComputedRef, onMounted, toRef } from 'vue'

import config from '@/config'
import type { Theme } from '@/model/theme'
import { useTopicStore } from '@/store/TopicStore'
import { useSearchPagesConfig } from '@/utils/config'
import { useThemeOptions } from '@/utils/theme'

import Tile from './Tile.vue'

const topicStore = useTopicStore()

const { searchPageName, searchPageSlug, searchPageExtrasKey } =
  useSearchPagesConfig(route.path.replace('/admin', '').split('/')[1])

const getThemeColor = (theme: Theme) => {
  const themeName = toRef(theme.name)
  const { themeColors } = useThemeOptions(themeName)
  return themeColors.value.background
}

const getThemeDescription = (theme: Theme) => {
  const nbTopics = topicStore.data.filter((topic) => {
    return (
      !topic.private && topic.extras[searchPageExtrasKey].theme === theme.name
    )
  }).length
  switch (nbTopics) {
    case 0:
      return `Aucun  ${searchPageName}`
    case 1:
      return `1 ${searchPageName}`
    default:
      return `${nbTopics} ${searchPageName}s`
  }
}

const themesWithDescriptions: ComputedRef<Array<[Theme, string]>> = computed(
  () => {
    return config.themes.map((theme: Theme) => {
      return [theme, getThemeDescription(theme)]
    })
  }
)

onMounted(() => {
  topicStore.loadTopicsForUniverse([searchPageSlug])
})
</script>

<template>
  <div class="fr-container--fluid">
    <ul
      class="fr-grid-row fr-grid-row--gutters es__tiles__list home-themes-tiles"
    >
      <li
        v-for="[theme, description] in themesWithDescriptions"
        :key="theme.name"
        class="fr-col-12 fr-col-lg-3"
      >
        <Tile
          :style="`--themeColor: ${getThemeColor(theme)}`"
          :link="{ name: searchPageSlug, query: { theme: theme.name } }"
          :title="theme.name"
          :description="description"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
:deep(.fr-tile__body) {
  align-items: flex-start;
  box-shadow:
    rgb(221, 221, 221) 0px 0px 0px 1px inset,
    var(--themeColor, var(--blue-cumulus-sun-368-moon-732)) 0px -4px 0px 0px inset;
}
</style>

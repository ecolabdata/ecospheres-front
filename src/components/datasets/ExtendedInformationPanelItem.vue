<script setup lang="ts">
import { fromMarkdown } from '@/utils'

interface Props {
  title: string
  items: string[] | undefined
}

defineProps<Props>()
</script>

<template>
  <div v-if="items && items.length > 0" class="fr-mb-3w">
    <h3 class="subtitle fr-mb-2v">{{ title }}</h3>
    <ul v-if="items.length > 1" class="fr-mb-0">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <li v-for="item in items" :key="item" v-html="fromMarkdown(item, true)" />
    </ul>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div
      v-else-if="items.length === 1"
      class="fr-text--sm fr-m-0"
      v-html="fromMarkdown(items[0], true)"
    />
  </div>
</template>

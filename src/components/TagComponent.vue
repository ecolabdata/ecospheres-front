<script setup lang="ts">
import type { ResolvedTag } from '@/model/tag'

defineProps({
  tag: {
    type: Object as () => ResolvedTag,
    default: null
  }
})
</script>

<template>
  <p v-if="tag" :class="['fr-badge', `fr-badge--${tag.color}`]">
    {{ tag.name }}
  </p>
</template>

<script setup lang="ts">
import type { DatasetV2 } from '@datagouv/components-next'
import { computed } from 'vue'

import config from '@/config'
import type { WithOwned } from '@/model'
import type { Topic } from '@/model/topic'

const props = defineProps({
  object: {
    type: Object as () => WithOwned<DatasetV2 | Topic>,
    required: true
  },
  size: {
    type: Number,
    default: 32
  },
  padding: {
    type: Number,
    default: 6
  }
})

const logoSrc = computed(() => {
  return (
    props.object.organization?.logo_thumbnail ||
    `${config.datagouvfr.base_url}/_themes/gouvfr/img/placeholders/organization.png`
  )
})

const style = computed(() => {
  const outerSize = props.size + props.padding * 2 + 1
  return {
    width: `${outerSize}px`,
    height: `${outerSize}px`,
    padding: `${props.padding}px`
  }
})
</script>

<template>
  <div class="logo" :style="style">
    <img :src="logoSrc" alt="" loading="lazy" :width="size" :height="size" />
  </div>
</template>

<style scoped>
.logo {
  display: inline-block;
  background: white;
  border: 1px solid var(--border-default-grey);
}
</style>

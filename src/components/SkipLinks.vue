<script lang="ts" setup>
interface SkipLinksProps {
  links: {
    id: string
    text: string
    ref?: string
  }[]
}

export type { SkipLinksProps }

defineProps<SkipLinksProps>()

const skipLinkList = useTemplateRef<HTMLElement>('skipLinkList')

defineExpose({
  skipLinkList
})
</script>

<template>
  <nav
    ref="skipLinkList"
    class="fr-container"
    role="navigation"
    aria-label="Accès rapides"
    tabindex="-1"
  >
    <ul class="skiplinks__list" role="list">
      <li v-for="(link, index) of links" :key="link.id">
        <a v-if="index === 0" class="fr-link" :href="`#${link.id}`">{{
          link.text
        }}</a>
        <a v-else class="fr-link" :href="`#${link.id}`">{{ link.text }}</a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.skiplinks__list {
  padding: 6px;
  position: fixed;
  margin: 0;
  top: -10rem;
  left: 1rem;
  display: flex;
  flex-flow: row wrap;
  gap: 1rem;
  background-color: #fff;
  z-index: 99999;
}
.skiplinks__list:focus-within:has(:focus-visible) {
  top: 0;
}

/* fallback for unsupported :has() */
@supports not selector(:has(a, b)) {
  .skiplinks__list:focus-within {
    top: 0;
  }
}
</style>

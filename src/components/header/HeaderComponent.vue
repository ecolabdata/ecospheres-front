<script lang="ts" setup>
import config from '@/config'
import type { DsfrHeaderProps } from '@gouvminint/vue-dsfr'
import Navigation from '../Navigation.vue'
import SearchComponent from '../SearchComponent.vue'

type Props = {
  userName: string | undefined
  logoOperatorHeight: string | undefined
  logoOperatorWidth: string | undefined
  customSearch: boolean
}

withDefaults(defineProps<DsfrHeaderProps & Props>(), {
  operatorImgAlt: '',
  operatorImgStyle: () => ({}),
  searchLabel: 'Recherche',
  quickLinks: () => [],
  showSearch: config.website.header_search.display,
  customSearch: false
})

// DsfrHeader does not expose the hidemodal function, so we do this to close the modal after a custom search.
const headerRef = useTemplateRef('headerRef')

const closeModal = () => {
  const closeButton: HTMLButtonElement | undefined | null =
    headerRef.value?.$el.querySelector('#close-button')
  if (closeButton) {
    // we need a timeout because of a '@keydown.enter' in DsfrSearchBar preventing the click to happen
    setTimeout(() => {
      closeButton.click()
    }, 50)
  }
}

const logoText = config.website.rf_title
const serviceTitle = config.website.title
const serviceLogo = config.website.service_logo
const logoOperator = config.website.logo_operator?.src
const showLogoOperatorInHeader =
  config.website.logo_operator?.show_in_header ?? true
const showBadge = config.website.badge.display
const badgeText = config.website.badge.text
const badgeStyle = config.website.badge.style
const dropdown = config.website.header_search.dropdown ?? undefined
</script>

<template>
  <DsfrHeader
    ref="headerRef"
    home-to="/"
    :logo-text
    :service-title="serviceLogo ? undefined : serviceTitle"
    :operator-img-src="showLogoOperatorInHeader ?? logoOperator"
    :operator-img-alt
    :operator-img-style
    service-description=""
    :quick-links
    :show-search="showSearch && !customSearch"
  >
    <!-- needed because of logo + badge -->
    <template #operator>
      <div v-if="showLogoOperatorInHeader && logoOperator">
        <img
          class="fr-responsive-img operator-logo"
          :src="logoOperator"
          alt=""
          :style="operatorImgStyle"
          :height="logoOperatorHeight"
          :width="logoOperatorWidth"
        />
      </div>
      <div v-if="serviceLogo">
        <img
          class="fr-responsive-img service-logo"
          :src="serviceLogo"
          :alt="serviceTitle"
        />
      </div>
      <span
        v-if="showBadge"
        :class="`fr-badge fr-badge--sm fr-badge--${badgeStyle}`"
      >
        {{ badgeText }}
      </span>
    </template>

    <template #after-quick-links>
      <SearchComponent
        v-if="customSearch"
        id="header-select-search"
        class="custom-search"
        :search-label="searchLabel"
        :dropdown="dropdown"
        placeholder="Rechercher"
        @do-search="closeModal"
      />
    </template>

    <template #mainnav="{ hidemodal }">
      <Navigation :on-click="hidemodal" />
    </template>
  </DsfrHeader>
</template>

<style scoped>
.operator-logo {
  inline-size: v-bind(logoOperatorWidth);
  block-size: v-bind(logoOperatorHeight);
}
.service-logo {
  max-block-size: 35px;
}
:deep(.fr-header__brand-top) {
  flex-wrap: wrap;

  .fr-header__operator {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  @media (max-width: 62em) {
    .fr-header__operator {
      flex: 1 1 100%;
      padding-top: 0;
      order: 3;
    }
    .fr-header__navbar {
      margin-right: 0;
      align-self: center;
      order: 2;
    }
  }
}
:deep(.fr-header__tools-links) {
  flex-wrap: wrap;
  align-items: center;

  & > nav {
    flex: 1 0 100%;
  }

  & > :last-child.custom-search {
    flex: 1 0 100%;
    max-inline-size: min(24rem, 100%);
  }
}
:deep(.custom-search) input + .fr-btn {
  background-color: var(--background-action-high-blue-france);
  color: var(--text-inverted-blue-france);

  &:hover {
    background-color: var(--hover-tint);
  }
}
</style>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import config from '@/config'
import type {
  DiscussionForm,
  DiscussionId,
  DiscussionResponse,
  Post,
  PostForm,
  SubjectClass
} from '@/model/discussion'
import LocalStorageService from '@/services/LocalStorageService'
import { useDiscussionStore } from '@/store/DiscussionStore'
import { useUserStore } from '@/store/UserStore'
import { formatDate } from '@/utils'
import { useTopicsConf } from '@/utils/config'

const route = useRoute()
const router = useRouter()

const discussionStore = useDiscussionStore()
const userStore = useUserStore()

const { topicsName } = useTopicsConf()

const { loggedIn } = storeToRefs(userStore)
const currentPage: Ref<number> = ref(1)
const showDiscussionForm: Ref<boolean> = ref(false)
const postFormId: Ref<DiscussionId | null> = ref(null)

const props = defineProps({
  subject: {
    type: Object,
    required: true
  },
  subjectClass: {
    type: String as () => SubjectClass,
    default: 'Dataset'
  }
})

const subjectClassLabels = {
  Dataset: 'jeu de données',
  Topic: topicsName,
  Indicator: 'indicateur'
}

const discussionForm: Ref<DiscussionForm> = ref({
  title: '',
  comment: '',
  subject: {
    id: props.subject.id,
    class: props.subjectClass
  }
})

const postForm: Ref<PostForm> = ref({ comment: '' })

const discussions: ComputedRef<DiscussionResponse | undefined> = computed(
  () => {
    return discussionStore.getDiscussionsForSubject(
      props.subject.id,
      currentPage.value
    )
  }
)
const pages = computed(() => {
  return discussionStore.getDiscussionsPaginationForSubject(props.subject.id)
})

const allowDiscussionCreation = computed(() => {
  return config.website.discussions[props.subjectClass.toLowerCase()].create
})

const getUserAvatar = (post: Post) => {
  if (post.posted_by.avatar_thumbnail) {
    return post.posted_by.avatar_thumbnail
  }
  return `${config.datagouvfr.base_url}/api/1/avatars/${post.posted_by.id}/20`
}

const triggerLogin = () => {
  LocalStorageService.setItem('lastRoute', route.fullPath)
  router.push({ name: 'login' })
}

const createDiscussion = () => {
  discussionStore.createDiscussion(discussionForm.value).then((d) => {
    if (d !== undefined) {
      discussionForm.value.title = ''
      discussionForm.value.comment = ''
      showDiscussionForm.value = false
      currentPage.value = 1
    }
  })
}

const createPost = (discussionId: DiscussionId) => {
  discussionStore
    .createPost(props.subject.id, discussionId, postForm.value)
    .then((d) => {
      if (d !== undefined) {
        postForm.value.comment = ''
        postFormId.value = null
      }
    })
}

watchEffect(() => {
  if (!props.subject.id) return
  discussionStore.loadDiscussionsForSubject(props.subject.id, currentPage.value)
  discussionForm.value.subject = {
    id: props.subject.id,
    class: props.subjectClass
  }
})
</script>

<template>
  <div class="fr-grid-row fr-grid-row--middle discussion-header">
    <div class="fr-col">
      <h2 class="fr-mt-4w">Discussions</h2>
    </div>
    <template v-if="allowDiscussionCreation">
      <button
        v-if="loggedIn"
        type="button"
        class="fr-btn fr-btn--sm fr-btn--secondary fr-btn--secondary-grey-500 fr-icon-add-line fr-btn--icon-left"
        @click.stop.prevent="showDiscussionForm = true"
      >
        Démarrer une nouvelle discussion
      </button>
      <button
        v-else
        type="button"
        class="fr-btn fr-btn--sm fr-btn--secondary fr-btn--secondary-grey-500 fr-icon-account-line fr-btn--icon-left"
        @click.stop.prevent="triggerLogin()"
      >
        Connectez-vous pour démarrer une discussion
      </button>
    </template>
  </div>

  <div v-if="showDiscussionForm" class="fr-mb-4w">
    <form @submit.stop.prevent="createDiscussion()">
      <div class="fr-input-group">
        <label class="fr-label" for="discussion-title">
          Titre (obligatoire)</label
        >
        <input
          id="discussion-title"
          v-model="discussionForm.title"
          required
          class="fr-input"
          name="title"
        />
      </div>
      <div class="fr-input-group">
        <label class="fr-label" for="discussion-message">
          Message (obligatoire)</label
        >
        <textarea
          id="discussion-message"
          v-model="discussionForm.comment"
          required
          class="fr-input"
          name="message"
        ></textarea>
      </div>
      <div class="text-align-right">
        <button
          type="button"
          class="fr-btn fr-btn--secondary fr-mr-1w"
          @click.stop.prevent="showDiscussionForm = false"
        >
          Annuler
        </button>
        <button type="submit" class="fr-btn">Soumettre</button>
      </div>
    </form>
  </div>

  <div
    v-if="!discussions?.data?.length"
    class="fr-grid-row flex-direction-column fr-grid-row--middle fr-mt-5w"
  >
    <img
      src="/blank_state/discussion.svg"
      alt=""
      loading="lazy"
      height="105"
      width="130"
    />
    <p class="fr-h6 fr-mt-2w fr-mb-5v text-center">
      Pas de discussion pour
      {{ props.subjectClass === 'Indicator' ? 'cet' : 'ce' }}
      {{ subjectClassLabels[props.subjectClass] }}.
    </p>
  </div>
  <div v-else class="fr-mt-4w">
    <div
      v-for="discussion in discussions?.data"
      :key="discussion.id"
      class="fr-mb-6w"
    >
      <h3 :id="discussion.id" class="discussion-title fr-mb-3v">
        {{ discussion.title }}
      </h3>
      <div class="discussion-subtitle">
        <div class="avatar">
          <img
            :src="getUserAvatar(discussion.discussion[0])"
            alt=""
            loading="lazy"
            width="20"
            height="20"
          />
        </div>
        <p class="user-name">
          {{ discussion.discussion[0].posted_by.first_name }}
          {{ discussion.discussion[0].posted_by.last_name }}
        </p>
        <time
          :datetime="discussion.discussion[0].posted_on"
          class="comment-date"
        >
          - le {{ formatDate(discussion.discussion[0].posted_on) }}
        </time>
      </div>
      <p class="comment comment-text fr-mt-2v">
        {{ discussion.discussion[0].content }}
      </p>
      <template v-if="discussion.discussion.length > 1">
        <div class="discussion-answers">
          <div
            v-for="comment in discussion.discussion.slice(1)"
            :key="comment.content"
            class="discussion-answer fr-mt-3w"
          >
            <div class="discussion-subtitle">
              <div class="avatar">
                <img
                  :src="getUserAvatar(comment)"
                  alt=""
                  loading="lazy"
                  width="20"
                  height="20"
                />
              </div>
              <p class="user-name">
                {{ comment.posted_by.first_name }}
                {{ comment.posted_by.last_name }}
              </p>
              <time :datetime="comment.posted_on" class="comment-date">
                - le {{ formatDate(comment.posted_on) }}
              </time>
            </div>
            <p
              class="secondary-comment-content comment-text fr-ml-md-7v fr-mt-2v"
            >
              {{ comment.content }}
            </p>
          </div>
        </div>
      </template>
      <div v-if="allowDiscussionCreation" class="fr-mt-3w">
        <button
          v-if="postFormId !== discussion.id && loggedIn"
          type="button"
          class="fr-btn fr-btn--sm fr-btn--secondary fr-btn--secondary-grey-500 fr-icon-chat-3-line fr-btn--icon-left"
          aria-label="Répondre à la discussion"
          :aria-describedby="discussion.id"
          @click.stop.prevent="
            () => {
              postForm.comment = ''
              postFormId = discussion.id
            }
          "
        >
          Répondre
        </button>
        <button
          v-if="!loggedIn"
          type="button"
          class="fr-btn fr-btn--sm fr-btn--secondary fr-btn--secondary-grey-500 fr-icon-account-line fr-btn--icon-left"
          @click.stop.prevent="triggerLogin()"
        >
          Connectez-vous pour répondre
        </button>
        <form
          v-if="postFormId === discussion.id"
          @submit.stop.prevent="createPost(discussion.id)"
        >
          <div class="fr-input-group">
            <label class="fr-label" for="input-discussion-comment">
              Commentaire (obligatoire)
            </label>
            <textarea
              id="input-discussion-comment"
              v-model="postForm.comment"
              required
              class="fr-input"
              name="message"
            ></textarea>
          </div>
          <div class="text-align-right">
            <button
              type="button"
              class="fr-btn fr-btn--secondary fr-mr-1w"
              @click.stop.prevent="postFormId = null"
            >
              Annuler
            </button>
            <button type="submit" class="fr-btn">Soumettre</button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="pages?.length > 1" class="fr-container">
      <DsfrPagination
        :current-page="currentPage - 1"
        :pages="pages"
        @update:current-page="(p: number) => (currentPage = p + 1)"
      />
    </div>
  </div>
</template>

<style scoped>
.discussion-header {
  justify-content: space-between;
}
.start-discussion {
  flex: 1 1 auto;
}
.discussion-title {
  font-size: 1.125rem;
  font-weight: bold;
}

.discussion-subtitle {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  column-gap: 0.5rem;
  row-gap: 0.25rem;
}

.user-name {
  margin: 0;
  font-size: 0.875rem;
  color: #3557a2;
}

.avatar {
  display: flex;
  align-items: center;
}
.avatar > img {
  border-radius: 50%;
}

.comment-date {
  color: #666;
  font-style: italic;
  font-size: 0.875rem;
}

.comment {
  font-size: 0.875rem;
}

.secondary-comment-content {
  font-size: 0.875rem;
  border-left: 2px solid var(--grey-900-175);
  padding-left: 10px;
  margin-bottom: 10px;
}

.comment-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>

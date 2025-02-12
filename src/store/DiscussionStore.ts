import { defineStore } from 'pinia'

import type {
  Discussion,
  DiscussionForm,
  DiscussionId,
  DiscussionResponse,
  PostForm,
  SubjectId
} from '@/model/discussion'
import DiscussionsAPI from '@/services/api/resources/DiscussionsAPI'

const discussionsAPI = new DiscussionsAPI()

export const useDiscussionStore = defineStore('discussion', {
  state: () => {
    const data: Record<SubjectId, DiscussionResponse[]> = {}
    return { data }
  },
  actions: {
    /**
     * Add a post to a discussion
     */
    async createPost(
      subjectId: SubjectId,
      discussionId: DiscussionId,
      postForm: PostForm
    ): Promise<Discussion | undefined> {
      const discussion: Discussion | undefined =
        await discussionsAPI.createPost(discussionId, postForm)
      if (discussion === undefined) return
      this.data[subjectId] = this.data[subjectId].map((dPage) => {
        dPage.data = dPage.data.map((d) => {
          return d.id === discussionId ? discussion : d
        })
        return dPage
      })
      return discussion
    },
    /**
     * Refresh discussions for a subject, by loading the first page
     */
    async reloadForSubject(subjectId: SubjectId) {
      if (this.data[subjectId] === undefined) return
      // TODO: refactor data structure to comply with this rule
      delete this.data[subjectId]
      return await this.loadDiscussionsForSubject(subjectId)
    },
    /**
     * Add a discussion
     */
    async createDiscussion(
      discussionForm: DiscussionForm
    ): Promise<Discussion> {
      const discussion: Discussion = await discussionsAPI.create({
        data: discussionForm
      })
      await this.reloadForSubject(discussionForm.subject.id)
      return discussion
    },
    /**
     * Get discussions for a subject from store
     */
    getDiscussionsForSubject(
      subjectId: SubjectId,
      page = 1
    ): DiscussionResponse | undefined {
      if (this.data[subjectId] === undefined) return
      return this.data[subjectId].find((d) => d.page === page)
    },
    /**
     * Async function to trigger API fetch of discussions for a subject
     */
    async loadDiscussionsForSubject(
      subjectId: SubjectId,
      page = 1
    ): Promise<DiscussionResponse | undefined> {
      const existing = this.getDiscussionsForSubject(subjectId, page)
      if (existing !== undefined) return existing
      const discussions = await discussionsAPI.getDiscussions(subjectId, page)
      this.addDiscussions(subjectId, discussions)
      return this.getDiscussionsForSubject(subjectId, page)
    },
    /**
     * Store the result of a discussions fetch operation for a dataset in store
     */
    addDiscussions(subjectId: SubjectId, res: DiscussionResponse) {
      const existing = this.data[subjectId] ?? []
      this.data[subjectId] = [...existing, res]
    },
    /**
     * Get a discussions pagination object for a given dataset, from store infos
     */
    getDiscussionsPaginationForSubject(subjectId: SubjectId) {
      const discussions = this.getDiscussionsForSubject(subjectId)
      if (discussions === undefined) return []
      const nbPages = Math.ceil(discussions.total / discussions.page_size)
      return [...Array(nbPages).keys()].map((page) => {
        page += 1
        return {
          label: page.toString(),
          href: '#',
          title: `Page ${page}`
        }
      })
    }
  }
})

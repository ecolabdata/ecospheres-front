import type { User } from '@datagouv/components-next'

import type { GenericResponse } from './api'

interface Discussion {
  discussion: Post[]
  id: DiscussionId
  subject: Subject
  title: string
}

type DiscussionId = string

interface DiscussionForm {
  title: string
  comment: string
  subject: Subject
}

interface Post {
  content: string
  posted_by: User
  posted_on: string
}

interface PostForm {
  comment: string
}

interface Subject {
  class: SubjectClass
  id: SubjectId
}

type SubjectClass = 'Dataset' | 'Topic' | 'Indicator'

type SubjectId = string

interface DiscussionResponse extends GenericResponse {
  data: Discussion[]
}

export type {
  Discussion,
  DiscussionForm,
  DiscussionId,
  DiscussionResponse,
  Post,
  PostForm,
  Subject,
  SubjectClass,
  SubjectId
}

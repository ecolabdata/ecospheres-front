import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { stripHtml } from 'string-strip-html'

const markedOptions = {
  gfm: true,
  breaks: true,
  mangle: false,
  headerIds: false
}

/**
 * Parse description from markdown to HTML
 *
 * @param {ref} ref
 */
export const descriptionFromMarkdown = (ref, attr = 'description') => {
  if (ref.value?.description) {
    return fromMarkdown(ref.value[attr])
  }
}

/**
 * Parse markdown to HTML
 *
 * @param {string} value
 */
export const fromMarkdown = (value, safe = false) => {
  if (!value) return ''
  const parsed = marked.parse(value, markedOptions)
  if (safe) return parsed
  return DOMPurify.sanitize(parsed)
}

/**
 * Strip HTML tags from markdown
 *
 * @param {string} value
 * @returns {string}
 */
export const stripFromMarkdown = (value) => {
  const html = marked.parse(value, markedOptions)
  return stripHtml(html).result
}

/**
 * Format date
 *
 */
export const formatDate = (dateString, short = false) => {
  const date = new Date(dateString)
  const params = short
    ? {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    : {
        dateStyle: 'full',
        timeStyle: 'short'
      }
  return new Intl.DateTimeFormat('default', params).format(date)
}

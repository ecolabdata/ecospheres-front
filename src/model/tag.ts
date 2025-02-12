export interface TagSelectOption {
  name: string
  id: string
  disabled?: boolean
}

export interface ResolvedTag {
  id: string
  name: string
  type: string
  color: string
}

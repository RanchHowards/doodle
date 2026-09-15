import { useCallback, useState } from 'react'

const STORAGE_KEY = 'doodle-chat-author'

export function useAuthor() {
  const [author, setAuthorState] = useState(() => localStorage.getItem(STORAGE_KEY))

  const setAuthor = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    setAuthorState(trimmed)
  }, [])

  return { author, setAuthor }
}

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { fetchMessages, postMessage } from '../api/messagesApi'
import { ApiError, type ChatMessage } from '../types'
import { usePolling } from './usePolling'

const PAGE_SIZE = 30
const POLL_INTERVAL_MS = 3000

export interface MessageEntry extends ChatMessage {
  status?: 'pending' | 'failed'
}

interface State {
  messages: MessageEntry[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  hasMoreOlder: boolean
  isLoadingOlder: boolean
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; messages: ChatMessage[]; hasMore: boolean }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'POLL_SUCCESS'; messages: ChatMessage[] }
  | { type: 'LOAD_OLDER_START' }
  | { type: 'LOAD_OLDER_SUCCESS'; messages: ChatMessage[]; hasMore: boolean }
  | { type: 'LOAD_OLDER_ERROR' }
  | { type: 'SEND_START'; entry: MessageEntry }
  | { type: 'RETRY_START'; tempId: string }
  | { type: 'SEND_SUCCESS'; tempId: string; message: ChatMessage }
  | { type: 'SEND_ERROR'; tempId: string }

function sortByCreatedAt(messages: MessageEntry[]): MessageEntry[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

// Reconciles two message lists by _id so polling/pagination never produce duplicates.
function mergeUnique(existing: MessageEntry[], incoming: MessageEntry[]): MessageEntry[] {
  const byId = new Map(existing.map((entry) => [entry._id, entry]))
  for (const message of incoming) byId.set(message._id, { ...byId.get(message._id), ...message })
  return sortByCreatedAt([...byId.values()])
}

const initialState: State = {
  messages: [],
  status: 'idle',
  error: null,
  hasMoreOlder: true,
  isLoadingOlder: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null }
    case 'LOAD_SUCCESS':
      return { ...state, status: 'ready', messages: sortByCreatedAt(action.messages), hasMoreOlder: action.hasMore }
    case 'LOAD_ERROR':
      return { ...state, status: 'error', error: action.error }
    case 'POLL_SUCCESS':
      return action.messages.length === 0 ? state : { ...state, messages: mergeUnique(state.messages, action.messages) }
    case 'LOAD_OLDER_START':
      return { ...state, isLoadingOlder: true }
    case 'LOAD_OLDER_SUCCESS':
      return {
        ...state,
        isLoadingOlder: false,
        hasMoreOlder: action.hasMore,
        messages: mergeUnique(state.messages, action.messages),
      }
    case 'LOAD_OLDER_ERROR':
      return { ...state, isLoadingOlder: false }
    case 'SEND_START':
      return { ...state, messages: sortByCreatedAt([...state.messages, action.entry]) }
    case 'RETRY_START':
      return {
        ...state,
        messages: state.messages.map((m) => (m._id === action.tempId ? { ...m, status: 'pending' } : m)),
      }
    case 'SEND_SUCCESS':
      return { ...state, messages: state.messages.map((m) => (m._id === action.tempId ? action.message : m)) }
    case 'SEND_ERROR':
      return {
        ...state,
        messages: state.messages.map((m) => (m._id === action.tempId ? { ...m, status: 'failed' } : m)),
      }
    default:
      return state
  }
}

export function useMessages(author: string) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const messagesRef = useRef(state.messages)

  useEffect(() => {
    messagesRef.current = state.messages
  }, [state.messages])

  useEffect(() => {
    const controller = new AbortController()
    dispatch({ type: 'LOAD_START' })
    fetchMessages({ limit: PAGE_SIZE }, controller.signal)
      .then((messages) => dispatch({ type: 'LOAD_SUCCESS', messages, hasMore: messages.length === PAGE_SIZE }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        dispatch({ type: 'LOAD_ERROR', error: err instanceof ApiError ? err.message : 'Failed to load messages' })
      })
    return () => controller.abort()
  }, [])

  const poll = useCallback(async (signal: AbortSignal) => {
    const latest = messagesRef.current.at(-1)
    if (!latest) return
    const messages = await fetchMessages({ after: latest.createdAt }, signal)
    if (messages.length) dispatch({ type: 'POLL_SUCCESS', messages })
  }, [])

  usePolling(poll, POLL_INTERVAL_MS, state.status === 'ready')

  const loadOlder = useCallback(async () => {
    const earliest = messagesRef.current[0]
    if (!earliest || state.isLoadingOlder || !state.hasMoreOlder) return
    dispatch({ type: 'LOAD_OLDER_START' })
    try {
      const messages = await fetchMessages({ before: earliest.createdAt, limit: PAGE_SIZE })
      dispatch({ type: 'LOAD_OLDER_SUCCESS', messages, hasMore: messages.length === PAGE_SIZE })
    } catch {
      dispatch({ type: 'LOAD_OLDER_ERROR' })
    }
  }, [state.isLoadingOlder, state.hasMoreOlder])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const tempId = crypto.randomUUID()
      const entry: MessageEntry = {
        _id: tempId,
        message: trimmed,
        author,
        createdAt: new Date().toISOString(),
        status: 'pending',
      }
      dispatch({ type: 'SEND_START', entry })
      try {
        const created = await postMessage({ message: trimmed, author })
        dispatch({ type: 'SEND_SUCCESS', tempId, message: created })
      } catch {
        dispatch({ type: 'SEND_ERROR', tempId })
      }
    },
    [author],
  )

  const retryMessage = useCallback(async (tempId: string) => {
    const entry = messagesRef.current.find((m) => m._id === tempId)
    if (!entry) return
    dispatch({ type: 'RETRY_START', tempId })
    try {
      const created = await postMessage({ message: entry.message, author: entry.author })
      dispatch({ type: 'SEND_SUCCESS', tempId, message: created })
    } catch {
      dispatch({ type: 'SEND_ERROR', tempId })
    }
  }, [])

  return { ...state, loadOlder, sendMessage, retryMessage }
}

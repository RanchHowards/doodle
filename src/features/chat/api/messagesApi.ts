import { request } from './httpClient'
import type { ChatMessage, FetchMessagesParams, NewMessagePayload } from '../types'

export function fetchMessages(params: FetchMessagesParams = {}, signal?: AbortSignal) {
  return request<ChatMessage[]>({ method: 'GET', query: { ...params }, signal })
}

export function postMessage(payload: NewMessagePayload, signal?: AbortSignal) {
  return request<ChatMessage>({ method: 'POST', body: payload, signal })
}

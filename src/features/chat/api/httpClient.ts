import { ApiError } from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
const TOKEN = import.meta.env.VITE_API_TOKEN

interface RequestOptions {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number | undefined>
  body?: unknown
  signal?: AbortSignal
}

export async function request<T>(options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options

  const url = new URL(BASE_URL)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  // Guard against empty response bodies (e.g. 204) that would break res.json().
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

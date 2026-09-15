export interface ChatMessage {
  _id: string
  message: string
  author: string
  createdAt: string
}

export interface NewMessagePayload {
  message: string
  author: string
}

export interface FetchMessagesParams {
  limit?: number
  before?: string
  after?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './MessageList.module.css'
import { MessageItem } from './MessageItem'
import type { MessageEntry } from '../hooks/useMessages'

interface MessageListProps {
  messages: MessageEntry[]
  author: string
  hasMoreOlder: boolean
  isLoadingOlder: boolean
  onLoadOlder: () => void
  onRetry: (tempId: string) => void
}

export function MessageList({
  messages,
  author,
  hasMoreOlder,
  isLoadingOlder,
  onLoadOlder,
  onRetry,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeight = useRef<number | null>(null)
  const prevMessageCount = useRef(0)
  const hasScrolledInitially = useRef(false)
  const [liveRegionEnabled, setLiveRegionEnabled] = useState(false)

  // Delay enabling aria-live so the initial history load isn't read aloud in full.
  useEffect(() => {
    const id = window.setTimeout(() => setLiveRegionEnabled(true), 0)
    return () => window.clearTimeout(id)
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (prevScrollHeight.current !== null) {
      // Restore the offset after prepending older messages so the view doesn't jump.
      container.scrollTop = container.scrollHeight - prevScrollHeight.current
      prevScrollHeight.current = null
      prevMessageCount.current = messages.length
      return
    }

    if (!hasScrolledInitially.current && messages.length > 0) {
      container.scrollTop = container.scrollHeight
      hasScrolledInitially.current = true
      prevMessageCount.current = messages.length
      return
    }

    const grew = messages.length > prevMessageCount.current
    const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120
    if (grew && wasNearBottom) {
      container.scrollTop = container.scrollHeight
    }
    prevMessageCount.current = messages.length
  }, [messages])

  const handleLoadOlder = () => {
    if (containerRef.current) prevScrollHeight.current = containerRef.current.scrollHeight
    onLoadOlder()
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {hasMoreOlder && (
        <button type="button" className={styles.loadOlder} onClick={handleLoadOlder} disabled={isLoadingOlder}>
          {isLoadingOlder ? 'Loading…' : 'Load older messages'}
        </button>
      )}
      <ul className={styles.list} role="log" aria-live={liveRegionEnabled ? 'polite' : 'off'} aria-relevant="additions">
        {messages.map((entry) => (
          <MessageItem key={entry._id} entry={entry} isOwn={entry.author === author} onRetry={onRetry} />
        ))}
      </ul>
    </div>
  )
}

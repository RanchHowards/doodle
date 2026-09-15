import styles from './MessageItem.module.css'
import type { MessageEntry } from '../hooks/useMessages'

interface MessageItemProps {
  entry: MessageEntry
  isOwn: boolean
  onRetry: (tempId: string) => void
}

export function MessageItem({ entry, isOwn, onRetry }: MessageItemProps) {
  const time = new Date(entry.createdAt)
  const timeLabel = Number.isNaN(time.getTime())
    ? ''
    : time.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <li className={`${styles.item} ${isOwn ? styles.own : ''}`}>
      <div className={styles.meta}>
        <span className={styles.author}>{entry.author}</span>
        {timeLabel && (
          <time className={styles.time} dateTime={entry.createdAt}>
            {timeLabel}
          </time>
        )}
      </div>
      <p className={styles.bubble}>{entry.message}</p>
      {entry.status === 'pending' && (
        <span className={styles.status} role="status">
          Sending…
        </span>
      )}
      {entry.status === 'failed' && (
        <span className={styles.status} role="alert">
          Failed to send.{' '}
          <button type="button" className={styles.retry} onClick={() => onRetry(entry._id)}>
            Retry
          </button>
        </span>
      )}
    </li>
  )
}

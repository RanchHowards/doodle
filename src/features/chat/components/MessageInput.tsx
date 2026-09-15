import { useState, type FormEvent, type KeyboardEvent } from 'react'
import styles from './MessageInput.module.css'

interface MessageInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="chat-message-input" className={styles.visuallyHidden}>
        Message
      </label>
      <textarea
        id="chat-message-input"
        className={styles.textarea}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={1}
        disabled={disabled}
        aria-disabled={disabled}
      />
      <button type="submit" className={styles.send} disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  )
}

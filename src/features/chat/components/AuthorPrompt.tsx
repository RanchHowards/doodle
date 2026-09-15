import { useEffect, useRef, useState, type FormEvent } from 'react'
import styles from './AuthorPrompt.module.css'

interface AuthorPromptProps {
  onSubmit: (name: string) => void
}

export function AuthorPrompt({ onSubmit }: AuthorPromptProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    // Name entry is required before chatting, so block the default Escape-to-close behavior.
    const preventCancel = (event: Event) => event.preventDefault()
    dialog?.addEventListener('cancel', preventCancel)
    return () => dialog?.removeEventListener('cancel', preventCancel)
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="author-prompt-title">
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 id="author-prompt-title">Join the chat</h2>
        <label htmlFor="author-name">Your name</label>
        <input
          id="author-name"
          name="author-name"
          type="text"
          autoFocus
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
        <button type="submit" disabled={!name.trim()}>
          Continue
        </button>
      </form>
    </dialog>
  )
}

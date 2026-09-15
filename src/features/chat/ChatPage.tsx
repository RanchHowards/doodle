import styles from './ChatPage.module.css'
import { AuthorPrompt } from './components/AuthorPrompt'
import { MessageInput } from './components/MessageInput'
import { MessageList } from './components/MessageList'
import { useAuthor } from './hooks/useAuthor'
import { useMessages } from './hooks/useMessages'

export function ChatPage() {
  const { author, setAuthor } = useAuthor()

  if (!author) {
    return <AuthorPrompt onSubmit={setAuthor} />
  }

  return <ChatRoom author={author} />
}

function ChatRoom({ author }: { author: string }) {
  const { messages, status, error, hasMoreOlder, isLoadingOlder, loadOlder, sendMessage, retryMessage } =
    useMessages(author)

  return (
    <main className={styles.page} aria-label="Chat">
      <header className={styles.header}>
        <h1 className={styles.title}>Doodle Chat</h1>
        <p className={styles.subtitle}>Signed in as {author}</p>
      </header>

      {status === 'loading' && <p className={styles.status}>Loading messages…</p>}
      {status === 'error' && (
        <p className={styles.status} role="alert">
          {error ?? 'Something went wrong loading messages.'}
        </p>
      )}

      {status !== 'loading' && (
        <MessageList
          messages={messages}
          author={author}
          hasMoreOlder={hasMoreOlder}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={loadOlder}
          onRetry={retryMessage}
        />
      )}

      <MessageInput onSend={sendMessage} disabled={status === 'loading'} />
    </main>
  )
}

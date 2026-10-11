import { Link, Outlet, useMatch } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useConversations from '../hooks/useConversations'
import { formatRelative } from '../utils/dates'
import Avatar from '../components/Avatar'
import { ErrorState } from '../components/EmptyState'
import { Skeleton } from '../components/Spinner'

// Split-pane workspace: conversation list on the left, the open thread (via <Outlet/>) on the right.
// On phones only one pane shows at a time: the list at /messages, the thread at /chat/:id.
export default function MessagesShell() {
  const { user, blockedIds } = useAuth()
  const { rows, loading, error, refresh, retry } = useConversations(user)
  const open = useMatch('/chat/:otherUserId')
  const activeId = open?.params.otherUserId
  const visible = rows.filter((r) => !blockedIds.has(r.person.id))

  return (
    <div className="flex min-h-0 flex-1">
      <aside className={`${open ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col bg-brand-800 text-white md:w-[340px] lg:w-[400px]`} aria-label="Conversations">
        <h1 className="px-8 pb-4 pt-8 text-3xl font-bold">Messages</h1>
        <div className="on-dark min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-6">
          {loading ? (
            <div className="space-y-3 px-2" role="status" aria-label="Loading">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full bg-brand-700" />)}
            </div>
          ) : error ? (
            <div className="px-2"><ErrorState message="We could not load your conversations." onRetry={retry} /></div>
          ) : visible.length === 0 ? (
            <p className="px-4 py-6 text-[15px] text-brand-200">No conversations yet. Show interest in a listing to start chatting.</p>
          ) : (
            visible.map(({ person, last, unreadCount }) => {
              const active = String(person.id) === activeId
              return (
                <Link
                  key={person.id}
                  to={`/chat/${person.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[72px] items-center gap-4 rounded-2xl px-4 py-3 transition-colors ${active ? 'bg-brand-600' : 'hover:bg-brand-700/60'}`}
                >
                  <Avatar user={person} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[17px] font-bold">{person.name}</p>
                      {last && <span className="shrink-0 text-sm text-brand-200">{formatRelative(last.sentAt)}</span>}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-[15px] ${unreadCount ? 'text-white' : 'text-brand-100'}`}>
                        {last ? `${last.sender?.id === user.id ? 'You: ' : ''}${last.content}` : 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-sun-400 px-1.5 text-xs font-bold text-brand-900" aria-label={`${unreadCount} unread`}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </aside>

      <section className={`${open ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-mist`}>
        <Outlet context={{ refreshConversations: refresh }} />
      </section>
    </div>
  )
}

export function NoThread() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="font-display text-2xl font-bold text-brand-900">Pick a conversation</p>
      <p className="max-w-sm text-slate-600">Your chats with flatmates and flat owners show up on the left.</p>
    </div>
  )
}

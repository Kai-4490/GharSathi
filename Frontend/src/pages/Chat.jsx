import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as usersApi from '../api/users'
import * as listingsApi from '../api/listings'
import * as reportsApi from '../api/reports'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import useChat from '../hooks/useChat'
import { formatDayLabel, sameDay } from '../utils/dates'
import MessageBubble from '../components/MessageBubble'
import Avatar from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'
import ReportModal from '../components/ReportModal'
import Spinner from '../components/Spinner'
import { ErrorState } from '../components/EmptyState'

export default function Chat() {
  const { otherUserId } = useParams()
  const { user } = useAuth()
  if (String(user.id) === String(otherUserId)) return <Navigate to="/messages" replace />
  return <ChatThread key={otherUserId} me={user} otherUserId={otherUserId} />
}

function ChatThread({ me, otherUserId }) {
  const [params] = useSearchParams()
  const listingId = params.get('listingId')
  const { isBlocked, addBlocked } = useAuth()
  const { refreshConversations } = useOutletContext()
  const { messages, loading, error, connected, send } = useChat({ me, otherUserId, listingId })
  const [other, setOther] = useState(null)
  const [listing, setListing] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [blockBusy, setBlockBusy] = useState(false)
  const bottomRef = useRef(null)

  const blocked = isBlocked(Number(otherUserId))

  useEffect(() => {
    usersApi.getUser(otherUserId).then(setOther).catch((e) => toastError(e, 'Could not load user'))
  }, [otherUserId])

  useEffect(() => {
    if (!listingId) return
    listingsApi.get(listingId).then(setListing).catch(() => {})
  }, [listingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  // Keep the sidebar preview and unread badges in step with this thread.
  const readCount = messages.filter((m) => m.read).length
  useEffect(() => {
    if (!loading) refreshConversations()
  }, [loading, messages.length, readCount, refreshConversations])

  const submit = async () => {
    const content = draft.trim()
    if (!content || sending || blocked) return
    setSending(true)
    try {
      await send(content)
      setDraft('')
    } catch (e) {
      toastError(e, 'Message not sent')
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const doBlock = async () => {
    setBlockBusy(true)
    try {
      await reportsApi.block(me.id, Number(otherUserId))
      addBlocked(Number(otherUserId))
      toast.success('User blocked')
      setBlockOpen(false)
    } catch (e) {
      toastError(e, 'Could not block user')
    } finally {
      setBlockBusy(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 bg-brand-50 px-4 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link to="/messages" aria-label="Back to messages" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-brand-700 hover:bg-brand-100 md:hidden">←</Link>
          {other && <Avatar user={other} size="lg" />}
          <div className="min-w-0">
            {other ? (
              <Link to={`/users/${other.id}`} className="block truncate font-display text-xl font-bold text-brand-900 hover:underline">{other.name}</Link>
            ) : (
              <span className="text-lg font-semibold text-slate-400">Loading…</span>
            )}
            {listing && (
              <Link to={`/listings/${listing.id}`} className="block max-w-full truncate text-[15px] text-slate-600 hover:underline">
                Re: {listing.location}
              </Link>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn-secondary min-h-[44px] px-5" onClick={() => setReportOpen(true)}>Report</button>
          {!blocked && <button type="button" className="btn-secondary min-h-[44px] px-5" onClick={() => setBlockOpen(true)}>Block</button>}
        </div>
      </header>

      {!connected && !loading && (
        <div role="status" className="bg-sun-100 px-4 py-1.5 text-center text-xs font-semibold text-brand-900">Reconnecting…</div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6 sm:px-8" aria-live="polite">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message="We could not load this conversation." />
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-slate-600">No messages yet. Say hello!</p>
        ) : (
          messages.map((m, i) => (
            <Fragment key={m.id}>
              {(i === 0 || !sameDay(messages[i - 1].sentAt, m.sentAt)) && (
                <div className="flex justify-center pb-2">
                  <span className="rounded-full bg-brand-50 px-4 py-1 text-sm font-medium text-slate-600">{formatDayLabel(m.sentAt)}</span>
                </div>
              )}
              <MessageBubble message={m} me={me} />
            </Fragment>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {blocked ? (
        <div className="bg-brand-50 px-4 py-4 text-center text-[15px] text-slate-600">
          You blocked this user. <Link to="/blocked" className="font-semibold text-brand-700 hover:underline">Manage blocked users</Link>
        </div>
      ) : (
        <form className="flex items-end gap-3 bg-brand-50 px-4 py-4 sm:px-8" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <label htmlFor="composer" className="sr-only">Type a message</label>
          <textarea id="composer" rows={1} className="max-h-32 min-h-[52px] flex-1 resize-none rounded-[26px] border-0 bg-white px-6 py-3.5 text-base text-slate-900 placeholder-slate-500 shadow-sm" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} placeholder="Type a message" />
          <button type="submit" className="btn-primary h-[52px] rounded-full px-8 text-base" disabled={!draft.trim() || sending}>Send</button>
        </form>
      )}

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} reportedUserId={Number(otherUserId)} targetLabel={other?.name} />
      <ConfirmDialog open={blockOpen} danger loading={blockBusy} title={`Block ${other?.name || 'this user'}?`} message="You will no longer see their listings or conversations, and you will not be able to message them. You can unblock them later." confirmLabel="Block" onConfirm={doBlock} onCancel={() => !blockBusy && setBlockOpen(false)} />
    </div>
  )
}

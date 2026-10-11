import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import * as matchesApi from '../api/matches'
import * as reportsApi from '../api/reports'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { otherUser } from '../utils/match'
import MatchCard from '../components/MatchCard'
import ConfirmDialog from '../components/ConfirmDialog'
import ReportModal from '../components/ReportModal'
import { CardSkeletonGrid } from '../components/Spinner'
import EmptyState, { ErrorState } from '../components/EmptyState'
import PageHero from '../components/PageHero'

const TABS = [
  ['received', 'Received'],
  ['sent', 'Sent'],
  ['all', 'All'],
]
const ACTED = ['INTERESTED', 'ACCEPTED', 'REJECTED']

export default function Matches() {
  const { user, blockedIds, addBlocked } = useAuth()
  const [tab, setTab] = useState('received')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [blockTarget, setBlockTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setMatches(await matchesApi.forUser(user.id))
    } catch (e) {
      setError(true)
      toastError(e, 'Could not load matches')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  const decide = async (m, status) => {
    try {
      const updated = await matchesApi.setStatus(m.id, status)
      setMatches((ms) => ms.map((x) => (x.id === updated.id ? updated : x)))
      toast.success(status === 'ACCEPTED' ? 'Accepted' : 'Rejected')
    } catch (e) {
      toastError(e, 'Could not update')
    }
  }

  const doBlock = async () => {
    setBusy(true)
    try {
      await reportsApi.block(user.id, blockTarget.id)
      addBlocked(blockTarget.id)
      toast.success(`${blockTarget.name} blocked`)
      setBlockTarget(null)
    } catch (e) {
      toastError(e, 'Could not block user')
    } finally {
      setBusy(false)
    }
  }

  const base = matches.filter((m) => !blockedIds.has(otherUser(m, user).id))
  const shown = base.filter((m) => {
    if (tab === 'received') return m.userTwo?.id === user.id && ACTED.includes(m.status)
    if (tab === 'sent') return m.userOne?.id === user.id && m.status !== 'SUGGESTED'
    return true
  })

  const actionsFor = (m) => {
    const other = otherUser(m, user)
    const received = m.userTwo?.id === user.id
    const chat = `/chat/${other.id}${m.listing ? `?listingId=${m.listing.id}` : ''}`
    return (
      <>
        {received && m.status === 'INTERESTED' && (
          <>
            <button type="button" className="btn-primary" onClick={() => decide(m, 'ACCEPTED')}>Accept</button>
            <button type="button" className="btn-secondary" onClick={() => decide(m, 'REJECTED')}>Reject</button>
          </>
        )}
        {(m.status === 'INTERESTED' || m.status === 'ACCEPTED') && <Link to={chat} className="btn-secondary">Message</Link>}
      </>
    )
  }

  return (
    <>
      <PageHero title="Matches" subtitle="People who showed interest in you, and people you reached out to.">
        <div role="tablist" aria-label="Match filters" className="flex gap-1 rounded-xl bg-brand-800 p-1 sm:inline-flex">
          {TABS.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setTab(key)} className={`min-h-[44px] flex-1 rounded-lg px-6 text-sm font-semibold sm:flex-none ${tab === key ? 'bg-sun-400 text-brand-900' : 'text-brand-100 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </PageHero>
      <div className="shell space-y-6 py-8">
      {loading ? (
        <CardSkeletonGrid count={3} />
      ) : error ? (
        <ErrorState message="We could not load your matches." onRetry={load} />
      ) : shown.length === 0 ? (
        <EmptyState
          title={tab === 'received' ? 'Nobody has shown interest yet' : tab === 'sent' ? "You haven't shown interest in anyone yet" : 'No matches yet'}
          message={tab === 'sent' ? 'Browse suggestions or search listings and tap Show interest.' : undefined}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {shown.map((m) => {
            const other = otherUser(m, user)
            return (
              <MatchCard
                key={m.id}
                match={m}
                me={user}
                dimmed={m.status === 'REJECTED'}
                actions={actionsFor(m)}
                menuItems={[
                  { label: 'Report user', onClick: () => setReportTarget(other) },
                  { label: 'Block user', danger: true, onClick: () => setBlockTarget(other) },
                ]}
              />
            )
          })}
        </div>
      )}

      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} reportedUserId={reportTarget?.id} targetLabel={reportTarget?.name} />
      <ConfirmDialog open={!!blockTarget} danger loading={busy} title={`Block ${blockTarget?.name}?`} message="You will no longer see their listings or conversations. You can unblock them later from the Blocked users page." confirmLabel="Block" onConfirm={doBlock} onCancel={() => !busy && setBlockTarget(null)} />
      </div>
    </>
  )
}

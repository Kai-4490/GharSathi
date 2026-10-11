import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as matchesApi from '../api/matches'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import SuggestionRow from '../components/SuggestionRow'
import PageHero from '../components/PageHero'
import { otherUser } from '../utils/match'
import { CardSkeletonGrid } from '../components/Spinner'
import EmptyState, { ErrorState } from '../components/EmptyState'

export default function Suggestions() {
  const { user, blockedIds } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const fetched = useRef(false)

  // GET /suggestions inserts rows server-side, so it is called exactly once per mount.
  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      setMatches(await matchesApi.suggestions(user.id))
    } catch (e) {
      const msg = e.response?.data?.message || ''
      if (e.response?.status === 400 && /complete your profile/i.test(msg)) {
        toast('Complete your profile to get suggestions', { icon: 'ℹ️' })
        navigate('/profile', { replace: true })
        return
      }
      setError(true)
      toastError(e, 'Could not load suggestions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const interest = async (m) => {
    setBusyId(m.id)
    try {
      const updated = await matchesApi.setStatus(m.id, 'INTERESTED')
      setMatches((ms) => ms.map((x) => (x.id === updated.id ? updated : x)))
      toast.success('Interest sent')
    } catch (e) {
      toastError(e, 'Could not send interest')
    } finally {
      setBusyId(null)
    }
  }

  const visible = matches.filter((m) => !blockedIds.has(otherUser(m, user).id))

  const actionsFor = (m) => {
    const other = otherUser(m, user)
    const chat = `/chat/${other.id}${m.listing ? `?listingId=${m.listing.id}` : ''}`
    switch (m.status) {
      case 'SUGGESTED':
        return (
          <>
            <button type="button" className="btn-primary" disabled={busyId === m.id} onClick={() => interest(m)}>Show interest</button>
            {m.listing && <Link to={`/listings/${m.listing.id}`} className="flex min-h-[36px] items-center justify-center text-[15px] font-bold text-brand-700 hover:underline">View listing</Link>}
          </>
        )
      case 'INTERESTED':
        return (
          <>
            <span className="flex min-h-[36px] items-center justify-center rounded-lg bg-sky-100 px-3 text-sm font-medium text-sky-900">Waiting for response</span>
            <Link to={chat} className="btn-secondary">Message</Link>
          </>
        )
      case 'ACCEPTED':
        return <Link to={chat} className="btn-primary">Message</Link>
      default:
        return null
    }
  }

  return (
    <>
      <PageHero title="Suggested for you" subtitle="Ranked by how well each listing fits your profile" />
      <div className="shell space-y-5 py-8">
        {loading ? (
          <CardSkeletonGrid count={3} />
        ) : error ? (
          <ErrorState message="We could not load suggestions." onRetry={load} />
        ) : visible.length === 0 ? (
          <EmptyState title="No suggestions yet" message="When more listings are posted, the best fits will show up here." />
        ) : (
          <div className="space-y-5">
            {visible.map((m) => (
              <SuggestionRow key={m.id} match={m} me={user} dimmed={m.status === 'REJECTED'} actions={actionsFor(m)} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

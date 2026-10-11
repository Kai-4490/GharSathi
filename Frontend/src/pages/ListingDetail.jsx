import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as listingsApi from '../api/listings'
import * as matchesApi from '../api/matches'
import * as reportsApi from '../api/reports'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { GENDER_LABEL, LISTING_TYPE_LABEL } from '../constants/enums'
import { formatDate, formatDateTime } from '../utils/dates'
import { formatRentRange } from '../utils/money'
import { splitList } from '../utils/match'
import StatusBadge from '../components/StatusBadge'
import ScoreRing from '../components/ScoreRing'
import ConfirmDialog from '../components/ConfirmDialog'
import ReportModal from '../components/ReportModal'
import Spinner from '../components/Spinner'
import { ErrorState } from '../components/EmptyState'

export default function ListingDetail() {
  const { id } = useParams()
  const { user, addBlocked } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [matches, setMatches] = useState([]) // owner: matches for this listing; visitor: my matches
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirm, setConfirm] = useState(null) // 'hide' | 'delete' | 'block'
  const [reportOpen, setReportOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const l = await listingsApi.get(id)
      setListing(l)
      if (l.postedBy?.id === user.id) setMatches(await matchesApi.forListing(l.id))
      else setMatches(await matchesApi.forUser(user.id))
    } catch (e) {
      setError(e)
      if (e.response?.status !== 404) toastError(e, 'Could not load listing')
    } finally {
      setLoading(false)
    }
  }, [id, user.id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Spinner />
  if (error?.response?.status === 404) return <ErrorState message="Listing not found." />
  if (error || !listing) return <ErrorState message="We could not load this listing." onRetry={load} />

  const mine = listing.postedBy?.id === user.id
  const active = listing.status === 'ACTIVE'
  const amenities = splitList(listing.amenities)
  const myMatch = !mine ? matches.find((m) => m.listing?.id === listing.id) : null
  const interested = mine ? matches.filter((m) => ['INTERESTED', 'ACCEPTED', 'REJECTED'].includes(m.status)) : []

  const showInterest = async () => {
    setBusy(true)
    try {
      // Re-check for an existing match so we never create a duplicate row.
      const current = await matchesApi.forUser(user.id)
      const existing = current.find((m) => m.listing?.id === listing.id)
      let result
      if (!existing) result = await matchesApi.showInterest(user.id, listing.postedBy.id, listing.id)
      else if (existing.status === 'SUGGESTED') result = await matchesApi.setStatus(existing.id, 'INTERESTED')
      else result = existing
      setMatches((ms) => [...ms.filter((m) => m.id !== result.id), result])
      toast.success('Interest sent')
    } catch (e) {
      toastError(e, 'Could not send interest')
    } finally {
      setBusy(false)
    }
  }

  const decide = async (m, status) => {
    try {
      const updated = await matchesApi.setStatus(m.id, status)
      setMatches((ms) => ms.map((x) => (x.id === updated.id ? updated : x)))
      toast.success(status === 'ACCEPTED' ? 'Accepted' : 'Rejected')
    } catch (e) {
      toastError(e, 'Could not update')
    }
  }

  const runConfirm = async () => {
    setBusy(true)
    try {
      if (confirm === 'hide') {
        setListing(await listingsApi.deactivate(listing.id, user.id))
        toast.success('Listing hidden')
        setConfirm(null)
      } else if (confirm === 'delete') {
        await listingsApi.remove(listing.id, user.id)
        toast.success('Listing deleted')
        navigate('/my-listings', { replace: true })
      } else if (confirm === 'block') {
        await reportsApi.block(user.id, listing.postedBy.id)
        addBlocked(listing.postedBy.id)
        toast.success(`${listing.postedBy.name} blocked`)
        navigate('/listings', { replace: true })
      }
    } catch (e) {
      toastError(e, 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const confirmText = {
    hide: ['Hide this listing?', 'It will disappear from search. This cannot be undone from the app: there is no way to unhide a listing later.', 'Hide listing'],
    delete: ['Delete this listing?', 'It will be removed from search and from your listings. This cannot be undone.', 'Delete listing'],
    block: [`Block ${listing.postedBy?.name}?`, 'You will no longer see their listings or conversations. You can unblock them later from the Blocked users page.', 'Block'],
  }[confirm] || []

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to={mine ? '/my-listings' : '/listings'} className="text-sm font-medium text-brand-700 hover:underline">← Back</Link>

      {listing.status !== 'ACTIVE' && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {listing.status === 'INACTIVE' ? 'This listing is hidden.' : 'This listing was deleted.'}
        </div>
      )}

      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="listing" status={listing.status} />
          {mine && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Yours</span>}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{listing.location}</h1>
        <p className="text-sm text-slate-500">{LISTING_TYPE_LABEL[listing.type]}</p>
        <p className="text-2xl font-semibold text-brand-700">
          {formatRentRange(listing.rentMin, listing.rentMax)}
          {(listing.rentMin != null || listing.rentMax != null) && <span className="text-base font-normal text-slate-500"> / month</span>}
        </p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Available from</dt><dd className="font-medium">{listing.availableFrom ? formatDate(listing.availableFrom) : 'Immediately'}</dd></div>
          <div><dt className="text-slate-500">Gender preference</dt><dd className="font-medium">{GENDER_LABEL[listing.genderPreference]}</dd></div>
          <div><dt className="text-slate-500">Posted</dt><dd className="font-medium">{formatDateTime(listing.createdAt)}</dd></div>
          <div><dt className="text-slate-500">Last updated</dt><dd className="font-medium">{formatDateTime(listing.updatedAt)}</dd></div>
        </dl>
        <div>
          <h2 className="mb-1.5 text-sm font-medium text-slate-500">Amenities</h2>
          {amenities.length ? <div className="flex flex-wrap gap-1.5">{amenities.map((a) => <span key={a} className="chip">{a}</span>)}</div> : <p className="text-sm text-slate-500">None listed</p>}
        </div>
      </section>

      <section className="card flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs text-slate-500">Posted by</p>
          <Link to={`/users/${listing.postedBy.id}`} className="text-base font-semibold text-slate-900 hover:text-brand-700">{listing.postedBy.name}</Link>
        </div>
        <Link to={`/users/${listing.postedBy.id}`} className="btn-secondary">View profile</Link>
      </section>

      {!mine ? (
        <section className="flex flex-wrap gap-2">
          {myMatch && myMatch.status !== 'SUGGESTED' ? (
            <span className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm">Your interest: <StatusBadge kind="match" status={myMatch.status} /></span>
          ) : (
            <button type="button" className="btn-primary" onClick={showInterest} disabled={busy || !active}>Show interest</button>
          )}
          <Link to={`/chat/${listing.postedBy.id}?listingId=${listing.id}`} className="btn-secondary">Message</Link>
          <button type="button" className="btn-secondary" onClick={() => setReportOpen(true)}>Report listing</button>
          <button type="button" className="btn-secondary text-red-600" onClick={() => setConfirm('block')}>Block poster</button>
        </section>
      ) : (
        <>
          <section className="flex flex-wrap gap-2">
            <Link to={`/listings/${listing.id}/edit`} className="btn-primary">Edit</Link>
            {active && <button type="button" className="btn-secondary" onClick={() => setConfirm('hide')}>Hide</button>}
            {listing.status !== 'DELETED' && <button type="button" className="btn-secondary text-red-600" onClick={() => setConfirm('delete')}>Delete</button>}
          </section>
          <section className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900">Interested people</h2>
            {interested.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nobody has shown interest yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {interested.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0 space-y-1">
                      <Link to={`/users/${m.userOne.id}`} className="font-medium text-slate-900 hover:text-brand-700">{m.userOne.name}</Link>
                      <ScoreRing score={m.compatibilityScore} size={48} showLabel={false} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge kind="match" status={m.status} />
                      {m.status === 'INTERESTED' && (
                        <>
                          <button type="button" className="btn-primary" onClick={() => decide(m, 'ACCEPTED')}>Accept</button>
                          <button type="button" className="btn-secondary" onClick={() => decide(m, 'REJECTED')}>Reject</button>
                        </>
                      )}
                      <Link to={`/chat/${m.userOne.id}?listingId=${listing.id}`} className="btn-secondary">Message</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmDialog open={!!confirm} danger loading={busy} title={confirmText[0]} message={confirmText[1]} confirmLabel={confirmText[2]} onConfirm={runConfirm} onCancel={() => !busy && setConfirm(null)} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} reportedListingId={listing.id} reportedUserId={listing.postedBy.id} targetLabel="listing" />
    </div>
  )
}

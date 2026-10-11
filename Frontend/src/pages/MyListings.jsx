import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as listingsApi from '../api/listings'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ListingCard from '../components/ListingCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { CardSkeletonGrid } from '../components/Spinner'
import EmptyState, { ErrorState } from '../components/EmptyState'
import PageHero from '../components/PageHero'

export default function MyListings() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [confirm, setConfirm] = useState(null) // { kind: 'hide' | 'delete', listing }
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await listingsApi.byUser(user.id)
      setListings(data.filter((l) => l.status !== 'DELETED'))
    } catch (e) {
      setError(true)
      toastError(e, 'Could not load your listings')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  const run = async () => {
    const { kind, listing } = confirm
    setBusy(true)
    try {
      if (kind === 'hide') {
        const updated = await listingsApi.deactivate(listing.id, user.id)
        setListings((ls) => ls.map((l) => (l.id === updated.id ? updated : l)))
        toast.success('Listing hidden')
      } else {
        await listingsApi.remove(listing.id, user.id)
        setListings((ls) => ls.filter((l) => l.id !== listing.id))
        toast.success('Listing deleted')
      }
      setConfirm(null)
    } catch (e) {
      toastError(e, 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHero title="My listings" subtitle="Flats and searches you have posted." action={<Link to="/listings/new" className="btn-primary">Create listing</Link>} />
      <div className="shell space-y-6 py-8">

      {loading ? (
        <CardSkeletonGrid count={3} />
      ) : error ? (
        <ErrorState message="We could not load your listings." onRetry={load} />
      ) : listings.length === 0 ? (
        <EmptyState title="You have no listings yet" message="Post a flat or a flat search to start getting matched." action={<Link to="/listings/new" className="btn-primary">Create listing</Link>} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              me={user}
              showStatus
              footer={
                <>
                  <Link to={`/listings/${l.id}/edit`} className="btn-secondary">Edit</Link>
                  {l.status === 'ACTIVE' && <button type="button" className="btn-secondary" onClick={() => setConfirm({ kind: 'hide', listing: l })}>Hide</button>}
                  <button type="button" className="btn-secondary text-red-600" onClick={() => setConfirm({ kind: 'delete', listing: l })}>Delete</button>
                </>
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        danger
        loading={busy}
        title={confirm?.kind === 'hide' ? 'Hide this listing?' : 'Delete this listing?'}
        message={
          confirm?.kind === 'hide'
            ? 'Hidden listings disappear from search. This cannot be undone from the app: there is no way to unhide a listing later.'
            : 'The listing will be removed from your list and from search. This cannot be undone.'
        }
        confirmLabel={confirm?.kind === 'hide' ? 'Hide listing' : 'Delete listing'}
        onConfirm={run}
        onCancel={() => !busy && setConfirm(null)}
      />
      </div>
    </>
  )
}

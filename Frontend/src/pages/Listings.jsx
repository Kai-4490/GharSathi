import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as listingsApi from '../api/listings'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { GENDER_LABEL, GENDER_PREFERENCES } from '../constants/enums'
import ListingCard from '../components/ListingCard'
import { CardSkeletonGrid } from '../components/Spinner'
import EmptyState, { ErrorState } from '../components/EmptyState'
import PageHero from '../components/PageHero'

export default function Listings() {
  const { user, blockedIds } = useAuth()
  const [filters, setFilters] = useState({ location: '', maxBudget: '', genderPreference: '' })
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))

  // Debounced (400 ms) search; also runs once on mount with no filters.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    const handle = setTimeout(async () => {
      const params = {}
      if (filters.location.trim()) params.location = filters.location.trim()
      if (filters.maxBudget !== '' && Number(filters.maxBudget) >= 0) params.maxBudget = Number(filters.maxBudget)
      if (filters.genderPreference) params.genderPreference = filters.genderPreference
      try {
        const data = await listingsApi.search(params)
        if (!cancelled) setListings(data)
      } catch (e) {
        if (!cancelled) {
          setError(true)
          toastError(e, 'Could not load listings')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [filters, tick])

  const retry = useCallback(() => setTick((t) => t + 1), [])
  const visible = listings.filter((l) => !blockedIds.has(l.postedBy?.id))

  return (
    <>
      <PageHero
        title="Find your place"
        subtitle="Flats and roommates, matched on how you actually live."
        action={<Link to="/listings/new" className="btn-hero">Create listing</Link>}
      >
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] lg:items-end" onSubmit={(e) => { e.preventDefault(); retry() }} role="search">
          <div>
            <label htmlFor="f-loc" className="hero-label">Location</label>
            <input id="f-loc" className="hero-input" value={filters.location} onChange={set('location')} placeholder="e.g. Andheri" />
          </div>
          <div>
            <label htmlFor="f-budget" className="hero-label">Max budget (₹)</label>
            <input id="f-budget" type="number" min="0" className="hero-input" value={filters.maxBudget} onChange={set('maxBudget')} placeholder="15000" />
          </div>
          <div>
            <label htmlFor="f-gender" className="hero-label">Gender preference</label>
            <select id="f-gender" className="hero-input" value={filters.genderPreference} onChange={set('genderPreference')}>
              <option value="">Any</option>
              {GENDER_PREFERENCES.map((g) => <option key={g} value={g}>{GENDER_LABEL[g]}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary h-12 px-8 text-base">Search</button>
        </form>
      </PageHero>

      <div className="shell space-y-5 py-8">
        {loading ? (
          <CardSkeletonGrid />
        ) : error ? (
          <ErrorState message="We could not load listings." onRetry={retry} />
        ) : visible.length === 0 ? (
          <EmptyState title="No listings match your filters" message="Try a different location or a higher budget." />
        ) : (
          <>
            <p className="font-bold text-brand-900" aria-live="polite">{visible.length} active {visible.length === 1 ? 'listing' : 'listings'}</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((l) => <ListingCard key={l.id} listing={l} me={user} />)}
            </div>
          </>
        )}
      </div>
    </>
  )
}

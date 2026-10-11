import { Link } from 'react-router-dom'
import { formatRentRange } from '../utils/money'
import { otherUser, splitList } from '../utils/match'
import { toneFor } from '../utils/ui'
import BuildingArt from './BuildingArt'
import ScoreRing from './ScoreRing'

// One suggested listing: tile, details, compatibility ring, then actions.
export default function SuggestionRow({ match, me, actions = null, dimmed = false }) {
  const l = match.listing
  const other = otherUser(match, me)
  const amenities = l ? splitList(l.amenities) : []
  const tone = toneFor(l?.id ?? other?.id)
  const title = l ? l.location : other?.name
  const hasRent = l && (l.rentMin != null || l.rentMax != null)

  return (
    <article className={`card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 ${dimmed ? 'opacity-60' : ''}`}>
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <div className={`relative hidden h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:block ${tone.bg}`} aria-hidden="true">
          <BuildingArt className="absolute inset-x-3 bottom-0 h-[75%]" />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-xl font-bold text-brand-900">
              {l ? <Link to={`/listings/${l.id}`} className="hover:underline">{title}</Link> : <Link to={`/users/${other.id}`} className="hover:underline">{title}</Link>}
            </h2>
            <span className="rounded-full bg-brand-900 px-3 py-1 text-sm font-semibold text-white">
              {!l ? 'Direct interest' : l.type === 'FLAT_AVAILABLE' ? 'Flat available' : 'Looking for flat'}
            </span>
          </div>
          {l && (
            <p className="font-bold text-brand-600">
              {formatRentRange(l.rentMin, l.rentMax)}
              {hasRent && <span className="font-normal text-slate-500"> / month</span>}
            </p>
          )}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">{amenities.map((a) => <span key={a} className="chip">{a}</span>)}</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 sm:justify-end">
        <ScoreRing score={match.compatibilityScore} />
        {actions && <div className="flex w-44 shrink-0 flex-col gap-2 sm:w-48">{actions}</div>}
      </div>
    </article>
  )
}

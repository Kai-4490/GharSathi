import { Link } from 'react-router-dom'
import { GENDER_LABEL } from '../constants/enums'
import { formatDate, formatRelative } from '../utils/dates'
import { formatRentRange } from '../utils/money'
import { splitList } from '../utils/match'
import { toneFor } from '../utils/ui'
import BuildingArt from './BuildingArt'
import StatusBadge from './StatusBadge'

// `footer` renders action buttons below the clickable body (My listings).
export default function ListingCard({ listing, me, showStatus = false, footer = null }) {
  const mine = me && listing.postedBy?.id === me.id
  const amenities = splitList(listing.amenities)
  const tone = toneFor(listing.id)
  const hasRent = listing.rentMin != null || listing.rentMax != null
  return (
    <article className="card flex flex-col overflow-hidden">
      <Link to={`/listings/${listing.id}`} className="group flex flex-1 flex-col focus-visible:ring-inset" aria-label={`View listing in ${listing.location}`}>
        <div className={`relative h-32 ${tone.bg}`}>
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-900 px-3 py-1 text-sm font-semibold text-white">
              {listing.type === 'FLAT_AVAILABLE' ? 'Flat available' : 'Looking for flat'}
            </span>
            {mine && <span className="rounded-full bg-sun-400 px-3 py-1 text-sm font-semibold text-brand-900">Yours</span>}
            {showStatus && <StatusBadge kind="listing" status={listing.status} />}
          </div>
          <BuildingArt className="absolute bottom-0 right-6 h-[78%] w-24" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="text-xl font-bold text-brand-900">{listing.location}</h3>
          <p className="text-lg font-bold text-brand-600">
            {formatRentRange(listing.rentMin, listing.rentMax)}
            {hasRent && <span className="text-base font-normal text-slate-500"> / month</span>}
          </p>
          <p className="text-[15px] text-slate-600">
            Available {listing.availableFrom ? formatDate(listing.availableFrom) : 'immediately'} · {GENDER_LABEL[listing.genderPreference] || listing.genderPreference}
          </p>
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <span key={a} className="chip">{a}</span>
              ))}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-[15px]">
            <span className="min-w-0 truncate text-slate-600">
              {listing.postedBy?.name} · {formatRelative(listing.createdAt)}
            </span>
            <span className="shrink-0 font-bold text-brand-600 group-hover:underline">View →</span>
          </div>
        </div>
      </Link>
      {footer && <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">{footer}</div>}
    </article>
  )
}

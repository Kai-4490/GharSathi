import { Link } from 'react-router-dom'
import { GENDER_LABEL } from '../constants/enums'
import { formatDate, formatRelative } from '../utils/dates'
import { formatRentRange } from '../utils/money'
import { otherUser, splitList } from '../utils/match'
import ScoreRing from './ScoreRing'
import Avatar from './Avatar'
import StatusBadge from './StatusBadge'
import CardMenu from './CardMenu'

// `actions`: buttons node. `menuItems`: CardMenu items. `detailed`: show amenities/availability (Suggestions).
export default function MatchCard({ match, me, actions = null, menuItems = null, detailed = false, dimmed = false }) {
  const other = otherUser(match, me)
  const l = match.listing
  const amenities = detailed && l ? splitList(l.amenities) : []
  return (
    <article className={`card p-5 ${dimmed ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <Avatar user={other} />
        <div className="min-w-0 flex-1">
          <Link to={`/users/${other.id}`} className="font-display text-lg font-bold text-brand-900 hover:underline">
            {other.name}
          </Link>
          <p className="mt-0.5 text-sm text-slate-600">
            {l ? (
              <>
                <Link to={`/listings/${l.id}`} className="hover:text-brand-600 hover:underline">{l.location}</Link>
                {' · '}
                {formatRentRange(l.rentMin, l.rentMax)}
              </>
            ) : (
              'Direct interest'
            )}
          </p>
          {detailed && l && (
            <p className="mt-0.5 text-xs text-slate-500">
              Available {l.availableFrom ? formatDate(l.availableFrom) : 'immediately'} · {GENDER_LABEL[l.genderPreference]}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge kind="match" status={match.status} />
          {menuItems && <CardMenu items={menuItems} />}
        </div>
      </div>
      {amenities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {amenities.map((a) => <span key={a} className="chip">{a}</span>)}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <ScoreRing score={match.compatibilityScore} size={56} showLabel={false} />
        <span className="text-sm text-slate-500">{formatRelative(match.createdAt)}</span>
      </div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </article>
  )
}

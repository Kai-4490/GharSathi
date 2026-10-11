import {
  BADGE_COLOR,
  LISTING_STATUS_LABEL,
  MATCH_STATUS_LABEL,
  REPORT_STATUS_LABEL,
  VERIFICATION_LABEL,
} from '../constants/enums'

const MAP = {
  listing: [LISTING_STATUS_LABEL, BADGE_COLOR.listing],
  match: [MATCH_STATUS_LABEL, BADGE_COLOR.match],
  report: [REPORT_STATUS_LABEL, BADGE_COLOR.report],
  verification: [VERIFICATION_LABEL, BADGE_COLOR.verification],
}

export default function StatusBadge({ kind, status, label }) {
  const [labels, colors] = MAP[kind]
  const text = label || labels[status] || status
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {kind === 'verification' && status === 'VERIFIED' && (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
        </svg>
      )}
      {text}
    </span>
  )
}

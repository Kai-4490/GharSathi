export const ROLES = ['SEEKER', 'FLAT_POSTER', 'ADMIN']
export const REGISTRABLE_ROLES = ['SEEKER', 'FLAT_POSTER'] // never offer ADMIN
export const ROLE_LABEL = {
  SEEKER: 'Looking for a place',
  FLAT_POSTER: 'I have a flat',
  ADMIN: 'Admin',
}

export const LISTING_TYPES = ['FLAT_AVAILABLE', 'LOOKING_FOR_FLAT']
export const LISTING_TYPE_LABEL = {
  FLAT_AVAILABLE: 'Flat available (need a roommate)',
  LOOKING_FOR_FLAT: 'Looking for a flat + roommate',
}

export const GENDER_PREFERENCES = ['MALE_ONLY', 'FEMALE_ONLY', 'CO_ED']
export const GENDER_LABEL = {
  MALE_ONLY: 'Male only',
  FEMALE_ONLY: 'Female only',
  CO_ED: 'Co-ed / any',
}

export const LISTING_STATUSES = ['ACTIVE', 'INACTIVE', 'DELETED']
export const LISTING_STATUS_LABEL = { ACTIVE: 'Active', INACTIVE: 'Hidden', DELETED: 'Deleted' }

export const MATCH_STATUSES = ['SUGGESTED', 'INTERESTED', 'ACCEPTED', 'REJECTED']
export const MATCH_STATUS_LABEL = {
  SUGGESTED: 'Suggested',
  INTERESTED: 'Interested',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
}

export const REPORT_STATUSES = ['PENDING', 'REVIEWED', 'ACTION_TAKEN']
export const REPORT_STATUS_LABEL = {
  PENDING: 'Pending',
  REVIEWED: 'Reviewed',
  ACTION_TAKEN: 'Action taken',
}

export const VERIFICATION_STATUSES = ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED']
export const VERIFICATION_LABEL = {
  NOT_SUBMITTED: 'Not verified',
  PENDING: 'Under review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
}

const GREY = 'bg-slate-100 text-slate-700'
const GREEN = 'bg-green-100 text-green-800'
const RED = 'bg-red-100 text-red-800'
const BLUE = 'bg-blue-100 text-blue-800'
const AMBER = 'bg-amber-100 text-amber-800'

export const BADGE_COLOR = {
  listing: { ACTIVE: GREEN, INACTIVE: GREY, DELETED: RED },
  match: { SUGGESTED: GREY, INTERESTED: BLUE, ACCEPTED: GREEN, REJECTED: RED },
  report: { PENDING: AMBER, REVIEWED: BLUE, ACTION_TAKEN: GREEN },
  verification: { NOT_SUBMITTED: GREY, PENDING: AMBER, VERIFIED: GREEN, REJECTED: RED },
}

export const AMENITY_SUGGESTIONS = ['WiFi', 'AC', 'Furnished', 'Parking', 'Washing machine', 'Gym', 'Power backup']

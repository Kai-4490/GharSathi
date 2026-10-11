import client from './client'

export const forUser = (userId) => client.get(`/api/matches/user/${userId}`).then((r) => r.data)
export const forListing = (listingId) => client.get(`/api/matches/listing/${listingId}`).then((r) => r.data)
// NOTE: has side effects (inserts SUGGESTED rows). Call once per Suggestions mount.
export const suggestions = (userId) => client.get(`/api/matches/suggestions/${userId}`).then((r) => r.data)
export const showInterest = (interestedUserId, targetUserId, listingId) =>
  client
    .post('/api/matches/interest', { interestedUserId, targetUserId, listingId: listingId ?? null })
    .then((r) => r.data)
export const setStatus = (matchId, status) =>
  client.patch(`/api/matches/${matchId}/status`, { status }).then((r) => r.data)

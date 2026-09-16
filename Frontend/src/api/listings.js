import client from './client'

export function createListing(userId, data) {
  return client.post(`/api/listings?userId=${userId}`, data).then((res) => res.data)
}

export function getListing(listingId) {
  return client.get(`/api/listings/${listingId}`).then((res) => res.data)
}

export function getListingsByUser(userId) {
  return client.get(`/api/listings/user/${userId}`).then((res) => res.data)
}

export function searchListings({ location, maxBudget, genderPreference } = {}) {
  const params = new URLSearchParams()
  if (location) params.set('location', location)
  if (maxBudget) params.set('maxBudget', maxBudget)
  if (genderPreference) params.set('genderPreference', genderPreference)
  return client.get(`/api/listings/search?${params.toString()}`).then((res) => res.data)
}

export function updateListing(listingId, userId, data) {
  return client.put(`/api/listings/${listingId}?userId=${userId}`, data).then((res) => res.data)
}

export function deactivateListing(listingId, userId) {
  return client.patch(`/api/listings/${listingId}/deactivate?userId=${userId}`).then((res) => res.data)
}

export function deleteListing(listingId, userId) {
  return client.delete(`/api/listings/${listingId}?userId=${userId}`).then((res) => res.data)
}

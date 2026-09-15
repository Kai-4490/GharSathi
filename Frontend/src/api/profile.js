import client from './client'

export function getProfile(userId) {
  return client.get(`/api/users/${userId}/profile`).then((res) => res.data)
}

export function upsertProfile(userId, data) {
  return client.post(`/api/users/${userId}/profile`, data).then((res) => res.data)
}

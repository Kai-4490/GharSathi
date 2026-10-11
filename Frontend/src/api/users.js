import client from './client'

export const getUser = (id) => client.get(`/api/users/${id}`).then((r) => r.data)
export const updateUser = (id, body) => client.put(`/api/users/${id}`, body).then((r) => r.data)
export const deactivateUser = (id) => client.delete(`/api/users/${id}`).then((r) => r.data)
// Resolves to null when the user has no profile yet (404 is normal for new users).
export const getProfile = (id) =>
  client
    .get(`/api/users/${id}/profile`)
    .then((r) => r.data)
    .catch((e) => {
      if (e.response?.status === 404) return null
      throw e
    })
export const saveProfile = (id, body) => client.post(`/api/users/${id}/profile`, body).then((r) => r.data)

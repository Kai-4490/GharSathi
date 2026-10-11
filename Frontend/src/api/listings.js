import client from './client'

export const create = (userId, body) => client.post('/api/listings', body, { params: { userId } }).then((r) => r.data)
export const get = (id) => client.get(`/api/listings/${id}`).then((r) => r.data)
export const byUser = (userId) => client.get(`/api/listings/user/${userId}`).then((r) => r.data)
export const search = (params) => client.get('/api/listings/search', { params }).then((r) => r.data)
export const update = (id, userId, body) =>
  client.put(`/api/listings/${id}`, body, { params: { userId } }).then((r) => r.data)
export const deactivate = (id, userId) =>
  client.patch(`/api/listings/${id}/deactivate`, null, { params: { userId } }).then((r) => r.data)
export const remove = (id, userId) =>
  client.delete(`/api/listings/${id}`, { params: { userId } }).then((r) => r.data)

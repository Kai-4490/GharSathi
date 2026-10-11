import client from './client'

export const fileReport = (body) => client.post('/api/reports', body).then((r) => r.data)
export const filedBy = (userId) => client.get(`/api/reports/user/${userId}`).then((r) => r.data)
export const block = (blockerId, blockedUserId) =>
  client.post('/api/reports/block', { blockerId, blockedUserId }).then((r) => r.data)
export const unblock = (blockerId, blockedUserId) =>
  client.delete('/api/reports/block', { params: { blockerId, blockedUserId } }).then(() => true)
export const blockedBy = (userId) => client.get(`/api/reports/block/${userId}`).then((r) => r.data)

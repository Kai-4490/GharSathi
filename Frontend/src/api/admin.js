import client from './client'

export const users = () => client.get('/api/admin/users').then((r) => r.data)
export const deactivateUser = (userId) => client.patch(`/api/admin/users/${userId}/deactivate`).then((r) => r.data)
export const reports = (status) =>
  client.get('/api/admin/reports', { params: status ? { status } : {} }).then((r) => r.data)
export const reviewReport = (reportId, status, adminNote) =>
  client.patch(`/api/admin/reports/${reportId}/review`, { status, adminNote: adminNote ?? null }).then((r) => r.data)
export const pendingVerifications = () => client.get('/api/admin/profiles/pending-verification').then((r) => r.data)
export const setVerification = (profileId, status) =>
  client.patch(`/api/admin/profiles/${profileId}/verification`, { status }).then((r) => r.data)

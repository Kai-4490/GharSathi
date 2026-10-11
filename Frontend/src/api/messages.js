import client from './client'

export const send = ({ senderId, receiverId, listingId, content }) =>
  client.post('/api/messages', { senderId, receiverId, listingId: listingId ?? null, content }).then((r) => r.data)
export const conversation = (userAId, userBId) =>
  client.get('/api/messages/conversation', { params: { userAId, userBId } }).then((r) => r.data)
export const unread = (userId) => client.get(`/api/messages/unread/${userId}`).then((r) => r.data)
export const unreadCount = (userId) =>
  client.get(`/api/messages/unread/${userId}/count`).then((r) => Number(r.data) || 0)
export const markRead = (messageId) => client.patch(`/api/messages/${messageId}/read`).then((r) => r.data)

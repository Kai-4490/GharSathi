import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { API_URL } from '../api/client'
import * as messagesApi from '../api/messages'
import { conversationKey } from '../utils/match'
import { parseDate } from '../utils/dates'
import { refreshUnread } from './useUnreadCount'

// Appends only from history and from the subscription (no optimistic appends); dedupes by id.
function mergeMessages(list, incoming) {
  const map = new Map(list.map((m) => [m.id, m]))
  for (const m of incoming) map.set(m.id, { ...map.get(m.id), ...m })
  return [...map.values()].sort((a, b) => {
    const ta = parseDate(a.sentAt)?.getTime() ?? 0
    const tb = parseDate(b.sentAt)?.getTime() ?? 0
    return ta - tb || a.id - b.id
  })
}

export default function useChat({ me, otherUserId, listingId }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const clientRef = useRef(null)
  const meId = me.id

  const markIncomingRead = useCallback(
    async (msgs) => {
      const unread = msgs.filter((m) => m.receiver?.id === meId && !m.read)
      if (unread.length === 0) return
      const results = await Promise.allSettled(unread.map((m) => messagesApi.markRead(m.id)))
      const doneIds = new Set(unread.filter((_, i) => results[i].status === 'fulfilled').map((m) => m.id))
      setMessages((prev) => prev.map((m) => (doneIds.has(m.id) ? { ...m, read: true } : m)))
      refreshUnread()
    },
    [meId],
  )

  // History
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setMessages([])
    messagesApi
      .conversation(meId, otherUserId)
      .then((history) => {
        if (cancelled) return
        setMessages((prev) => mergeMessages(history, prev))
        setLoading(false)
        markIncomingRead(history)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [meId, otherUserId, markIncomingRead])

  // STOMP subscription
  useEffect(() => {
    const topic = `/topic/chat/${conversationKey(meId, Number(otherUserId))}`
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)
        client.subscribe(topic, (frame) => {
          let msg
          try {
            msg = JSON.parse(frame.body)
          } catch {
            return
          }
          setMessages((prev) => mergeMessages(prev, [msg]))
          if (msg.receiver?.id === meId && !msg.read) {
            messagesApi
              .markRead(msg.id)
              .then(() => {
                setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)))
                refreshUnread()
              })
              .catch(() => {})
          }
        })
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    })
    clientRef.current = client
    client.activate()
    return () => {
      setConnected(false)
      client.deactivate()
      clientRef.current = null
    }
  }, [meId, otherUserId])

  const send = useCallback(
    async (content) => {
      const dto = {
        senderId: meId,
        receiverId: Number(otherUserId),
        listingId: listingId ? Number(listingId) : null,
        content,
      }
      const client = clientRef.current
      if (client && client.connected) {
        client.publish({ destination: '/app/chat.send', body: JSON.stringify(dto) })
        return
      }
      const saved = await messagesApi.send(dto)
      setMessages((prev) => mergeMessages(prev, [saved]))
    },
    [meId, otherUserId, listingId],
  )

  return { messages, loading, error, connected, send }
}
